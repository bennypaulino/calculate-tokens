# Phase 1 — MVP Interactive Calculator
**Weeks:** 4–6  
**Primary actor:** Elena — The AI Engineer  
**Goal:** A working, accurate, fast calculator that shows token counts and costs across all models for any pasted text. No engagement features yet — just the core capability.  
**Prerequisite:** Phase 0 complete. `prices.json` live and accessible at `/api/v1/prices.json`.

---

## 1.1 Master Input Textarea

### Description
The primary input surface. Accepts arbitrary text. Displays live character, word, and token counts as the user types. Tokenization is initially heuristic; upgrades to Wasm when available.

### Requirements
1. The textarea accepts plain text, code snippets, and JSON. No file input in v1.
2. Character count, word count, and token count update on every `input` event, debounced at 100ms. Debounce is measured from the last keystroke to the count update in the DOM.
3. Token count displays the heuristic estimate immediately on page load. The heuristic is: `Math.ceil(charCount / 4)`. This applies for all models until the Wasm worker for that model initializes.
4. When the Wasm worker resolves for a specific model, that model's token count updates silently in the cost grid. The textarea-level "token count" field shows the count for the first active model (or the model with the most recently initialized Wasm worker).
5. A subtle "~" prefix appears before heuristic counts (e.g., "~256 tokens"). The "~" disappears when Wasm accuracy is confirmed. An "exact" indicator (e.g., a small checkmark icon with `aria-label="Exact count"`) appears alongside the count once Wasm is ready.
6. The textarea has a minimum height of 120px and expands vertically as content grows, up to a maximum of 50% of the viewport height. Beyond that, the textarea scrolls internally.
7. The trust badge "🔒 Your text is never sent to our servers" is displayed adjacent to the textarea (above or below, below preferred). It is visible without scrolling on all breakpoints.

### Acceptance Criteria
- AC-1.1.1: After pasting 400 characters of text and waiting 100ms, the character count shows 400, the word count is within ±20% of `text.trim().split(/\s+/).filter(Boolean).length` for the pasted text, and the token count shows `~100` (400 ÷ 4). Word count is defined as whitespace-delimited tokens; the ±20% tolerance accommodates boundary edge cases (leading/trailing whitespace, consecutive spaces), not alternative counting algorithms.
- AC-1.1.2: The "~" prefix is present when Wasm has not yet initialized. The "~" is absent and the "exact" indicator is present when Wasm has initialized.
- AC-1.1.3: The count updates within 150ms of the last keystroke (100ms debounce + ≤50ms DOM update), measured in Chrome DevTools Performance panel.
- AC-1.1.4: The trust badge is visible on 375px mobile viewport without scrolling.
- AC-1.1.5: The textarea has `aria-label="Enter your AI prompt or text"` and `role="textbox"`.

### Given/When/Then
**Scenario: Heuristic to Wasm upgrade**  
Given: A user has pasted 1,000 characters into the textarea  
And: The Wasm tiktoken worker has not yet initialized  
When: The token count field renders  
Then: It displays "~250 tokens" with the "~" prefix  

Given: The Wasm tiktoken worker initializes (2–4 seconds after page load)  
When: The worker resolves with an exact count of 241 tokens  
Then: The field updates to "241 tokens" without the "~" prefix, the "exact" indicator appears, and no visible flash or layout shift occurs

**Scenario: Debounce behavior**  
Given: A user is typing continuously  
When: They type one character every 50ms for 2 seconds (40 characters)  
Then: The count updates exactly once, 100ms after the last character is typed

---

## 1.2 Wasm Tokenizer Workers

### Architecture
Each tokenizer sub-system runs in a dedicated Web Worker. Workers are lazy-loaded — not imported until the textarea first receives input. The main thread communicates with workers via `postMessage`.

### Worker protocol

