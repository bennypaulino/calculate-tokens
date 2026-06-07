# Phase 3 — Discovery & Monetization Activation
**Weeks:** 9–10  
**Primary actor:** The AdSense reviewer (Google's automated and human review process)  
**Goal:** Achieve AdSense approval (or confirm Carbon Ads contingency), verify that Phase 0 content has indexed correctly, and validate the entire product against quality and accessibility standards. Phase 3 is the gate before Phase 4 launch.  
**Prerequisite:** Phase 2 complete. Phase 0 content has been live for 6–7 weeks (indexing runway achieved).

---

## 3.1 Ad Network Applications

AdSense and Carbon Ads applications are submitted **simultaneously** at the start of Phase 3. This eliminates a sequential timing dependency: AdSense approval takes 1–14 days (sometimes longer, with no advance warning), and Carbon Ads approval takes 2–4 weeks. Submitting both in parallel ensures that at least one ad network is ready by the Phase 4 launch window regardless of which approves first.

### Prerequisites for submission
All of the following must be true before submitting to either network:
- [ ] At least 10 comparison pages are indexed in Google Search Console (verified by "Coverage" report)
- [ ] `/learn/what-is-a-token` is indexed
- [ ] The calculator is functional (Phase 1 complete)
- [ ] A `privacy` page exists at `/privacy`
- [ ] The site has received at least some organic traffic (any amount)

### Application checklist — AdSense (primary)
1. Create a Google AdSense account at [adsense.google.com](https://adsense.google.com) using the project owner's Google account.
2. Add the AdSense verification script to the site's `<head>`. Deploy to Cloudflare Pages.
3. Submit `calculatetokens.com` for review.
4. Expected review timeline: 1–14 days.

### Application checklist — Carbon Ads (parallel, not fallback)
1. Create a Carbon Ads account and apply for the `calculatetokens.com` property at the same time as the AdSense application.
2. Carbon Ads approval timeline: 2–4 weeks. Starting in parallel ensures Carbon Ads is ready even if AdSense approves first — it becomes the confirmed fallback with no additional wait.
3. Keep the Carbon Ads account in a ready state throughout Phase 3. No ad units need to be placed until it's needed.

### Outcome handling
| Outcome | Action |
|---------|--------|
| AdSense approved | Proceed with AdSense ad units as specified in Phase 2 spec (Section 2.5). **Update `/privacy`:** change AdSense status from "pending approval" to "active"; update the Third-party scripts section to reflect live AdSense serving. Carbon Ads account remains on standby. |
| AdSense pending / under review | Wait up to 14 days; resubmit if explicitly rejected with feedback. If still unresolved at Phase 4 launch, activate Carbon Ads (which should be approved by this point given parallel application). |
| AdSense rejected with feedback | Address the specific policy issue cited; resubmit. Activate Carbon Ads if launch date would otherwise slip. |
| AdSense rejected twice | Activate Carbon Ads. **Update `/privacy`:** replace all AdSense references with Carbon Ads; link to Carbon Ads privacy policy. |

### 3.1.1 Carbon Ads activation
When Carbon Ads is activated (as primary or after AdSense rejection):
1. Carbon Ads serves a single ad unit (script tag). Replace the 4 AdSense container slots with 1 Carbon Ads unit in the most prominent position (inline between textarea and grid).
2. Update the privacy policy to reference Carbon Ads instead of AdSense.
3. Launch proceeds regardless of ad network status — the product ships and revenue follows.

### Acceptance Criteria
- AC-3.1.1: Both AdSense and Carbon Ads applications are submitted before Phase 4 launch begins.
- AC-3.1.2: The active ad network decision (AdSense approved, Carbon Ads active, or pending) is documented in the project README before launch.

---

## 3.2 Google Search Console Verification

### Setup
1. Add the site to Google Search Console using the domain verification method (add a DNS TXT record to the Cloudflare DNS for `calculatetokens.com`).
2. Submit the sitemap at `https://calculatetokens.com/sitemap.xml`.

### Indexing verification
Run the following checks in Search Console:

| Check | Target | Pass condition |
|-------|--------|----------------|
| Sitemap submitted | `/sitemap.xml` | No errors reported |
| Coverage: Valid pages | All pages | Zero "Excluded" pages due to noindex or crawl errors |
| Index coverage: Comparison pages | ≥ 10 pages | At least 10 of the 36 `/compare/*` pages show "Indexed" status |
| Core Web Vitals report | All URLs | Zero "Poor" URLs (LCP > 4s or CLS > 0.25) |
| Rich results | Comparison pages | JSON-LD valid; FAQ rich results eligible |

### Acceptance Criteria
- AC-3.2.1: Search Console shows zero critical crawl errors.
- AC-3.2.2: At least 10 comparison pages show "Indexed" status in the Coverage report.
- AC-3.2.3: The Core Web Vitals report shows zero URLs in the "Poor" category.
- AC-3.2.4: The sitemap returns 200 with no XML parse errors.

---

## 3.3 Core Web Vitals Review

### Measurement approach
Measure against real user data in Cloudflare Analytics AND synthetic Lighthouse in CI. Both must pass.

### Targets (repeated from PRD for gate clarity)
| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 2.5s | Lighthouse CI + Cloudflare real-user data |
| CLS | < 0.1 | Lighthouse CI (with ads loaded) |
| INP | < 200ms | Chrome UX Report via Search Console |
| TTFB | < 200ms | Cloudflare Analytics |

### Phase 3 Lighthouse test procedure
Lighthouse runs against the production URL are automated via `.github/workflows/lighthouse-production.yml`. This workflow triggers via `workflow_run` after every successful deploy to `main`, waits for the production URL to become available (using `npx wait-on`), then runs `@lhci/cli` in desktop and mobile configurations.

```yaml
# .github/workflows/lighthouse-production.yml (abbreviated)
name: Lighthouse Production Check
on:
  workflow_run:
    workflows: ["Deploy to Cloudflare Pages"]
    types: [completed]
    branches: [main]
jobs:
  lighthouse:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - name: Wait for production deployment
        run: npx wait-on https://calculatetokens.com --timeout 120000
      - name: Run Lighthouse (desktop + mobile)
        run: |
          npx @lhci/cli autorun \
            --collect.url=https://calculatetokens.com \
            --collect.numberOfRuns=3 \
            --assert.assertions."largest-contentful-paint"='["error",{"maxNumericValue":2500}]' \
            --assert.assertions."cumulative-layout-shift"='["error",{"maxNumericValue":0.1}]' \
            --upload.target=temporary-public-storage
```

All three configurations (desktop, mobile, mobile with ads) must pass LCP < 2.5s and CLS < 0.1. The automated run produces a publicly accessible LHCI report URL in the job summary. Manual Lighthouse runs against production are a debugging tool for failures surfaced by this automated workflow, not a blocking gate in their own right.

### Common failure sources and fixes
| Issue | Likely cause | Fix |
|-------|-------------|-----|
| LCP > 2.5s | Wasm worker blocking main thread | Verify workers are lazy-loaded; confirm `<link rel="preload">` is not loading Wasm eagerly |
| CLS > 0.1 | Ad slot without explicit `min-height` | Audit ad containers; add `min-height` to any missing |
| INP > 200ms | Synchronous token calculation on main thread | Move to Web Worker; verify debounce is 100ms |
| TTFB > 200ms | Cloudflare Pages cold start | Not applicable for static sites — investigate CDN edge config |

### Acceptance Criteria
- AC-3.3.1: Lighthouse mobile (Moto G Power) with ads loaded reports LCP < 2.5s.
- AC-3.3.2: Lighthouse with ads loaded reports CLS < 0.1.
- AC-3.3.3: INP < 200ms confirmed in Chrome DevTools Performance panel with simulated typing interaction.
- AC-3.3.4: All three Lighthouse configurations pass before Phase 4 launch is authorized.

---

## 3.4 Accessibility Audit

### Tooling
Run accessibility checks in three modes:
1. **Component-level automated:** via `jest-axe` in the unit test suite (fast JSDOM-based check)
2. **Real-browser automated:** via `@axe-core/playwright` (`axe-playwright` package) against the fully rendered page in a real browser — this is the authoritative gate, replacing the manual browser extension check
3. **Screen reader (manual, scoped):** VoiceOver on macOS Safari — scoped to announcement quality validation only (see below)

### Automated tests (required in CI)

**Component-level (`jest-axe`):**
```typescript
// tests/accessibility.test.ts
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CalculatorPage from '../app/page';

expect.extend(toHaveNoViolations);

test('calculator page has no accessibility violations', async () => {
  const { container } = render(<CalculatorPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Real-browser (`@axe-core/playwright`) — authoritative gate:**
```typescript
// tests/e2e/accessibility.spec.ts
import { checkA11y, injectAxe } from 'axe-playwright';

test('calculator page passes real-browser axe audit', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page, undefined, {
    axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] },
  });
});

