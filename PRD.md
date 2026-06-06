# Product Requirement Document (PRD)
## Project: Calculate Tokens — AI Token & Cost Intelligence Suite
**Domain:** calculatetokens.com  
**License:** MIT (Open Source)  
**Status:** Draft v0.6 — In Review  
**Last Updated:** 2026-06-05

---

## Table of Contents
1. [Product Overview & Objectives](#1-product-overview--objectives)
2. [Target Audience & Core Personas](#2-target-audience--core-personas)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Key Product Features & Functional Requirements](#4-key-product-features--functional-requirements)
5. [Out of Scope (v1)](#5-out-of-scope-v1)
6. [UX/UI & AdSense Monetization Strategy](#6-uxui--adsense-monetization-strategy)
7. [Discovery Optimization Strategy (SEO, AEO, GEO)](#7-discovery-optimization-strategy-seo-aeo-geo)
8. [Technical Stack & Architecture](#8-technical-stack--architecture)
9. [Pricing Data Pipeline](#9-pricing-data-pipeline)
10. [Open Source Strategy](#10-open-source-strategy)
11. [Performance & Quality Standards](#11-performance--quality-standards)
12. [Accessibility & Internationalization](#12-accessibility--internationalization)
13. [Analytics & Instrumentation](#13-analytics--instrumentation)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Assumptions & Dependencies](#15-assumptions--dependencies)
16. [Release Milestones](#16-release-milestones)

---

## 1. Product Overview & Objectives

### Executive Summary
**Calculate Tokens** shows you what your AI prompt costs on every major model — live, as you type, without sending your text to our servers.

Developers don't hire a token calculator to count tokens. They hire it to make a decision: which model should I use, and what will it cost at scale? That comparison can only happen in a neutral, third-party tool. No AI provider will ever honestly display a competitor's pricing and say "this one is cheaper for your use case" — the cross-provider comparison is structurally against every provider's interests. Calculate Tokens is the only place that comparison exists.

The tool runs entirely in the browser. Your text is never sent to our servers. This is a meaningful differentiator for the highest-value users — engineers and SaaS founders who cannot paste proprietary system prompts or customer data into provider-hosted tools that log inputs by policy.

The platform is 100% ad-supported via Google AdSense and open-sourced under the MIT license to maximize community trust, backlink authority, and GEO discoverability.

### Business Goals
- **Monetization:** Generate sustainable ad revenue via optimized Google AdSense placement and premium ad space.
- **Market Position:** Become the industry-standard calculator cited by AI developers, engineering blogs, and AI discovery engines (ChatGPT Search, Perplexity, Gemini).
- **Virality:** Achieve high sharing metrics through shareable cost-simulation URLs and configuration export.
- **Community:** Leverage open-source model to attract contributors who keep pricing data and tokenizer support current.

### Success Metrics (KPIs)
| Metric | Target | Rationale |
|--------|--------|-----------|
| Session Duration — Calculator | > 3.5 min | Maximizes AdSense impressions; dwell-time features (token highlighter, scaling simulator) drive this |
| Session Duration — Content pages | > 90 sec | Sufficient for reading a comparison page and making a decision; content page sessions are intentionally short |
| Bounce Rate | < 35% | Client-side instant interaction reduces bounces on the calculator; content pages have a higher natural bounce rate and are tracked separately |
| Search Visibility | Rank #1–3 for "token calculator", "LLM cost estimator", "API cost calculator" | Primary acquisition channel |
| Discovery Engine Citations | Indexed by Perplexity, Gemini Search, ChatGPT Search as preferred pricing reference | Secondary acquisition |
| Core Web Vitals (LCP) | < 2.5s | Google ranking factor; directly affects organic rank |
| Core Web Vitals (CLS) | < 0.1 | Prevents layout shift during ad load |
| Core Web Vitals (INP) | < 200ms | Ensures real-time input feels instant |
| GitHub Stars (6 months) | > 500 | Proxy for developer trust and backlink velocity |

---

## 2. Target Audience & Core Personas

### Sam — The SaaS Builder
- **Goal:** Project monthly operational costs before launching a feature.
- **Key Task:** Simulate volume tiers — "What will 50,000 monthly requests on Claude Sonnet 4.6 cost us?"
- **Pain Point:** Spreadsheet-based estimates are slow; existing tools only show one model at a time. Pasting proprietary system prompts into provider-hosted tools is a security concern.
- **Success:** Leaves with a per-model cost breakdown and a shareable URL to paste into a Notion budget doc.
- **Primary surface:** Interactive calculator (uses the scaling simulator and shareable URL)

### Elena — The AI Engineer
- **Goal:** Verify precise token splits for complex prompts to prevent context-window overflow on frontier models.
- **Key Task:** Paste a system prompt + few-shot examples and see the exact token count per model before deployment.
- **Pain Point:** Token counts differ significantly between GPT-4o and Claude; overflow bugs are expensive to debug in production. Cannot paste real prompts into OpenAI or Anthropic consoles.
- **Success:** Immediately sees token count per model and a visual token highlight showing where cuts occur.
- **Primary surface:** Interactive calculator (uses the token highlighter, context window indicator, and Wasm accuracy)

### Marcus — The Content Operations Lead
- **Goal:** Estimate AI processing costs for mass data extraction or localization workflows.
- **Key Task:** Understand cost in plain language — dollars per document, not "tokens per million."
- **Pain Point:** Doesn't understand what a token is; needs instant dollar translation from word/character counts.
- **Success:** Finds a comparison page via Google search, reads a plain-English cost breakdown per model, and shares the URL with his manager.
- **Primary surface:** Static comparison and model pricing content pages — Marcus rarely interacts with the calculator directly. The SEO content strategy IS his product.

> **Two-product architecture note:** The interactive calculator primarily serves Sam and Elena. The static comparison and content pages primarily serve Marcus (and non-technical stakeholders). Both share the same `prices.json` source of truth and the same domain authority.

---

## 3. Competitive Landscape

### Direct Competitors
| Tool | Strengths | Weaknesses |
|------|-----------|------------|
| **OpenAI Tokenizer Playground** (platform.openai.com/tokenizer) | Official; accurate for GPT models | Single model only; no cost output |
| **tiktokenizer.vercel.app** | Developer-popular; visual token highlighting | No pricing; no multi-model comparison |
| **LLMPrices.com** | Multi-model pricing reference | Static table only; no interactive input |
| **Anthropic Console Token Counter** | Accurate for Claude | Claude-only; no cost grid |
| **OpenRouter's cost calculator** | Genuinely neutral; pricing data backed by real transaction volume; financial incentive to maintain accuracy | Serves developers who have already committed to an API routing strategy — Calculate Tokens wins the earlier, upstream moment: the architectural decision before any intermediary is in the picture |
| **artificialanalysis.ai** | 4M monthly visits; comprehensive benchmark + pricing calculator; strong growth (+25% MoM) | Uses o200k_base (one tokenizer) for all models — produces ~65% error on Gemini, ~32% on Llama 3; proprietary; no privacy claim; no open source |
| **pricepertoken.com** | 185K monthly visits; 300+ models; +17% growth; filtering by capability flags | No per-model tokenizer accuracy; no browser-native privacy guarantee; no open source |
| **tokencalculator.ai** | Claims browser-native processing and "no data transmitted"; 100+ models | Proprietary — privacy claim unverifiable without open source; tokenizer approach undisclosed |

> **Note on llm-stats.com:** Often cited alongside token calculators but is a different product — a benchmarking leaderboard (~303K monthly visits) combining intelligence scores, speed, and pricing into composite rankings. No token calculator or cost projection tool. Not a direct competitor.

### Competitive Advantage
Calculate Tokens wins on four dimensions that competitors cannot replicate:

1. **Structural neutrality** — The cross-provider cost comparison is the primary job users hire this tool to do. No AI provider will ever build that comparison honestly against their competitors. This advantage is not technical — it is structural. It does not erode as providers invest in their own tools.

2. **Zero server transmission** — Your text is never sent to our servers. The tool runs entirely in the browser. Provider-hosted tools (OpenAI Playground, Anthropic Console) log inputs by policy. For any user with proprietary or sensitive prompts — which describes most enterprise and B2B use cases — Calculate Tokens is the only option that keeps text off external servers entirely.

3. **Per-model tokenizer accuracy** — Most token calculators use OpenAI's tiktoken (cl100k_base) for all models, producing ~65% error on Gemini and ~32% error on Llama 3. Those errors compound directly into cost estimates used for architectural decisions. Calculate Tokens runs the correct tokenizer per model — compiled to WebAssembly, running in the browser — with zero server round-trips. This is the known, documented weakness of every competing tool.

4. **Verifiable privacy** — Competitor privacy claims ("no data transmitted") are unverifiable in proprietary code. Calculate Tokens is MIT-licensed and open source. Users can confirm no data leaves the browser by reading the source code. Open source is the only meaningful proof.

---

## 4. Key Product Features & Functional Requirements

### 4.1 Browser-Native Tokenizer Engine

**Description:** High-speed tokenization occurs entirely client-side (in-browser) using compiled WebAssembly (Wasm) or optimized JavaScript. Text is never transmitted to a backend server, ensuring compliance with corporate data-privacy policies.

**Supported Tokenizer Sub-Systems:**
| Tokenizer | Models |
|-----------|--------|
| OpenAI Tiktoken (`cl100k_base`) | GPT-4, GPT-3.5-turbo families |
| OpenAI Tiktoken (`o200k_base`) | GPT-4o, GPT-4.1, o1, o3, o4 families |
| Anthropic Tokenizer | Claude 3.x and Claude 4.x profiles |
| Google Gemini Tokenizer | Gemini 1.5, 2.0, 2.5 families |
| Open-Weight Tokenizers | Llama 4, DeepSeek V3/R1 |

**Fallback Logic:** For unreleased or proprietary models lacking public tokenizer weights, implement a calibrated baseline heuristic: **1 token ≈ 4 characters** for English text. This fallback must be clearly labeled in the UI so users understand it is an estimate.

**Loading Strategy:** The heuristic estimate (4 chars/token) is the primary product experience for the majority of users (Sam and Marcus personas). It loads instantly and is sufficient for cost estimation. Wasm accuracy is a quality upgrade for the engineering persona (Elena) who needs exact token splits.

Implementation: Wasm tokenizer bundles (1–4 MB each) load lazily in a background Web Worker. The UI renders immediately with confident heuristic counts — not labeled as degraded or approximate, just as the current count. When the Wasm worker resolves, counts update silently. A subtle "exact" indicator appears on the token count field once Wasm is ready, signaling that precision is now active without implying the prior state was wrong.

### 4.2 Real-Time Live Multi-Model Cost Grid

**Description:** As the user types or pastes text into a master input area, a dynamic grid recalculates parameters instantaneously using debounced input (≤ 100ms debounce).

**Interactive Controls Required:**

| Control | Description |
|---------|-------------|
| **Master Input Textarea** | Supports plain text, code snippets, and JSON blocks. Character and word count displayed live. |
| **Output Token Slider** | Simulates projected AI output lengths (range: 0–8,000 output tokens). Required because text input only represents input tokens; pricing structures are asymmetric. |
| **Thinking Token Toggle** | Conditional modifier for reasoning models (o3, o4-mini, DeepSeek R1). When enabled, applies a projected chain-of-thought multiplier based on published model ratios. Clearly labeled as an estimate. |
| **Context Window Indicator** | For each model in the grid, show the input token count as a percentage of that model's maximum context window (e.g., "38% of 200K"). Turns amber at >80%, red at >95%. |

**Cost Grid Columns:**
| Column | Description |
|--------|-------------|
| Model | Provider + model name with version |
| Input Tokens | Exact count (or estimated if Wasm not yet loaded) |
| Input Cost | Calculated at current pricing |
| Output Cost | Calculated at slider value |
| Total Cost | Input + Output |
| Context Used | Token count / context window max |

**Cost Comparison Affordance — required:**
The cost gap between cheapest and most expensive model for the user's specific input is the remark that makes this tool shareable. It must be surfaced, not buried in equal-weight columns.

- Grid is **sorted by Total Cost ascending** by default (cheapest first)
- The lowest-cost row receives a subtle **"Lowest cost"** badge — not "Best value." The tool presents cost data; it does not recommend models. Quality, reliability, and output characteristics are outside this tool's scope and vary by use case. "Best value" implies a recommendation on dimensions the tool cannot assess.
- A **cost ratio callout** appears above the grid whenever the spread exceeds 10×: *"DeepSeek V3 is 41× cheaper than GPT-4.1 for this prompt"*
- The callout updates live as the user types and as the output slider moves
- Users can re-sort by any column header; clicking "Total Cost" again restores the default sort

```
[ Master Input Area: Text, Code, or Paste ]               🔒 Your text is never sent to our servers
                       │
         ┌─────────────────────────────────┐
         │  DeepSeek V3 is 41× cheaper     │  ← cost ratio callout (appears when spread > 10×)
         │  than GPT-4.1 for this prompt   │
         └─────────────────────────────────┘
                       │
                       ▼
┌───────────────────────┬────────────┬───────────┬───────────┬──────────┐
│ Model                 │ In Tokens  │ In Cost   │ Out Cost  │ Total    │
├───────────────────────┼────────────┼───────────┼───────────┼──────────┤
│ ↓ DeepSeek V3         │ 1,018      │ $0.0003   │ $0.0004   │ $0.0007  │  ← lowest cost
│   Gemini 2.5 Pro      │ 987        │ $0.0020   │ $0.0118   │ $0.0138  │
│   Claude Sonnet 4.6   │ 1,031      │ $0.0031   │ $0.0155   │ $0.0186  │
│   GPT-4.1             │ 1,024      │ $0.0026   │ $0.0164   │ $0.0190  │
└───────────────────────┴────────────┴───────────┴───────────┴──────────┘
```
> Note: Model names and pricing in this diagram are illustrative. Actual values are driven by the live pricing config at runtime.

### 4.3 Visual Token Highlighter

**Description:** A toggleable overlay on the input textarea that colorizes token boundaries using alternating highlight colors, visually demonstrating where the tokenizer splits the text. This is a high-engagement feature that substantially increases session dwell time.

**Requirements:**
- Must update in real-time as user types (debounced)
- Color palette must be accessible (sufficient contrast for WCAG AA)
- Must degrade gracefully — if Wasm tokenizer hasn't loaded yet, show a "Loading tokenizer..." state instead of incorrect highlights

### 4.4 Scaling & Bulk Volume Simulator

**Description:** A designated section that scales a single-prompt calculation to production-level infrastructure costs.

**User-Configurable Variables:**
| Variable | Description |
|----------|-------------|
| Daily / Monthly Request Volume | Integer input with preset options (100, 1K, 10K, 100K, 1M requests) |
| Context Caching Toggle | Per-provider: applies provider-specific caching discount to input tokens (Anthropic: up to 90%; OpenAI: varies by tier). Discount rate is shown per model, not as a flat value. |
| Batch API Multiplier | Per-provider: applies asynchronous batch processing discount where offered (e.g., OpenAI Batch API: 50% off; not all providers offer this). Clearly labeled when unavailable for a given model. |

**Output:** Monthly estimated spend per model in a sortable table; exportable as CSV.

### 4.5 Shareable URL State

**Description:** All interactive state is encoded into the URL query string so any configuration can be shared via a single link. The share button always produces a valid URL, but what it encodes depends on input size.

#### URL Design — Configuration Parameters Only

Shareable URLs encode calculator *configuration* only. Raw textarea text is **never** encoded in the URL. This is a privacy invariant (prompt text is not embedded in URLs that may be logged by proxies or synced across devices) and a security control (eliminates decompression bomb attacks via crafted share links).

```
https://calculatetokens.com/?out=512&think=0&vol=10000&cache=1&models=gpt-4o,claude-sonnet-4-6
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `out` | integer [0–8000] | Output token slider value |
| `think` | 0 or 1 | Thinking token toggle state |
| `vol` | integer [1–100000000] | Monthly volume multiplier |
| `cache` | 0 or 1 | Context caching toggle |
| `batch` | 0 or 1 | Batch API toggle |
| `models` | comma-separated IDs | Active model selection (omit = all); values validated against known model IDs |

The share button always produces a valid, complete URL. No "settings-only" fallback mode is needed because text is never included.

Users who want to share both configuration and a specific prompt can share the URL (restores their exact slider/toggle setup) and separately share the prompt text.

#### URL State Mechanics
- URL updates on every interaction using `history.replaceState` (no page reload, no history stack pollution). This is a UX optimization, not a security control.
- On page load, each URL parameter is validated against its expected type and range before use. Unknown parameter names are silently ignored. No URL parameter name is used as a dynamic object property key.
- The textarea is always empty on initial page load from a shared URL. The URL restores configuration; the user provides their own prompt text.

### 4.6 Quick Preset Library

**Description:** Pre-defined prompt scenarios in the left sidebar that users can click to instantly populate the input area.

**Included Presets (v1):**
- "Analyze a 10-page PDF (text equivalent)"
- "Process a Python script (500 lines)"
- "Customer support chat turn"
- "Summarize a blog post (1,500 words)"
- "System prompt: Large RAG instruction set"

---

## 5. Out of Scope (v1)

The following features are explicitly excluded from v1 to keep development overhead and infrastructure costs minimal. They are logged for future consideration.

| Feature | Reason Deferred |
|---------|-----------------|
| File upload (PDF, DOCX) | Requires parsing libraries and server-side processing or large client-side bundles |
| Multi-turn conversation cost simulation | Significant UX complexity; addressed by Presets for common cases |
| Image / multimodal token counting | Provider-specific formulas are complex; adds scope without proportional value for v1 |
| Currency conversion (EUR, GBP, etc.) | Secondary priority; USD covers the majority of the developer audience |
| User accounts / saved history | Adds auth infrastructure and cost; stateless URL sharing covers the use case |
| Dark mode | Nice to have; not in critical path |
| Mobile app / PWA | Web-first approach is sufficient for v1 |
| Premium tier / API access | Monetization v2; AdSense is sole revenue source for v1 |

---

## 6. UX/UI & AdSense Monetization Strategy

### 6.1 Layout Architecture

#### Desktop (≥ 1024px) — Three-Column Layout
| Column | Width | Content |
|--------|-------|---------|
| Left (Navigation & Presets) | ~18% | Quick-select preset scenarios; model filter checkboxes to toggle models on/off in the grid |
| Center (Core Application) | ~60% | Master input textarea; metric counters (Characters, Words, Tokens, Total Cost); cost grid; scaling simulator |
| Right (Ad Anchor) | ~22% | Persistent sticky 300×600 or 160×600 display banner |

#### Tablet (768px–1023px) — Two-Column Layout
Left sidebar collapses into a hamburger/drawer. Right ad column persists as a 300×250 inline unit below the cost grid.

#### Mobile (< 768px) — Single-Column Stacked Layout
All columns stack vertically. Ad units appear inline: one 320×100 above the fold, one responsive unit between input and cost grid. Sticky sidebar unit is disabled on mobile.

### 6.2 Micro-Interactions for Dwell Time
- **Visual Token Highlighter** (see Feature 4.3) — primary dwell-time driver
- **One-Click "Compare All" tab** — switching view re-renders the cost grid, triggering subtle ad refreshes within Google programmatic guidelines
- **Animated counter transitions** — token/cost counts tick up/down as values change rather than instantly jumping (16ms frame-rate transitions)
- **Preset hover previews** — hovering a preset shows a tooltip with the input text sample

### 6.3 Ad Placement Rules
| Placement | Unit Type | Location |
|-----------|-----------|----------|
| Above-the-fold native banner | Responsive leaderboard (728×90 / 320×100) | Below main header, above input textarea. Must look integrated, not intrusive. |
| "Calculated Results" inline ad | Responsive link or image unit | Embedded between the input area and the cost grid |
| Sticky sidebar unit | 300×600 or 160×600 | Right column; follows scroll. Disabled on mobile. |
| Below-the-fold content ad | Responsive unit | Below the scaling simulator section |

**Ad Density — Hard Product Principle:**
Maximum 4 ad units per page. This is a design constraint, not an AdSense policy note. The risk of this limit being violated is not external (AdSense policy enforcement) — it is internal (revenue growth creating pressure to add units). As AdSense income grows, resist adding units beyond this cap. More ads → degraded UX → higher bounce rate → lower SEO rankings → less traffic → less revenue. The cap exists to protect the product from its own monetization incentive.

**AdSense Policy Compliance:**
- Hard cap: 4 ad units maximum per page (see principle above)
- No ad within 150px of interactive controls that could trigger accidental clicks
- Ads never obscure primary content
- Ad refresh only triggered by explicit user tab-switching actions, not on every keystroke

> ⚠️ **Risk Note:** AdSense account approval is not guaranteed. See Section 14 for contingency.

---

## 7. Discovery Optimization Strategy (SEO, AEO, GEO)

### 7.1 Classic Search Engine Optimization (SEO)

**Technical SEO:**
- Next.js Static Export for pre-rendered HTML on every route — no client-side routing for primary content
- Sitemap auto-generation covering all static and programmatic routes
- `robots.txt` explicitly allowing `/api/v1/prices.json` for crawler ingestion
- Canonical tags on all pages
- Open Graph + Twitter Card meta tags for social previews

**Content SEO:**
- **Programmatic Landing Pages:** Auto-generate lightweight, crawlable subpages for high-intent comparisons (e.g., `/compare/gpt-4-vs-claude-sonnet`, `/models/claude-sonnet-4-6-pricing`). Pages are static HTML generated at build time from the pricing config.
- **Rich Snippets & Structured Data:** JSON-LD `SoftwareApplication` and `FAQPage` schemas on every tool page defining pricing, calculation boundaries, and capabilities.
- **Primary Target Keywords (Tier 1 — high-traffic, long-term authority building):** "token calculator", "LLM cost estimator", "API cost calculator", "GPT token counter", "Claude token cost", "AI API pricing"
- **Model-Specific Keywords (Tier 2 — Phase 0 quick-win targets, low competition, high transactional intent):** "claude token calculator", "claude sonnet token count", "claude haiku token counter", "llama token calculator", "llama 4 token count", "gemini token calculator", "gemini 2.5 token counter", "deepseek token calculator", "deepseek r1 token count", "o4-mini token calculator", "gpt-4o token counter". These are matched directly by the 36 comparison pages and `/models/[id]` pages generated in Phase 0.
- **Accuracy & Differentiation Keywords (Tier 3 — medium competition, validated developer resonance):** "accurate LLM token calculator", "LLM token calculator accuracy", "tokenizer comparison GPT Claude", "OpenRouter token calculator"

> **Keyword strategy note:** Tier 1 head-on terms face strong competition from artificialanalysis.ai (4M monthly visits) and are long-term authority investments. Tier 2 model-specific terms are underserved today and deliver indexed traffic early via Phase 0 content infrastructure. Both tiers run in parallel — model-specific for early organic wins, generic terms for compounding domain authority over 12+ months.

### 7.2 Answer Engine Optimization (AEO)

- **Direct Answer Architecture:** Pricing constants and formulas in semantically structured tables (`<thead>`, `<tbody>`, `<th scope>` attributes). Answer engines prioritize structured tables for precise pricing answers.
- **"What is a Token?" Evergreen Hub:** A highly optimized FAQ sub-layout at `/learn/what-is-a-token` responding directly to core informational queries. Written to match natural language patterns that conversational AI models source from.
- **Data Provenance Footer:** Every page includes the exact timestamp of the last pricing update and a direct link to the source `prices.json` config file. Transparency signals authority to both users and crawlers.

### 7.3 Generative Engine Optimization (GEO)

- **Source Citability:** High factual density pages with transparent methodology documentation. Generative engines prefer citing sources with clear, verifiable data.
- **Open `/api/v1/prices.json` Endpoint:** A publicly accessible, human- and machine-readable static JSON file containing current model pricing, token limits, and metadata. Served from Cloudflare's edge CDN at zero cost with global low-latency delivery. AI agents crawling for pricing data will ingest this file directly, increasing the site's authority profile. The `robots.txt` explicitly permits crawling of this path.
- **Open Source Repository:** A public GitHub repo (MIT license) with stars and activity signals authority to discovery algorithms. The repo README links prominently to calculatetokens.com.
- **External Backlink Targets:** Developer documentation sites, AI newsletters, GitHub READMEs, and Stack Overflow answers should reference the tool. Open-source strategy accelerates this organically.

---

## 8. Technical Stack & Architecture

### Stack Decisions
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | Next.js (App Router, Static Export mode) | Pre-rendered HTML for SEO; near-instant page load; clean asset structure |
| Styling | Tailwind CSS + shadcn/ui | Minimal bundle size; consistent design system; accessible component primitives |
| Tokenization Workers | `js-tiktoken` (Wasm) + model-specific JS libraries | Moves computation off UI thread; zero UI lag during real-time typing |
| State Management | Zustand or React Context (lightweight) | No Redux-scale complexity needed for this app |
| Hosting & CDN | **Cloudflare Pages (free tier)** | Unlimited bandwidth, unlimited requests, 500 builds/month — no caps that could force paid tier; global edge delivery |
| Monetization | Google AdSense Auto-Ads + Manual Placements | Easy integration; programmatic bidding; clean viewport resizing |
| Analytics | **Cloudflare Web Analytics (free)** | GDPR/CCPA compliant; no cookies; no consent banner; built into Cloudflare Pages; zero cost |
| Pricing Pipeline | **GitHub Actions → git push → Cloudflare Pages deploy** | See Section 9 |

### Architecture Principles
- **Zero-backend for user interactions:** All tokenization, calculation, and state management happen client-side. No user data is ever transmitted.
- **Heuristic-first, Wasm-upgraded:** The heuristic estimate is the primary product experience. Wasm accuracy is a transparent upgrade, not a required dependency. This keeps initial load fast for all users.
- **Static-first, no server required:** All routes are statically generated at build time. There are no serverless functions, no ISR, and no server-side rendering — the site is a collection of static files served from Cloudflare's edge CDN. Pricing data is a static public file updated via git commit. This eliminates all function invocation costs and removes the ISR/Cron architecture entirely.

### Service Worker Strategy
- **Registration:** Registered on first visit; controls `/` and all sub-routes.
- **Pricing cache:** `stale-while-revalidate` strategy with a 24-hour TTL. The pricing JSON is always served from cache for instant load; a background fetch updates the cache daily.
- **Cache invalidation:** A build-time version hash in the pricing JSON triggers cache-busting when prices change.
- **Offline behavior:** If the user is fully offline, the app functions with the last cached pricing data. A subtle "Prices may be outdated" banner is shown if the cache is > 48 hours old.

### Security Considerations

#### Content Security Policy (CSP) — Mutually Exclusive Configurations

The application operates in exactly one of two CSP configurations, determined at build time via the `NEXT_PUBLIC_CSP_MODE` environment variable. **These configurations are mutually exclusive and MUST NOT coexist.** A build that attempts to combine both MUST fail with the error: `CSP_MODE conflict: wasm-unsafe-eval and AdSense are mutually exclusive.`

**Configuration A — Analytics-Only (default; active until AdSense approval):**
- `script-src 'self' 'wasm-unsafe-eval'` — permits Wasm compilation; no third-party script domains
- `worker-src 'self'` — restricts Web Worker script origins to the application origin
- `connect-src 'self' https://[umami-host]` — restricts fetch/XHR origins
- `unsafe-eval` MUST NOT be present in any directive

**Configuration B — AdSense-Enabled (opt-in after AdSense approval):**
- `script-src 'self' https://pagead2.googlesyndication.com https://googletagservices.com https://doubleclick.net` — required AdSense domains
- `wasm-unsafe-eval` MUST NOT be present; Wasm tokenization is replaced with the pure-JS fallback
- `unsafe-eval` MUST NOT be present

The CSP MUST be delivered as an HTTP response header (not a `<meta>` tag) so that `frame-ancestors` is enforceable. The exact header value for each configuration MUST be specified as a constant in the codebase and verified in CI against a reference string.

#### No User Data Persistence
No cookies are set by the application itself. AdSense sets its own cookies; this is governed by Google's policy and disclosed in the privacy policy. A privacy policy page is required at `/privacy`.

#### Wasm Sandboxing
Tokenizer Wasm modules run in dedicated Web Workers, isolated from the main thread and DOM. Workers are spawned lazily on first textarea input. The main thread communicates with workers exclusively via `postMessage`. No Wasm module is loaded on the main thread.

#### DOM Rendering Safety
Any user-controlled text rendered into the DOM (token highlighter, preset previews, error messages) MUST use `textContent` assignment, never `innerHTML` assignment. HTML entity encoding is not a substitute for safe DOM APIs. This requirement is verified by unit tests that pass XSS payloads (`<script>`, `<img onerror>`, `javascript:`) as input and assert no script execution occurs.

#### Dependency Audit Policy
`npm audit --audit-level=high` runs in CI on every PR and fails the build on any HIGH or CRITICAL finding. MODERATE findings generate a warning artifact without blocking. A finding may be suppressed only by adding an entry to `audit-exemptions.json` with fields: `cve`, `rationale`, `expiry` (maximum 90 days from today), and `owner`. Expired exemptions cause the audit step to fail. The scheduled pricing workflow MUST also run `npm audit --audit-level=high` and send a maintainer notification on failure.

---

## 9. Pricing Data Pipeline

### Source of Truth
Pricing data is maintained in a versioned `prices.json` file at `/public/api/v1/prices.json` in the project's public GitHub repository. Because the site is purely static, this file is served directly from Cloudflare's edge CDN as a plain file — no serverless function, no API route, no invocation cost. The public URL `calculatetokens.com/api/v1/prices.json` resolves to this static file.

The file structure supports per-model fields including:
- Input cost per 1M tokens
- Output cost per 1M tokens
- Context caching discount (per-provider, not a flat rate)
- Batch API discount availability and rate (per-provider)
- Maximum context window (tokens)
- Tokenizer sub-system identifier
- `last_checked` — timestamp of the last automated GitHub Actions check (confirms the file was examined; does not confirm correctness)
- `last_human_verified` — timestamp of the last manual human confirmation against the provider's official pricing page (distinct from `last_checked`)

The UI data provenance footer must display `last_human_verified`, not `last_checked`. As the site grows in authority, developers will make real cost decisions based on this data. The distinction between "the automation ran" and "a human confirmed this is correct" matters at scale.

**Staleness policy — required UI behavior:**
Verification lag must be visible, not hidden behind a static disclaimer. The UI enforces this per model row in the cost grid:

| `last_human_verified` age | UI behavior |
|---------------------------|-------------|
| ≤ 14 days | Normal display |
| 15–30 days | Amber indicator on the model row; tooltip: "Pricing last verified [date] — may have changed" |
| > 30 days | Row flagged with a warning icon; tooltip: "Pricing unverified for 30+ days — confirm at [provider URL] before relying on this figure" |

This makes staleness a public, visible signal rather than a private maintainer obligation. A model row showing amber is an open invitation for a community PR — converting maintenance burden into a community contribution trigger.

### Update Flow
1. **Daily automated check:** A GitHub Actions workflow runs at 06:00 UTC. It performs three checks:
   - **Schema validation:** Validates `prices.json` against `prices.schema.json`. Fails the workflow on invalid data.
   - **Staleness detection:** Reports models whose `last_human_verified` is 15+ days old in the GitHub Actions job summary (warning, does not fail).
   - **Provider page change detection:** `scripts/check-page-changes.js` fetches each model's `provider_pricing_url` and compares a CSS-selector-extracted pricing content hash against the stored snapshot in `scripts/pricing-snapshots/`. If a hash differs, the provider is listed in the job summary AND a GitHub Issue is auto-created (via the `notify-price-changes` job) with the affected provider names, current `prices.json` values, and resolution instructions. The workflow does NOT fail on a detected change. A deduplication guard prevents duplicate issues if the same change is detected across multiple daily runs before the maintainer acts.
2. **Human verification (triggered by #1):** When the job summary lists changed provider pages, the maintainer navigates to that specific provider URL, confirms the pricing values, updates `prices.json`, and sets `last_human_verified` to the current date. Only this step updates `last_human_verified` — the automation updates only `last_checked` and the content snapshots.
3. **Automatic redeploy:** Any commit to `prices.json` triggers Cloudflare Pages to rebuild and redeploy the site (~60 seconds). The updated static file is live on the edge immediately after.
4. **No change detected:** The workflow exits after updating `last_checked` timestamps and snapshots. No `prices.json` redeploy is triggered unless values changed.
5. **Community updates:** Contributors submit PRs to update `prices.json` directly when providers announce changes between daily checks.
6. **Service Worker:** Client-side cache is refreshed via `stale-while-revalidate` as described in Section 8.

There is no Vercel Cron, no ISR revalidation, and no serverless function in this pipeline. The entire update mechanism runs on GitHub's free CI infrastructure and Cloudflare's free static hosting.

### Pricing Accuracy Policy
- The data provenance footer on every page shows the last-verified timestamp and links to the source file.
- Price fields are labeled with the date they were last confirmed against the provider's official pricing page.
- **Disclaimer:** Displayed prominently: "Prices are updated regularly but may not reflect the latest provider changes. Always confirm with the provider's official pricing page before billing decisions."

---

## 10. Open Source Strategy

### Repository
- **License:** MIT
- **Hosting:** GitHub, under the `calculatetokens` organization or personal account
- **Visibility:** Public from day one

### Contribution Model
- `prices.json` updates are the highest-value, lowest-barrier contribution type. Well-documented contribution guide and a PR template for pricing updates.
- Core application PRs require maintainer review.
- Issues tagged `good-first-issue` for community onboarding.

### Community & GEO Benefits
- GitHub README prominently features the live site link, increasing backlink authority.
- Open source signals trustworthiness to discovery engines and developer audiences.
- Community-maintained pricing data reduces maintainer burden and increases update frequency.

---

## 11. Performance & Quality Standards

### Core Web Vitals Targets
| Metric | Target | Measurement Tool |
|--------|--------|-----------------|
| Largest Contentful Paint (LCP) | < 2.5s | PageSpeed Insights |
| Cumulative Layout Shift (CLS) | < 0.1 | PageSpeed Insights |
| Interaction to Next Paint (INP) | < 200ms | Chrome UX Report |
| Time to First Byte (TTFB) | < 200ms | Cloudflare Analytics |
| Total JS Bundle (initial) | < 150KB gzipped | Next.js build output / Cloudflare Pages build log |

### Browser Compatibility
| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Primary development target |
| Firefox | 88+ | Full support required |
| Safari | 14+ | WebAssembly and Web Workers required |
| Edge | 90+ | Chromium-based; Chrome parity |
| Mobile Chrome | 90+ | Required for responsive layout |
| Mobile Safari | 14+ | Required for iOS |

### Testing Strategy
- **Unit tests:** Tokenizer output validation against reference fixtures for each supported model (Jest)
- **Integration tests:** Cost calculation accuracy given known token counts and pricing inputs
- **E2E tests:** Playwright tests for the golden path: paste text → see counts → adjust slider → see updated costs → copy share URL
- **Accessibility tests:** Automated WCAG 2.1 AA check via axe-core in CI
- **Visual regression:** Screenshot comparison on key layout breakpoints (optional, v2)

### CI/CD Pipeline
- GitHub Actions on every PR: lint → type-check → unit tests → integration tests → `npm audit --audit-level=high`
- `npm audit --audit-level=high` exits non-zero and blocks merge on any HIGH or CRITICAL finding. See Security Considerations for the exemption process.
- All third-party GitHub Actions MUST be pinned to immutable commit SHAs (format: `{owner}/{action}@{40-char-sha}`). Mutable tag references (`@v4`, `@v5`, etc.) are prohibited. SHA pins are updated automatically via Dependabot (`package-ecosystem: github-actions`, monthly cadence). Dependabot PRs MUST be reviewed and merged within 30 days of opening.
- Merge to `main`: automated deploy to Cloudflare Pages (triggered by git push)
- Automated Lighthouse CI score gate: LCP < 2.5s required to merge
- A CSP configuration validation step MUST run on every build, asserting that `NEXT_PUBLIC_CSP_MODE` is set to a known value and that the generated CSP header matches the reference constant for that mode.

---

## 12. Accessibility & Internationalization

### Accessibility (WCAG 2.1 AA)
- All interactive controls (textarea, slider, toggles) must have explicit `aria-label` or associated `<label>` elements
- Color is never the sole means of conveying information (token highlight colors must also use pattern or border differentiation)
- Keyboard navigation must reach all interactive elements in logical tab order
- Focus visible indicator on all interactive elements (never suppressed with `outline: none` without a replacement)
- Contrast ratio ≥ 4.5:1 for all text; ≥ 3:1 for large text and UI components
- Token highlighter color scheme must pass WCAG contrast requirements
- Automated axe-core scan run in CI; zero critical/serious violations to merge

### Internationalization (i18n)
- **v1:** English only. All UI copy is managed through a single `en.json` locale file from the start, enabling future translation without refactoring.
- **Currency:** USD only in v1. Currency symbol is abstracted in the pricing display component to enable future addition of EUR/GBP without UI changes.

---

## 13. Analytics & Instrumentation

### Primary Analytics: Cloudflare Web Analytics (free)
Cloudflare Web Analytics is built into Cloudflare Pages at no additional cost. It is privacy-first (no cookies, no fingerprinting), GDPR/CCPA compliant, and requires no cookie consent banner — identical compliance posture to Plausible, at zero cost.

**Page-level tracking (automatic):**
- Pageviews per route
- Core Web Vitals (LCP, CLS, INP) measured from real users
- Traffic source / referrer
- Top pages by visits and visit duration

**Limitation:** Cloudflare Web Analytics does not support custom event tracking natively. The custom events table below requires a supplemental solution.

### Custom Event Tracking: Umami (self-hosted, free)
Umami is an open-source, privacy-first analytics tool that supports custom events. It can be self-hosted on [Railway](https://railway.app) or [Render](https://render.com) free tiers at zero cost. It requires no cookies and no consent banner.

**Decision:** Self-host Umami on Railway free tier for custom event tracking. Cloudflare Web Analytics handles passive page metrics; Umami handles interaction events. Total cost: zero.

**Custom events to instrument:**
| Event | Trigger | Properties | Data minimization rationale |
|-------|---------|------------|----------------------------|
| `tokenize` | User has been typing for ≥ 2s (debounced) | `tokenizer_type`, `char_count` | `char_count` MUST be quantized to the nearest 100 before transmission (e.g., 347 → 300) to prevent precise behavioral fingerprinting while preserving aggregate analytics utility |
| `preset_selected` | User clicks a preset | `preset_name` | Preset name is a fixed enum value from the spec — no free-text |
| `share_url_copied` | User clicks share button | `mode` (full or settings-only) | Mode is a binary enum; no content is transmitted |
| `output_slider_adjusted` | Slider interaction | `value` | Integer in [0, 8000]; not personally identifiable |
| `thinking_toggle_enabled` | Toggle on | `model` | Model name is a fixed enum value from prices.json |
| `scaling_simulator_used` | User adjusts volume multiplier | — | No properties transmitted |
| `compare_tab_switched` | View toggle | `tab_name` | Tab name is a fixed enum value |
| `token_highlighter_toggled` | Highlight on/off | — | No properties transmitted |

**Analytics data retention:** Umami event data MUST be subject to a retention policy of no more than 90 days, configured in the Umami installation settings. Events older than 90 days MUST be automatically purged.

**EU analytics scope (v1):** Railway free tier does not offer a Data Processing Agreement (DPA), which GDPR requires for processing EU data subjects' analytics. Umami custom event collection is therefore **disabled for EU users in v1** via Umami's geo-blocking configuration. This is a documented v1 scope exclusion. Cloudflare Web Analytics (page-level metrics) continues to run for EU users — Cloudflare maintains its own GDPR compliance. The `/privacy` page explicitly states this exclusion.

> **Note:** If Railway's free tier is retired or Umami hosting becomes unreliable, custom events can be dropped with no impact on core functionality. They are instrumentation, not a product dependency.

### AdSense Integration
- Google AdSense Auto-Ads enabled as a baseline
- Manual placement units defined per Section 6.3, each with `data-ad-slot` IDs for performance tracking in AdSense dashboard
- No custom ad refresh scripts (would violate AdSense policy)

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AdSense account denied or suspended | Medium | High | Carbon Ads application is submitted **in parallel** with AdSense in Phase 3 (not as a fallback after rejection). Both approval processes run concurrently so at least one network is ready by launch regardless of outcome. AdSense application submitted only after content mass is established in Phase 0. |
| Umami free hosting (Railway/Render) discontinued | Low | Low | Custom events are instrumentation only — drop them if hosting fails. Cloudflare Web Analytics continues to cover page metrics. Core product unaffected. |
| Tokenizer Wasm bundle too large, hurting LCP | Medium | High | Heuristic-first UX means LCP is not gated on Wasm load. Wasm bundles load lazily after first render. `<link rel="preload">` used for priority tokenizer only. |
| Pricing data goes stale | High | Medium | Automated daily GitHub Actions check; Service Worker cache with staleness banner; community PR process |
| Provider releases model with proprietary tokenizer | High | Low | Heuristic fallback (4 chars/token) serves most users adequately; accuracy improves when open-weight tokenizer ships |
| SEO underperformance vs. established tools | Medium | Medium | Content infrastructure launches in Phase 0, giving 8+ weeks of indexing time before the interactive tool launch |
| AdSense layout shift causing CLS failures | Medium | High | Reserve ad slot dimensions in CSS before AdSense scripts load; use `min-height` on ad containers |
| Cloudflare Pages free tier policy change | Low | Medium | Migrate to Netlify or GitHub Pages (both free for static sites) — migration is a 30-minute config change given the purely static architecture |
| Open-source competitors fork and outcompete | Low | Medium | Domain authority, SEO investment, and community relationships create durable moats |

---

## 15. Assumptions & Dependencies

| Assumption | If Wrong |
|------------|---------|
| AdSense approval is granted after Phase 0 content is indexed | Activate Carbon Ads (applied in parallel in Phase 3; approval is expected before launch); timeline unaffected, zero-cost operation continues |
| `js-tiktoken` Wasm builds are publicly available and licensed for web use | Fall back to pure-JS tiktoken implementation (slower but functional); heuristic-first UX means this is non-blocking |
| Cloudflare Pages free tier remains available and sufficient | Migrate to Netlify or GitHub Pages (both free, both static — 30-minute migration) |
| Railway/Render free tier supports Umami self-hosting | Drop custom event tracking; Cloudflare Web Analytics continues; no product impact |
| GitHub Actions free minutes are sufficient for daily pricing check | True for all public repos with no hard limit; no fallback needed |
| Community pricing contributions will help keep `prices.json` current | Maintainer commits to weekly manual price verification for the first 6 months |
| Next.js Static Export is compatible with all required features | Validate during Phase 0 technical spike; no ISR or server features are required, so compatibility risk is low |
| Google AdSense does not penalize the token-highlighter re-render interactions | Validate against AdSense refresh policy before implementing tab-switching ad refresh |

---

## 16. Release Milestones

> **Sequencing rationale:** Search engines need 6–10 weeks to index and begin ranking new content. The static comparison pages and evergreen hub must go live as early as possible — before the interactive tool is finished — so they have indexing runway before the public launch. Content infrastructure ships in Phase 0 alongside the technical foundation. The interactive tool follows in Phase 1.

### Phase 0 — Foundation + Content Infrastructure (Week 1–3)
*Deploy static content immediately so SEO indexing clock starts. Interactive tool is not required.*

**Technical foundation:**
- [ ] Repository created, MIT license, `CONTRIBUTING.md` and `prices.json` schema defined
- [ ] Cloudflare Pages connected to GitHub repo; auto-deploy on push confirmed
- [ ] Next.js project scaffolded with Tailwind + shadcn/ui; static export confirmed
- [ ] `prices.json` populated with current pricing for top 9 models (including o4-mini and DeepSeek R1 as thinking models), placed at `/public/api/v1/prices.json`
- [ ] GitHub Actions daily pricing check workflow created
- [ ] Cloudflare Web Analytics enabled; Umami self-hosted on Railway for custom events
- [ ] Basic heuristic tokenizer running client-side (no Wasm yet)

**Content infrastructure (deploy to production ASAP):**
- [ ] Programmatic comparison landing pages (`/compare/model-a-vs-model-b`) generated from `prices.json` at build time (36 pages for 9 initial models)
- [ ] `/learn/what-is-a-token` evergreen hub page
- [ ] JSON-LD `SoftwareApplication` and `FAQPage` structured data on all pages
- [ ] Sitemap, `robots.txt` (explicitly permitting `/api/v1/prices.json`), canonical tags, OG meta (including `og:image` at 1200×630px)
- [ ] Privacy policy page (including EU analytics scope exclusion)
- [ ] `/.well-known/security.txt` (RFC 9116 format, Expires ≤ 12 months)
- [ ] Styled 404 page
- [ ] `scripts/validate-csp.js` in CI
- [ ] Lighthouse CI gate set up (LCP < 2.5s required to merge)

### Phase 1 — MVP Interactive Tool (Week 4–6)
- [ ] Master input textarea with live character/word/token counts (heuristic)
- [ ] Wasm tokenizer workers integrated (lazy-loaded; heuristic remains primary until Wasm resolves)
- [ ] Multi-model cost grid (input + output costs)
- [ ] Output token slider
- [ ] Context window indicator per model
- [ ] Responsive layout (desktop 3-col + mobile single-col)
- [ ] Service Worker with `stale-while-revalidate` pricing cache

### Phase 2 — Engagement & Monetization (Week 7–8)
- [ ] Visual token highlighter
- [ ] Scaling & bulk volume simulator (caching + batching toggles per provider)
- [ ] Preset library (5 presets)
- [ ] Model filter checkboxes (sidebar) + "Compare All" tab
- [ ] Shareable URL state encoding (configuration-only; text is never encoded)
- [ ] AdSense ad units integrated at all placements defined in Section 6.3
- [ ] Umami custom events wired to all interactions in Section 13

### Phase 3 — Discovery & Monetization Activation (Week 9–10)
*By this point, Phase 0 content has had 6–7 weeks to index. Submit AdSense application now.*

- [ ] AdSense application submitted (content mass and indexing now established)
- [ ] Verify comparison pages are indexed in Google Search Console
- [ ] Review Core Web Vitals in Cloudflare Analytics; address any regressions
- [ ] Confirm `prices.json` daily update pipeline is running cleanly
- [ ] Accessibility audit (axe-core; zero critical/serious violations)
- [ ] Cross-browser QA (Chrome, Firefox, Safari, Mobile)
- [ ] E2E test suite (Playwright golden paths)

### Phase 4 — Public Launch (Week 10–11)
*Launch after AdSense status is known. If approved, all placements active at launch. If pending, launch with Carbon Ads contingency.*

- [ ] AdSense status confirmed (approved → proceed; pending/denied → activate Carbon Ads)
- [ ] Final content review: all comparison pages accurate, structured data valid
- [ ] Public launch: Hacker News Show HN post (engineered for timing — Tuesday/Wednesday 9am EST for maximum front-page exposure)
- [ ] Product Hunt launch (coordinated with HN post for cross-platform momentum)
- [ ] GitHub repository social media push; README badges and live site link prominent

### Future (v2 Backlog)
- File upload (PDF, DOCX, TXT)
- Multi-turn conversation cost simulation
- Multimodal / image token counting
- Currency conversion toggle
- Dark mode
- Browser extension

---

*Document maintained in the `calculatetokens/calculatetokens` GitHub repository. Pricing data sourced from `prices.json` in the same repository. Last updated: 2026-06-05.*
