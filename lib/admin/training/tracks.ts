import { BarChart3, ClipboardList } from 'lucide-react'

import type { TrainingTrackMeta } from '@/lib/admin/training/types'

export const TRAINING_TRACKS: TrainingTrackMeta[] = [
  {
    id: 'operations',
    label: 'Operations',
    description: 'Day-to-day admin workflows for staff',
    icon: ClipboardList,
  },
  {
    id: 'owner',
    label: 'Owner dashboard',
    description: 'Revenue, fleet, and monitoring for leadership',
    icon: BarChart3,
  },
]

export function trackLabel(id: string): string {
  return TRAINING_TRACKS.find((t) => t.id === id)?.label ?? id
}