test('comparison page passes real-browser axe audit', async ({ page }) => {
  await page.goto('/compare/gpt-4o-vs-claude-sonnet-4-6');
  await injectAxe(page);
  await checkA11y(page, undefined, {
    axeOptions: { runOnly: ['wcag2a', 'wcag2aa'] },
  });
});

// ARIA structural pre-conditions for screen reader support
test('aria-live region present for cost ratio callout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[aria-live]')).toHaveCount({ min: 1 });
});

test('keyboard Tab navigation reaches all primary controls', async ({ page }) => {
  await page.goto('/');
  const reached: string[] = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    reached.push(tag);
  }
  expect(reached).toContain('TEXTAREA');
  expect(reached).toContain('INPUT');  // slider
  expect(reached).toContain('BUTTON');
});

test('slider increments on ArrowRight', async ({ page }) => {
  await page.goto('/');
  const slider = page.locator('[aria-label="Output token estimate"]');
  await slider.focus();
  const before = parseInt((await slider.getAttribute('aria-valuenow'))!);
  await page.keyboard.press('ArrowRight');
  const after = parseInt((await slider.getAttribute('aria-valuenow'))!);
  expect(after).toBeGreaterThan(before);
});
```

### Required pass conditions
- Zero `critical` violations (must fix before launch — no exceptions)
- Zero `serious` violations (must fix before launch — no exceptions)
- `moderate` violations: reviewed and accepted or fixed
- `minor` violations: logged as issues for v2; do not block launch

### Manual screen reader test procedure (scoped)
Structural pre-conditions for screen reader support (keyboard navigation, `aria-live` presence, slider operability) are now verified automatically by the Playwright tests above. The manual VoiceOver test is scoped to **announcement quality validation only** — verifying that what the screen reader announces makes semantic sense to a human user.

Confirm with VoiceOver on macOS (Safari):
1. The live cost ratio callout is announced naturally when it appears (not just "status" — the text content is read)
2. The cost grid reads in a logical column order (Model → Input → Output → Total)
3. The "~" heuristic prefix on token counts is read or skipped in a way that makes sense to a non-sighted user
4. The share button's state (active/inactive) is communicated

This is a qualitative check, not a binary pass/fail CI gate. It is a recommended supplement to the automated tests, not a blocking launch requirement.

### Acceptance Criteria
- AC-3.4.1: `jest-axe` test passes with zero critical or serious violations.
- AC-3.4.2: `@axe-core/playwright` `checkA11y()` passes with zero critical or serious WCAG 2.1 AA violations on the calculator page in a real browser.
- AC-3.4.3: The cost ratio callout element has `aria-live="polite"` (verified by Playwright structural test).
- AC-3.4.4: Keyboard Tab navigation reaches textarea, slider (INPUT), and share button (BUTTON) within 30 Tab presses (verified by Playwright structural test).
- AC-3.4.5: The output slider increments `aria-valuenow` on ArrowRight key press (verified by Playwright structural test).
- AC-3.4.6: All form elements have associated labels (verified by axe `label` rule in both `jest-axe` and `@axe-core/playwright`).
- AC-3.4.7: Focus order follows the visual layout — Tab progresses: header → textarea → slider → grid → simulator → footer (verified by Playwright keyboard navigation test).

---

## 3.5 Cross-Browser QA Matrix

### Automated cross-browser CI (zero cost)
All P0 flows are run in CI via Playwright against five browser configurations. No BrowserStack account is required.

`playwright.config.ts` MUST define these projects:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
]
```

