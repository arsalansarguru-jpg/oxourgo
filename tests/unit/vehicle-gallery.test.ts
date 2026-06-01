import { describe, expect, it } from 'vitest'

import { normalizeVehicleGalleryImages, resolveVehicleGalleryUrls } from '@/lib/fleet/vehicle-gallery'

describe('vehicle gallery', () => {
  it('normalizes gallery json', () => {
    const items = normalizeVehicleGalleryImages([
      { path: 'abc/exterior-1.jpg', label: 'exterior' },
      { path: '', label: 'interior' },
    ])
    expect(items).toHaveLength(1)
    expect(items[0]?.label).toBe('exterior')
  })

  it('dedupes cover and gallery urls', () => {
    const urls = resolveVehicleGalleryUrls('v1/a.jpg', [{ path: 'v1/b.jpg', label: 'interior' }])
    expect(urls.length).toBeGreaterThanOrEqual(1)
  })
})