**Main → Worker message:**
```typescript
type TokenizeRequest = {
  type: 'TOKENIZE';
  requestId: string;   // UUID for response correlation
  text: string;
  model: string;       // e.g., 'gpt-4o', 'claude-sonnet-4-6'
}
```

**Worker → Main message:**
```typescript
type TokenizeResponse = {
  type: 'TOKENIZE_RESULT';
  requestId: string;
  model: string;
  tokenCount: number;
  source: 'wasm' | 'heuristic';  // always 'wasm' for successful worker response
}

type TokenizeError = {
  type: 'TOKENIZE_ERROR';
  requestId: string;
  model: string;
  error: string;
}
```

### Worker initialization sequence
1. On first textarea `input` event, the worker manager spawns workers for all active models in `prices.json`.
2. Each worker loads its Wasm module asynchronously. Until Wasm is ready, the worker queues incoming `TOKENIZE` requests.
3. Once Wasm is ready, the worker processes the queue and begins responding.
4. If a worker fails to initialize (Wasm load error, module not available), it emits a `TOKENIZE_ERROR` with a descriptive message, and the UI permanently shows the heuristic count for that model with a `title="Exact tokenization unavailable for this model"` tooltip.

### Tokenizer mapping
| `prices.json` tokenizer value | Worker module |
|-------------------------------|---------------|
| `cl100k_base` | `js-tiktoken` with cl100k_base encoding |
| `o200k_base` | `js-tiktoken` with o200k_base encoding |
| `claude` | Anthropic tokenizer (community Wasm build) |
| `gemini` | Gemini tokenizer (community Wasm build) |
| `llama` | Llama tokenizer (sentencepiece Wasm) |
| `heuristic` | No worker spawned; always returns `Math.ceil(chars / 4)` |

### Acceptance Criteria
- AC-1.2.1: For GPT-4o (`o200k_base`), the Wasm worker returns a token count matching the OpenAI Tokenizer Playground for the same input text (±0 tokens — exact match required for English text).
- AC-1.2.2: For Claude (`claude` tokenizer), the Wasm worker returns a token count within ±2% of the Anthropic console token counter for the same input. The ±2% tolerance reflects a known implementation difference between the community Wasm build and Anthropic's internal tokenizer (BPE merge order variations on non-ASCII and code content). For purely ASCII/English text, the match should be exact. If a tighter tolerance is achievable in practice, tighten this AC during implementation. **UI disclosure required if tolerance exceeds ±1%:** a `title` tooltip on Claude's token count reading "Claude token count may vary slightly from the Anthropic console."
- AC-1.2.3: A worker initialization failure for one model does not affect tokenization for other models.
- AC-1.2.4: The UI thread is not blocked during Wasm worker initialization (LCP is not delayed by worker startup, verified via Lighthouse).
- AC-1.2.5: Workers are garbage-collected by the browser when the page is destroyed — no explicit termination is required. If explicit cleanup is implemented for memory profiling purposes, use the `pagehide` event (not `beforeunload`, which fires on navigation and prematurely kills workers when the user clicks a link and uses Back).

### Failure behavior
- Wasm module fails to load: UI shows heuristic count permanently for that model; `title` tooltip states "Exact tokenization unavailable"
- Worker crashes mid-operation: Main thread catches the error via `worker.onerror`; falls back to heuristic for that model; does not crash other workers
- Worker takes > 10 seconds to respond to a `TOKENIZE` request: Request is considered timed out; heuristic count is used; worker is not terminated (may still be loading)

---

## 1.3 Multi-Model Cost Grid

### Description
A table that recalculates costs for all active models in real time as the user types. Sorted cheapest-first by default. Shows the cost ratio callout when the cheapest/most-expensive spread exceeds 10×.

### Data flow
1. On each debounced input event (100ms), the grid receives the current token counts (heuristic or Wasm) for each model.
2. For each model, it calculates:
   - `inputCost = (inputTokens / 1_000_000) * model.input_cost_per_1m`
   - `outputCost = (outputTokens / 1_000_000) * model.output_cost_per_1m`
   - `totalCost = inputCost + outputCost`