The CI `ci.yml` workflow MUST install all three browser engines: `npx playwright install --with-deps chromium firefox webkit`. Test runs are parallelized across browser projects (`workers: 3` minimum in CI).

| Playwright Project | Covers | Priority |
|-------------------|--------|----------|
| `chromium` | Chrome, Edge | P0 |
| `firefox` | Firefox | P0 |
| `webkit` | Safari macOS | P0 |
| `mobile-chrome` | Android Chrome (emulated) | P0 |
| `mobile-safari` | iOS Safari (emulated) | P0 |

**Real-device testing (supplementary, not a blocking gate):**
Playwright mobile emulation covers all functional flows. Real-device testing is scoped to three specific areas that emulation cannot fully replicate:
1. Service Worker installation and offline caching (iOS Safari has implementation-specific SW behavior)
2. Token highlighter visual rendering (CSS rendering differences on real hardware)
3. Touch scroll behavior in the cost grid

Real-device testing of these three flows is recommended before launch but does not block the Phase 3 launch gate. This is irreducibly manual — zero-cost automation of real Safari on iOS does not exist without BrowserStack ($450+/month).

### Test flows (run for each browser)
1. **Basic calculation:** Paste 200 words of text → verify token count updates → verify cost grid populates
2. **Slider interaction:** Move slider to 2,000 → verify cost grid updates
3. **Token highlighter:** Enable highlighter → verify colored spans appear → type additional text → verify highlights update
4. **Preset load:** Click "Blog post summary" preset → verify textarea populates
5. **Scaling simulator:** Set volume to 100,000 → verify monthly costs calculate
6. **Share URL:** Copy share URL → open in new tab → verify state restores
7. **Mobile layout:** On mobile viewport, verify single-column layout, no horizontal scroll, ad units inline

