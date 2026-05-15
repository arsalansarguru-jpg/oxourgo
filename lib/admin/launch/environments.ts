import 'server-only'

import { getPublicSiteUrl } from '@/lib/env/site-url'

export type DeployEnvironmentId = 'production' | 'staging' | 'development'

export type DeployEnvironmentCard = {
  id: DeployEnvironmentId
  label: string
  url: string | null
  /** Whether this row describes the currently running deployment. */
  isCurrent: boolean
  status: 'healthy' | 'warn' | 'unknown'
  detail: string
}

function inferCurrentEnv(): DeployEnvironmentId {
  const vercel = process.env.VERCEL_ENV?.trim()
  if (vercel === 'production') return 'production'
  if (vercel === 'preview') return 'staging'
  if (process.env.NODE_ENV === 'development') return 'development'
  return 'production'
}

export function resolveDeployEnvironments(): DeployEnvironmentCard[] {
  const current = inferCurrentEnv()
  const siteUrl = getPublicSiteUrl()
  const productionUrl = process.env.LAUNCH_PRODUCTION_URL?.trim() || (current === 'production' ? siteUrl : null)
  const stagingUrl = process.env.LAUNCH_STAGING_URL?.trim() || (current === 'staging' ? siteUrl : null)
  const devUrl = current === 'development' ? siteUrl : 'http://localhost:3000'

  return [
    {
      id: 'production',
      label: 'Production',
      url: productionUrl,
      isCurrent: current === 'production',
      status: productionUrl ? (productionUrl.startsWith('https://') ? 'healthy' : 'warn') : 'unknown',
      detail: productionUrl ? 'URL configured' : 'Set LAUNCH_PRODUCTION_URL or deploy to production',
    },
    {
      id: 'staging',
      label: 'Staging',
      url: stagingUrl,
      isCurrent: current === 'staging',
      status: stagingUrl ? 'healthy' : 'unknown',
      detail: stagingUrl ? 'Preview/staging URL' : 'Set LAUNCH_STAGING_URL or use Vercel preview',
    },
    {
      id: 'development',
      label: 'Development',
      url: devUrl,
      isCurrent: current === 'development',
      status: 'healthy',
      detail: 'Local or dev deployment',
    },
  ]
}

export function currentDeployEnvironmentLabel(): string {
  const id = inferCurrentEnv()
  return id.charAt(0).toUpperCase() + id.slice(1)
}
