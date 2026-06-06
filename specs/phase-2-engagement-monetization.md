# Phase 2 — Engagement & Monetization
**Weeks:** 7–8  
**Primary actor:** Sam — The SaaS Builder  
**Goal:** Add the features that make the tool worth sharing and monetize the traffic Phase 0 has been building. By the end of Phase 2, the tool is complete in functionality and generating ad impressions.  
**Prerequisite:** Phase 1 complete and stable.

---

## 2.1 Visual Token Highlighter

### Description
A toggleable overlay that colorizes token boundaries directly in the textarea, showing users exactly where the tokenizer splits their text. Primary dwell-time driver — developers explore their prompts token-by-token.

### Technical approach
The textarea is replaced with a layered composition: a transparent `<textarea>` overlaid on a `<div>` mirror. The div displays the same text but wraps each token in a `<span>` with alternating highlight classes. The textarea remains the editable input; the div provides visual decoration only.

This approach (mirrored highlight) is standard for syntax-highlight-in-textarea and avoids `contenteditable` complexity. Reference: CodeMirror's approach to line highlighting.

#### DOM rendering safety requirement
Token text content MUST be inserted into `<span>` elements using DOM API methods (`document.createElement` + `element.textContent = tokenText`). Use of `innerHTML` with unsanitized token content is **prohibited**. This is not optional: the highlighter renders arbitrary user input, including pasted content from shared URLs. An `innerHTML`-based implementation is a stored-equivalent XSS vulnerability.

This requirement MUST be verified by a unit test:
```typescript
test('token highlighter does not execute injected scripts', () => {
  const payload = '<img src=x onerror="window.__xss=true">';
  renderHighlighter(payload);
  expect(window.__xss).toBeUndefined();
  expect(document.querySelector('img')).toBeNull();
});
```

### Requirements
1. The highlighter is off by default. A toggle button labeled "Highlight tokens" (with a keyboard shortcut `Shift+H`) enables it.
2. When enabled, each token is wrapped in a `<span>` with alternating classes `token-highlight-a` and `token-highlight-b`. Adjacent tokens alternate colors.
3. The highlight colors must meet WCAG AA contrast requirements against the textarea background.
4. While the Wasm worker is initializing, the toggle is disabled and shows a `title="Loading tokenizer..."` tooltip. It enables automatically once Wasm is ready for the currently displayed model.
5. The highlight model is the first model in the grid (cheapest, by default sort). A model selector dropdown adjacent to the toggle allows changing the highlight model.
6. When the highlighter is enabled, the textarea's `caret-color` and selection must remain visible and functional.
7. Highlight updates are debounced at 150ms (slightly longer than the count debounce) to prevent visual flicker on fast typing.
8. Highlighting is disabled for inputs > 50,000 characters (performance protection). A message states: "Token highlighting is available for inputs up to 50,000 characters."

### Color scheme (default)
- `token-highlight-a`: `background: rgba(59, 130, 246, 0.2)` (light blue)
- `token-highlight-b`: `background: rgba(16, 185, 129, 0.2)` (light green)
- Both must achieve WCAG AA contrast (4.5:1) against white and dark backgrounds.

### Acceptance Criteria
- AC-2.1.1: When the highlighter is toggled on with "Hello, world!" in the textarea and the GPT-4o tokenizer active, the text is segmented into visually distinct colored spans corresponding to the GPT-4o tokenization of "Hello, world!".
- AC-2.1.2: The toggle is disabled (and shows "Loading tokenizer..." tooltip) before the Wasm worker is ready.
- AC-2.1.3: The textarea remains fully editable with the cursor visible when the highlighter is on.
- AC-2.1.4: `axe-core` reports no contrast violations on the highlighted textarea.
- AC-2.1.5: A Umami `token_highlighter_toggled` event fires when the toggle is activated or deactivated.
- AC-2.1.6: With 60,000 characters in the textarea, the toggle is disabled with the character limit message shown.
- AC-2.1.7: The XSS unit test (see DOM rendering safety requirement above) passes: pasting `<img src=x onerror="window.__xss=true">` into the textarea and enabling the highlighter does not execute the payload and produces no `<img>` element in the DOM.

