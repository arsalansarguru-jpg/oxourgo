import { Section, SectionHeading } from '@/components/ui/Section'
import { CarCardSkeleton } from '@/components/ui/LoadingSkeleton'

export function FleetLoading() {
  return (
    <Section className="pt-10">
      <SectionHeading
        eyebrow="Fleet"
        title="Browse the collection"
        subtitle="Loading vehicles…"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    </Section>
  )
}