3. The grid sorts rows by `totalCost` ascending.
4. If `maxTotalCost / minTotalCost > 10`, the cost ratio callout renders above the grid.

### Cost ratio callout
- Text: "[Cheapest model display_name] is [ratio]× cheaper than [most expensive model display_name] for this prompt"
- Ratio is computed as `Math.round(maxTotalCost / minTotalCost)`
- Callout has `role="status"` and `aria-live="polite"` so screen readers announce updates
- Callout disappears when ratio drops to 10× or below

### Staleness indicators (per model row)
Read `last_human_verified` from `prices.json` for each model. Apply the staleness policy:

| Age | Row display |
|-----|-------------|
| ≤ 14 days | Normal |
| 15–30 days | Amber dot (●) before model name; `aria-label="Pricing last verified [date] — may have changed"` |
| > 30 days | Warning icon (⚠) before model name; `aria-label="Pricing unverified for 30+ days — confirm at [provider URL]"` |

### Cost formatting
All costs display in USD with dynamic decimal precision:
- ≥ $1.00: 2 decimal places (e.g., "$1.23")
- $0.01–$0.99: 3 decimal places (e.g., "$0.012")
- < $0.01: 4 decimal places (e.g., "$0.0003")
- $0.00: Display as "$0.0000" (never round to $0 when cost > 0)

### Grid columns
| Column | Content | Sortable |
|--------|---------|----------|
| Model | Provider + display_name; staleness indicator if applicable | No |
| Input Tokens | Token count; "~" prefix if heuristic | Yes |
| Input Cost | Formatted USD | Yes |
| Output Cost | Formatted USD (from slider value) | Yes |
| Total Cost | Formatted USD | Yes (default sort, ascending) |
| Context | "X% of Yk"; amber >80%, red >95% | Yes |

### Context window indicator
- Shows: `Math.round((inputTokens / model.context_window) * 100)` + "% of " + formatted context_window
- Context window formatted as: ≥ 100,000 → "Xk" (e.g., "128k"); < 100,000 → exact number
- Color: ≤ 79% = neutral; 80–94% = amber (`#F59E0B`); ≥ 95% = red (`#EF4444`)
- The context percentage cell has `aria-label="[X]% of context window used"` 

### Acceptance Criteria
- AC-1.3.1: For a 1,000 input token / 500 output token calculation, GPT-4o's total cost is $(1000/1M * 2.50) + (500/1M * 10.00) = $0.0025 + $0.0050 = $0.0075. The grid shows "$0.0075". (Pricing figures illustrative — verify against live `prices.json`.)
- AC-1.3.2: The grid re-sorts by total cost within 100ms of a pricing-affecting input change.
- AC-1.3.3: The cost ratio callout appears when the cheapest model costs at least 10× less than the most expensive, and disappears when the ratio drops below 10.
- AC-1.3.4: A model with `last_human_verified` 20 days ago displays an amber indicator. A model with `last_human_verified` 35 days ago displays a warning icon.
- AC-1.3.5: The "Lowest cost" badge appears on exactly one row — the row with the minimum `totalCost`.
- AC-1.3.6: The context window cell for a model at 90% capacity shows amber background/color.

### Given/When/Then
**Scenario: Cost ratio callout**  
Given: The grid contains GPT-4o and DeepSeek V3  
And: The user has typed 2,000 characters (~500 tokens)  
And: The output slider is set to 200 tokens  
When: Costs are calculated  
Then: If `maxTotalCost / minTotalCost > 10`, the callout "DeepSeek V3 is [N]× cheaper than GPT-4o for this prompt" is visible above the grid  

**Scenario: Empty input**  
Given: The textarea is empty  
When: The grid renders  
Then: All cost cells show "$0.0000" and no "Lowest cost" badge appears

