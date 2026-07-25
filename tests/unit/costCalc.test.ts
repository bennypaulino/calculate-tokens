import { describe, it, expect } from 'vitest'
import { computeCostRow, computeEffectiveOutputTokens, resolveRates } from '@/lib/costCalc'
import type { ModelEntry } from '@/types/prices'

function makeModel(overrides: Partial<ModelEntry> = {}): ModelEntry {
  return {
    id: 'gpt-4o',
    display_name: 'GPT-4o',
    provider: 'openai',
    tokenizer: 'o200k_base',
    input_cost_per_1m: 2.50,
    output_cost_per_1m: 10.00,
    context_window: 128000,
    thinking_model: false,
    thinking_billed_separately: false,
    thinking_multiplier: null,
    active: true,
    last_human_verified: '2025-01-01',
    last_checked: '2025-01-01',
    provider_pricing_url: 'https://openai.com/pricing',
    supports_context_caching: false,
    context_caching_discount: null,
    supports_batch_api: false,
    batch_api_discount: null,
    ...overrides,
  }
}

describe('computeCostRow — AC-1.3.1', () => {
  it('calculates input, output, and total costs correctly for gpt-4o', () => {
    const model = makeModel()
    const row = computeCostRow(model, 1000, 500, false)

    // inputCost = 1000 / 1_000_000 * 2.50 = 0.0025
    expect(row.inputCost).toBeCloseTo(0.0025, 6)
    // outputCost = 500 / 1_000_000 * 10.00 = 0.005
    expect(row.outputCost).toBeCloseTo(0.005, 6)
    // totalCost = 0.0025 + 0.005 = 0.0075
    expect(row.totalCost).toBeCloseTo(0.0075, 6)
  })

  it('includes modelId, modelName, and provider in the row', () => {
    const model = makeModel()
    const row = computeCostRow(model, 1000, 500, false)

    expect(row.modelId).toBe('gpt-4o')
    expect(row.modelName).toBe('GPT-4o')
    expect(row.provider).toBe('openai')
  })

  it('reflects input and context window in the row', () => {
    const model = makeModel()
    const row = computeCostRow(model, 1000, 500, false)

    expect(row.inputTokens).toBe(1000)
    expect(row.contextWindow).toBe(128000)
  })
})

describe('computeCostRow — AC-1.4.6 thinking disabled', () => {
  it('outputTokens in row equals passed outputTokens when thinking disabled', () => {
    const model = makeModel({ thinking_model: true, thinking_billed_separately: true, thinking_multiplier: 3 })
    const row = computeCostRow(model, 1000, 500, false)

    // thinking is off, so effectiveOutput should equal the raw 500
    expect(row.outputTokens).toBe(500)
  })

  it('non-thinking model: outputTokens unchanged regardless of flag', () => {
    const model = makeModel({ thinking_model: false })
    const row = computeCostRow(model, 1000, 500, true)

    expect(row.outputTokens).toBe(500)
  })
})

describe('computeEffectiveOutputTokens — thinking enabled with billed_separately', () => {
  it('multiplies outputTokens by thinking_multiplier when billed separately and enabled', () => {
    const model = makeModel({
      thinking_model: true,
      thinking_billed_separately: true,
      thinking_multiplier: 3,
    })

    // When thinking is billed separately the implementation returns:
    // Math.round(outputTokens * thinking_multiplier) = Math.round(500 * 3) = 1500
    const effective = computeEffectiveOutputTokens(500, model, true)
    expect(effective).toBe(1500)
  })

  it('computeCostRow reflects the multiplied effective output in costs', () => {
    const model = makeModel({
      thinking_model: true,
      thinking_billed_separately: true,
      thinking_multiplier: 3,
    })
    const row = computeCostRow(model, 1000, 500, true)

    // effectiveOutput = 1500
    expect(row.outputTokens).toBe(1500)
    // outputCost = 1500 / 1_000_000 * 10.00 = 0.015
    expect(row.outputCost).toBeCloseTo(0.015, 6)
  })

  it('returns outputTokens unchanged when thinking_billed_separately is false', () => {
    const model = makeModel({
      thinking_model: true,
      thinking_billed_separately: false,
      thinking_multiplier: null,
    })
    const effective = computeEffectiveOutputTokens(500, model, true)
    expect(effective).toBe(500)
  })
})

