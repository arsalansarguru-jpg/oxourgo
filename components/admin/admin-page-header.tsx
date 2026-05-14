export type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function AdminPageHeader({ eyebrow = 'Admin', title, description }: AdminPageHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-electric/90">{eyebrow}</p>
      <h1 className="max-w-[20ch] text-balance text-3xl font-semibold tracking-[-0.045em] text-soft sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted lg:text-[0.9375rem]">{description}</p>
      ) : null}
    </header>
  )
}
