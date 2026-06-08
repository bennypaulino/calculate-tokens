import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium',      use: { ...devices['Desktop Chrome'] },   testIgnore: '**/adsense.spec.ts' },
    { name: 'firefox',       use: { ...devices['Desktop Firefox'] },  testIgnore: '**/adsense.spec.ts' },
    { name: 'webkit',        use: { ...devices['Desktop Safari'] },   testIgnore: '**/adsense.spec.ts' },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] },          testIgnore: '**/adsense.spec.ts' },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] },        testIgnore: '**/adsense.spec.ts' },
    {
      name: 'adsense',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
      testMatch: '**/adsense.spec.ts',
    },
  ],
  webServer: [
    {
      command: 'NEXT_PUBLIC_CSP_MODE=analytics npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'NEXT_PUBLIC_CSP_MODE=adsense NEXT_PUBLIC_WORKERS_ORIGIN=https://workers.calculatetokens.com PORT=3001 npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
})