### Given/When/Then
**Scenario: Highlighter activation with loaded tokenizer**  
Given: The Wasm tokenizer for GPT-4o is initialized  
And: The textarea contains "The quick brown fox"  
When: The user clicks "Highlight tokens"  
Then: The text is visually segmented into token spans with alternating colors  
And: The textarea cursor position is unchanged  
And: The toggle button state changes to "active"

**Scenario: Highlighter updates on typing**  
Given: The highlighter is active  
When: The user types an additional word  
Then: The highlight updates 150ms after the last keystroke  
And: No layout shift occurs during the update

---

## 2.2 Scaling & Bulk Volume Simulator

### Description
Extends the cost grid to show production-scale monthly costs. Transforms per-prompt costs into monthly infrastructure estimates.

### Location
Below the cost grid, above the page footer. Visible without scrolling on desktop when the input textarea is short; requires scrolling for longer inputs.

### Controls

#### Volume input
- A numeric input field labeled "Monthly requests"
- Preset buttons: 100 · 1K · 10K · 100K · 1M (clicking sets the value)
- Accepts manual entry (integers only; non-numeric input is rejected)
- Default: 10,000
- Range: 1 to 100,000,000 (values outside this range are clamped)

#### Context caching toggle (per-provider)
- A toggle for each provider that supports context caching (determined by `supports_context_caching: true` in `prices.json`)
- When enabled, `effectiveInputCost = inputCost * (1 - context_caching_discount)` for that provider's models
- Label: "Context caching" with a `(?)` tooltip: "Applies the provider's input token caching discount. Assumes 100% cache hit rate. Real savings depend on your caching implementation."
- Default: off

#### Batch API toggle (per-provider)
- A toggle for each provider with `supports_batch_api: true`
- When enabled, `totalCost = totalCost * (1 - batch_api_discount)` for that provider's models
- Label: "Batch API" with a `(?)` tooltip: "Applies the provider's async batch processing discount. Assumes all requests use the batch API."
- Default: off
- If a model does not support batch API (`supports_batch_api: false`), the toggle is visible but grayed out with tooltip: "Not available for [model name]"

### Monthly cost calculation
```
monthlyInputCost = (inputTokens / 1_000_000) * model.input_cost_per_1m
                   * (caching enabled ? (1 - model.context_caching_discount) : 1)

monthlyOutputCost = (outputTokens / 1_000_000) * model.output_cost_per_1m

monthlyCostPerRequest = (monthlyInputCost + monthlyOutputCost)
                        * (batch enabled ? (1 - model.batch_api_discount) : 1)

monthlyTotal = monthlyCostPerRequest * volumeRequests
```

### Output table
Displays the monthly total per model, sorted ascending by `monthlyTotal`. Re-uses the same cost formatting rules as the main grid.

**Additional column:** "vs. cheapest" — shows the monthly premium versus the cheapest model. E.g., "$1,234 more/month than DeepSeek V3". Not shown for the cheapest row.

### CSV export
A "Download CSV" button exports the monthly costs table. CSV columns: Model, Provider, Monthly Requests, Input Tokens, Output Tokens, Caching Applied, Batch Applied, Monthly Cost (USD).

Filename: `calculatetokens-estimate-[ISO date].csv`

#### CSV injection prevention
All cell values MUST be sanitized before CSV serialization. Any string value whose first character is `=`, `+`, `-`, `@`, or `\t` MUST be prefixed with a tab character (`\t`) to prevent formula interpretation by spreadsheet applications (Excel, LibreOffice, Google Sheets). This applies to all string columns — particularly Model and Provider, whose values originate from `prices.json` and could theoretically contain injected content if the CI pipeline were compromised.

```typescript
function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t]/.test(value) ? `\t${value}` : value;
}
```

This requirement is verified by a unit test that passes `=HYPERLINK("https://evil.com","Click")` as a model name and asserts the exported cell value begins with `\t`.