### Acceptance Criteria
- AC-3.5.1: All P0 flows pass across all five Playwright projects in CI without JavaScript errors.
- AC-3.5.2: No horizontal scroll on 375px viewport in any browser project (verified by `mobile-safari` and `mobile-chrome` Playwright projects).
- AC-3.5.3: Token highlighter renders without visual glitches in `firefox` Playwright project (known quirk with `background-color` on inline spans — add Firefox-specific snapshot test if needed).
- AC-3.5.4: Service Worker installs successfully in `webkit` Playwright project; real-device iOS SW behavior is a supplementary manual check.
- AC-3.5.5: CI reports a test result for each of the five browser projects. A failure in any single project fails the build.

---

## 3.6 End-to-End Test Suite

### Framework: Playwright
Playwright tests run in GitHub Actions CI against the Cloudflare Pages preview URL on every PR to `main`.

### Test file structure
```
tests/
  e2e/
    calculator.spec.ts      # Core calculation golden path
    comparison-pages.spec.ts  # Static content pages
    share-url.spec.ts       # URL state encoding/decoding
    accessibility.spec.ts   # Keyboard navigation flows
```

### `calculator.spec.ts` — required test cases

```typescript
test('heuristic token count appears immediately', async ({ page }) => {
  await page.goto('/');
  await page.fill('[aria-label="Enter your AI prompt or text"]', 'Hello world this is a test input');
  await page.waitForTimeout(150); // debounce
  const countText = await page.locator('[data-testid="token-count"]').innerText();
  expect(countText).toMatch(/~\d+ tokens/);
});

test('cost grid populates for all models', async ({ page }) => {
  await page.goto('/');
  await page.fill('[aria-label="Enter your AI prompt or text"]', 'A'.repeat(400));
  await page.waitForTimeout(150);
  const rows = await page.locator('[data-testid="cost-grid-row"]').count();
  expect(rows).toBeGreaterThanOrEqual(9); // at least 9 models
});

test('cost grid sorted cheapest first by default', async ({ page }) => {
  await page.goto('/');
  await page.fill('[aria-label="Enter your AI prompt or text"]', 'A'.repeat(400));
  await page.waitForTimeout(150);
  const costs = await page.locator('[data-testid="total-cost"]').allInnerTexts();
  const parsed = costs.map(c => parseFloat(c.replace('$', '')));
  for (let i = 1; i < parsed.length; i++) {
    expect(parsed[i]).toBeGreaterThanOrEqual(parsed[i - 1]);
  }
});

test('output slider updates costs', async ({ page }) => {
  await page.goto('/');
  await page.fill('[aria-label="Enter your AI prompt or text"]', 'A'.repeat(400));
  await page.waitForTimeout(150);
  const initialCosts = await page.locator('[data-testid="output-cost"]').allInnerTexts();
  await page.fill('[aria-label="Output token estimate"]', '2000');
  await page.waitForTimeout(50);
  const updatedCosts = await page.locator('[data-testid="output-cost"]').allInnerTexts();
  expect(updatedCosts).not.toEqual(initialCosts);
});

test('share URL restores configuration state, not text', async ({ page }) => {
  await page.goto('/');
  // Set a non-default configuration value (output slider to 2000)
  await page.fill('[aria-label="Output token estimate"]', '2000');
  await page.waitForTimeout(600); // wait for 500ms replaceState throttle + buffer
  const url = page.url();
  // Navigate to the share URL
  await page.goto(url);
  // INVARIANT: textarea must be empty — text is never encoded in URLs (privacy + security)
  const restoredText = await page.locator('[aria-label="Enter your AI prompt or text"]').inputValue();
  expect(restoredText).toBe('');
  // Configuration state (slider value) must be restored from URL
  const sliderValue = await page.locator('[aria-label="Output token estimate"]').getAttribute('aria-valuenow');
  expect(sliderValue).toBe('2000');
});

test('trust badge is visible without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const badge = page.locator('[data-testid="trust-badge"]');
  await expect(badge).toBeVisible();
  const box = await badge.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(667); // within viewport
});
```

