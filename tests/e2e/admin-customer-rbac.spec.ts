import { existsSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

const storagePath = path.join(process.cwd(), 'tests/e2e/.auth/customer.json')

test.describe('admin RBAC (optional)', () => {
  test.skip(!existsSync(storagePath), 'Add tests/e2e/.auth/customer.json — run `npx playwright codegen` signed in as customer, save storage to that path')

  test.use({ storageState: storagePath })

  test('admin routes block non-admin users', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/dashboard/)
    expect(page.url()).toContain('error=forbidden')
  })
})
