# Phase 0 — Foundation + Content Infrastructure
**Weeks:** 1–3  
**Primary actor:** Search crawlers (Googlebot, Bingbot, AI crawlers)  
**Goal:** Deploy a live, indexed, structurally sound site with accurate pricing content before the interactive calculator exists. The SEO indexing clock starts on the day Phase 0 deploys.  
**Prerequisite for Phase 1:** All Phase 0 acceptance criteria must pass before Phase 1 work begins.

---

## 0.1 Repository & Project Scaffold

### Requirements
1. A public GitHub repository is created under the `calculatetokens` organization (or personal account) with an MIT `LICENSE` file in the root.
2. The repository contains a `CONTRIBUTING.md` that documents: how to submit a pricing update PR, the `prices.json` schema (reference Section 0.2), and the PR template for pricing updates.
3. The project is bootstrapped with Next.js (App Router), configured for **static export** (`output: 'export'` in `next.config.js`). The build must complete with zero errors and produce a `dist/` or `out/` directory of static files with no server-side rendering or API routes.
4. Tailwind CSS and shadcn/ui are installed and a base layout renders without errors.
5. Cloudflare Pages is connected to the GitHub repository. A push to `main` triggers an automatic Cloudflare Pages build and deploy. Successful deployment is verified by loading the live URL.
6. A Lighthouse CI GitHub Actions workflow is configured. It runs on every PR and fails the PR if LCP > 2.5s or CLS > 0.1 on the deployed preview URL.
7. A styled 404 page exists at `app/not-found.tsx` (Next.js App Router). The static export build produces a `404.html` file; Cloudflare Pages automatically serves it for unmatched routes. The page maintains the site's visual design and includes a link back to the calculator at `/`.
8. `scripts/validate-csp.js` exists and is wired into the CI `ci.yml` build step. It asserts: (a) `NEXT_PUBLIC_CSP_MODE` is set to `analytics` or `adsense`, and (b) the Cloudflare Pages `_headers` CSP directive for the current mode matches the corresponding reference constant defined in the script. The build fails non-zero if either assertion fails.

### Acceptance Criteria
- AC-0.1.1: `npm run build` completes with zero errors and zero TypeScript errors.
- AC-0.1.2: `npm run build` produces only static files (HTML, CSS, JS, JSON). No `.js` server files, no API route handlers.
- AC-0.1.3: A push to a PR branch creates a Cloudflare Pages preview deployment within 3 minutes.
- AC-0.1.4: Lighthouse CI reports LCP < 2.5s and CLS < 0.1 on the preview deployment for the index page.
- AC-0.1.5: The repository is publicly visible and the `LICENSE` file contains the MIT license text.
- AC-0.1.6: Requesting a non-existent path (e.g., `/this-page-does-not-exist`) serves the styled 404 page — not a Cloudflare default error page — and the page contains a link back to `/`.
- AC-0.1.7: `scripts/validate-csp.js` exits non-zero when `NEXT_PUBLIC_CSP_MODE` is unset or set to an unknown value (verified by running the script with an invalid env in CI).

### Definition of Done
- [ ] GitHub Actions `ci.yml` runs lint, type-check, Lighthouse CI, and CSP validation on every PR
- [ ] `scripts/validate-csp.js` exists and asserts: (a) `NEXT_PUBLIC_CSP_MODE` is set to a known value (`analytics` or `adsense`), and (b) the generated Cloudflare Pages `_headers` CSP directive matches the reference constant for that mode. Build fails if assertion fails.
- [ ] Cloudflare Pages auto-deploy confirmed on push to `main`
- [ ] `npm run build` passes clean in CI

---

## 0.2 `prices.json` Schema and Initial Data

### Schema
The file lives at `/public/api/v1/prices.json`. It is served as a static file at `calculatetokens.com/api/v1/prices.json` with no server involvement.

```json
{
  "$schema": "https://calculatetokens.com/api/v1/prices.schema.json",
  "version": "1.0.0",
  "generated_at": "2026-06-05T06:00:00Z",
  "models": [
    {
      "id": "gpt-4o",
      "display_name": "GPT-4o",
      "provider": "OpenAI",
      "provider_pricing_url": "https://openai.com/api/pricing",
      "tokenizer": "o200k_base",
      "context_window": 128000,
      "input_cost_per_1m": 2.50,
      "output_cost_per_1m": 10.00,
      "supports_context_caching": false,
      "context_caching_discount": null,
      "supports_batch_api": true,
      "batch_api_discount": 0.50,
      "thinking_model": false,
      "thinking_multiplier": null,
      "last_checked": "2026-06-05T06:00:00Z",
      "last_human_verified": "2026-06-05T00:00:00Z",
      "active": true
    }
  ]
}
```

