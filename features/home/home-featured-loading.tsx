import { Section, SectionHeading } from '@/components/ui/Section'
import { CarCardSkeleton } from '@/components/ui/LoadingSkeleton'

export function HomeFeaturedLoading() {
  return (
    <Section>
      <SectionHeading
        title="Featured Luxury Fleet"
        subtitle="Loading vehicles…"
      />
      <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    </Section>
  )
}
