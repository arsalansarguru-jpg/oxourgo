import 'server-only'

import { fetchBackupHealthBundle } from '@/lib/admin/data/backup-health'
import { LAUNCH_CHECKLIST_ITEMS, LAUNCH_QA_TESTS, LAUNCH_SECTION_LABELS, type LaunchSectionId } from '@/lib/admin/launch/checklist-definition'
import { currentDeployEnvironmentLabel, resolveDeployEnvironments, type DeployEnvironmentCard } from '@/lib/admin/launch/environments'
import { getPublicSiteUrl } from '@/lib/env/site-url'
import { isPosthogEnabled } from '@/lib/analytics/posthog-env'
import { getSentryDsn } from '@/lib/monitoring/sentry-runtime-env'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { createAdminClient } from '@/lib/supabase/admin'

export type LaunchItemStatus = 'healthy' | 'warn' | 'critical' | 'pending' | 'unknown'

export type LaunchChecklistItem = {
  key: string
  section: LaunchSectionId
  sectionLabel: string
  label: string
  description: string
  kind: 'auto' | 'manual'
  status: LaunchItemStatus
  completed: boolean
  detail?: string
  completedAt?: string | null
}

export type LaunchQaItem = {
  key: string
  label: string
  description: string
  status: 'pending' | 'passed' | 'failed' | 'blocked'
  notes: string | null
  updatedAt: string | null
}

export type LaunchOperationalAlert = {
  id: string
  severity: 'critical' | 'warn'
  title: string
  body: string
  href?: string
}

export type LaunchReadinessBundle = {
  checkedAt: string
  currentEnvironment: string
  environments: DeployEnvironmentCard[]
  readinessPercent: number
  completedCount: number
  totalCount: number
  sections: {
    id: LaunchSectionId
    label: string
    completed: number
    total: number
    percent: number
  }[]
  items: LaunchChecklistItem[]
  qaItems: LaunchQaItem[]
  qaPercent: number
  alerts: LaunchOperationalAlert[]
  serviceRoleAvailable: boolean
}

type AutoProbeResult = { status: LaunchItemStatus; completed: boolean; detail?: string }

