# Phase 4 — Public Launch
**Weeks:** 10–11  
**Primary actor:** The developer community (Hacker News, GitHub, dev Twitter/X)  
**Goal:** Maximum visibility launch that seeds organic backlinks, GitHub stars, and developer mindshare. A successful launch generates a traffic spike that accelerates AdSense approval and SEO authority simultaneously.  
**Prerequisite:** All Phase 3 launch gates passed (documented checklist in phase-3 spec). No exceptions.

---

## 4.1 Pre-Launch Readiness Checklist

This checklist is a binary pass/fail gate. Every item must pass before any launch content is published. If an item fails, the launch date shifts.

### Product
- [ ] All Phase 3 Definition of Done items pass
- [ ] Privacy policy page live at `/privacy` and linked in footer
- [ ] 404 page is styled (not a default Cloudflare error page)
- [ ] **(Automated)** Build integrity check passes — `scripts/verify-build-integrity.js` confirms all comparison pages match their source `prices.json` values
- [ ] **(Manual, triggered by automation)** No open pricing change alerts in the daily GitHub Actions job summary for any model — if alerts exist, verify and update `prices.json` before launch
- [ ] `prices.json` `last_human_verified` for all active models is within 14 days
- [ ] **(Supplementary manual)** Calculator works correctly on a real iOS device (Safari) — scoped to Service Worker installation, token highlighter rendering, and touch scroll only (all other flows covered by Playwright CI)
- [ ] **(Automated)** Playwright `no JavaScript console errors on page load` test passes in CI against the production URL
- [ ] The trust badge "🔒 Your text is never sent to our servers" is visible on page load on all breakpoints (verified by Playwright `mobile-safari` project)

### Repository
- [ ] GitHub repository is public
- [ ] README contains: one-line description, live site link, screenshot, installation instructions, contributing guide link
- [ ] `CONTRIBUTING.md` explains how to submit a pricing update PR (with the PR template) and includes a maintainer succession section: who to contact if the primary maintainer is unavailable, and how to run the pricing verification pipeline independently
- [ ] `LICENSE` file present (MIT)
- [ ] Open issues list is clean (no open bugs; feature requests are fine)
- [ ] Latest commit is from within the past 7 days (signals active project)
- [ ] Repository description and topics set: `ai`, `token-calculator`, `llm`, `openai`, `claude`, `pricing`

### Analytics & Monetization
- [ ] Cloudflare Web Analytics recording pageviews (check dashboard — one-time manual verification)
- [ ] **(Automated)** Playwright analytics tests in `tests/e2e/analytics.spec.ts` pass — verifies all 8 Umami event types fire to the Umami endpoint with correct properties. Manual Umami dashboard check is a one-time setup verification only.
- [ ] AdSense approved and ad units live OR Carbon Ads active as contingency
- [ ] **(Automated)** Lighthouse production workflow confirms CLS < 0.1 with ads loaded (post-deploy run via `lighthouse-production.yml`)