---

## 1.4 Output Token Slider

### Description
Controls the projected output token count for cost calculations. Located between the textarea and the cost grid.

### Specification
- Range: 0 to 8,000 tokens (integer)
- Default: 500 tokens
- Tick marks / labels at: 0, 500, 1k, 2k, 4k, 8k
- Updates the cost grid on every `input` event (no debounce needed — slider events are already throttled by the browser)
- Displays the current value: "Output: [N] tokens"
- Has `aria-label="Output token estimate"`, `aria-valuemin="0"`, `aria-valuemax="8000"`, `aria-valuenow="[current]"`
- For thinking models (`thinking_model: true`), an additional estimated thinking output is shown: "Output: [N] tokens + ~[thinking_estimate] thinking tokens (estimated)"

### Thinking Token Toggle
A toggle control that appears in the controls area **only when at least one thinking model (`thinking_model: true` in `prices.json`) is present in the active cost grid.** It is not a global toggle — it enables/disables thinking cost estimation for all thinking-capable models simultaneously.

- Label: "Include thinking tokens" with a `(?)` tooltip: "Adds estimated chain-of-thought tokens to the output cost for reasoning models (o4-mini, DeepSeek R1). The multiplier is an estimate based on published model ratios — actual thinking token usage varies."
- Default: **off** (thinking tokens not included by default)
- When off: thinking models calculate cost using `outputTokens` only (no multiplier)
- When on: thinking models apply the `thinking_multiplier` from `prices.json` to their output token cost
- The toggle is hidden (not just disabled) when no thinking models are active in the grid
- State is encoded in the `think` URL parameter (§2.4): `think=1` when enabled

### Thinking estimate calculation
Thinking models fall into two billing categories defined by `thinking_billed_separately` in `prices.json`:

**`thinking_billed_separately: true` (e.g., OpenAI o4-mini)** — thinking tokens are an additional billing line on top of output tokens. When the toggle is enabled:
- `thinkingTokenEstimate = Math.round(outputTokens * model.thinking_multiplier)`
- `effectiveOutputTokens = outputTokens + thinkingTokenEstimate`
- `outputCost = (effectiveOutputTokens / 1_000_000) * model.output_cost_per_1m`
- Displayed as: "Output: [N] tokens + ~[thinking_estimate] thinking tokens (estimated)"

**`thinking_billed_separately: false` (e.g., DeepSeek R1)** — thinking tokens are included in DeepSeek's output token pricing; there is no separate billing line and no multiplier. The toggle still appears (the model is a thinking model) but selecting it shows a tooltip: "DeepSeek R1 includes thinking in its output token pricing — no additional cost is applied." Output cost always uses `outputTokens` only for these models regardless of toggle state.

For **all** thinking models when the toggle is **disabled**: output cost uses `outputTokens` only, no multiplier applied.

### Acceptance Criteria
- AC-1.4.1: Moving the slider to 1,000 updates all cost grid "Output Cost" cells within 50ms.
- AC-1.4.2: The slider is fully keyboard-operable (arrow keys adjust value; Home = 0, End = 8000).
- AC-1.4.3: For a thinking model with `thinking_billed_separately: true` and `thinking_multiplier: 3`, slider at 500, and thinking toggle **enabled**: the displayed estimate reads "Output: 500 tokens + ~1,500 thinking tokens (estimated)" and the output cost reflects 2,000 total output tokens.
- AC-1.4.3b: For a thinking model with `thinking_billed_separately: false` (e.g., DeepSeek R1), the output cost always uses `outputTokens` only regardless of toggle state. The toggle displays the tooltip "DeepSeek R1 includes thinking in its output token pricing — no additional cost is applied" when hovered.
- AC-1.4.4: The slider label reads correctly at minimum (0) and maximum (8,000).
- AC-1.4.5: The thinking toggle is **not visible** when all thinking models are deselected from the model filter. It **appears** when at least one thinking model is re-selected.
- AC-1.4.6: With thinking toggle **disabled**, a thinking model's output cost uses `outputTokens` only (no multiplier). Output cost doubles when toggle is enabled (for a model with `thinking_multiplier: 2`).
- AC-1.4.7: The toggle state is preserved in the `think=1` URL parameter and restored correctly on page load.
- AC-1.4.8: When a page loads with `?think=1&models=gpt-4o,claude-sonnet-4-6` (no thinking models in the active selection), the thinking toggle is **not visible** (no thinking-capable model is present in the grid). The `think=1` parameter is silently discarded, and the URL is updated via `replaceState` to remove the `think` parameter. No thinking multiplier is applied to any cost calculation.