**Export location:** `sanitizeCsvCell` MUST be exported from `src/lib/csv.ts` (not inlined in the component), so it can be imported directly by unit tests without rendering the full component. The CSV export component imports it: `import { sanitizeCsvCell } from '@/lib/csv'`. AC-2.2.8: `sanitizeCsvCell` is exported from `src/lib/csv.ts` and unit-tested independently of the export UI component.

### Acceptance Criteria
- AC-2.2.1: With 500 input tokens, 200 output tokens, GPT-4o, and 10,000 monthly requests: `monthly = ((500/1M * 2.50) + (200/1M * 10.00)) * 10000 = ($0.00125 + $0.002) * 10000 = $32.50`. Grid shows "$32.50". (Figures illustrative — verify against live `prices.json`.)
- AC-2.2.2: Enabling context caching for Anthropic with `context_caching_discount: 0.9` reduces the input cost contribution by 90%.
- AC-2.2.3: The batch API toggle is disabled (not checked, grayed) for a model with `supports_batch_api: false`.
- AC-2.2.4: The exported CSV contains accurate data matching the on-screen table.
- AC-2.2.5: A Umami `scaling_simulator_used` event fires when the volume input is changed.
- AC-2.2.6: Entering "abc" in the volume input rejects the input; the field shows the previous valid value.
- AC-2.2.7: With GPT-4o pricing ($2.50 input, $10.00 output per 1M tokens), 500 input tokens, 200 output tokens, 10,000 monthly requests, and batch API at 50% discount enabled: `monthlyTotal = ((500/1M × $2.50) + (200/1M × $10.00)) × 10,000 × 0.50 = $0.00325 × 10,000 × 0.50 = $16.25`. Grid shows "$16.25". (Pricing figures illustrative — verify against live `prices.json`.)

---

## 2.3 Quick Preset Library

### Description
Pre-loaded example inputs in the left sidebar that populate the textarea with realistic prompt templates.

### Presets (v1 — exact content)

**All preset text MUST be committed as `src/data/presets.json`** before Phase 2 begins. The file is the authoritative source; the UI reads from it at build time. This ensures token counts are deterministic across test runs, and the "10-page document" preset's character count is known at spec time so the 50,000-character highlighter cutoff test has a stable input.

Each preset entry:
```json
{
  "id": "customer-support-turn",
  "label": "Customer support turn",
  "charCountWarning": null,
  "text": "<actual preset text>"
}
```

`data-testid` values for E2E tests: `data-testid="preset-{id}"` on each preset button (e.g., `data-testid="preset-customer-support-turn"`).

| Preset name | `id` | Approx chars | Notes |
|-------------|------|-------------|-------|
| Customer support turn | `customer-support-turn` | ~300 | |
| Blog post summary | `blog-post-summary` | ~2,800 | |
| Python script | `python-script` | ~600 | |
| RAG system prompt | `rag-system-prompt` | ~1,500 | |
| 10-page document | `ten-page-document` | ~15,000 | `charCountWarning: "This preset contains ~15,000 characters. Token highlighting will be unavailable."` |

Draft preset text for each entry is provided in the companion file `specs/preset-content-draft.md`. Review and finalize the text before committing `presets.json`.

### Behavior
1. Clicking a preset replaces the textarea content with the preset text.
2. A confirmation modal is NOT shown — the textarea is replaced immediately. Undo (Ctrl+Z) restores the previous content.
3. The active preset is visually highlighted in the sidebar.
4. Hovering a preset shows a tooltip with the first 100 characters of the preset text.
5. The "10-page document" preset warns: "This preset contains ~15,000 characters. Token highlighting will be unavailable."

### Acceptance Criteria
- AC-2.3.1: Clicking any preset populates the textarea with the corresponding text within 50ms.
- AC-2.3.2: After clicking a preset, pressing Ctrl+Z in the textarea restores the previous content.
- AC-2.3.3: The active preset has a distinct visual indicator (e.g., left border or background highlight).
- AC-2.3.4: A Umami `preset_selected` event fires with the preset name when a preset is clicked.
- AC-2.3.5: The "10-page document" preset tooltip includes the character count warning.

---

## 2.4 Shareable URL State

### Description
All interactive state is encoded in the URL. Sharing the URL restores the exact session. See PRD Section 4.5 for the full two-mode spec.

