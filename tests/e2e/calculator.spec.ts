import { test, expect } from '@playwright/test'

// AC-1.1.2 — heuristic ~ prefix visible while Wasm worker is still loading
test('heuristic ~ prefix is visible immediately after typing', async ({ page }) => {
  await page.goto('/')

  const textarea = page.getByRole('textbox')
  await textarea.fill('Hello world')

  // The ~ prefix should appear as soon as the heuristic estimate is displayed,
  // before the Wasm worker has resolved.
  // Allow up to 5 s — static file serving can be slower than dev server.
  // Multiple cells show ~N (one per model) — .first() avoids strict mode violation
  await expect(page.locator('text=/~\\d/').first()).toBeVisible({ timeout: 5000 })
})

// AC-1.1.5 — textarea must have an accessible aria-label and role="textbox"
test('textarea has aria-label and role="textbox"', async ({ page }) => {
  await page.goto('/')

  const textarea = page.getByRole('textbox')
  await expect(textarea).toBeVisible()

  // role="textbox" is implied by getByRole above; additionally verify aria-label is set
  const ariaLabel = await textarea.getAttribute('aria-label')
  expect(ariaLabel).toBeTruthy()
  expect(ariaLabel!.length).toBeGreaterThan(0)
})

// AC-1.4.2 — output slider must expose correct ARIA range attributes
test('output slider has aria-valuemin=0 and aria-valuemax=8000', async ({ page }) => {
  await page.goto('/')

  const slider = page.getByRole('slider')
  await expect(slider).toBeVisible()

  const min = await slider.getAttribute('aria-valuemin')
  const max = await slider.getAttribute('aria-valuemax')

  expect(min).toBe('0')
  expect(max).toBe('8000')
})

// AC-2.3.1 — clicking a preset populates the textarea with the preset text
test('clicking a preset populates the textarea', async ({ page }) => {
  await page.goto('/')

  const textarea = page.getByRole('textbox')
  // Textarea should be empty (or near-empty) before clicking the preset
  await expect(textarea).toBeVisible()

  // PresetBar renders in both mobile and desktop slots — filter to the visible one
  const preset = page.locator('[data-testid="preset-customer-support-turn"]:visible')
  await preset.click()

  // After clicking, textarea must contain meaningful content
  const value = await textarea.inputValue()
  expect(value.trim().length).toBeGreaterThan(20)
})

// AC-2.4.1 — ?out=2000 sets slider to 2000; textarea must remain empty
test('URL ?out=2000 sets slider to 2000 and leaves textarea empty', async ({ page }) => {
  await page.goto('/?out=2000')

  const slider = page.getByRole('slider')
  await expect(slider).toBeVisible()

  const value = await slider.getAttribute('aria-valuenow')
  expect(value).toBe('2000')

  const textarea = page.getByRole('textbox')
  const textContent = await textarea.inputValue()
  expect(textContent).toBe('')
})

// AC-2.4.2 — malformed ?out=notanumber falls back to 500, no JS error
test('malformed ?out=notanumber falls back to slider value 500 without JS errors', async ({
  page,
}) => {
  const jsErrors: string[] = []
  page.on('pageerror', (err: Error) => jsErrors.push(err.message))

  await page.goto('/?out=notanumber')

  const slider = page.getByRole('slider')
  await expect(slider).toBeVisible()

  const value = await slider.getAttribute('aria-valuenow')
  expect(value).toBe('500')

  expect(jsErrors).toHaveLength(0)
})

// AC-1.1.4 — trust badge "Your text is never sent" visible on 375 px viewport
test('"Your text is never sent" trust badge is visible on a 375 px mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')

  // Accept any case variant and surrounding words
  const badge = page.getByText(/your text is never sent/i)
  await expect(badge).toBeVisible()
})