describe('resolveRates — long-context tier selection', () => {
  const tiered = () =>
    makeModel({
      id: 'gpt-5-6-sol',
      input_cost_per_1m: 5.0,
      output_cost_per_1m: 30.0,
      context_window: 1_050_000,
      long_context: {
        threshold_input_tokens: 272_000,
        input_cost_per_1m: 10.0,
        output_cost_per_1m: 45.0,
      },
    })

  it('uses standard rates below the threshold', () => {
    const r = resolveRates(tiered(), 271_999)
    expect(r.inputCostPer1m).toBe(5.0)
    expect(r.outputCostPer1m).toBe(30.0)
    expect(r.longContextApplied).toBe(false)
  })

  it('uses standard rates exactly AT the threshold (strictly greater-than)', () => {
    const r = resolveRates(tiered(), 272_000)
    expect(r.inputCostPer1m).toBe(5.0)
    expect(r.longContextApplied).toBe(false)
  })

  it('switches to long-context rates one token above the threshold', () => {
    const r = resolveRates(tiered(), 272_001)
    expect(r.inputCostPer1m).toBe(10.0)
    expect(r.outputCostPer1m).toBe(45.0)
    expect(r.longContextApplied).toBe(true)
  })

  it('leaves flat-rate models untouched at any prompt size', () => {
    const r = resolveRates(makeModel(), 10_000_000)
    expect(r.inputCostPer1m).toBe(2.5)
    expect(r.outputCostPer1m).toBe(10.0)
    expect(r.longContextApplied).toBe(false)
  })

  it('honours each provider its own threshold rather than a shared constant', () => {
    // Gemini switches at 200K, OpenAI at 272K. A prompt between the two must
    // be long-context for Gemini and standard for OpenAI.
    const gemini = makeModel({
      input_cost_per_1m: 1.25,
      output_cost_per_1m: 10.0,
      long_context: {
        threshold_input_tokens: 200_000,
        input_cost_per_1m: 2.5,
        output_cost_per_1m: 15.0,
      },
    })
    expect(resolveRates(gemini, 250_000).longContextApplied).toBe(true)
    expect(resolveRates(tiered(), 250_000).longContextApplied).toBe(false)
  })
})

describe('computeCostRow — long-context pricing', () => {
  const gemini = () =>
    makeModel({
      id: 'gemini-2-5-pro',
      input_cost_per_1m: 1.25,
      output_cost_per_1m: 10.0,
      context_window: 1_000_000,
      long_context: {
        threshold_input_tokens: 200_000,
        input_cost_per_1m: 2.5,
        output_cost_per_1m: 15.0,
      },
    })

  it('bills a below-threshold prompt entirely at standard rates', () => {
    const row = computeCostRow(gemini(), 100_000, 1_000, false)
    expect(row.inputCost).toBeCloseTo(0.125, 6) // 100k @ $1.25
    expect(row.outputCost).toBeCloseTo(0.01, 6) // 1k @ $10.00
    expect(row.longContextApplied).toBe(false)
  })

  it('re-prices the WHOLE request once the prompt crosses the threshold', () => {
    // Step function, not marginal: all 300k input bills at $2.50 (not 200k at
    // $1.25 + 100k at $2.50), and output moves to $15.00 even though the
    // threshold is defined on input alone.
    const row = computeCostRow(gemini(), 300_000, 1_000, false)
    expect(row.inputCost).toBeCloseTo(0.75, 6) // 300k @ $2.50, NOT 0.5
    expect(row.outputCost).toBeCloseTo(0.015, 6) // 1k @ $15.00, NOT 0.01
    expect(row.totalCost).toBeCloseTo(0.765, 6)
    expect(row.longContextApplied).toBe(true)
  })

  it('is never cheaper to send a longer prompt across the boundary', () => {
    const justUnder = computeCostRow(gemini(), 200_000, 1_000, false)
    const justOver = computeCostRow(gemini(), 200_001, 1_000, false)
    expect(justOver.totalCost).toBeGreaterThan(justUnder.totalCost)
  })

  it('applies the long-context output rate to thinking-inflated output tokens', () => {
    const m = makeModel({
      input_cost_per_1m: 1.25,
      output_cost_per_1m: 10.0,
      thinking_model: true,
      thinking_billed_separately: true,
      thinking_multiplier: 3,
      long_context: {
        threshold_input_tokens: 200_000,
        input_cost_per_1m: 2.5,
        output_cost_per_1m: 15.0,
      },
    })
    const row = computeCostRow(m, 300_000, 1_000, true)
    expect(row.outputTokens).toBe(3_000)
    expect(row.outputCost).toBeCloseTo(0.045, 6) // 3k @ $15.00
  })
})

describe('prices.json long-context data integrity', () => {
  it('keeps every declared threshold reachable inside the context window', async () => {
    const { models } = await import('@/public/api/v1/prices.json')
    const tiered = (models as ModelEntry[]).filter((m) => m.long_context)
    expect(tiered.length).toBeGreaterThan(0)

    for (const m of tiered) {
      const lc = m.long_context!
      expect(
        lc.threshold_input_tokens,
        `${m.id}: threshold >= context_window, so the tier can never trigger`
      ).toBeLessThan(m.context_window)
      // A "long context" tier that is cheaper would invert the cost model.
      expect(lc.input_cost_per_1m).toBeGreaterThanOrEqual(m.input_cost_per_1m)
      expect(lc.output_cost_per_1m).toBeGreaterThanOrEqual(m.output_cost_per_1m)
    }
  })
})