### URL encoding — configuration parameters only

> **Privacy and security invariant:** The shareable URL encodes only calculator *configuration* (model selections, slider value, toggles, volume). Raw textarea text is **never** included in the URL under any mode. This is both a privacy guarantee (prompt text is not embedded in URLs that may be logged by proxies or synced by browsers) and a security control (eliminates the XSS-via-URL attack vector). The two-mode design described in the PRD (full-state vs settings-only) is superseded by this invariant — all URLs are configuration-only.

```typescript
// Encoding — configuration parameters only, no text
const params = new URLSearchParams({
  out: outputSliderValue.toString(),
  think: thinkingEnabled ? '1' : '0',
  vol: volumeRequests.toString(),
  cache: cachingEnabled ? '1' : '0',
  batch: batchEnabled ? '1' : '0',
  ...(activeModelIds.length < allModelIds.length
    ? { models: activeModelIds.join(',') }
    : {}),
});
history.replaceState(null, '', `?${params.toString()}`);
```

```typescript
// Decoding on page load — validated parameter by parameter
const url = new URLSearchParams(window.location.search);

// Each parameter is validated against type and range before use.
// Parameters with unexpected names are silently ignored (no dynamic property assignment).
const out = Math.min(8000, Math.max(0, parseInt(url.get('out') ?? '500', 10) || 500));
const think = url.get('think') === '1';
const vol = Math.min(100_000_000, Math.max(1, parseInt(url.get('vol') ?? '10000', 10) || 10000));
const cache = url.get('cache') === '1';
const batch = url.get('batch') === '1';
const models = url.get('models')
  ?.split(',')
  .filter(id => KNOWN_MODEL_IDS.has(id))  // allowlist against prices.json model IDs
  ?? [];
```

> **`KNOWN_MODEL_IDS` source:** `KNOWN_MODEL_IDS` is a `Set<string>` built at **compile time** from the `id` fields of all active models in `prices.json`. It is imported as a static module (e.g., `import { KNOWN_MODEL_IDS } from '@/data/models'`), not fetched at runtime. URL decoding uses the compile-time set — a model added to `prices.json` is only recognized after the next build and deploy. This is acceptable: an unrecognized model ID is silently filtered, falling back to "all models selected."

**Why no `?t=` text parameter?** The previous design encoded gzip-compressed textarea content in the URL. This creates a decompression bomb risk: a crafted URL with a small encoded payload that expands to gigabytes of data can crash the browser tab. Since the primary use case for sharing is sharing a *cost configuration* (model selection + slider settings), not the specific prompt text, removing text from the URL eliminates the attack surface with no loss of the primary sharing utility. Users who want to share both configuration and text can share the URL plus paste the text separately.

### URL length guidance
Configuration-only URLs are short by design (a few hundred characters maximum). The "settings-only vs full-state" distinction from the PRD is no longer applicable since text is never encoded. The share button always produces a valid, complete URL. No amber-dot warning or "Copy text" fallback is needed.

### URL update behavior
`history.replaceState` is called on every interaction that changes state. **Throttled** (not debounced) to a maximum of once per 500ms — the trailing call always fires so the final state is captured within 500ms of the last interaction. During slider drag, the URL updates every 500ms while dragging and once more when dragging stops.

### Acceptance Criteria
- AC-2.4.1: Loading a share URL restores the slider value, toggle states, and model selection. Textarea is empty on load (text is never encoded in URLs).
- AC-2.4.2: A URL containing unknown or malformed parameters loads with default state values. No JavaScript error is thrown.
- AC-2.4.3: The copied URL does not contain any representation of the textarea text content, regardless of textarea length.
- AC-2.4.4: A Umami `share_url_copied` event fires when the share button is clicked.
- AC-2.4.5: The URL updates (via `replaceState`) within 600ms of any state-changing interaction.
- AC-2.4.6: A URL parameter named `__proto__`, `constructor`, or `prototype` does not affect application behavior (prototype pollution protection — verify with a test that sets these parameters and asserts `Object.prototype` is unmodified).

---

## 2.4b Model Filter Checkboxes & Compare All Tab

