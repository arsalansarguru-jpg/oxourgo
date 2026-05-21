import { typeAdminPageTitle, typeCaption, typeEyebrow } from '@/lib/design/typography'
import { cn } from '@/lib/utils/cn'

export type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function AdminPageHeader({ eyebrow = 'Admin', title, description }: AdminPageHeaderProps) {
  return (
    <header className="glass-panel rounded-3xl p-4 sm:p-6">
      <p className={cn(typeEyebrow, 'text-electric/90')}>{eyebrow}</p>
      <h1 className={cn(typeAdminPageTitle, 'mt-2 max-w-none text-balance sm:mt-3 sm:max-w-[28ch]')}>
        {title}
      </h1>
      {description ? (
        <p className={cn(typeCaption, 'mt-2 max-w-2xl text-muted sm:mt-3 sm:text-[0.9375rem]')}>
          {description}
        </p>
      ) : null}
    </header>
  )
}
