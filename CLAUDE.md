# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Status

**Pre-implementation.** No code exists yet. The repository contains a PRD and four phase specs. Implementation begins with Phase 0. Each phase has a strict prerequisite: all prior phase acceptance criteria must pass before the next phase starts.

---

## What This Is

**Calculate Tokens** (`calculatetokens.com`) — a browser-native LLM token calculator. Users paste a prompt and instantly see accurate token counts and USD costs across all major models, side-by-side, without the text leaving the browser.

The core technical differentiator is per-model tokenization accuracy: each model runs its actual tokenizer compiled to WebAssembly in a dedicated Web Worker. Most competitors use OpenAI's `o200k_base` for all models, which produces ~65% error on Gemini and ~32% on Llama 3.

---

## Repository Structure

```
PRD.md                          # Product requirements — authoritative business logic source
specs/
  phase-0-foundation.md         # Repo scaffold, prices.json schema, CI workflows, SEO pages
  phase-1-mvp-calculator.md     # Interactive calculator, Wasm workers, cost grid, SW cache
  phase-2-engagement-monetization.md  # Highlighter, simulator, presets, URL sharing, ads
  phase-3-discovery-activation.md     # AdSense application, GSC, a11y audit, cross-browser QA
  phase-4-public-launch.md            # Launch checklist, HN post, Product Hunt, post-launch monitoring
  preset-content-draft.md             # Draft text for the 5 preset library entries
```

When implementation begins, the planned structure is:
- `public/api/v1/prices.json` + `prices.schema.json` — the single source of truth for all model data
- `scripts/` — CI utility scripts (check-page-changes.js, compute-prices-hash.js, verify-build-integrity.js, etc.)
- `src/data/presets.json` — preset library committed before Phase 2
- `tests/e2e/` — Playwright tests (analytics.spec.ts, accessibility.spec.ts, calculator.spec.ts, etc.)

---

## Tech Stack

Next.js (App Router, `output: 'export'` — static only, zero server-side rendering), Tailwind CSS, shadcn/ui, deployed on Cloudflare Pages (free tier). No backend, no API routes, no SSR.

Analytics: Cloudflare Web Analytics (page-level) + self-hosted Umami on Railway (custom events). Umami geo-blocks EU users in v1 — Railway free tier has no GDPR DPA.

---

## Architecture: Critical Invariants

These constraints appear throughout the specs and must never be violated:

**1. Prompt text never leaves the browser — ever.**
No URL parameter, no analytics event, no server call ever encodes or transmits textarea content. The share URL encodes only configuration (slider value, model selection, toggle states). `?t=` or any text-encoding URL parameter is explicitly prohibited. This is simultaneously a privacy guarantee and an XSS mitigation.

**2. Dual CSP mode — deployment configuration, not a product tradeoff.**
`NEXT_PUBLIC_CSP_MODE=analytics`: `wasm-unsafe-eval` in the main site CSP; workers bundled and served from the same origin. AdSense excluded.
`NEXT_PUBLIC_CSP_MODE=adsense`: `wasm-unsafe-eval` absent from the main site CSP (satisfies AdSense). Workers are served from `workers.calculatetokens.com` (a separate Cloudflare Pages project) whose own CSP carries `wasm-unsafe-eval`. Tokenization accuracy is **identical in both modes** — the subdomain handles Wasm, the main page handles AdSense, and they communicate via `postMessage`. `scripts/validate-csp.js` enforces this in CI: fails if mode is unset, if `wasm-unsafe-eval` appears on the main domain in adsense mode, or if `worker-src https://workers.calculatetokens.com` is missing in adsense mode. `NEXT_PUBLIC_WORKERS_ORIGIN` controls which worker URL strategy is used: empty = bundled relative workers (dev / analytics mode); `https://workers.calculatetokens.com` = cross-origin workers (adsense production build).

**3. Wasm tokenizers run in dedicated Web Workers — never the main thread.**
Workers are lazy-loaded on first textarea input. Until a worker resolves, the heuristic (`Math.ceil(charCount / 4)`) is shown with a `~` prefix. When Wasm resolves, the count updates silently — no flash, no layout shift.

**4. Token highlighter uses `textContent`, never `innerHTML`.**
The highlighter renders arbitrary user-pasted content including content from shared URLs. `innerHTML` is XSS. DOM construction must use `document.createElement` + `element.textContent = tokenText`.

**5. `char_count` in Umami events must be quantized to the nearest 100.**
This is a GDPR data minimization obligation — not optional, not configurable. Applied in the `track()` call before transmission. 347 chars → 300.

**6. All GitHub Actions `uses:` references pinned to 40-character commit SHAs.**
Mutable tag references (`@v4`) are prohibited. Dependabot manages monthly SHA updates.

---

## Architecture: Pricing Data Pipeline

`prices.json` is the single source of truth for everything: model IDs, tokenizer mapping, pricing, context window sizes, feature flags, and pricing page URLs.