async function runAutoProbes(): Promise<Map<string, AutoProbeResult>> {
  const map = new Map<string, AutoProbeResult>()
  const siteUrl = getPublicSiteUrl()
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

  const set = (key: string, r: AutoProbeResult) => map.set(key, r)

  set('domain.public_url', {
    status: 'healthy',
    completed: true,
    detail: siteUrl,
  })

  set('domain.https_production', {
    status: !isProd ? 'healthy' : siteUrl.startsWith('https://') ? 'healthy' : 'critical',
    completed: !isProd || siteUrl.startsWith('https://'),
    detail: isProd ? 'Production must use HTTPS' : 'N/A outside production',
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  set('auth.supabase_public', {
    status: supabaseUrl && supabaseAnon ? 'healthy' : 'critical',
    completed: Boolean(supabaseUrl && supabaseAnon),
  })

  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  set('auth.service_role', {
    status: serviceRole ? 'healthy' : 'critical',
    completed: serviceRole,
    detail: serviceRole ? 'Configured' : 'Missing — admin data unavailable',
  })

  set('payments.razorpay', {
    status:
      process.env.NEXT_PUBLIC_PAYMENTS_ONLINE_CHECKOUT_ENABLED === '1'
        ? process.env.RAZORPAY_KEY_SECRET?.trim() && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()
          ? 'healthy'
          : 'warn'
        : 'healthy',
    completed:
      process.env.NEXT_PUBLIC_PAYMENTS_ONLINE_CHECKOUT_ENABLED !== '1' ||
      Boolean(process.env.RAZORPAY_KEY_SECRET?.trim() && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()),
    detail:
      process.env.NEXT_PUBLIC_PAYMENTS_ONLINE_CHECKOUT_ENABLED === '1'
        ? 'Online checkout enabled'
        : 'Online checkout disabled',
  })

  const sentryOn = Boolean(getSentryDsn())
  set('monitoring.sentry', {
    status: sentryOn ? 'healthy' : isProd ? 'warn' : 'unknown',
    completed: sentryOn,
  })

  set('monitoring.analytics', {
    status: isPosthogEnabled() ? 'healthy' : isProd ? 'warn' : 'unknown',
    completed: isPosthogEnabled(),
  })

  const opsEmails = process.env.OPS_ALERT_EMAILS?.trim() || process.env.OPS_ALERT_EMAIL?.trim()
  set('monitoring.ops_email', {
    status: opsEmails ? 'healthy' : 'warn',
    completed: Boolean(opsEmails),
    detail: opsEmails ? 'Routing configured' : 'Set OPS_ALERT_EMAILS',
  })

  if (!serviceRole) {
    for (const item of LAUNCH_CHECKLIST_ITEMS) {
      if (item.kind === 'auto' && !map.has(item.key)) {
        set(item.key, { status: 'unknown', completed: false, detail: 'Service role required' })
      }
    }
    return map
  }

  try {
    const admin = createAdminClient()
    const [bookings, kyc, vehicles, audit, kycPinned, backupOps, holds] = await Promise.all([
      admin.from('bookings').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      admin.from('kyc_documents').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      admin.from('vehicles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      admin
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      admin
        .from('kyc_documents')
        .select('id', { count: 'exact', head: true })
        .eq('storage_pinned', true)
        .is('deleted_at', null),
      admin
        .from('backup_operation_logs')
        .select('status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      admin.from('bookings').select('id', { count: 'exact', head: true }).not('ops_hold_at', 'is', null),
    ])

    if (bookings.error) logPostgrestError('[launch] bookings', bookings.error)
    if (kyc.error) logPostgrestError('[launch] kyc', kyc.error)
    if (vehicles.error) logPostgrestError('[launch] vehicles', vehicles.error)

    set('bookings.data_access', {
      status: bookings.error ? 'critical' : 'healthy',
      completed: !bookings.error,
      detail: bookings.error ? 'Query failed' : `${bookings.count ?? 0} active bookings`,
    })

    set('kyc.queue_access', {
      status: kyc.error ? 'critical' : 'healthy',
      completed: !kyc.error,
    })

    set('kyc.storage_retention', {
      status: kycPinned.error ? 'unknown' : (kycPinned.count ?? 0) > 0 ? 'healthy' : 'warn',
      completed: !kycPinned.error,
      detail: `${kycPinned.count ?? 0} pinned documents`,
    })

    set('payments.module_access', {
      status: bookings.error ? 'critical' : 'healthy',
      completed: !bookings.error,
      detail: 'Payments board uses booking ledger',
    })

    const fleetCount = vehicles.count ?? 0
    set('fleet.catalog', {
      status: fleetCount > 0 ? 'healthy' : 'warn',
      completed: fleetCount > 0,
      detail: `${fleetCount} active vehicles`,
    })

    set('admin.command_center', {
      status: !bookings.error && !vehicles.error ? 'healthy' : 'warn',
      completed: !bookings.error && !vehicles.error,
    })

    const auditCount = audit.count ?? 0
    set('admin.audit_trail', {
      status: auditCount > 0 ? 'healthy' : 'warn',
      completed: auditCount > 0,
      detail: `${auditCount} events (7d)`,
    })

    try {
      const health = await fetchBackupHealthBundle()
      const critical = health.indicators.filter((i) => i.status === 'critical').length
      const warn = health.indicators.filter((i) => i.status === 'warn').length
      set('backups.health', {
        status: critical > 0 ? 'critical' : warn > 0 ? 'warn' : 'healthy',
        completed: critical === 0,
        detail: `${health.indicators.length} indicators`,
      })
    } catch {
      set('backups.health', { status: 'unknown', completed: false, detail: 'Health check failed' })
    }

    const ops = backupOps.data ?? []
    const last = ops[0]
    const failedRecent = ops.filter((o) => o.status === 'failed').length
    set('backups.recent_success', {
      status: !last ? 'warn' : last.status === 'failed' ? 'critical' : 'healthy',
      completed: Boolean(last && last.status !== 'failed'),
      detail: last ? `Last: ${last.status}` : 'No operations logged',
    })

    if (failedRecent > 0 && last?.status === 'failed') {
      map.set('__backup_failed', { status: 'critical', completed: false })
    }

    if ((holds.count ?? 0) > 0) {
      map.set('__ops_holds', {
        status: 'warn',
        completed: false,
        detail: `${holds.count} bookings on ops hold`,
      })
    }
  } catch {
    for (const item of LAUNCH_CHECKLIST_ITEMS) {
      if (item.kind === 'auto' && !map.has(item.key)) {
        set(item.key, { status: 'unknown', completed: false, detail: 'Probe error' })
      }
    }
  }

  return map
}

async function loadManualCompletions(): Promise<Map<string, { completed: boolean; completedAt: string | null }>> {
  const out = new Map<string, { completed: boolean; completedAt: string | null }>()
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return out

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('launch_checklist_completions').select('item_key, completed, completed_at')
    if (error) {
      logPostgrestError('[launch] completions', error)
      return out
    }
    for (const row of data ?? []) {
      out.set(row.item_key, { completed: row.completed, completedAt: row.completed_at })
    }
  } catch {
    /* graceful */
  }
  return out
}

async function loadQaSignoffs(): Promise<Map<string, { status: LaunchQaItem['status']; notes: string | null; updatedAt: string | null }>> {
  const out = new Map<string, { status: LaunchQaItem['status']; notes: string | null; updatedAt: string | null }>()
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return out

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('launch_qa_signoffs').select('test_key, status, notes, updated_at')
    if (error) {
      logPostgrestError('[launch] qa', error)
      return out
    }
    for (const row of data ?? []) {
      const status = row.status as LaunchQaItem['status']
      out.set(row.test_key, { status, notes: row.notes, updatedAt: row.updated_at })
    }
  } catch {
    /* graceful */
  }
  return out
}

async function buildOperationalAlerts(adminUserId: string | null): Promise<LaunchOperationalAlert[]> {
  const alerts: LaunchOperationalAlert[] = []
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    alerts.push({
      id: 'no-service-role',
      severity: 'critical',
      title: 'Admin service role missing',
      body: 'Launch probes and checklist persistence require SUPABASE_SERVICE_ROLE_KEY.',
    })
    return alerts
  }

  try {
    const admin = createAdminClient()
    const [failedBackups, opsAlerts, holds] = await Promise.all([
      admin
        .from('backup_operation_logs')
        .select('id, operation_type, summary, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5),
      admin.from('ops_alerts').select('id, type, title, body, created_at').order('created_at', { ascending: false }).limit(30),
      admin.from('bookings').select('id', { count: 'exact', head: true }).not('ops_hold_at', 'is', null),
    ])

    for (const row of failedBackups.data ?? []) {
      alerts.push({
        id: `backup-${row.id}`,
        severity: 'critical',
        title: 'Failed backup operation',
        body: row.summary ?? row.operation_type,
        href: '/admin/backup',
      })
    }

    const incidentTypes = new Set(['incident', 'emergency', 'safety', 'critical'])
    for (const row of opsAlerts.data ?? []) {
      const type = row.type.toLowerCase()
      const isCritical = incidentTypes.has(type) || type.includes('critical')
      if (isCritical) {
        alerts.push({
          id: `ops-${row.id}`,
          severity: 'critical',
          title: row.title,
          body: row.body ?? row.type,
          href: '/admin/notifications',
        })
      }
    }

    if ((holds.count ?? 0) > 0) {
      alerts.push({
        id: 'ops-holds',
        severity: 'warn',
        title: 'Bookings on ops hold',
        body: `${holds.count} booking(s) require resolution before go-live.`,
        href: '/admin/operations',
      })
    }

    if (adminUserId) {
      const { data: dismissals } = await admin
        .from('ops_alert_dismissals')
        .select('alert_id')
        .eq('admin_user_id', adminUserId)
      const dismissed = new Set((dismissals ?? []).map((d) => d.alert_id))
      const undismissed = (opsAlerts.data ?? []).filter((a) => !dismissed.has(a.id))
      if (undismissed.length >= 10) {
        alerts.push({
          id: 'ops-backlog',
          severity: 'warn',
          title: 'Large ops alert backlog',
          body: `${undismissed.length} undismissed alerts — triage before launch.`,
          href: '/admin/notifications',
        })
      }
    }
  } catch {
    alerts.push({
      id: 'probe-error',
      severity: 'warn',
      title: 'Could not load all alerts',
      body: 'Some operational checks failed safely. Retry or verify Supabase connectivity.',
    })
  }

  return alerts.slice(0, 12)
}

export async function fetchLaunchReadinessBundle(adminUserId: string | null): Promise<LaunchReadinessBundle> {
  const checkedAt = new Date().toISOString()
  const serviceRoleAvailable = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())

  const [autoProbes, manualMap, qaMap, alerts] = await Promise.all([
    runAutoProbes(),
    loadManualCompletions(),
    loadQaSignoffs(),
    buildOperationalAlerts(adminUserId),
  ])

  const items: LaunchChecklistItem[] = LAUNCH_CHECKLIST_ITEMS.map((def) => {
    const sectionLabel = LAUNCH_SECTION_LABELS[def.section]
    if (def.kind === 'auto') {
      const probe = autoProbes.get(def.key) ?? { status: 'unknown' as const, completed: false }
      return {
        key: def.key,
        section: def.section,
        sectionLabel,
        label: def.label,
        description: def.description,
        kind: def.kind,
        status: probe.status,
        completed: probe.completed,
        detail: probe.detail,
      }
    }
    const manual = manualMap.get(def.key)
    const completed = manual?.completed ?? false
    return {
      key: def.key,
      section: def.section,
      sectionLabel,
      label: def.label,
      description: def.description,
      kind: def.kind,
      status: completed ? 'healthy' : 'pending',
      completed,
      completedAt: manual?.completedAt ?? null,
    }
  })

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const readinessPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const sectionIds = [...new Set(LAUNCH_CHECKLIST_ITEMS.map((i) => i.section))]
  const sections = sectionIds.map((id) => {
    const sectionItems = items.filter((i) => i.section === id)
    const completed = sectionItems.filter((i) => i.completed).length
    const total = sectionItems.length
    return {
      id,
      label: LAUNCH_SECTION_LABELS[id],
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })

  const qaItems: LaunchQaItem[] = LAUNCH_QA_TESTS.map((def) => {
    const row = qaMap.get(def.key)
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      status: row?.status ?? 'pending',
      notes: row?.notes ?? null,
      updatedAt: row?.updatedAt ?? null,
    }
  })

  const qaPassed = qaItems.filter((q) => q.status === 'passed').length
  const qaPercent = qaItems.length > 0 ? Math.round((qaPassed / qaItems.length) * 100) : 0

  return {
    checkedAt,
    currentEnvironment: currentDeployEnvironmentLabel(),
    environments: resolveDeployEnvironments(),
    readinessPercent,
    completedCount,
    totalCount,
    sections,
    items,
    qaItems,
    qaPercent,
    alerts,
    serviceRoleAvailable,
  }
}
