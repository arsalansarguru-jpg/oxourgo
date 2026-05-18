export type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function AdminPageHeader({ eyebrow = 'Admin', title, description }: AdminPageHeaderProps) {
  return (
    <header className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-4 shadow-[var(--shadow-card)] sm:p-6">
      <p className="text-[10px] font-semibold uppercase text-electric/90">{eyebrow}</p>
      <h1 className="mt-2 max-w-none text-balance text-2xl font-semibold text-soft sm:mt-3 sm:max-w-[24ch] sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:mt-3 lg:text-[0.9375rem]">{description}</p>
      ) : null}
    </header>
  )
}
