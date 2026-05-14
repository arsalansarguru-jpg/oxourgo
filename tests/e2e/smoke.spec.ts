import { expect, test, type Page } from '@playwright/test'

/** Signed-in customer vs /admin: see `admin-customer-rbac.spec.ts` and `tests/e2e/.auth/customer.json`. */

/** UUID v4 for anonymous PDF probe (no booking required). */
const SAMPLE_BOOKING_ID = '550e8400-e29b-41d4-a716-446655440000'

async function expectAnonymousBlockedFromProtectedArea(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  const url = page.url()
  expect(
    url.includes('/login') || url.includes('/system/unavailable'),
    `expected ${path} to redirect anonymous users, got ${url}`,
  ).toBe(true)
}

test.describe('production smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#main')).toBeVisible()
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })

  test('fleet page loads', async ({ page }) => {
    await page.goto('/fleet', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#main')).toBeVisible()
    await expect(page.getByTestId('fleet-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Browse the collection' })).toBeVisible()
  })

  test('dashboard redirects when logged out', async ({ page }) => {
    await expectAnonymousBlockedFromProtectedArea(page, '/dashboard')
  })

  test('admin routes redirect anonymous users', async ({ page }) => {
    await expectAnonymousBlockedFromProtectedArea(page, '/admin')
  })

  test('booking happy path: fleet → car → reserve panel', async ({ page }) => {
    await page.goto('/fleet', { waitUntil: 'domcontentloaded' })
    const book = page.getByRole('link', { name: 'Book' }).first()
    const n = await book.count()
    test.skip(n === 0, 'No bookable vehicles in catalog — skip booking smoke')
    await book.click()
    await expect(page).toHaveURL(/\/car\/[0-9a-f-]{36}/i)
    await expect(page.locator('#vehicle-reserve')).toBeVisible({ timeout: 20_000 })
  })

  test('booking dashboard requires sign-in when logged out', async ({ page }) => {
    await expectAnonymousBlockedFromProtectedArea(page, '/dashboard/bookings')
  })

  test('customer invoice PDF route returns unauthorized when logged out', async ({ request }) => {
    const res = await request.get(`/api/bookings/${SAMPLE_BOOKING_ID}/pdf?doc=invoice`)
    expect(res.status(), await res.text().catch(() => '')).toBe(401)
    const json = (await res.json().catch(() => null)) as { code?: string } | null
    expect(json?.code).toBe('unauthorized')
  })
})
