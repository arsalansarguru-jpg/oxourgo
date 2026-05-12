export type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function AdminPageHeader({ eyebrow = 'Admin', title, description }: AdminPageHeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-soft">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-muted">{description}</p> : null}
    </header>
  )
}