**Field definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique model identifier (URL-safe, kebab-case) |
| `display_name` | string | yes | Human-readable model name shown in the UI |
| `provider` | string | yes | Provider name (e.g., "OpenAI", "Anthropic") |
| `provider_pricing_url` | string | yes | Direct URL to the provider's official pricing page. MUST match the approved domain allowlist (see below). |
| `tokenizer` | string | yes | One of: `cl100k_base`, `o200k_base`, `claude`, `gemini`, `llama`, `heuristic` |
| `context_window` | integer | yes | Maximum input + output tokens |
| `input_cost_per_1m` | number | yes | USD cost per 1,000,000 input tokens |
| `output_cost_per_1m` | number | yes | USD cost per 1,000,000 output tokens |
| `supports_context_caching` | boolean | yes | Whether provider offers input token caching |
| `context_caching_discount` | number\|null | yes | Fraction of input cost saved (e.g., `0.9` = 90% off). `null` if not supported. |
| `supports_batch_api` | boolean | yes | Whether provider offers async batch processing discount |
| `batch_api_discount` | number\|null | yes | Fraction of total cost saved (e.g., `0.5` = 50% off). `null` if not supported. |
| `thinking_model` | boolean | yes | Whether model performs extended reasoning (chain-of-thought output) |
| `thinking_multiplier` | number\|null | yes | Estimated output token multiplier for thinking. `null` if not a thinking model. |
| `thinking_billed_separately` | boolean | yes | `true` if thinking tokens are billed as additional output tokens (OpenAI o-series: thinking adds to the output cost). `false` if thinking tokens are included in the base output token price (DeepSeek R1: no separate billing line). Must be `false` when `thinking_model` is `false`. |
| `requires_js_render` | boolean | no (default: false) | `true` if `provider_pricing_url` is a JavaScript-rendered SPA whose pricing content is injected at runtime. `check-page-changes.js` uses a headless browser (Playwright) instead of `fetch` for these providers. Omit or set `false` for static HTML pricing pages. |
| `last_checked` | ISO 8601 string | yes | Timestamp of last automated GitHub Actions check |
| `last_human_verified` | ISO 8601 string | yes | Timestamp of last manual human verification against `provider_pricing_url` |
| `active` | boolean | yes | Set `false` to hide deprecated models without removing data |

### provider_pricing_url domain allowlist
The `provider_pricing_url` field MUST match one of the approved HTTPS prefixes for known AI providers. The allowlist is stored in `scripts/pricing-url-allowlist.json` and enforced by the AJV schema using a `pattern` constraint. Any URL not matching the allowlist causes the CI validation step to fail with a non-zero exit code.

Initial allowlist:
```json
["https://openai.com/", "https://anthropic.com/", "https://cloud.google.com/", "https://ai.google.dev/", "https://deepseek.com/", "https://llama.meta.com/", "https://mistral.ai/"]
```

`javascript:` URIs, relative paths, and non-HTTPS URLs are rejected by schema pattern even if the domain would otherwise match.

### JSON Schema validation
A `prices.schema.json` is published alongside `prices.json`. The GitHub Actions daily check validates `prices.json` against this schema and fails the workflow if the file is invalid. This prevents malformed data from being committed.

The schema MUST enforce:
- `provider_pricing_url`: HTTPS URL matching the allowlist pattern
- `input_cost_per_1m` and `output_cost_per_1m`: non-negative numbers
- `context_caching_discount`: number in [0, 1] or null
- `batch_api_discount`: number in [0, 1] or null
- `thinking_multiplier`: positive number or null
- `thinking_billed_separately`: must be `false` when `thinking_model` is `false`

The complete `prices.schema.json` MUST be committed at `public/api/v1/prices.schema.json`. The canonical content is:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://calculatetokens.com/api/v1/prices.schema.json",
  "title": "Calculate Tokens Pricing Data",
  "type": "object",
  "additionalProperties": false,
  "required": ["$schema", "version", "generated_at", "models"],
  "properties": {
    "$schema": { "type": "string" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "generated_at": { "type": "string", "format": "date-time" },
    "models": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id", "display_name", "provider", "provider_pricing_url",
          "tokenizer", "context_window",
          "input_cost_per_1m", "output_cost_per_1m",
          "supports_context_caching", "context_caching_discount",
          "supports_batch_api", "batch_api_discount",
          "thinking_model", "thinking_multiplier", "thinking_billed_separately",
          "last_checked", "last_human_verified", "active"
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-z0-9][a-z0-9-]*[a-z0-9]$",
            "description": "URL-safe kebab-case unique model identifier"
          },
          "display_name": { "type": "string", "minLength": 1 },
          "provider": { "type": "string", "minLength": 1 },
          "provider_pricing_url": {
            "type": "string",
            "pattern": "^https://(openai\\.com|anthropic\\.com|cloud\\.google\\.com|ai\\.google\\.dev|deepseek\\.com|llama\\.meta\\.com|mistral\\.ai)/"
          },
          "requires_js_render": {
            "type": "boolean",
            "description": "True if provider_pricing_url requires JS execution to render pricing content"
          },
          "tokenizer": {
            "type": "string",
            "enum": ["cl100k_base", "o200k_base", "claude", "gemini", "llama", "heuristic"]
          },
          "context_window": { "type": "integer", "minimum": 1 },
          "input_cost_per_1m": { "type": "number", "minimum": 0 },
          "output_cost_per_1m": { "type": "number", "minimum": 0 },
          "supports_context_caching": { "type": "boolean" },
          "context_caching_discount": {
            "oneOf": [
              { "type": "number", "minimum": 0, "maximum": 1 },
              { "type": "null" }
            ]
          },
          "supports_batch_api": { "type": "boolean" },
          "batch_api_discount": {
            "oneOf": [
              { "type": "number", "minimum": 0, "maximum": 1 },
              { "type": "null" }
            ]
          },
          "thinking_model": { "type": "boolean" },
          "thinking_multiplier": {
            "oneOf": [
              { "type": "number", "exclusiveMinimum": 0 },
              { "type": "null" }
            ]
          },
          "thinking_billed_separately": {
            "type": "boolean",
            "description": "true = thinking tokens are an additional billing line (OpenAI o-series). false = thinking tokens are bundled in output token pricing (DeepSeek R1)."
          },
          "last_checked": { "type": "string", "format": "date-time" },
          "last_human_verified": { "type": "string", "format": "date-time" },
          "active": { "type": "boolean" }
        },
        "if": {
          "properties": { "thinking_model": { "const": false } }
        },
        "then": {
          "properties": {
            "thinking_multiplier": { "const": null },
            "thinking_billed_separately": { "const": false }
          }
        }
      }
    }
  }
}
```

### Initial data
Phase 0 must include accurate, human-verified data for at minimum these 9 models. **Verify all model names, versions, and pricing against official provider pricing pages on the day Phase 0 data is populated** — these values are current as of spec authoring but providers update models and pricing regularly.

| Model | Provider | Notes |
|-------|----------|-------|
| GPT-4o | OpenAI | `thinking_model: false`, `thinking_billed_separately: false` |
| GPT-4.1 | OpenAI | `thinking_model: false`, `thinking_billed_separately: false` |
| o4-mini | OpenAI | `thinking_model: true`, `thinking_billed_separately: true`, `thinking_multiplier` from published OpenAI ratios |
| Claude Sonnet 4.6 | Anthropic | `thinking_model: false`, `thinking_billed_separately: false`, `requires_js_render: true` |
| Claude Haiku 4.5 | Anthropic | `thinking_model: false`, `thinking_billed_separately: false`, `requires_js_render: true` |
| Gemini 2.5 Pro | Google | `thinking_model: false`, `thinking_billed_separately: false` |
| DeepSeek V3 | DeepSeek | `thinking_model: false`, `thinking_billed_separately: false` |
| DeepSeek R1 | DeepSeek | `thinking_model: true`, `thinking_billed_separately: false` (thinking tokens are included in DeepSeek's output token pricing — no separate billing line), `thinking_multiplier: null` |
| Llama 4 Scout | Meta | `tokenizer: "heuristic"`, `thinking_model: false`, `thinking_billed_separately: false` |

### Acceptance Criteria
- AC-0.2.1: `prices.json` validates against `prices.schema.json` with zero errors.
- AC-0.2.2: All 9 initial models have `last_human_verified` dates within 7 days of Phase 0 deploy.
- AC-0.2.3: `calculatetokens.com/api/v1/prices.json` returns valid JSON with a 200 status and `Content-Type: application/json` header.
- AC-0.2.4: The JSON schema validation step in GitHub Actions CI fails when a model entry omits a required field.

---

## 0.3 GitHub Actions Daily Pricing Check

### Workflow: `.github/workflows/pricing-check.yml`

> **Supply chain security requirement:** All `uses:` references MUST be pinned to an immutable 40-character commit SHA. Mutable tag references (`@v4`, `@v5`, etc.) are prohibited. The human-readable version MAY be noted in a comment. SHA pins are reviewed and updated monthly.

> **Trigger constraint:** This workflow MUST only be triggered by `schedule` and `workflow_dispatch`. It MUST NOT include a `pull_request` trigger. Fork-triggered runs receive a restricted `GITHUB_TOKEN` that lacks `issues: write`, causing a silent 403 on issue creation.

```yaml
name: Daily Pricing Check
on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC daily
  workflow_dispatch:      # allow manual trigger
  # NOTE: No pull_request trigger — see trigger constraint above

