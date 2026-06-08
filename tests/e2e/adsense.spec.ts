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
    // Spy on the Worker constructor before page load so we can capture every URL
    // passed to new Worker(). page.route() does not reliably intercept Web Worker
    // script fetches in all Playwright environments, so we capture at the JS layer.
    await page.addInitScript(() => {
      const OriginalWorker = globalThis.Worker
      const captured: string[] = []
      ;(globalThis as unknown as Record<string, unknown>).__workerUrls = captured
      globalThis.Worker = function (
        url: string | URL,
        options?: WorkerOptions
      ): Worker {
        captured.push(String(url))
        return new OriginalWorker(url, options)
      } as unknown as typeof Worker
      globalThis.Worker.prototype = OriginalWorker.prototype
    })

    // Still mock the subdomain so workers can actually respond
    await page.route(`${WORKER_ORIGIN}/**`, async (route) => {
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

    // At least one worker should have been constructed with the subdomain URL
    const workerUrls: string[] = await page.evaluate(
      () => (window as unknown as Record<string, string[]>).__workerUrls ?? []
    )
    expect(workerUrls.length).toBeGreaterThan(0)
    expect(workerUrls.some((u) => u.includes('workers.calculatetokens.com'))).toBe(true)
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

    // Heuristic estimate should appear (indicated by ~ prefix) — .first() because
    // the cost grid renders one cell per model, all showing the same ~N value.
    await expect(page.locator('text=/~\\d/').first()).toBeVisible({ timeout: 5000 })

    // The only tolerated error is the CORS/network error Chromium throws when the
    // cross-origin worker request is aborted — that IS the failure we're testing.
    // Any other uncaught JS exception is unexpected.
    const unexpectedErrors = jsErrors.filter(
      (msg) =>
        !msg.includes('cannot be accessed from origin') &&
        !msg.includes('workers.calculatetokens.com')
    )
    expect(unexpectedErrors).toHaveLength(0)
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
