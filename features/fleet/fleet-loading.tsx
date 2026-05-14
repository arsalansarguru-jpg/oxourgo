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
      <div className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    </Section>
  )
}