Key schema fields beyond the obvious:
- `thinking_billed_separately` (boolean): `true` = thinking tokens add to cost (OpenAI o-series); `false` = thinking is bundled in output token price (DeepSeek R1). The `if/then` constraint in `prices.schema.json` enforces `thinking_billed_separately: false` when `thinking_model: false`.
- `requires_js_render` (boolean): `true` triggers Playwright headless extraction instead of `fetch` in `check-page-changes.js` (Anthropic's pricing page is a React SPA). Anthropic models have this set to `true`.
- `last_human_verified` vs `last_checked`: `last_checked` is updated automatically by CI. `last_human_verified` requires a human to navigate to `provider_pricing_url` and confirm the value — it drives the amber/warning staleness indicators in the UI.

The CI pipeline (`pricing-check.yml`) runs daily at 06:00 UTC. It validates `prices.json` against the schema, detects page content changes (static fetch or Playwright), opens GitHub Issues when changes are detected, and updates `last_checked` timestamps. The `validate` job runs with `contents: read`; `update-timestamps` runs with `contents: write` — intentional permission separation.

Service Worker integrity: `scripts/compute-prices-hash.js` runs post-build and writes an `X-Content-Hash` SHA-256 header into `public/_headers`. The SW reads this header and verifies the response body before updating its cache. Hash mismatch → retain cached version, log console error.

---

## Architecture: Tokenizer Mapping

| `prices.json` `tokenizer` value | Implementation |
|----------------------------------|----------------|
| `cl100k_base` | `js-tiktoken` (GPT-3.5/4 family) |
| `o200k_base` | `js-tiktoken` (GPT-4o, o-series) |
| `claude` | Anthropic tokenizer (community Wasm build) |
| `gemini` | Gemini tokenizer (community Wasm build) |
| `llama` | sentencepiece Wasm |
| `heuristic` | `Math.ceil(chars / 4)` — no worker spawned |

In `adsense` CSP mode, all tokenizers continue to work at full accuracy because workers are served from `workers.calculatetokens.com` with its own permissive CSP. The `~` prefix disappears and the "exact" indicator appears for all model families once their workers resolve — same behaviour as analytics mode.

---

## Implementation Order and Phase Prerequisites

**Phase 0** (Weeks 1–3): Repository scaffold, `prices.json` + `prices.schema.json` committed with 9 human-verified models, GitHub Actions CI/pricing pipeline, all 36 comparison pages, `/models/[id]` pages, `/learn/what-is-a-token`, SEO infrastructure, Service Worker hash script, analytics setup. **Phase 0 must be fully indexed before Phase 1 launches** — the SEO clock starts on Phase 0 deploy day.

**Phase 1** (Weeks 4–6): Interactive calculator. Textarea, Wasm workers, cost grid, output slider, thinking token toggle (with `thinking_billed_separately` logic), context window indicator, responsive layout, Service Worker pricing cache.

**Phase 2** (Weeks 7–8): Token highlighter (XSS-safe DOM construction required), scaling simulator with CSV export (`sanitizeCsvCell` in `src/lib/csv.ts`), preset library (`src/data/presets.json` committed before Phase 2 begins), shareable URL (configuration-only invariant), AdSense integration, all 8 Umami events wired.

**Phase 3** (Weeks 9–10): AdSense + Carbon Ads applications submitted simultaneously. GSC verification, Core Web Vitals gate, accessibility audit, cross-browser Playwright suite (5 browser projects: chromium, firefox, webkit, mobile-chrome, mobile-safari). Cross-origin worker deployment (`workers.calculatetokens.com`) live and verified (AC-3.7.x).

**Phase 4** (Week 10–11): Launch gate checklist, HN post, Product Hunt, post-launch monitoring workflow.

---

## Key Scripts (to be implemented in Phase 0)

| Script | Purpose |
|--------|---------|
| `scripts/validate-csp.js` | Asserts CSP mode is valid; run in CI on every PR |
| `scripts/check-page-changes.js` | Dual-mode: `fetch` for static pages, Playwright for `requires_js_render: true` providers |
| `scripts/compute-prices-hash.js` | Post-build: computes SHA-256 of `prices.json`, writes `X-Content-Hash` to `_headers` |
| `scripts/verify-build-integrity.js` | Post-build: reads every `/compare/[a]-vs-[b]/index.html` and asserts pricing cells match `prices.json` |
| `scripts/check-staleness.js` | Warns on `last_human_verified` > 15 days; non-failing |
| `scripts/check-exemption-expiry.js` | Fails CI if any `audit-exemptions.json` entry has an expired date |
| `scripts/check-security-txt.js` | Fails if `security.txt` `Expires:` is past or > 12 months in the future |

---

## Spec Navigation Tips

- The specs are the authoritative implementation contract. The PRD is the business context.
- Every acceptance criterion (AC-x.y.z) is binary pass/fail. "Verified by Playwright test" means the test must exist in CI, not just be runnable locally.
- `specs/preset-content-draft.md` contains the actual text for all 5 presets. The `ten-page-document` preset text (~20,000 chars) is ready to copy into `src/data/presets.json`.
- Phase 0 Definition of Done (bottom of `phase-0-foundation.md`) is the literal launch gate checklist for that phase.