### `comparison-pages.spec.ts` — required test cases
```typescript
test('comparison page renders pricing table', async ({ page }) => {
  await page.goto('/compare/gpt-4o-vs-claude-sonnet-4-6');
  await expect(page.locator('h1')).toContainText('vs');
  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('text=Input cost')).toBeVisible();
});

test('comparison page has valid structured data', async ({ page }) => {
  await page.goto('/compare/gpt-4o-vs-claude-sonnet-4-6');
  const jsonLd = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => JSON.parse(s.textContent!));
  });
  expect(jsonLd.length).toBeGreaterThan(0);
  expect(jsonLd[0]['@type']).toBe('FAQPage');
});
```

### Acceptance Criteria
- AC-3.6.1: All E2E tests pass in Chromium (Playwright default) in CI.
- AC-3.6.2: E2E tests run against the Cloudflare Pages preview URL on every PR to `main`.
- AC-3.6.3: Test failures block merging to `main` (required status check).
- AC-3.6.4: All `data-testid` attributes referenced in tests are present in the production DOM.

---

## 3.7 Cross-Origin Worker Deployment

Wasm tokenizer workers are served from `workers.calculatetokens.com` — a second Cloudflare Pages project with its own permissive CSP. This allows exact tokenization in all CSP modes, including the AdSense production build. The main page CSP never needs `wasm-unsafe-eval`; AdSense compatibility is maintained without any tokenization degradation.

### How it works

The main page's `WorkerManager` branches on `NEXT_PUBLIC_WORKERS_ORIGIN` (Phase 1 prerequisite, AC-1.2.6):
- **Unset / empty** (dev, analytics build): workers load via bundled relative `new URL(...)` paths — existing behavior, no change.
- **Set to `https://workers.calculatetokens.com`** (adsense production build): workers load via absolute cross-origin URL. The subdomain's `_headers` file grants the required CORS and CORP headers. The Wasm payload executes in the worker's origin, not the main page's — so the main page CSP never sees `wasm-unsafe-eval`.

### Phase 3 prerequisites (must be complete before this section's ACs are evaluated)

The following items from earlier phases are blocking prerequisites for AC-3.7.x:

- **AC-1.2.6 (Phase 1)**: `WorkerManager` factory functions branch on `NEXT_PUBLIC_WORKERS_ORIGIN`. Must be implemented and merged. ✅
- **`scripts/generate-headers.js` (Phase 1)**: Prebuild script that generates `public/_headers` with mode-appropriate CSP. `NEXT_PUBLIC_CSP_MODE=adsense npm run build` produces adsense-mode headers (`worker-src 'self' https://workers.calculatetokens.com`, no `wasm-unsafe-eval`). Wired into `package.json` `prebuild`. ✅
- **`public/_headers`**: Now generated by `generate-headers.js` — not manually edited. The adsense-mode CSP includes `worker-src https://workers.calculatetokens.com`. ✅
- **`scripts/validate-csp.js`**: Asserts `worker-src https://workers.calculatetokens.com` is present specifically in the `worker-src` directive (not just anywhere in the CSP string) when `NEXT_PUBLIC_CSP_MODE=adsense`. Uses directive-aware regex. ✅
- **`.env.local.example`**: Documents `NEXT_PUBLIC_WORKERS_ORIGIN` with comments explaining the two build configurations. ✅
- **`scripts/validate-worker-origin.js`**: CI health check for subdomain CORS and CSP headers. Added as optional step in `pricing-check.yml`. ✅

