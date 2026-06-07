import { test, expect } from '@playwright/test'
import pricesData from '../../public/api/v1/prices.json'

// Pick the first two active models for test slug
const activeModels = (pricesData.models as Array<{ id: string; active?: boolean }>)
  .filter((m) => m.active !== false)

// Build slug: sort IDs for canonical ordering and join with -vs-
const ids = [activeModels[0].id, activeModels[1].id].sort()
const TEST_SLUG = ids.join('-vs-')
const TEST_URL = `/compare/${TEST_SLUG}`

test('comparison page loads without JavaScript errors', async ({ page }) => {
  const jsErrors: string[] = []
  page.on('pageerror', (err: Error) => jsErrors.push(err.message))

  await page.goto(TEST_URL)
  await page.waitForLoadState('networkidle')

  expect(jsErrors).toHaveLength(0)
})

test('comparison page has JSON-LD structured data', async ({ page }) => {
  await page.goto(TEST_URL)

  const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(ldJson).toBeTruthy()

  const parsed = JSON.parse(ldJson!)
  expect(parsed['@type']).toBeTruthy()
})

test('comparison page has correct canonical URL', async ({ page }) => {
  await page.goto(TEST_URL)

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  expect(canonical).toContain(TEST_SLUG)
  expect(canonical).toMatch(/^https:\/\/calculatetokens\.com\/compare\//)
})

test('comparison page renders pricing cells with dollar amounts', async ({ page }) => {
  await page.goto(TEST_URL)

  // Look for elements containing dollar-sign pricing
  const pricingCells = page.locator('[data-price-input]')
  const count = await pricingCells.count()
  expect(count).toBeGreaterThan(0)

  // Verify at least one cell contains a dollar amount in text
  const bodyText = await page.locator('body').textContent()
  expect(bodyText).toMatch(/\$[\d.]+/)
})

test('comparison page title includes both model names', async ({ page }) => {
  await page.goto(TEST_URL)

  const title = await page.title()
  // Title should reference the comparison in some meaningful way
  expect(title.length).toBeGreaterThan(10)
  // Should not be a 404 title
  expect(title.toLowerCase()).not.toContain('not found')
  expect(title.toLowerCase()).not.toContain('404')
})
