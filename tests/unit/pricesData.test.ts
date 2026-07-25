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

describe('verification waivers are dated commitments, not off switches', () => {
  type Model = {
    id: string
    active?: boolean
    last_human_verified?: string
    verification_waiver_until?: string
    verification_waiver_reason?: string
  }
  const waived = (prices.models as Model[]).filter((m) => m.verification_waiver_until)

  it('always pairs a waiver with a reason', () => {
    for (const m of waived) {
      expect(
        m.verification_waiver_reason,
        `${m.id} is waived without a reason; the schema requires one`
      ).toBeTruthy()
      expect((m.verification_waiver_reason ?? '').length).toBeGreaterThanOrEqual(10)
    }
  })

  it('caps every waiver at 90 days out, so none becomes permanent', () => {
    const CAP_DAYS = 90
    const now = Date.now()
    for (const m of waived) {
      const daysOut = Math.floor(
        (new Date(m.verification_waiver_until!).getTime() - now) / 86_400_000
      )
      expect(
        daysOut,
        `${m.id} waiver runs ${daysOut} days out, beyond the ${CAP_DAYS}-day cap`
      ).toBeLessThanOrEqual(CAP_DAYS)
    }
  })

  it('never waives a model that could simply be re-verified', () => {
    // A waiver means "the vendor no longer publishes this price", so it should
    // coexist with a pricing_note explaining the situation to users. Without
    // that, the waiver is just hiding a stale number.
    for (const m of waived as (Model & { pricing_note?: string })[]) {
      expect(
        m.pricing_note,
        `${m.id} is waived but carries no pricing_note; users see no warning`
      ).toBeTruthy()
    }
  })

  it('never records a verification date in the future', () => {
    const now = Date.now()
    for (const m of prices.models as Model[]) {
      if (!m.last_human_verified) continue
      expect(
        new Date(m.last_human_verified).getTime(),
        `${m.id} claims verification in the future, which would age backwards forever`
      ).toBeLessThanOrEqual(now)
    }
  })
})