### Description
The left sidebar contains checkboxes for each active model in `prices.json`. Users can deselect models to narrow the comparison. A "Compare All" tab/button above the cost grid resets the selection to all active models. Switching between a custom selection and "all" triggers a subtle cost grid re-render, which counts as a view change for ad refresh purposes (within Google programmatic guidelines).

### Model filter checkboxes (left sidebar)
- One checkbox per active model, grouped by provider (OpenAI, Anthropic, Google, DeepSeek, Meta)
- Default: all models selected
- Deselecting a model removes its row from the cost grid and excludes it from the `models` URL parameter
- A minimum of 2 models must remain selected; deselecting would leave 1 model shows a tooltip "At least 2 models required for comparison" and prevents the deselection
- The sidebar filter state is reflected in the `models` URL parameter (per §2.4)

### Compare All tab
- Displayed as a button/tab above the cost grid, visible only when at least one model has been deselected
- Label: "Compare All ([N] models)" where N is the total count of active models in `prices.json`
- Clicking it resets all model checkboxes to selected and updates the `models` URL parameter (removes the `models` param entirely, since all = default)
- The button disappears (or becomes inactive) when all models are already selected

### Umami event
The existing `compare_tab_switched` event fires when the Compare All button is clicked:
- `tab_name: 'all'` — when Compare All is clicked (resets to full model list)
- `tab_name: 'filtered'` — when a model checkbox is deselected for the first time in a session (entering filtered mode)

### Acceptance Criteria
- AC-2.4b.1: Deselecting 3 models removes those rows from the cost grid within 100ms.
- AC-2.4b.2: The "Compare All" button is visible when at least 1 model is deselected and hidden when all models are selected.
- AC-2.4b.3: Clicking "Compare All" restores all model rows and removes the `models` parameter from the URL.
- AC-2.4b.4: Attempting to deselect a model when only 2 are selected shows the tooltip and does not deselect the model.
- AC-2.4b.5: The model selection state persists in the URL (`models=gpt-4o,claude-sonnet-4-6`) and is restored on page load from a shared URL.
- AC-2.4b.6: A Umami `compare_tab_switched` event with `tab_name: 'filtered'` fires when the first model is deselected. A `compare_tab_switched` event with `tab_name: 'all'` fires when "Compare All" is clicked.

---

## 2.5 Google AdSense Integration

### Prerequisites
- AdSense application has been submitted (Phase 3) and approved **OR** Carbon Ads is being used as the contingency.
- This spec covers the technical integration, independent of which ad network is approved.

### Script placement
The AdSense auto-ads script is loaded in `<head>` with `strategy="lazyOnload"` in Next.js (prevents blocking LCP). Manual placement units are in the component tree at the specified locations.

### Ad unit placements (4 units maximum — hard cap)

| # | Placement | Component location | Unit type | Sizes |
|---|-----------|-------------------|-----------|-------|
| 1 | Above-the-fold banner | Between `<Header>` and `<MainContent>` | Responsive leaderboard | 728×90 (desktop) / 320×100 (mobile) |
| 2 | Inline between textarea and grid | Between `<InputSection>` and `<CostGrid>` | Responsive in-article | Auto |
| 3 | Sticky sidebar | `<RightSidebar>` | 300×600 or 160×600 | Desktop only; disabled at < 1024px |
| 4 | Below scaling simulator | After `<ScalingSimulator>` | Responsive in-article | Auto |

### CLS prevention (critical)
Every ad container must have a minimum height set before the AdSense script runs:
```css
.ad-container-leaderboard { min-height: 90px; }
.ad-container-inline      { min-height: 280px; }
.ad-container-sidebar     { min-height: 600px; }
```
Without this, AdSense script injection causes CLS > 0.1, failing the Lighthouse gate.

### Proximity rule
No ad unit may be within 150px of any interactive control (textarea, slider, toggle, button). Verified via browser devtools.

### Carbon Ads contingency
If AdSense is not approved, the same 4 slot positions are populated with Carbon Ads units. Carbon Ads requires a single script tag; the same container CSS applies.

