import { Section, SectionHeading } from '@/components/ui/Section'

export default function CarDetailLoading() {
  return (
    <Section className="pt-8">
      <SectionHeading
        eyebrow="Vehicle"
        title="Loading listing…"
        subtitle="Preparing gallery, specifications, and booking panel."
      />
      <div className="mx-auto mt-8 max-w-5xl space-y-8">
        <div className="h-[min(22rem,55vw)] animate-pulse rounded-3xl border border-stroke bg-fill-glass/80" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-52 animate-pulse rounded-2xl border border-stroke bg-fill-glass/60" />
          <div className="h-52 animate-pulse rounded-2xl border border-stroke bg-fill-glass/60" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl border border-stroke bg-fill-glass/50" />
      </div>
    </Section>
  )
}
