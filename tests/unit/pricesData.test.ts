import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import schema from '@/public/api/v1/prices.schema.json'
import prices from '@/public/api/v1/prices.json'

/**
 * prices.json was only ever validated against its schema by a CI step, never by
 * `npm test`. That let a half-applied migration through: the schema change was
 * committed while the data change was reverted, and the local build, unit tests
 * and build-integrity check all passed because none of them compare the two.
 *
 * Validating here means the mismatch fails in the same command a developer runs
 * before pushing.
 */
describe('prices.json conforms to prices.schema.json', () => {
  it('validates, reporting every error rather than just the first', () => {
    const ajv = new Ajv({ strict: false, allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(schema)

    const valid = validate(prices)
    expect(
      valid,
      `prices.json failed schema validation:\n${JSON.stringify(validate.errors, null, 2)}`
    ).toBe(true)
  })

  it('keeps last_checked document-level, never per-model', () => {
    // The pricing bot rewrites this field daily. Per-model it produced 20 lines
    // of churn that conflicted with any open PR touching the file.
    expect(prices).toHaveProperty('last_checked')

    const strays = prices.models
      .filter((m: Record<string, unknown>) => 'last_checked' in m)
      .map((m: Record<string, unknown>) => m.id)
    expect(strays, `models must not carry last_checked: ${strays.join(', ')}`).toEqual([])
  })

  it('gives every active model a unique id', () => {
    const ids = prices.models.map((m: { id: string }) => m.id)
    expect(new Set(ids).size, 'duplicate model ids').toBe(ids.length)
  })

  it('uses exactly one pricing URL per provider', () => {
    // check-page-changes.js derives the snapshot filename from the provider NAME
    // alone, so two URLs for one provider make them overwrite each other's hash
    // and report a change on every run.
    const byProvider = new Map<string, Set<string>>()
    for (const m of prices.models.filter(
      (m: { active?: boolean }) => m.active !== false
    ) as { provider: string; provider_pricing_url: string }[]) {
      if (!byProvider.has(m.provider)) byProvider.set(m.provider, new Set())
      byProvider.get(m.provider)!.add(m.provider_pricing_url)
    }
    for (const [provider, urls] of byProvider) {
      expect(
        urls.size,
        `${provider} has ${urls.size} pricing URLs; they would collide on ${provider.toLowerCase()}.hash`
      ).toBe(1)
    }
  })
})
