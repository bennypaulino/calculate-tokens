import { describe, it, expect } from 'vitest'
import { computeCostRow, computeEffectiveOutputTokens } from '@/lib/costCalc'
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
