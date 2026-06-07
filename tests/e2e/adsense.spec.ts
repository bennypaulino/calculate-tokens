import { test, expect } from '@playwright/test'

/**
 * AC-3.7.x — Cross-origin worker tests for adsense build mode.
 *
 * These tests run against the "adsense" playwright project which starts the
 * dev server on port 3001 with NEXT_PUBLIC_WORKERS_ORIGIN set to
 * https://workers.calculatetokens.com. page.route() mocks the subdomain so
 * no real subdomain needs to be deployed during CI.
 */

const WORKER_ORIGIN = 'https://workers.calculatetokens.com'

// Minimal valid heuristic-worker script that the WorkerManager can use.
// Returns a heuristic count via postMessage so the UI can display a result.
const MOCK_WORKER_SCRIPT = `
self.onmessage = function(e) {
  const { id, text } = e.data;
  const count = Math.ceil((text || '').length / 4);
  self.postMessage({ id, tokenCount: count, source: 'wasm' });
};
`

test.describe('AC-3.7.4 — adsense build: workers load from configured origin', () => {
  test('page requests workers from the configured cross-origin subdomain', async ({ page }) => {
    const workerRequests: string[] = []

    // Intercept and mock all requests to the worker subdomain
    await page.route(`${WORKER_ORIGIN}/**`, async (route) => {
      workerRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: MOCK_WORKER_SCRIPT,
      })
    })

    await page.goto('/')
    const textarea = page.getByRole('textbox')
    await textarea.fill('Hello world')

    // Allow time for worker initialisation
    await page.waitForTimeout(2000)

    // At least one worker script should have been requested from the subdomain
    expect(workerRequests.length).toBeGreaterThan(0)
    expect(workerRequests[0]).toContain('workers.calculatetokens.com')
  })

  test('page loads without JS errors in adsense mode', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err: Error) => jsErrors.push(err.message))

    await page.route(`${WORKER_ORIGIN}/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: MOCK_WORKER_SCRIPT,
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(jsErrors).toHaveLength(0)
  })
})

test.describe('AC-3.7.7 — cross-origin worker failure falls back gracefully', () => {
  test('heuristic fallback (~ prefix) appears when worker origin is unreachable', async ({
    page,
  }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err: Error) => jsErrors.push(err.message))

    // Abort all worker requests → simulates subdomain being unreachable
    await page.route(`${WORKER_ORIGIN}/**`, (route) => route.abort())

    await page.goto('/')
    const textarea = page.getByRole('textbox')
    await textarea.fill('Hello world, this is a test.')

    // Heuristic estimate should appear (indicated by ~ prefix)
    await expect(page.locator('text=/~\\d/')).toBeVisible({ timeout: 5000 })

    // No uncaught JS exceptions despite worker failure
    expect(jsErrors).toHaveLength(0)
  })

  test('page remains interactive after cross-origin worker failure', async ({ page }) => {
    await page.route(`${WORKER_ORIGIN}/**`, (route) => route.abort())

    await page.goto('/')

    // Textarea should still be interactive
    const textarea = page.getByRole('textbox')
    await expect(textarea).toBeVisible()
    await textarea.fill('Still works')

    // Slider should still be interactive
    const slider = page.getByRole('slider')
    await expect(slider).toBeVisible()
    await slider.focus()
    await slider.press('ArrowRight')

    const valuenow = await slider.getAttribute('aria-valuenow')
    expect(parseInt(valuenow ?? '0', 10)).toBeGreaterThan(0)
  })
})