jobs:
  validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # read-only: validation only, no writes
    outputs:
      price_changes: ${{ steps.detection.outputs.price_changes }}
      detected_sha: ${{ steps.detection.outputs.detected_sha }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - name: Dependency audit
        run: npm audit --audit-level=high
      - name: Validate prices.json schema
        run: npx ajv-cli@5.0.0 validate -s public/api/v1/prices.schema.json -d public/api/v1/prices.json
      - name: Check for models with stale last_human_verified
        run: node scripts/check-staleness.js
      - name: Detect provider pricing page changes
        id: detection
        run: |
          node scripts/check-page-changes.js
          # check-page-changes.js writes price_changes to $GITHUB_OUTPUT
          # Also export the SHA used for this detection run
          echo "detected_sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT
      - name: Check audit exemption expiry dates
        run: node scripts/check-exemption-expiry.js
      - name: Validate security.txt expiry
        run: node scripts/check-security-txt.js
      - name: Compute prices.json content hash
        run: |
          HASH=$(sha256sum public/api/v1/prices.json | awk '{print $1}')
          echo "PRICES_HASH=$HASH" >> $GITHUB_OUTPUT
        id: hash

  update-timestamps:
    runs-on: ubuntu-latest
    needs: [validate]  # only runs if validate job succeeds
    permissions:
      contents: write  # write permission scoped to this job only
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - name: Update last_checked timestamps
        run: node scripts/update-checked.js
      - name: Update pricing-snapshots hashes
        run: node scripts/check-page-changes.js --update-only
      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git diff --quiet || (
            git add public/api/v1/prices.json scripts/pricing-snapshots/ &&
            git commit -m "chore: update pricing last_checked timestamps and page snapshots [skip ci]" &&
            git push
          )

  notify-price-changes:
    runs-on: ubuntu-latest
    needs: [validate]
    # Explicit success check: skips if validate failed OR was skipped
    if: ${{ needs.validate.result == 'success' && needs.validate.outputs.price_changes != '' }}
    permissions:
      issues: write   # scoped to this job only
      contents: read  # needed for checkout
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
        with:
          ref: ${{ needs.validate.outputs.detected_sha }}  # exact SHA validate used

      - name: Check for existing open verification issue
        id: dedup_check
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Single label query — comma-separated labels in gh CLI are OR, not AND
          OPEN=$(gh issue list \
            --label "pricing-verification-pending" \
            --state open \
            --json number \
            --jq length)
          echo "open_count=${OPEN}" >> $GITHUB_OUTPUT

      - name: Generate issue body
        id: gen_body
        if: steps.dedup_check.outputs.open_count == '0'
        env:
          PRICE_CHANGES: ${{ needs.validate.outputs.price_changes }}
          # Passed as env var — never interpolated into shell string (prevents injection)
        run: node scripts/generate-issue-body.js > /tmp/issue_body.md

      - name: Open pricing verification issue
        if: steps.dedup_check.outputs.open_count == '0'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRICE_CHANGES: ${{ needs.validate.outputs.price_changes }}
        run: |
          gh issue create \
            --title "Pricing verification needed: ${PRICE_CHANGES}" \
            --label "pricing-verification-pending" \
            --body-file /tmp/issue_body.md
```

**Why three jobs?** `validate` runs with `contents: read`. `update-timestamps` runs with `contents: write` after validation passes. `notify-price-changes` runs with `issues: write` only when changes are detected — no single job holds more than the minimum required permissions.

### `scripts/check-staleness.js`
This script reads `prices.json`, computes the age of each `last_human_verified` field, and:
- Exits 0 if all models are verified within 30 days
- Logs a warning to stdout for models 15–30 days old
- Creates a GitHub Actions workflow summary listing all stale models with links to their `provider_pricing_url`
- Does NOT fail the workflow (verification is a human responsibility)

### `scripts/generate-issue-body.js` (new)
Reads `prices.json` and `process.env.PRICE_CHANGES` (comma-separated provider names from the `validate` job output). Writes the GitHub Issue body to stdout. Exits non-zero with a descriptive error if any provider in `PRICE_CHANGES` is not found in `prices.json`.

Issue body includes for each changed provider: display name, `provider_pricing_url`, current `input_cost_per_1m`, `output_cost_per_1m`, and `last_human_verified` date from `prices.json`. Ends with resolution instructions including the explicit `Closes #N` PR keyword reminder.

Provider names are read from `process.env.PRICE_CHANGES`, not `process.argv`, to prevent shell injection.

### `scripts/check-page-changes.js`
This script detects actual changes on provider pricing pages so the maintainer knows *which* models need re-verification rather than having to check all of them manually.

**Two extraction modes**, selected per-provider by the `requires_js_render` flag in `prices.json`:

- **Static mode** (`requires_js_render: false` or absent): Uses Node.js `fetch()` and regex extraction. Lightweight, no browser required. Regex: `\$\d+(?:\.\d+)?\s*(?:per|\/)\s*(?:1M|million)\s*tokens`.
- **JS-render mode** (`requires_js_render: true`, e.g., Anthropic): Launches a headless Chromium browser via Playwright, navigates to `provider_pricing_url`, waits for the pricing table to appear (selector: `table`, timeout 15s), then extracts text content from the table. Falls back to full page text if no `table` element is found within the timeout.

The `validate` job in `pricing-check.yml` MUST install Playwright before running this script:

```yaml
- name: Install Playwright Chromium
  run: npx playwright install --with-deps chromium
```

This step runs unconditionally (not gated on whether any provider has `requires_js_render: true`) so the installation is stable regardless of `prices.json` changes.

For each model in `prices.json` with `active: true`:
1. Selects extraction mode based on `requires_js_render`
2. Extracts pricing-relevant content using the appropriate method
3. Computes SHA-256 of the extracted content
4. Compares to the stored hash in `scripts/pricing-snapshots/{provider-id}.hash`
5. If the snapshot file is missing: exits non-zero with `[FAIL] Missing snapshot for provider {id}. Run check-page-changes.js --init locally and commit the snapshots/ directory.`
6. If a hash differs: appends the provider name + a direct link to `provider_pricing_url` to the GitHub Actions job summary (informational, does NOT fail the workflow — change detection is a trigger for human action, not a failing gate)
7. Handles HTTP errors and Playwright timeouts by logging a warning and skipping that provider without failing

After all checks, updated hashes are committed by the `update-timestamps` job alongside the `last_checked` update.

The `scripts/pricing-snapshots/` directory is committed to the repository. Each file is named `{provider-id}.hash` and contains the SHA-256 hex string of the last-known pricing content.

**First-run initialization (important):** The `validate` job runs with `contents: read` permissions and cannot write files. Therefore, `pricing-snapshots/` MUST NOT be generated inside the workflow on first run. The maintainer initializes snapshots manually during Phase 0 setup: run `node scripts/check-page-changes.js --init` locally (which creates all `{provider-id}.hash` files from a live fetch), then commit the resulting snapshot directory. If the workflow runs and a snapshot file is missing for an active model, the script exits non-zero: `[FAIL] Missing snapshot for provider {id}. Run check-page-changes.js --init locally and commit the snapshots/` directory.`

**Workflow failure monitoring:** GitHub sends email notifications to repository owners when a scheduled workflow fails. Ensure this notification is not disabled in repository Settings → Notifications → Actions. No additional configuration is required. Review workflow failure notifications daily during the first 2 weeks after Phase 0 deploy.

### `scripts/check-exemption-expiry.js`
Reads `audit-exemptions.json` and validates expiry dates:
- If any entry's `expiry` date is in the past: exits non-zero with `[FAIL] Expired audit exemption: {cve} expired on {date}. Remove or renew with owner approval.`
- If any entry expires within 7 days: logs a WARNING to the step summary (exits 0)
- If any entry expires within 30 days: logs a NOTICE to the step summary (exits 0)
- If all entries are current: exits 0 silently
- If `audit-exemptions.json` does not exist: exits 0 (treated as empty — no exemptions to validate)

**`audit-exemptions.json` initial state:** The repository root MUST contain `audit-exemptions.json` committed at Phase 0 completion. Initial content when no exemptions exist:

```json
[]
```

Each exemption entry schema (for future reference):
```json
{
  "cve": "CVE-YYYY-NNNNN",
  "rationale": "Why this finding does not apply to this project",
  "expiry": "YYYY-MM-DD",
  "owner": "github-username"
}
```

**AC-0.3.x:** `audit-exemptions.json` exists in the repository root with content `[]` at Phase 0 completion. The file is valid JSON (verified by `node -e "JSON.parse(require('fs').readFileSync('audit-exemptions.json','utf8'))"` in CI).

### `scripts/check-security-txt.js`
Reads `public/.well-known/security.txt`, extracts the `Expires:` field, and asserts:
1. The date is not in the past — exits non-zero with `[FAIL] security.txt expired on {date}.`
2. The date is not more than 12 months in the future — exits non-zero with `[FAIL] security.txt Expires ({date}) exceeds the 12-month maximum.`

### `scripts/update-checked.js`
Updates the `last_checked` field for all active models to the current UTC timestamp. This is committed automatically by the workflow.

### Acceptance Criteria
- AC-0.3.1: The workflow runs daily at 06:00 UTC (verified via GitHub Actions history after 48 hours).
- AC-0.3.2: The workflow fails if `prices.json` is invalid JSON.
- AC-0.3.3: The workflow fails if any required schema field is missing from any model entry.
- AC-0.3.4: The workflow succeeds (does not fail) even when models have stale `last_human_verified` dates — it logs a warning but does not block.
- AC-0.3.5: After the workflow runs, the committed `last_checked` timestamps are within 60 seconds of the workflow execution time.
- AC-0.3.6: The workflow fails if any entry in `audit-exemptions.json` has an expiry date in the past.
- AC-0.3.7: When `check-page-changes.js` detects a changed provider pricing page, the GitHub Actions job summary lists the affected provider and a direct link to their `provider_pricing_url`. The workflow does not fail on a detected change.
- AC-0.3.8: The workflow fails if `public/.well-known/security.txt` has an expired `Expires:` date or an expiry date more than 12 months in the future.
- AC-0.3.9: `.github/dependabot.yml` is present in the repository with `github-actions` ecosystem configured.
- AC-0.3.10: Dependabot opens a PR within 30 days when a pinned GitHub Actions dependency has a new release.

**`notify-price-changes` job acceptance criteria:**

- AC-0.3.11: Given `validate` completes successfully and `price_changes` is non-empty, a GitHub Issue is created with title `Pricing verification needed: <providers>`, label `pricing-verification-pending`, and body containing each changed provider's name, URL, current `prices.json` prices, and `last_human_verified` date.
- AC-0.3.12: Given an issue with label `pricing-verification-pending` is open, no new issue is created on subsequent detections. The existing issue number is logged to the step output.
- AC-0.3.13: Given all issues labeled `pricing-verification-pending` are closed, a new issue is created on the next detection per AC-0.3.11.
- AC-0.3.14: Given `gh issue create` fails (API error, permission error), the `validate` job result remains visible and unchanged, the `notify` job is marked failed with a descriptive error, and the workflow does not show green.
- AC-0.3.15: Given `generate-issue-body.js` exits non-zero (e.g., provider not found in `prices.json`), the `gen_body` step is marked failed, the issue creation step is skipped, and no partial issue body is submitted.
- AC-0.3.16: Given a provider name in `price_changes` contains single quotes, double quotes, backticks, or `$()` sequences, the issue is created with the provider name as literal text and no shell command substitution occurs.
- AC-0.3.17: The prices shown in the issue body are sourced from the same `prices.json` SHA used by the `validate` job (`detected_sha` output).
- AC-0.3.18: Given `validate` exits with non-success (failed or skipped), `notify-price-changes` is skipped and the skipped status is visible in the workflow run summary.
- AC-0.3.19: *(deferred)* The workflow has no `pull_request` trigger, ensuring fork runs never attempt issue creation with a restricted token.
- AC-0.3.20: *(deferred — v2)* Given an open `pricing-verification-pending` issue has been open 14+ days, a comment with updated `prices.json` values is added on the next detection instead of creating a new issue. V1 accepted gap: issue body may be stale if unactioned. Documented here as a known limitation.

### Dependabot Configuration
The repository MUST include `.github/dependabot.yml` to automate dependency updates:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
      day: monday
      time: "06:00"
      timezone: UTC
    commit-message:
      prefix: "ci"
      include: scope
    labels:
      - "dependencies"
      - "security"

  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

This replaces the manual monthly SHA pin review. When Dependabot opens a PR to update a GitHub Actions SHA pin, the maintainer MUST review the action's release notes and merge within 30 days. PRs that are not merged within 30 days are escalated to critical status.

- AC-0.3.9: `.github/dependabot.yml` is present in the repository with `github-actions` ecosystem configured.
- AC-0.3.10: Dependabot opens a PR within 30 days when a pinned GitHub Actions dependency has a new release.

---

## 0.4 Comparison Landing Pages

### Route pattern
`/compare/[model-a]-vs-[model-b]`  
Example: `/compare/gpt-4o-vs-claude-sonnet-4-6`

### Generation
Pages are generated at build time via `generateStaticParams` in Next.js. For N models in `prices.json` with `active: true`, generate all unique pairs: N×(N-1)÷2 pages. For the 9 initial models this is 36 pages.

### Page content (each comparison page must contain)
1. **H1:** "[Model A display_name] vs [Model B display_name] — Pricing & Token Cost Comparison"
2. **Side-by-side pricing table:**

| | [Model A] | [Model B] |
|--|-----------|-----------|
| Provider | ... | ... |
| Input cost (per 1M tokens) | $X.XX | $X.XX |
| Output cost (per 1M tokens) | $X.XX | $X.XX |
| Context caching | Yes (X% off) / No | ... |
| Batch API discount | X% / Not available | ... |
| Context window | Xk tokens | Xk tokens |
| Tokenizer | ... | ... |

3. **Cost calculator callout**: A prominent CTA linking to the main calculator: "Calculate your exact costs with Calculate Tokens →"
4. **Plain-English cost examples** (generated from pricing data):
   - "1,000 requests × 500 input tokens × 200 output tokens/month"
   - Monthly cost shown for each model
5. **Data provenance footer:** "Prices last verified [last_human_verified date] — [link to provider_pricing_url]. Source: [link to prices.json]"
6. **FAQ section** (minimum 3 questions):
   - "Which model is cheaper for [use case type]?"
   - "What is the difference between input and output token pricing?"
   - "Does [Model A] support context caching?"

### JSON-LD on each comparison page
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which is cheaper, [Model A] or [Model B]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For input tokens, [Model A] costs $X.XX per 1M tokens vs [Model B] at $X.XX per 1M tokens..."
      }
    }
  ]
}
```

### Acceptance Criteria
- AC-0.4.1: All comparison page pairs for the 9 initial models are generated and accessible (HTTP 200) after build (36 pages).
- AC-0.4.2: Each page contains the H1 pattern, the pricing table, and the FAQ section.
- AC-0.4.3: The JSON-LD on each comparison page is valid (validated via Google's Rich Results Test or equivalent).
- AC-0.4.4: Each page scores LCP < 2.5s on Lighthouse CI.
- AC-0.4.5: The data provenance footer on each page shows the correct `last_human_verified` date for both models.

**Given:** A build is run with 9 models in `prices.json`  
**When:** The static site is generated  
**Then:** 36 comparison pages exist at `/compare/[a]-vs-[b]` paths, each with unique, accurate pricing data

---

## 0.5 `/learn/what-is-a-token` Evergreen Hub

### Purpose
A high-information, search-optimized page answering the core informational queries that precede token calculator usage. This is Marcus's primary content discovery path and an AEO signal to AI answer engines.

### Required sections (H2 headings)
1. "What is a token in AI?"
2. "How are tokens counted? (with examples)"
3. "Why do tokens cost money?"
4. "How many tokens is my text?"
5. "Token limits by model" (table pulled from `prices.json` at build time)
6. "Token cost calculator" (CTA to the main tool)

### Token counting examples (required)
The page must include at least 5 concrete examples showing the same English text alongside its approximate token count:
- "Hello, world!" → ~4 tokens
- A 100-word paragraph → ~75 tokens  
- A Python function (20 lines) → ~120 tokens
- A JSON object (10 fields) → ~50 tokens
- A 1,000-word article → ~750 tokens

### JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What is a Token in AI? A Complete Guide",
  "description": "Tokens are the units AI models use to process text...",
  "dateModified": "[build date]"
}
```

### Acceptance Criteria
- AC-0.5.1: The page exists at `/learn/what-is-a-token` and returns HTTP 200.
- AC-0.5.2: All 6 required H2 sections are present.
- AC-0.5.3: The "Token limits by model" table reflects current `prices.json` data at build time.
- AC-0.5.4: The JSON-LD is valid.
- AC-0.5.5: Readability score is appropriate for a non-technical audience (Flesch-Kincaid grade level ≤ 10).

---

## 0.6 Technical SEO Infrastructure

### Sitemap
Auto-generated at `/sitemap.xml` at build time. Must include:
- `/` (index/calculator page)
- `/learn/what-is-a-token`
- All `/compare/[a]-vs-[b]` pages
- All `/models/[model-id]` pages (individual model pages — see below)

### `robots.txt`
```
User-agent: *
Allow: /
Allow: /api/v1/prices.json
Sitemap: https://calculatetokens.com/sitemap.xml
```

### Individual model pages
Route: `/models/[model-id]`  
Generated at build time via `generateStaticParams` for all active models in `prices.json`.

**Required page content:**
1. **H1:** "[display_name] Pricing — Token Costs & API Calculator"
2. **Pricing table:** Input cost per 1M tokens, output cost per 1M tokens, context caching (discount rate or "Not supported"), batch API discount (rate or "Not available"), context window, tokenizer used
3. **Plain-English cost example:** "1,000 requests × 500 input tokens × 200 output tokens costs $X.XX/month at [provider]'s published rates"
4. **Data provenance footer:** "Pricing last verified [last_human_verified date] — [link to provider_pricing_url]. Source: [link to prices.json]"
5. **CTA:** "Calculate your exact costs with [model] — try the calculator →" (links to `/?models=[id]`)
6. **Back-links:** Links to all comparison pages that include this model

**JSON-LD on each model page:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[display_name]",
  "applicationCategory": "AI Language Model",
  "offers": {
    "@type": "Offer",
    "price": "[input_cost_per_1m]",
    "priceCurrency": "USD",
    "description": "Per 1M input tokens"
  }
}
```

**Acceptance Criteria:**
- AC-0.6.7: All model pages are generated (`/models/[id]` for each active model) and return HTTP 200.
- AC-0.6.8: Each model page H1 follows the "[display_name] Pricing — Token Costs & API Calculator" pattern.
- AC-0.6.9: The pricing table on each model page reflects current `prices.json` values for that model.
- AC-0.6.10: Each model page has valid JSON-LD (validated by the same tooling as comparison pages).
- AC-0.6.11: Each model page is included in `/sitemap.xml`.

### OG meta tags (required on every page)
```html
<meta property="og:title" content="[Page-specific title]" />
<meta property="og:description" content="[Page-specific description, ≤ 160 chars]" />
<meta property="og:url" content="https://calculatetokens.com/[path]" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://calculatetokens.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

**OG image:** Create `public/og-image.png` at 1200×630px. The image must show the product name ("Calculate Tokens") and a representative view of the cost grid. A static designed image is sufficient for v1 — dynamic per-page OG images are v2. The same image is used on all pages.

### Canonical tags
Every page must have `<link rel="canonical" href="https://calculatetokens.com/[path]" />`.

### Acceptance Criteria
- AC-0.6.1: `/sitemap.xml` is valid XML and contains URLs for all generated pages.
- AC-0.6.2: `/robots.txt` explicitly allows `/api/v1/prices.json`.
- AC-0.6.3: Every page has a unique `og:title` and `og:description`.
- AC-0.6.4: No page has a duplicate canonical URL with another page.
- AC-0.6.5: Google Search Console reports zero critical errors when the sitemap is submitted.
- AC-0.6.6: `https://calculatetokens.com/og-image.png` returns HTTP 200 with `Content-Type: image/png`. The `og:image` meta tag is present on **every generated page** — verified by a Playwright test that iterates over all URLs in `/sitemap.xml` and asserts `meta[property='og:image']` is present and resolves to a non-404 URL on each.

---

## 0.7 Analytics Setup

> **v1 EU analytics scope exclusion:** GDPR requires a Data Processing Agreement (DPA) with each analytics data processor handling EU data subjects. Railway free tier does not offer a DPA. Therefore, Umami custom event tracking is **out of scope for EU users in v1**. Configure Umami's geo-blocking to exclude EU country codes from event collection. Cloudflare Web Analytics (page-level metrics) is unaffected — Cloudflare maintains its own GDPR compliance and does not store PII. The `/privacy` page must explicitly state this exclusion. This is a documented v1 limitation to be revisited when the project has revenue to support a paid hosting tier with a DPA.

### Cloudflare Web Analytics
Enable in Cloudflare Pages dashboard. No code changes required — Cloudflare injects the beacon script automatically. Verify data is flowing in Cloudflare dashboard within 24 hours of Phase 0 deploy.

### Umami (custom events)
Deploy Umami to Railway free tier. Add the Umami tracking script to the Next.js `<head>`. The script must be loaded with `strategy="afterInteractive"` to avoid blocking LCP.

**Given:** A user visits any page  
**When:** The page loads  
**Then:** A pageview is recorded in both Cloudflare Web Analytics and Umami within 5 seconds

### Privacy policy page
Route: `/privacy`

The privacy policy MUST include all of the following sections. Omitting any section is a failing acceptance criterion.

| Required section | Content |
|-----------------|---------|
| What is collected | Pageviews, Core Web Vitals, and the specific custom interaction events listed in PRD §13 (enumerate each event type and its properties by name) |
| What is NOT collected | Prompt text, personal identifiers, IP addresses (Cloudflare Web Analytics hashes IPs before storage) |
| Third-party scripts | AdSense (pending approval — note status), Umami (self-hosted on Railway), Cloudflare Web Analytics — each with a link to that service's own privacy policy |
| Data residency | The geographic location of each data processor (Railway: US; Cloudflare: distributed edge). State explicitly: Umami custom event tracking is disabled for EU users in v1 (no DPA in place with Railway free tier). Cloudflare Web Analytics is active for EU users (Cloudflare's own GDPR compliance applies). |
| Data retention | Umami event data: 90 days maximum. Cloudflare Web Analytics: per Cloudflare's stated policy (link required) |
| User rights (GDPR) | Right to access, right to erasure, right to restriction. Note that since no personally identifiable data is stored by the application, erasure requests are satisfied by confirmation that no PII is held |
| Opt-out mechanisms | Specific instructions for each service: Umami (browser Do Not Track header is respected if configured); Cloudflare Web Analytics (no opt-out mechanism — disclose this); AdSense (Google's ad personalization opt-out link) |
| Breach notification | In the event of a data breach affecting personal data, affected users will be notified within 72 hours of discovery, consistent with GDPR Article 33 |
| Contact | A contact method for privacy inquiries |

### Acceptance Criteria
- AC-0.7.1: Cloudflare Web Analytics shows pageview data within 24 hours of deploy.
- AC-0.7.2: Umami tracking script loads without errors in browser console.
- AC-0.7.3: `/privacy` page exists, returns HTTP 200, and contains all 9 required sections listed in the table above.
- AC-0.7.4: No cookie consent banner is shown (verified: neither Cloudflare Web Analytics nor Umami set cookies by default).
- AC-0.7.5: `/privacy` page mentions data retention period (90 days for Umami events) explicitly.
- AC-0.7.6: `/privacy` page includes a user rights section covering right to erasure and explains how erasure requests are handled.

---

## 0.8 `/.well-known/security.txt`

### Purpose
RFC 9116 specifies `security.txt` as the standard mechanism for security researchers to report vulnerabilities. It is required by the Phase 4 pre-launch checklist and validated daily by the `check-security-txt.js` workflow step added in §0.3. It must exist before Phase 0 deploys to prevent the daily workflow from failing immediately.

### File location
`public/.well-known/security.txt` — served as a static file at `https://calculatetokens.com/.well-known/security.txt`.

### Required content (RFC 9116 format)
```
Contact: mailto:[security-contact-email]
Expires: [date no more than 12 months from creation, ISO 8601 format]
Preferred-Languages: en
Canonical: https://calculatetokens.com/.well-known/security.txt
Policy: https://calculatetokens.com/security-policy
```

The `Policy` URL (`/security-policy`) must resolve to a page or section stating: reporters may email the contact address; the team commits to acknowledging reports within 7 days and resolving valid findings within 90 days. This can be a short section on the `/privacy` page (add an anchor `#security`) rather than a separate route.

**`Expires` constraint:** The `check-security-txt.js` workflow fails if `Expires` is in the past OR more than 12 months in the future. Set it to exactly 12 months from the Phase 0 deploy date and update it annually.

### Acceptance Criteria
- AC-0.8.1: `https://calculatetokens.com/.well-known/security.txt` returns HTTP 200.
- AC-0.8.2: The file contains a valid `Contact:` field (mailto URI) and an `Expires:` field in ISO 8601 format.
- AC-0.8.3: The `Expires:` date is not in the past and is no more than 12 months in the future (verified by `check-security-txt.js` running in the daily workflow).
- AC-0.8.4: A security policy (disclosure SLA of 7-day acknowledgement, 90-day resolution) is accessible at the URL in the `Policy:` field.

---

## 0.9 `scripts/compute-prices-hash.js` — Service Worker Integrity Header

### Purpose
The Phase 1 Service Worker verifies `prices.json` authenticity using a `X-Content-Hash` response header. This build script computes that hash at build time and injects it into Cloudflare Pages' `_headers` file so it is served with every CDN response.

### Script behavior
1. Reads `public/api/v1/prices.json`
2. Computes SHA-256 of the file content (hex string)
3. Appends to `public/_headers`:
```
/api/v1/prices.json
  X-Content-Hash: <sha256-hex>
  Cache-Control: public, max-age=86400, stale-while-revalidate=86400
```
4. Exits non-zero with a descriptive error if `public/api/v1/prices.json` is not found

### CI integration
The `ci.yml` workflow MUST run this script as a post-build step: after `npm run build` and before Cloudflare Pages deployment. The script modifies `public/_headers` in-place; the modified file is included in the deployment artifact. In the daily pricing check workflow (`pricing-check.yml`), the `update-timestamps` job MUST also run this script after committing any timestamp changes, so the deployed hash stays in sync with the committed `prices.json`.

### Acceptance Criteria
- AC-0.9.1: After `npm run build && node scripts/compute-prices-hash.js`, `public/_headers` contains an `X-Content-Hash` header entry under the `/api/v1/prices.json` path.
- AC-0.9.2: The hash value equals `sha256sum public/api/v1/prices.json | awk '{print $1}'`.
- AC-0.9.3: When `prices.json` changes between builds, the `X-Content-Hash` value in `_headers` changes correspondingly.
- AC-0.9.4: The script is wired into the CI `ci.yml` build step; it runs on every PR and main branch push.
- AC-0.9.5: If `public/api/v1/prices.json` does not exist, the script exits non-zero and the CI step fails.

---

## 0.10 `scripts/verify-build-integrity.js` — Build Output Verification

### Purpose
Confirms that every generated comparison page reflects its source `prices.json` values, preventing stale or mis-rendered pricing from reaching production. Referenced as a pre-launch gate in Phase 4.

### Script behavior
For each unique pair of active models (the same N×(N-1)÷2 pairs generated at build time):
1. Reads the corresponding page from the static build output directory (`out/compare/[a]-vs-[b]/index.html`)
2. Parses the HTML and extracts the pricing cells for both models
3. Compares extracted values against `prices.json` source values for `input_cost_per_1m` and `output_cost_per_1m`
4. If any value doesn't match (or the page file doesn't exist): exits non-zero, listing all failures

Exits 0 only when all comparison pages are present and all pricing cells match their `prices.json` source.

### CI integration
Run as a post-build check in `ci.yml` after `npm run build` and before deployment. Also run manually before Phase 4 launch as the pre-launch gate item.

### Acceptance Criteria
- AC-0.10.1: The script exits 0 when all comparison pages in `out/` contain pricing values matching `prices.json`.
- AC-0.10.2: The script exits non-zero and names the failing page(s) when any comparison page contains a pricing value that doesn't match `prices.json`.
- AC-0.10.3: The script exits non-zero when any expected comparison page file is missing from the build output.
- AC-0.10.4: The script is wired into CI and runs on every PR and main branch push (after `npm run build`).

---

## Phase 0 — Definition of Done

- [ ] GitHub repository is public with MIT license and `CONTRIBUTING.md`
- [ ] `npm run build` passes clean with zero TypeScript errors
- [ ] `scripts/validate-csp.js` passes in CI; build fails if `NEXT_PUBLIC_CSP_MODE` is unset or invalid
- [ ] Cloudflare Pages auto-deploy confirmed on push to `main`
- [ ] `prices.json` validates against `prices.schema.json` (AJV), contains 9 human-verified models (versions confirmed against provider pages on deploy day); `prices.schema.json` committed at `public/api/v1/prices.schema.json`
- [ ] `audit-exemptions.json` exists in repository root with content `[]`
- [ ] `pricing-snapshots/` directory committed with hash files for all 9 initial providers (run `node scripts/check-page-changes.js --init` locally and commit)
- [ ] GitHub Actions daily pricing workflow runs successfully
- [ ] `scripts/compute-prices-hash.js` wired into CI; `_headers` contains `X-Content-Hash` after build
- [ ] `scripts/verify-build-integrity.js` wired into CI post-build; exits 0 against current build output
- [ ] 36 comparison pages generated and accessible (9 models × 8 / 2 pairs)
- [ ] `/models/[model-id]` pages generated for all 9 active models; each has H1, pricing table, JSON-LD, and CTA
- [ ] `/learn/what-is-a-token` page live with all 6 sections
- [ ] `/sitemap.xml`, `/robots.txt`, OG meta (including `og:image`), canonical tags in place; `og:image` verified on all sitemap URLs
- [ ] `public/og-image.png` (1200×630px) exists and is served correctly
- [ ] Styled 404 page renders for unmatched routes (not a Cloudflare default error page)
- [ ] `/.well-known/security.txt` live, valid RFC 9116, `Expires` set to 12 months from actual deploy date
- [ ] All pages score LCP < 2.5s in Lighthouse CI
- [ ] Cloudflare Web Analytics recording pageviews
- [ ] Umami deployed; tracking script loading cleanly; EU geo-blocking configured
- [ ] `/privacy` page live with EU analytics exclusion explicitly stated
- [ ] Google Search Console sitemap submitted (no critical errors)