**Scenario: `think=1` URL with no thinking models selected**
Given: The URL is `?think=1&models=gpt-4o,claude-sonnet-4-6`
And: Neither GPT-4o nor Claude Sonnet 4.6 has `thinking_model: true`
When: The page loads and renders
Then: The thinking toggle is not present in the DOM (hidden, not just disabled)
And: No thinking multiplier is applied to any cost row
And: The URL is updated via `replaceState` to `?models=gpt-4o,claude-sonnet-4-6` (without `think`)

---

## 1.5 Responsive Layout

### Desktop (≥ 1024px) — Three columns
```
┌──────────────┬─────────────────────────────────────┬──────────────┐
│ Left sidebar │ Center: textarea + grid + simulator  │ Right: ad    │
│   ~18%      │            ~60%                      │   ~22%      │
└──────────────┴─────────────────────────────────────┴──────────────┘
```
Left sidebar content (Phase 1): placeholder "Presets coming soon" — the sidebar column is built in Phase 1 even though presets ship in Phase 2.

### Tablet (768px–1023px) — Two columns
Left sidebar collapses. Right ad column persists. Center expands.

### Mobile (< 768px) — Single column
All content stacks. Ad slots are placed inline (between major sections). Sticky right ad disabled.

### Acceptance Criteria
- AC-1.5.1: On a 375px viewport (iPhone SE), the main content (textarea + grid) is fully visible and interactive with no horizontal scroll.
- AC-1.5.2: On a 1440px viewport, all three columns are visible simultaneously.
- AC-1.5.3: The layout has zero CLS (no elements shift after initial render) — verified via Lighthouse.
- AC-1.5.4: Ad slot containers have explicit `min-height` set in CSS before AdSense scripts load (prevents CLS from ad injection).
- AC-1.5.5: The initial JavaScript bundle served to the index page is < 150KB gzipped. Verified in CI by a post-build script that reads `.next/build-manifest.json`, sums the gzipped sizes of all scripts listed for the index route, and exits non-zero if the total exceeds 150,000 bytes.

---

## 1.6 Service Worker Pricing Cache

### Strategy: stale-while-revalidate for `prices.json`
The Service Worker intercepts fetches to `/api/v1/prices.json` and applies stale-while-revalidate:
- Serve the cached version immediately (instant load)
- Simultaneously fetch the fresh version in the background
- Verify the fetched response integrity before writing to cache (see below)
- Update the cache only after integrity verification passes

### Cache integrity verification
The CI pipeline MUST compute a SHA-256 hash of `prices.json` after generation and include it as a `X-Content-Hash` response header on the CDN-served file. The Service Worker MUST:
1. Read the `X-Content-Hash` header from every background-fetched response
2. Compute the SHA-256 hash of the response body
3. Compare computed hash to the `X-Content-Hash` header value
4. On match: update the cache
5. On mismatch or missing header: retain the existing cache entry, emit a structured console error (`[SW] prices.json integrity check failed — retaining cached version`), and do NOT update the cache

The `X-Content-Hash` header value is set as a Cloudflare Pages custom header in `_headers` at build time. It changes with every deploy that modifies `prices.json`.