### SEO
- [ ] `sitemap.xml` accessible and submitted to Google Search Console
- [ ] **(Automated)** `scripts/check-sitemap.js` passes — validates XML structure and confirms expected URL count against `prices.json` active model count
- [ ] **(Automated)** Playwright `seo.spec.ts` OG metadata tests pass — confirms `og:title`, `og:description` (≤160 chars), and `og:image` resolution across key pages. One-time human visual check of rendered appearance is recommended but not a blocking gate.
- [ ] **(Automated)** `scripts/validate-structured-data.js` build-time JSON-LD validation passes — confirms all `<script type="application/ld+json">` blocks are valid JSON with correct Schema.org `@type` fields and required properties. Google Rich Results Test is a supplementary check for rich result eligibility (Google's proprietary determination, not automatable).

### Cross-origin workers
- [ ] **(Automated)** `node scripts/validate-worker-origin.js` exits 0 — confirms `workers.calculatetokens.com` is live, returns HTTP 200, and has correct `Access-Control-Allow-Origin` and `Cross-Origin-Resource-Policy` headers
- [ ] If AdSense build is active (`NEXT_PUBLIC_CSP_MODE=adsense`): Playwright adsense-build test (AC-3.7.4) passes — GPT-4o and Claude Sonnet show exact (non-heuristic `~`-prefixed) token counts across all five browser projects

### Security
- [ ] `/.well-known/security.txt` is live and returns HTTP 200 with valid RFC 9116 content
- [ ] `security.txt` specifies a security contact email and an expiry date no more than 12 months from launch date
- [ ] A vulnerability disclosure policy is linked from `security.txt` or included inline: reporters may email the contact address; the team commits to acknowledging reports within 7 days and resolving valid findings within 90 days
- [ ] CSP mode is confirmed as `NEXT_PUBLIC_CSP_MODE=analytics` (Wasm-compatible) unless AdSense was approved before launch
- [ ] No `unsafe-eval` or `unsafe-inline` directives present in the production CSP header (verify via `curl -I https://calculatetokens.com | grep -i content-security-policy`)

---

## 4.2 Launch Day Execution

### Timing
Launch on a **Tuesday or Wednesday**, between **8:00 AM and 10:00 AM EST**. This window consistently produces the highest engagement on Hacker News. Avoid Mondays (low traffic) and Fridays (audience distracted). Avoid major tech conference days.

### Sequence of actions (all on launch day, in order)

1. **GitHub repository goes public** (if not already)
2. **Hacker News "Show HN" post** (primary launch channel — see Section 4.3)
3. **Product Hunt launch** (secondary — see Section 4.4) — submit to queue 48 hours before launch day; mark launch date as launch day
4. **Twitter/X post** — brief thread: problem → solution → link (2–3 tweets)
5. **Reddit r/MachineLearning and r/LocalLLaMA posts** — if HN is gaining traction (>10 upvotes), post simultaneously; otherwise wait 2 hours
6. **GitHub social push** — star the repository from any accounts available; request stars from colleagues/network

Do not post to all channels simultaneously. The HN post must gain initial traction before secondary channels amplify — otherwise simultaneous posting reads as spam.

---

## 4.3 Hacker News "Show HN" Post

### Title (exact)
```
Show HN: Calculate Tokens – compare LLM API costs across every major model as you type
```

**Title rules:**
- Must start with "Show HN:"
- ≤ 80 characters (verified)
- No marketing language ("amazing", "best", "free")
- No question marks or exclamation marks
- The title above is the approved version — do not alter

### Post body (first comment — post immediately after submission)
```
I built Calculate Tokens (calculatetokens.com) because every time I needed to compare 
GPT-4 vs Claude vs DeepSeek costs, I had to open three tabs and do the math manually.

Most LLM cost calculators use OpenAI's tokenizer (cl100k_base) for every model — 
including Claude, Gemini, and Llama. That produces ~65% token count errors on Gemini 
and ~32% on Llama 3. Those errors compound directly into cost estimates. Calculate 
Tokens runs the actual tokenizer for each model, compiled to WebAssembly, in your browser.

No AI provider will ever show you an honest comparison against their competitors — 
cross-provider pricing is structurally against their interests. This tool is the only 
place that comparison exists, and it always will be.

It runs entirely in the browser — your text is never sent to our servers, which matters 
when you're testing with real system prompts or customer data. The tokenizers run via 
WebAssembly compiled from the actual model tokenizer libraries.

A few things worth knowing:
- Pricing is pulled from a public /api/v1/prices.json updated daily via GitHub Actions
- The whole thing is MIT licensed: [GitHub URL]
- It shows when pricing data was last human-verified (not just "last checked by automation")

Feedback welcome, especially on models or tokenizers I've missed.
```

**Comment rules:**
- Post this as the first comment on your own submission, within 2 minutes of the post going live
- Do not ask for upvotes
- Do not post affiliate or referral links
- Respond to every comment within the first 2 hours

### Expected failure mode
HN posts sometimes fail to gain traction for reasons unrelated to quality (timing, competing posts, algorithm variance). If the post has < 5 upvotes after 2 hours, do not repost. Wait 30 days and try again. Premature reposting flags the account.

---

## 4.4 Product Hunt Launch

### Tagline (≤ 60 characters)
```
LLM cost calculator — compare models as you type
```

### Description (≤ 260 characters)
```
Paste your AI prompt and instantly see what it costs on GPT-4, Claude, Gemini, and 
DeepSeek — simultaneously, live, as you type. Your text never leaves your browser. 
Tokenizers run via WebAssembly. Open source.
```

### Required assets
- [ ] Logo: 240×240px, `calculatetokens-logo.png`
- [ ] Gallery screenshots (minimum 3):
  1. Calculator with cost grid populated, showing cost ratio callout
  2. Token highlighter active, showing colored token boundaries
  3. Scaling simulator showing monthly cost projection
- [ ] Maker comment (similar to the HN first comment, adapted for PH tone)

### Acceptance Criteria
- AC-4.4.1: Product Hunt page is submitted to the queue at least 48 hours before launch day.
- AC-4.4.2: All 3 required screenshots are provided.
- AC-4.4.3: The tagline is ≤ 60 characters.

---

## 4.5 GitHub Repository Launch Assets

### README structure (required sections in order)
1. **Hero:** Product name + one-line description + live site badge + license badge
2. **Screenshot:** A single high-quality screenshot of the calculator with cost grid populated
3. **Why:** 2–3 sentences on the structural neutrality advantage and privacy claim
4. **Features:** Bullet list of core v1 features
5. **Data:** How pricing data works (`prices.json`, `last_human_verified`, GitHub Actions)
6. **Contributing:** Link to `CONTRIBUTING.md`; call out pricing PRs as the easiest contribution
7. **Tech stack:** Next.js, Tailwind, Cloudflare Pages, Wasm tokenizers
8. **License:** MIT

### README badges (top of file)
```markdown
[![Live site](https://img.shields.io/badge/Live-calculatetokens.com-blue)](https://calculatetokens.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange)](https://pages.cloudflare.com)
```

### Acceptance Criteria
- AC-4.5.1: README renders correctly on GitHub (no broken images, no broken links).
- AC-4.5.2: The live site link in the README badge resolves to the correct URL.
- AC-4.5.3: Repository topics include at minimum: `ai`, `token-calculator`, `llm`, `openai`, `claude`.

---

## 4.6 Post-Launch Monitoring (Day 1–7)

### Automated post-launch monitoring

`.github/workflows/monitoring.yml` runs daily at 09:00 UTC after launch. It checks:
- Site availability (`curl -f https://calculatetokens.com` — HTTP 200)
- Worker subdomain availability (`node scripts/validate-worker-origin.js` — confirms CORS headers on `workers.calculatetokens.com`)
- No JavaScript console errors in production (Playwright smoke test via `tests/e2e/smoke.spec.ts`)
- `prices.json` staleness (existing `check-staleness.js`)
- `security.txt` expiry (existing `check-security-txt.js`)

Any failure in this workflow creates a GitHub Actions failure notification. Review workflow results daily during the first week.

**`tests/e2e/smoke.spec.ts`** — minimal production smoke test:
```typescript
test('production site loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'https://calculatetokens.com');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
```

### Manual monitoring signals (hourly on launch day, daily thereafter)

| Signal | Watch for | Action if triggered |
|--------|-----------|---------------------|
| HN upvotes / rank | Front page (>10 points) | Engage comments immediately; respond to every question |
| Cloudflare Analytics | Traffic spike | Verify Cloudflare Pages is serving correctly; no 502s |
| AdSense / Carbon Ads | First impressions | None required; monitor CTR and RPM |
| Umami events | `tokenize` events | Confirms real usage; a good metric for "people are actually using it" |
| `prices.json` staleness | Any model going amber in job summary | Accept community PR or verify manually |
| GitHub | Stars, issues, PRs | Respond to all issues within 24 hours on launch week |

**Why these remain manual:** Cloudflare Analytics has no free API. AdSense RPM monitoring requires human judgment about acceptable revenue levels. Community engagement (HN, GitHub) requires authentic human interaction — automated responses would damage the community trust the launch is trying to build.

### Launch success threshold
A successful launch is not defined by a specific metric — it is defined by: the site is live, the HN post was submitted, the Product Hunt page is up, and at least one organic backlink exists within 7 days. Everything else is velocity, not viability.

### Tasks that are intentionally and permanently manual
The following tasks are manual by design. Future maintainers should not interpret these as automation gaps — they are human responsibilities that cannot be automated without defeating their purpose or violating platform rules.

| Task | Why irreducibly manual |
|------|----------------------|
| AdSense application | Requires human interaction with Google's review portal; Google does not offer an API for this. |
| HN / Product Hunt / social launch posts | Community platforms detect and penalize automated posting. Hacker News applies velocity scoring that flags programmatic submissions. Authentic first-person posts are the mechanism, not just a delivery channel. |
| HN comment responses | Requires genuine technical judgment and authentic human engagement. Automated responses would destroy the community trust the launch is building. |
| Launch retrospective | Qualitative reflection on what worked and what didn't. Value derives entirely from authentic human assessment. |
| Community pricing PR review | Requires a human to navigate to the provider's pricing page and confirm the submitted value is correct. The automation detects that a page has changed; the human confirms what the correct value is. These are different cognitive acts. |

---

## Phase 4 — Definition of Done

- [ ] All pre-launch checklist items pass
- [ ] HN Show HN post submitted; first comment posted within 2 minutes
- [ ] Product Hunt page live on launch day
- [ ] GitHub repository public with complete README
- [ ] No JavaScript console errors on index page post-launch
- [ ] Cloudflare Analytics showing traffic on launch day
- [ ] First Umami `tokenize` events recorded (confirms real usage)
- [ ] Responded to all HN comments within 2 hours of post
- [ ] Launch retrospective note written within 7 days: what worked, what didn't, what's next for v2