### Acceptance Criteria

**AC-3.7.1 — Subdomain deployment**
A second Cloudflare Pages project serves compiled worker JS files at `workers.calculatetokens.com`. The project directory (`workers-pages/`) in the repository contains:
- `dist/tiktoken.worker.js` (compiled and **committed** to the repo — run `npm run build:workers` from `workers-pages/`, then `git add workers-pages/dist/`)
- `dist/heuristic.worker.js` (same — compiled and committed)
- `_headers` file with correct CORS and CSP directives (see AC-3.7.2)
- `package.json` with `build:workers` script that produces the compiled JS
- `build.js` that invokes esbuild to bundle each worker with its dependencies

The Cloudflare Pages project for the subdomain has no build command configured — it serves the committed `dist/` files directly. This avoids a CF Pages build dependency on esbuild and keeps compiled output auditable in git history.

Build steps:
1. `cd workers-pages && npm install` (installs esbuild — separate `node_modules` from root)
2. `npm run build:workers` (compiles workers to `workers-pages/dist/`)
3. `git add workers-pages/dist/ && git commit`

**Important**: After any change to `src/workers/tiktoken.worker.ts` or `src/workers/heuristic.worker.ts`, re-run steps 1–3 and commit the updated `dist/` files. CI has no automated check for stale compiled workers — shipping without this step will silently serve outdated worker code from the subdomain.

**AC-3.7.2 — Subdomain CORS and CSP headers**
`workers.calculatetokens.com/_headers` sets on all paths:
```
/*
  Access-Control-Allow-Origin: https://calculatetokens.com
  Cross-Origin-Resource-Policy: cross-origin
  Content-Security-Policy: default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'
```
Cloudflare Pages automatically serves `.js` files with `Content-Type: application/javascript` — no explicit `Content-Type` header is required in `_headers`. Verified by `node scripts/validate-worker-origin.js` (see AC-3.7.6). HTTP 200 with these headers is the pass condition.

**AC-3.7.3 — Main site CSP in adsense mode**
When `NEXT_PUBLIC_CSP_MODE=adsense`, `public/_headers` `worker-src` directive includes `https://workers.calculatetokens.com`. `validate-csp.js` asserts this. No `wasm-unsafe-eval` appears anywhere in the main domain's CSP. CI fails if either condition is violated.

**AC-3.7.4 — Exact tokenization in adsense build**
Playwright test in `tests/e2e/adsense.spec.ts` (separate file for isolation).

CI execution: an `adsense-build-test` job in `ci.yml` (separate from the existing `build-and-test` job) runs with `NEXT_PUBLIC_CSP_MODE=adsense` and `NEXT_PUBLIC_WORKERS_ORIGIN=https://workers.calculatetokens.com`, builds the static output, then runs `npx playwright test tests/e2e/adsense.spec.ts` against it. This job runs in parallel with `build-and-test` and is a required status check before merge to `main`.

Test setup within `adsense.spec.ts`:
1. Before navigating, intercept requests to `https://workers.calculatetokens.com/**` via `page.route()` and fulfill them from local `workers-pages/dist/` files — this avoids requiring a live subdomain in CI
2. Navigate to the static build served locally

Assertions:
- Type 20+ character text into the textarea
- Assert GPT-4o input token count does NOT have a `~` prefix (tiktoken worker resolved via mocked cross-origin route)
- Must pass on all five Playwright browser projects: chromium, firefox, webkit, mobile-chrome, mobile-safari

Note: The `page.route()` mock bypasses real CORS enforcement at the browser level. After the subdomain goes live, run `validate-worker-origin.js` from a real browser (especially Safari) to verify actual CORP header behavior.

Note: Claude/Gemini/Llama models will continue to show `~` (heuristic) in this test — their Wasm tokenizer workers are not yet implemented. This AC intentionally scopes the exact-count assertion to GPT-4o only. Extend to Claude/Gemini/Llama in a future iteration when their Wasm workers are added.

