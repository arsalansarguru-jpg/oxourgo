import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { roleLabel, type AppAuthRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils/cn'

const ROLE_VARIANT: Partial<Record<AppAuthRole, BadgeProps['variant']>> = {
  customer: 'muted',
  ops_admin: 'electric',
  super_admin: 'electric',
  fleet_manager: 'success',
  fleet_host: 'success',
  finance_manager: 'default',
  kyc_reviewer: 'default',
  support_agent: 'muted',
}

export type RoleBadgeProps = {
  role: AppAuthRole
  className?: string
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, className, size = 'sm' }: RoleBadgeProps) {
  const variant = ROLE_VARIANT[role] ?? 'muted'
  return (
    <Badge
      variant={variant}
      className={cn(
        'font-semibold uppercase tracking-[0.12em]',
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        size === 'md' && 'text-xs px-2.5 py-1',
        className,
      )}
    >
      {roleLabel(role)}
    </Badge>
  )
}
