import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

// Full axe accessibility audit on the main calculator page
// Only fail on critical and serious violations (WCAG 2.0 A/AA + WCAG 2.1 A/AA)
test('main calculator page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/')

  await injectAxe(page)

  // includedImpacts limits failures to critical and serious violations only
  await checkA11y(
    page,
    undefined,
    {
      includedImpacts: ['critical', 'serious'],
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
  )
})

// Verify key interactive elements carry explicit aria-label attributes
test('key interactive elements have aria-label attributes', async ({ page }) => {
  await page.goto('/')

  // Textarea (prompt input)
  const textarea = page.getByRole('textbox')
  await expect(textarea).toBeVisible()
  const textareaLabel = await textarea.getAttribute('aria-label')
  expect(textareaLabel).toBeTruthy()

  // Output-token slider
  const slider = page.getByRole('slider')
  await expect(slider).toBeVisible()
  const sliderLabel = await slider.getAttribute('aria-label')
  expect(sliderLabel).toBeTruthy()
})

// Keyboard navigation: Tab should reach the textarea and slider without a mouse
test('textarea and slider are reachable via keyboard Tab navigation', async ({ page }) => {
  await page.goto('/')

  // Start from the top of the page
  await page.keyboard.press('Tab')

  // Keep tabbing until we hit the textarea (up to 20 presses)
  let textareaFocused = false
  for (let i = 0; i < 20; i++) {
    const focused = page.locator(':focus')
    const role = await focused.getAttribute('role')
    const tagName: string = await focused.evaluate((el: Element) => el.tagName.toLowerCase())
    if (tagName === 'textarea' || role === 'textbox') {
      textareaFocused = true
      break
    }
    await page.keyboard.press('Tab')
  }
  expect(textareaFocused).toBe(true)

  // Keep tabbing until we hit the slider
  let sliderFocused = false
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const role = await focused.getAttribute('role')
    if (role === 'slider') {
      sliderFocused = true
      break
    }
  }
  expect(sliderFocused).toBe(true)
})

// AC-3.4.5 — ArrowRight on the output slider increments aria-valuenow
test('output slider increments aria-valuenow on ArrowRight key press', async ({ page }) => {
  await page.goto('/')

  const slider = page.getByRole('slider')
  await expect(slider).toBeVisible()

  const before = parseInt((await slider.getAttribute('aria-valuenow')) ?? '0', 10)

  await slider.focus()
  await slider.press('ArrowRight')

  const after = parseInt((await slider.getAttribute('aria-valuenow')) ?? '0', 10)
  expect(after).toBeGreaterThan(before)
})

// AC-3.4.4 — share button is reachable via Tab within 30 presses
test('share button is reachable via keyboard Tab within 30 presses', async ({ page }) => {
  await page.goto('/')

  let shareButtonFocused = false
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const testId = await focused.getAttribute('data-testid').catch(() => null)
    if (testId === 'share-button') {
      shareButtonFocused = true
      break
    }
  }
  expect(shareButtonFocused).toBe(true)
})

// AC-3.4.7 — focus order: textarea appears before slider in Tab sequence
test('focus order: textarea appears before slider in Tab sequence', async ({ page }) => {
  await page.goto('/')

  // Record Tab sequence positions for textarea and slider
  let textareaTabIndex = -1
  let sliderTabIndex = -1

  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    const tagName: string = await focused.evaluate((el: Element) => el.tagName.toLowerCase()).catch(() => '')
    const role = await focused.getAttribute('role').catch(() => null)

    if ((tagName === 'textarea' || role === 'textbox') && textareaTabIndex === -1) {
      textareaTabIndex = i
    }
    if (role === 'slider' && sliderTabIndex === -1) {
      sliderTabIndex = i
    }
    if (textareaTabIndex !== -1 && sliderTabIndex !== -1) break
  }

  expect(textareaTabIndex).toBeGreaterThanOrEqual(0)
  expect(sliderTabIndex).toBeGreaterThan(textareaTabIndex)
})