### CSP impact when AdSense is enabled
When `NEXT_PUBLIC_CSP_MODE=adsense` (Configuration B), `wasm-unsafe-eval` is absent from the CSP. **Wasm tokenization is disabled for all models.** The fallback behavior differs by model family:

| Model family | AdSense-mode fallback | Accuracy |
|-------------|----------------------|----------|
| OpenAI (GPT-4o, GPT-4.1, o4-mini) | `js-tiktoken` pure-JS mode (no Wasm required) | Maintained — tiktoken has a full JS implementation |
| Claude, Gemini, Llama | Heuristic permanently (4 chars/token) | Degraded — no pure-JS alternative exists for these tokenizers |

Consequences:
- The `~` prefix on token counts is permanent for Claude, Gemini, and Llama in AdSense mode; the "exact" indicator never appears for these models
- OpenAI models retain accurate counts via pure-JS tiktoken; the "exact" indicator appears for those models
- The token highlighter is disabled (shows "Exact tokenization unavailable") for Claude, Gemini, and Llama in AdSense mode
- This degradation for non-OpenAI models MUST be disclosed: add a note to the `/privacy` page under "AdSense mode limitations" and add a `title` tooltip on the affected model rows: "Token counts for this model are estimated in the current configuration"
- AC-1.2.1 and AC-1.2.2 (Wasm accuracy) are inapplicable in AdSense mode for Claude/Gemini/Llama

This is an intentional architectural tradeoff: CSP security > tokenizer accuracy. The heuristic serves the Sam and Marcus personas adequately; Elena persona loses precision for non-OpenAI models in AdSense mode.

### Acceptance Criteria
- AC-2.5.1: Lighthouse CLS score remains < 0.1 with AdSense scripts loaded (ad containers have explicit `min-height`).
- AC-2.5.2: No ad unit appears within 150px of the textarea, slider, or any toggle (measured in DevTools).
- AC-2.5.3: The right sidebar ad unit is not visible on a 768px viewport.
- AC-2.5.4: Exactly 4 ad unit containers exist in the DOM (not more, not fewer).
- AC-2.5.5: AdSense script loads with `strategy="lazyOnload"` — confirmed via Network panel (does not appear in initial page load waterfall).

---

## 2.6 Umami Custom Event Wiring

### Events to instrument (all Phase 2 features)
All events defined in PRD Section 13 must be wired by the end of Phase 2.

```typescript
// Event tracking utility
function track(eventName: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, props);
  }
  // Silent fail if Umami is unavailable — never block UI interaction
}
```

### Event wiring checklist

> **Data minimization requirement for `char_count`:** The `char_count` property MUST be quantized to the nearest 100 before transmission (e.g., 347 → 300, 1,523 → 1,500). This prevents precise behavioral fingerprinting while preserving aggregate analytics utility. This is not optional — it is a GDPR data minimization obligation. The quantization MUST be applied in the `track()` call, not in the Umami dashboard.

| Event | Location | Properties |
|-------|----------|------------|
| `tokenize` | Textarea `input` handler (debounced 2s) | `tokenizer_type`, `char_count` (quantized to nearest 100) |
| `preset_selected` | Preset click handler | `preset_name` |
| `share_url_copied` | Share button click handler | — (no properties; all URLs are configuration-only per §2.4 invariant — the "full vs settings-only" distinction from the PRD is superseded and must not be re-implemented) |
| `output_slider_adjusted` | Slider `change` handler | `value` |
| `thinking_toggle_enabled` | Thinking toggle `change` handler (when checked) | `model` |
| `scaling_simulator_used` | Volume input `change` handler | — |
| `compare_tab_switched` | Tab switch handler | `tab_name` |
| `token_highlighter_toggled` | Highlighter toggle `change` handler | `enabled: '1' \| '0'` |

### `tests/e2e/analytics.spec.ts` — Event verification test spec

Verify Umami events by intercepting the POST request to Umami's `/api/send` endpoint via Playwright's `page.route()`. This avoids depending on the Umami dashboard for CI verification.

