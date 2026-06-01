const COMPANY_SUFFIXES = [
  'engineering',
  'technologies',
  'technology',
  'solutions',
  'services',
  'enterprises',
  'industries',
  'consulting',
  'agency',
  'group',
  'limited',
  'ltd',
  'pvt',
  'inc',
  'corp',
  'co',
  'algo',
  'labs',
  'studio',
  'holdings',
]

const GENERIC_NAMES = new Set(['info', 'oxour', 'admin', 'support', 'contact'])

/**
 * Heuristic: flag display names that are unlikely to be a natural person (for admin review tags).
 */
export function isLikelyCompanyDisplayName(name: string): boolean {
  const cleanName = name.trim().toLowerCase()
  if (!cleanName) return true
  if (GENERIC_NAMES.has(cleanName)) return true

  const words = cleanName.split(/\s+/).filter(Boolean)
  if (words.length === 1 && words[0]!.length <= 5) return true
  if (COMPANY_SUFFIXES.some((token) => cleanName.includes(token))) return true

  return false
}
