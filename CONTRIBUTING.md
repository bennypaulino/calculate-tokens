# Contributing to Calculate Tokens

Thank you for helping keep calculatetokens.com accurate. The most impactful contribution is a pricing update: LLM providers change prices frequently, and up-to-date data is the product's core value.

---

## Submitting a Pricing Update PR

All pricing data lives in a single file: `public/api/v1/prices.json`. Only humans update `last_human_verified`; the CI automation only touches `last_checked`.

### Step-by-step

1. **Navigate to the provider's official pricing page.**
   Each model entry in `prices.json` has a `provider_pricing_url` field — use that URL. Do not rely on third-party aggregators.

2. **Verify the new prices.**
   Confirm input and output costs per 1 million tokens. For models with thinking tokens, also check whether thinking tokens are billed separately (OpenAI o-series) or bundled (DeepSeek R1).

3. **Edit `public/api/v1/prices.json`.**
   Update the relevant model entry:
   - `input_cost_per_1m` — new input cost in USD per 1 million tokens
   - `output_cost_per_1m` — new output cost in USD per 1 million tokens
   - `last_human_verified` — today's date in ISO 8601 format: `"YYYY-MM-DD"`

   Example diff:
   ```json
   {
     "id": "gpt-4o",
     "input_cost_per_1m": 2.50,
     "output_cost_per_1m": 10.00,
     "last_human_verified": "2026-06-06"
   }
   ```

4. **Do not change `last_checked`.**
   That field is updated automatically by the daily CI pipeline (`pricing-check.yml`). Manually editing it will be overwritten and may cause confusion.

5. **Open a PR.**
   Title format: `pricing: [Provider] [Model] — [what changed]`
   Example: `pricing: OpenAI gpt-4o — input cost reduced from $5 to $2.50 per 1M tokens`

   In the PR description, include:
   - The provider and model name
   - Old values vs. new values
   - The URL of the official pricing page you verified against
   - The date you verified the prices

---

## `prices.json` Schema Reference

Each entry in the `models` array supports the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique model identifier (e.g. `"gpt-4o"`) |
| `name` | string | yes | Human-readable display name |
| `provider` | string | yes | Provider slug: `"openai"`, `"anthropic"`, `"google"`, `"deepseek"`, `"meta"` |
| `tokenizer` | string | yes | Tokenizer key: `"cl100k_base"`, `"o200k_base"`, `"claude"`, `"gemini"`, `"llama"`, `"heuristic"` |
| `input_cost_per_1m` | number | yes | USD cost per 1 million input tokens |
| `output_cost_per_1m` | number | yes | USD cost per 1 million output tokens |
| `context_window` | number | yes | Maximum context window in tokens |
| `provider_pricing_url` | string | yes | URL of the provider's official pricing page |
| `last_human_verified` | string | yes | ISO 8601 date of last manual human verification (`"YYYY-MM-DD"`) |
| `last_checked` | string | yes | ISO 8601 date of last automated CI check — **do not edit manually** |
| `thinking_model` | boolean | no | `true` if the model supports extended thinking / reasoning tokens |
| `thinking_billed_separately` | boolean | conditional | Required when `thinking_model: true`. `true` = thinking tokens add to cost (OpenAI o-series); `false` = thinking is bundled in output token price (DeepSeek R1) |
| `requires_js_render` | boolean | no | `true` if the provider pricing page requires JavaScript to render (triggers Playwright in CI instead of `fetch`) |
| `active` | boolean | no | `false` hides the model from the calculator UI without removing it from the file |

### Schema constraints

- `thinking_billed_separately` must be `false` when `thinking_model` is `false` (enforced by JSON Schema `if/then`).
- `last_human_verified` and `last_checked` must be valid ISO 8601 date strings.
- `input_cost_per_1m` and `output_cost_per_1m` must be non-negative numbers.

---

## What `last_human_verified` means

`last_human_verified` signals that a real person navigated to `provider_pricing_url` and confirmed the prices in `prices.json` are correct. The UI shows an amber staleness warning when this date is more than 15 days in the past.

**Only update `last_human_verified` when you have personally verified the prices against the provider's official page.** Do not update it when:
- Making unrelated code changes
- The CI pipeline updates `last_checked` (automated)
- You are guessing or inferring prices from a third-party source

---

## PR Checklist for Pricing Updates

Before opening your PR, confirm:

- [ ] I navigated to the `provider_pricing_url` listed in `prices.json` for this model
- [ ] I confirmed the new `input_cost_per_1m` and `output_cost_per_1m` values from the official page
- [ ] I set `last_human_verified` to today's ISO date (`YYYY-MM-DD`)
- [ ] I did **not** edit `last_checked`
- [ ] If the model has `thinking_model: true`, I also verified `thinking_billed_separately` is correct
- [ ] The PR title follows the format: `pricing: [Provider] [Model] — [what changed]`
- [ ] The PR description includes the source URL and old vs. new values

---

## Code Contributions

### Dev environment setup

**Prerequisites:** Node.js 20+, npm 10+.

```bash
# Install dependencies
npm install

# Start the development server (analytics CSP mode)
NEXT_PUBLIC_CSP_MODE=analytics npm run dev
```

The app runs at `http://localhost:3000`.

**CSP modes:**

| Mode | Use case | Wasm tokenizers | AdSense |
|---|---|---|---|
| `analytics` | Local dev and CI | Enabled | Disabled |
| `adsense` | AdSense integration testing | Disabled | Enabled |

Always develop with `NEXT_PUBLIC_CSP_MODE=analytics`. The `adsense` mode permanently degrades Claude, Gemini, and Llama tokenizers to heuristic — only use it when specifically testing AdSense integration.

### Running checks locally

```bash
# Type check
npx tsc --noEmit

# Validate prices.json against schema (requires ajv and ajv-formats in node_modules)
node -e "
  const Ajv = require('ajv');
  const addFormats = require('ajv-formats');
  const schema = require('./public/api/v1/prices.schema.json');
  const data = require('./public/api/v1/prices.json');
  const ajv = new Ajv({ strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(data)) { console.error(validate.errors); process.exit(1); }
  console.log('Valid');
"

# Validate CSP configuration
node scripts/validate-csp.js

# Check for stale pricing data
node scripts/check-staleness.js

# Check audit exemption expiry
node scripts/check-exemption-expiry.js

# Check security.txt expiry
node scripts/check-security-txt.js

# Build
npm run build

# Post-build: compute prices hash and verify build integrity
node scripts/compute-prices-hash.js
node scripts/verify-build-integrity.js
```

### Architecture invariants

Before submitting a code PR, re-read the invariants in `CLAUDE.md`. The most critical:

- **Prompt text never leaves the browser.** No URL parameter, analytics event, or server call may encode or transmit textarea content.
- **Token highlighter uses `textContent`, never `innerHTML`.** The highlighter renders untrusted user content — always use `document.createElement` + `element.textContent`.
- **Wasm workers run off the main thread.** Never instantiate a tokenizer directly on the main thread.
- **`char_count` in Umami events must be quantized to the nearest 100** before transmission.
- **All GitHub Actions `uses:` references must be pinned to 40-character commit SHAs.** Dependabot manages monthly updates.

### Dependency security

```bash
npm audit --audit-level=high
```

If a high-severity finding is unavoidable, add an exemption to `audit-exemptions.json` with an expiry date. The CI `check-exemption-expiry.js` script will fail the build if any exemption is past its expiry date.
