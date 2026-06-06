---
name: Pricing Update
about: Report a pricing change from a provider
title: '[PRICING] Provider name — what changed'
labels: pricing-verification-pending
---

## What changed

**Provider:** [OpenAI / Anthropic / Google / DeepSeek / Meta]

**Model:** [model name]

**Current prices.json values:**
- Input: $X.XX per 1M tokens
- Output: $X.XX per 1M tokens

**New prices (from official pricing page):**
- Input: $X.XX per 1M tokens
- Output: $X.XX per 1M tokens

**Source URL:** [link to official pricing page]

**Date verified:** [YYYY-MM-DD]

---

## Checklist

- [ ] I navigated to the official provider pricing URL listed in `prices.json`
- [ ] I confirmed the new prices from the official page (not a third-party aggregator)
- [ ] If submitting a PR: I set `last_human_verified` to today's ISO date
- [ ] If submitting a PR: I did **not** edit `last_checked`
- [ ] If the model has thinking tokens: I verified whether `thinking_billed_separately` is correct