```typescript
// tests/e2e/analytics.spec.ts
import { test, expect } from '@playwright/test';

async function captureUmamiEvents(page, action: () => Promise<void>) {
  const tracked: Array<{ name: string; data?: Record<string, unknown> }> = [];
  await page.route('**/api/send', async route => {
    const body = route.request().postDataJSON();
    if (body?.payload?.name) tracked.push({ name: body.payload.name, data: body.payload.data });
    await route.continue();
  });
  await action();
  return tracked;
}

test('tokenize event fires with quantized char_count after 2s', async ({ page }) => {
  await page.goto('/');
  const tracked = await captureUmamiEvents(page, async () => {
    await page.fill('[aria-label="Enter your AI prompt or text"]', 'x'.repeat(347));
    await page.waitForTimeout(2500); // 2s debounce
  });
  const evt = tracked.find(e => e.name === 'tokenize');
  expect(evt).toBeDefined();
  expect(evt!.data?.char_count).toBe(300); // quantized: 347 → 300
});

test('preset_selected event fires with preset name', async ({ page }) => {
  await page.goto('/');
  const tracked = await captureUmamiEvents(page, async () => {
    await page.click('[data-testid="preset-customer-support"]');
    await page.waitForTimeout(200);
  });
  const evt = tracked.find(e => e.name === 'preset_selected');
  expect(evt?.data?.preset_name).toBe('customer-support-turn');
});

test('share_url_copied event fires on share button click', async ({ page }) => {
  await page.goto('/');
  const tracked = await captureUmamiEvents(page, async () => {
    await page.click('[data-testid="share-button"]');
    await page.waitForTimeout(200);
  });
  expect(tracked.some(e => e.name === 'share_url_copied')).toBe(true);
});

test('output_slider_adjusted event fires with slider value', async ({ page }) => {
  await page.goto('/');
  const tracked = await captureUmamiEvents(page, async () => {
    await page.fill('[aria-label="Output token estimate"]', '2000');
    await page.waitForTimeout(200);
  });
  const evt = tracked.find(e => e.name === 'output_slider_adjusted');
  expect(evt?.data?.value).toBe(2000);
});

test('Umami script failure does not throw or block UI', async ({ page }) => {
  await page.route('**/umami*', route => route.abort());
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/');
  await page.fill('[aria-label="Enter your AI prompt or text"]', 'test input');
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
```

All remaining events (`thinking_toggle_enabled`, `scaling_simulator_used`, `compare_tab_switched`, `token_highlighter_toggled`) follow the same `captureUmamiEvents` pattern and are specified by name and property in the event wiring table above.

### Acceptance Criteria
- AC-2.6.1: All 8 Umami event types appear in Umami's dashboard after performing each corresponding UI action in production (one-time manual verification at deploy; ongoing CI coverage via analytics.spec.ts).
- AC-2.6.2: If the Umami script fails to load (network error), no JavaScript error is thrown and no UI functionality is affected (verified by the Umami abort test above).
- AC-2.6.3: The `tokenize` event fires at most once per 2 seconds of continuous typing (debounced).
- AC-2.6.4: The `tokenize` event transmitted for a 347-character input has `char_count: 300` (quantized to nearest 100, not the exact value 347).
- AC-2.6.5: `tests/e2e/analytics.spec.ts` exists and all tests in it pass in CI (Chromium).

---

## Phase 2 — Definition of Done

- [ ] Token highlighter toggles on/off; updates within 150ms; WCAG AA contrast verified
- [ ] Scaling simulator: volume, caching toggle, batch toggle all calculate correctly
- [ ] CSV export produces accurate, well-formatted file
- [ ] All 5 presets load correct content; undo works after preset click
- [ ] Shareable URL: configuration-only (slider value, toggle states, model selection encoded); textarea is always empty on load from a shared URL
- [ ] URL with unknown or malformed parameters loads with default state values; no JavaScript error thrown
- [ ] AdSense (or Carbon Ads): 4 units placed, CLS < 0.1, no ad within 150px of controls
- [ ] All 8 Umami events fire correctly and appear in Umami dashboard
- [ ] Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms (with ads loaded)
- [ ] axe-core: zero critical or serious violations
- [ ] Cross-browser smoke test: Chrome, Firefox, Safari (desktop + mobile)
