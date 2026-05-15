import type { AppAuthRole } from '@/lib/auth/roles'

import type { TrainingModule } from '@/lib/admin/training/types'

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function moduleMatchesRole(module: TrainingModule, role: AppAuthRole): boolean {
  if (module.roles === 'all') return true
  return module.roles.includes(role)
}

export function filterModulesForRole(modules: TrainingModule[], role: AppAuthRole): TrainingModule[] {
  return modules.filter((m) => moduleMatchesRole(m, role))
}

export function searchTrainingModules(modules: TrainingModule[], query: string, role: AppAuthRole): TrainingModule[] {
  const scoped = filterModulesForRole(modules, role)
  const q = normalize(query)
  if (!q) return scoped

  return scoped
    .map((mod) => {
      let score = 0
      const haystack = [
        mod.title,
        mod.description,
        mod.track,
        ...mod.keywords,
        ...mod.objectives,
        ...mod.steps.map((s) => `${s.title} ${s.body}`),
      ]
        .join(' ')
        .toLowerCase()

      if (normalize(mod.title).includes(q)) score += 10
      if (normalize(mod.description).includes(q)) score += 5
      if (mod.keywords.some((k) => normalize(k).includes(q))) score += 4
      if (haystack.includes(q)) score += 2

      return { mod, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.mod)
}

export function getModuleBySlug(modules: TrainingModule[], slug: string): TrainingModule | undefined {
  return modules.find((m) => m.slug === slug)
}
