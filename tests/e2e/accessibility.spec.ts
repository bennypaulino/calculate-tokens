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
