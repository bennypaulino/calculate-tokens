import { test, expect, type Page, type Route, type Request } from '@playwright/test'

/**
 * Helper: intercepts POST requests to Umami's /api/send endpoint and
 * returns a handle that accumulates all payloads received during the test.
 */
async function captureUmamiEvents(page: Page) {
  const events: Array<{ type: string; data: Record<string, unknown> }> = []

  await page.route('**/api/send', async (route: Route, request: Request) => {
    const body = request.postDataJSON() as {
      type: string
      payload?: { name?: string; data?: Record<string, unknown> }
    }
    if (body?.type === 'event' && body?.payload?.name) {
      events.push({
        type: body.payload.name,
        data: body.payload.data ?? {},
      })
    }
    // Always fulfil so the page doesn't break
    await route.fulfill({ status: 200, body: 'ok' })
  })

  return events
}

/** 347-character string used to verify quantization to 300 */
const INPUT_347 =
  'The quick brown fox jumps over the lazy dog. ' +
  'Pack my box with five dozen liquor jugs. ' +
  'How valiantly did Blackjack-dav fight! ' +
  'Sphinx of black quartz, judge my vow. ' +
  'Two driven jocks help fax my big quiz. ' +
  'Five quacking zephyrs jolt my wax bed. ' +
  'The five boxing wizards jump quickly. ' +
  'Jackdaws love my big sphinx of quartz!!'

// Sanity check — exactly 347 chars
if (INPUT_347.length !== 347) {
  throw new Error(`INPUT_347 is ${INPUT_347.length} chars, expected 347`)
}

// AC-2.6.4 — tokenize event fires with char_count quantized to 300
test('tokenize event fires with char_count=300 for 347-char input', async ({ page }) => {
  const events = await captureUmamiEvents(page)
  await page.goto('/')

  const textarea = page.getByRole('textbox', { name: /prompt|text|input/i })
  await textarea.fill(INPUT_347)

  // Wait 2.5 s to let the debounce / event fire
  await page.waitForTimeout(2500)

  const tokenizeEvents = events.filter((e) => e.type === 'tokenize')
  expect(tokenizeEvents.length).toBeGreaterThan(0)

  const last = tokenizeEvents[tokenizeEvents.length - 1]
  // GDPR data minimization: char_count must be quantized to nearest 100
  expect(last.data.char_count).toBe(300)
})

// AC-2.6.x — preset_selected event fires with preset_name
test('preset_selected event fires with preset_name when a preset is clicked', async ({ page }) => {
  const events = await captureUmamiEvents(page)
  await page.goto('/')

  const preset = page.getByTestId('preset-customer-support-turn')
  await preset.click()

  // Event should fire synchronously or near-synchronously
  await page.waitForTimeout(500)

  const presetEvents = events.filter((e) => e.type === 'preset_selected')
  expect(presetEvents.length).toBeGreaterThan(0)
  expect(presetEvents[presetEvents.length - 1].data.preset_name).toBe('customer-support-turn')
})

// AC-2.6.x — share_url_copied event fires when share button is clicked
test('share_url_copied event fires on clicking the share button', async ({ page }) => {
  const events = await captureUmamiEvents(page)
  await page.goto('/')

  // Grant clipboard-write permission so the copy succeeds
  await page.context().grantPermissions(['clipboard-write'])

  const shareButton = page.getByTestId('share-button')
  await shareButton.click()

  await page.waitForTimeout(500)

  const shareEvents = events.filter((e) => e.type === 'share_url_copied')
  expect(shareEvents.length).toBeGreaterThan(0)
})

// AC-2.6.x — output_slider_adjusted event fires with the slider value
test('output_slider_adjusted event fires with correct value when slider is moved', async ({
  page,
}) => {
  const events = await captureUmamiEvents(page)
  await page.goto('/')

  const slider = page.getByRole('slider')
  await slider.focus()
  // Move right several times to increment the value
  for (let i = 0; i < 5; i++) {
    await slider.press('ArrowRight')
  }

  await page.waitForTimeout(500)

  const sliderEvents = events.filter((e) => e.type === 'output_slider_adjusted')
  expect(sliderEvents.length).toBeGreaterThan(0)
  // Value must be a positive number
  const value = sliderEvents[sliderEvents.length - 1].data.value
  expect(typeof value).toBe('number')
  expect(value as number).toBeGreaterThan(0)
})

// Resilience — aborting the Umami script must not produce JS errors on the page
test('Umami script abort does not throw JS errors', async ({ page }) => {
  // Block the Umami analytics script
  await page.route('**/script.js', (route: Route) => route.abort())
  await page.route('**/umami**', (route: Route) => route.abort())
  await page.route('**/api/send', (route: Route) => route.abort())

  const jsErrors: string[] = []
  page.on('pageerror', (err: Error) => jsErrors.push(err.message))

  await page.goto('/')
  // Interact minimally so any deferred code paths run
  const textarea = page.getByRole('textbox')
  if (await textarea.isVisible()) {
    await textarea.fill('hello')
  }
  await page.waitForTimeout(1000)

  expect(jsErrors).toHaveLength(0)
})

// AC-2.4.3 — share URL must NOT contain textarea text content
test('Share URL does not contain textarea text content', async ({ page }) => {
  await page.goto('/')
  await page.context().grantPermissions(['clipboard-write', 'clipboard-read'])

  const textarea = page.getByRole('textbox')
  const sampleText = 'Super secret prompt text that must not leak into the URL'
  await textarea.fill(sampleText)

  const shareButton = page.getByTestId('share-button')
  await shareButton.click()

  // Read what was written to the clipboard
  const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText())

  // The URL (or whatever was copied) must not contain any meaningful portion
  // of the typed text.  We check for the first 10 chars as a representative slice.
  expect(clipboardText).not.toContain(sampleText.slice(0, 10))

  // Also verify the current page URL itself does not encode the text
  const currentUrl = page.url()
  expect(currentUrl).not.toContain(encodeURIComponent(sampleText.slice(0, 10)))
  // Explicit prohibition: no ?t= parameter
  expect(currentUrl).not.toMatch(/[?&]t=/)
})
