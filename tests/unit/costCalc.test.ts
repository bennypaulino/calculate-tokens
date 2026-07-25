import { describe, it, expect } from 'vitest'
import { computeCostRow, computeEffectiveOutputTokens, computeMonthlyProjection, resolveRates } from '@/lib/costCalc'
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

describe('computeMonthlyProjection — scaling simulator math', () => {
  const sol = () =>
    makeModel({
      id: 'gpt-5-6-sol',
      input_cost_per_1m: 5.0,
      output_cost_per_1m: 30.0,
      context_window: 1_050_000,
      thinking_model: true,
      thinking_billed_separately: true,
      thinking_multiplier: 3,
      supports_context_caching: true,
      context_caching_discount: 0.9,
      supports_batch_api: true,
      batch_api_discount: 0.5,
      long_context: {
        threshold_input_tokens: 272_000,
        input_cost_per_1m: 10.0,
        output_cost_per_1m: 45.0,
      },
    })

  const base = {
    inputTokens: 1_000,
    outputTokens: 1_000,
    thinkingEnabled: false,
    cachingEnabled: false,
    batchEnabled: false,
    volumeRequests: 1,
  }

  it('evaluates the threshold per request, never against the monthly aggregate', () => {
    // 1M requests x 1k prompt tokens = 1e9 tokens/month, but each individual
    // prompt is 1,000 tokens -- far below 272K. Resolving against the aggregate
    // would wrongly bill every request at long-context rates.
    const r = computeMonthlyProjection({
      ...base,
      model: sol(),
      inputTokens: 1_000,
      volumeRequests: 1_000_000,
    })
    expect(r.longContextApplied).toBe(false)
    // 1k in @ $5 + 1k out @ $30 = $0.035 per request
    expect(r.monthlyTotal).toBeCloseTo(35_000, 4)
  })

  it('applies long-context rates when a single prompt exceeds the threshold', () => {
    const r = computeMonthlyProjection({ ...base, model: sol(), inputTokens: 300_000 })
    expect(r.longContextApplied).toBe(true)
    // 300k in @ $10 = $3.00, 1k out @ $45 = $0.045
    expect(r.monthlyTotal).toBeCloseTo(3.045, 6)
  })

  it('inflates billable output by the thinking multiplier, matching the cost grid', () => {
    const withThinking = computeMonthlyProjection({ ...base, model: sol(), thinkingEnabled: true })
    const without = computeMonthlyProjection({ ...base, model: sol(), thinkingEnabled: false })

    // Same request shape, so the grid and the simulator must agree.
    const gridRow = computeCostRow(sol(), base.inputTokens, base.outputTokens, true)
    expect(withThinking.monthlyTotal).toBeCloseTo(gridRow.totalCost, 6)

    // 1k out -> 3k billable out @ $30 = $0.09 (vs $0.03), input unchanged.
    expect(withThinking.monthlyTotal).toBeCloseTo(0.095, 6)
    expect(without.monthlyTotal).toBeCloseTo(0.035, 6)
  })

  it('applies caching to input only and batch to the whole request', () => {
    const r = computeMonthlyProjection({
      ...base,
      model: sol(),
      cachingEnabled: true,
      batchEnabled: true,
    })
    // input 1k @ $5 * (1 - 0.9) = $0.0005; output 1k @ $30 = $0.03
    // (0.0005 + 0.03) * (1 - 0.5) = $0.01525
    expect(r.monthlyTotal).toBeCloseTo(0.01525, 6)
    expect(r.cachingApplied).toBe(true)
    expect(r.batchApplied).toBe(true)
  })

  it('ignores discounts the model does not support', () => {
    const flat = makeModel({ supports_context_caching: false, supports_batch_api: false })
    const r = computeMonthlyProjection({
      ...base,
      model: flat,
      cachingEnabled: true,
      batchEnabled: true,
    })
    expect(r.cachingApplied).toBe(false)
    expect(r.batchApplied).toBe(false)
    // 1k in @ $2.50 + 1k out @ $10.00, undiscounted
    expect(r.monthlyTotal).toBeCloseTo(0.0125, 6)
  })
})