### Cache TTL
- Cache entry expires after 24 hours
- If the background fetch returns a `prices.json` with a newer `generated_at` timestamp AND integrity verification passes, the page is reloaded to reflect updated prices — **only if the textarea is empty** (checked via `document.querySelector('[aria-label="Enter your AI prompt or text"]')?.value === ''`). If the textarea has content, the new pricing data is cached silently; it takes effect on the user's next page load. The `document.hasFocus()` check is not used here — it is irrelevant to whether the user has typed content.

### Offline behavior
If the user is fully offline and the cache is > 48 hours old:
- A non-blocking banner displays: "Prices may be outdated (last updated [date]). Connect to the internet to refresh."
- The banner has `role="alert"` and `aria-live="polite"`
- All calculator functionality continues to work with cached data

### Registration
The Service Worker registers from `sw.js` in the project root. Registration:
- Occurs in a `useEffect` hook that runs after hydration — not blocking the initial render
- MUST use `updateViaCache: 'none'` to ensure SW script updates are not delayed by HTTP cache: `navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })`
- MUST specify an explicit scope: `{ scope: '/' }` — restricts SW to the application origin and prevents inadvertent interception of other paths

### Acceptance Criteria
- AC-1.6.1: With the browser network throttled to "Offline" after a first visit, the calculator loads fully from cache.
- AC-1.6.2: After 49+ hours offline (simulated by manually adjusting cached `generated_at` timestamp), the staleness banner appears.
- AC-1.6.3: The Service Worker does not delay LCP (register after hydration).
- AC-1.6.4: A new `prices.json` deploy is reflected in the UI within 25 hours (24h TTL + background revalidation).
- AC-1.6.5: When a `prices.json` response is served with a tampered body (hash mismatch), the SW retains the previous cached version and logs a console error. The calculator continues to function with the cached data.
- AC-1.6.6: SW registration uses `updateViaCache: 'none'` (verified by inspecting the registration call in DevTools → Application → Service Workers).
- AC-1.6.7: SW scope is explicitly set to `'/'` (verified in DevTools → Application → Service Workers → Scope).
- AC-1.6.8: When a background `prices.json` fetch succeeds with a newer `generated_at` AND the textarea contains text, the page is **not** reloaded. The new data is cached silently. The user's typed content is preserved. (Verified by: type 50 characters → trigger a background fetch with a mocked newer `generated_at` → assert no page reload occurred and textarea content is unchanged.)

---

## Phase 1 — Definition of Done

- [ ] Textarea with heuristic counts renders on page load, counts update within 150ms of typing
- [ ] Wasm workers initialize lazily and upgrade counts silently (no flash or layout shift)
- [ ] Cost grid shows accurate costs for all 9 models; sorted cheapest-first by default
- [ ] Lowest-cost badge on correct row; cost ratio callout fires at >10× spread
- [ ] Staleness indicators show correctly for amber (15–30d) and warning (>30d) models
- [ ] Output token slider updates costs within 50ms
- [ ] Thinking Token Toggle: appears only when a thinking model is in the active grid; correctly applies/removes `thinking_multiplier` to output cost; state encodes in `think` URL param
- [ ] Context window percentage indicator with amber/red thresholds
- [ ] Responsive layout verified at 375px, 768px, 1024px, 1440px viewports — zero CLS
- [ ] Service Worker caching `prices.json`; offline banner working
- [ ] All interactive elements keyboard-accessible and screen reader-compatible
- [ ] axe-core scan returns zero critical or serious violations
- [ ] Unit tests: tokenizer output vs. reference fixtures (all 5 tokenizer types)
- [ ] Integration tests: cost calculation accuracy for known token counts × pricing
- [ ] Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Initial JS bundle (index page, gzipped) is < 150KB — enforced by a CI build step that parses Next.js build output and exits non-zero if the threshold is exceeded (AC-1.5.5)
