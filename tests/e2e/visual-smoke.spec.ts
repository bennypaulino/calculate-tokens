import { test, expect } from '@playwright/test';

test('body background is dark canvas (#0c0d10)', async ({ page }) => {
  await page.goto('/');
  const bg = await page.locator('body').evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  expect(bg).toBe('rgb(12, 13, 16)');
});

test('amber accent CSS variable is defined', async ({ page }) => {
  await page.goto('/');
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-ct-accent')
      .trim()
  );
  expect(accent).toBe('#fbbf24');
});

test('navigation contains expected links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Models' })).toBeVisible();
  await expect(page.getByRole('link', { name: /What is a token/i })).toBeVisible();
});