**AC-3.7.5 — Dev and analytics build fallback unchanged**
When `NEXT_PUBLIC_WORKERS_ORIGIN` is unset or empty, workers load from bundled relative `new URL(...)` paths. All existing Playwright tests continue to pass without the subdomain. No regression in analytics-mode builds.

**AC-3.7.6 — Worker origin validation script**
`scripts/validate-worker-origin.js` exists and:
- Requires Node 18+ (exits 1 with clear message if older version detected)
- Fetches `https://workers.calculatetokens.com/tiktoken.worker.js` (configurable via `--url` flag)
- Asserts HTTP 200
- Asserts `access-control-allow-origin: https://calculatetokens.com` header present
- Asserts `cross-origin-resource-policy: cross-origin` header present
- Asserts `content-security-policy` header contains `'wasm-unsafe-eval'` (confirms subdomain permits Wasm execution)
- Exits 0 on pass, exits 1 on any failure with descriptive message
- Runs in `pricing-check.yml` CI as an optional (non-blocking, `continue-on-error: true`) step in Phase 3; becomes a blocking step in the Phase 4 pre-launch gate

**AC-3.7.7 — Cross-origin worker failure fallback**
When a cross-origin worker fails to load (`onerror` fires on the `Worker` object), the affected model rows must not remain in permanent `pending` state. Required behavior:
- The `onError()` callback triggers the calculator store to set that model's status to `error`
- The UI renders the error indicator (the `?` symbol defined in `CostGridRow` `statusSymbol.error`)
- A `console.warn` is emitted identifying the failed worker URL
- Verified by Playwright: configure `page.route()` to return HTTP 404 for `workers.calculatetokens.com/**`, confirm affected model rows show the error indicator within 3 seconds of textarea input

---

## Phase 3 — Definition of Done (Launch Gate)

All items must pass before Phase 4 launch is authorized:

**Monetization:**
- [ ] AdSense application submitted AND Carbon Ads application submitted (parallel track)
- [ ] Active ad network decision documented in README

**Search:**
- [ ] Google Search Console: zero critical errors
- [ ] ≥ 10 comparison pages indexed
- [ ] Core Web Vitals report: zero "Poor" URLs

**Performance:**
- [ ] Lighthouse mobile (with ads): LCP < 2.5s ✓
- [ ] Lighthouse mobile (with ads): CLS < 0.1 ✓
- [ ] INP < 200ms confirmed in DevTools

**Quality:**
- [ ] `jest-axe`: zero critical or serious violations
- [ ] `@axe-core/playwright` real-browser axe audit: zero critical or serious WCAG 2.1 AA violations
- [ ] Playwright ARIA structural tests: `aria-live`, keyboard Tab navigation, slider ArrowKey operability all pass
- [ ] Manual VoiceOver check: announcement quality validated (recommended, not blocking)
- [ ] Cross-browser matrix: all P0 flows pass across all five Playwright projects (chromium, firefox, webkit, mobile-chrome, mobile-safari)
- [ ] Real-device supplementary check: SW installation, token highlighter, touch scroll on iOS Safari (recommended, not blocking)
- [ ] E2E suite: all tests passing in CI

**Cross-origin workers:**
- [ ] `workers-pages/dist/tiktoken.worker.js` and `heuristic.worker.js` built and committed to repo
- [ ] `workers.calculatetokens.com` Cloudflare Pages project created, pointing to `workers-pages/` directory, no build command (serves committed `dist/` files directly)
- [ ] Subdomain deployment verified healthy **before** adsense main site deployment is initiated (ordering constraint: subdomain must be live first)
- [ ] `node scripts/validate-worker-origin.js` exits 0
- [ ] AC-3.7.3 verified: adsense-mode `_headers` contains `worker-src https://workers.calculatetokens.com`, no `wasm-unsafe-eval` on main domain
- [ ] AC-3.7.4 verified: Playwright adsense build (`tests/e2e/adsense.spec.ts`) confirms exact (non-heuristic) GPT-4o token count across all five browser projects (subdomain mocked via `page.route()`)
- [ ] AC-3.7.7 verified: Playwright confirms cross-origin worker failure falls back to error state, not permanent pending

**Pricing:**
- [ ] All 9 initial models have `last_human_verified` within 14 days of launch
- [ ] `prices.json` daily check workflow running without errors for ≥ 7 consecutive days
