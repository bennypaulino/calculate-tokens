import type { ModelEntry } from '../types/prices';

export interface ResolvedRates {
  inputCostPer1m: number;
  outputCostPer1m: number;
  /** True when the prompt pushed this request into the long-context tier. */
  longContextApplied: boolean;
}

/**
 * Resolves the per-1M rates that apply to a request with `inputTokens` in the
 * prompt.
 *
 * Long-context pricing is a step function over the WHOLE request: once the
 * prompt exceeds the threshold, input *and* output are billed at the higher
 * rates. It is not marginal -- the tokens below the threshold do not stay at the
 * standard rate. The comparison is strictly greater-than, so a prompt exactly
 * equal to the threshold is still standard-rate.
 *
 * This is the single source of truth for rate selection. Anything computing a
 * dollar figure must go through it rather than reading the rate fields directly,
 * or it will silently under-bill long prompts.
 */
export function resolveRates(model: ModelEntry, inputTokens: number): ResolvedRates {
  const tier = model.long_context;
  if (tier && inputTokens > tier.threshold_input_tokens) {
    return {
      inputCostPer1m: tier.input_cost_per_1m,
      outputCostPer1m: tier.output_cost_per_1m,
      longContextApplied: true,
    };
  }
  return {
    inputCostPer1m: model.input_cost_per_1m,
    outputCostPer1m: model.output_cost_per_1m,
    longContextApplied: false,
  };
}

export function computeEffectiveOutputTokens(
  outputTokens: number,
  model: ModelEntry,
  thinkingEnabled: boolean
): number {
  if (!model.thinking_model || !thinkingEnabled) {
    return outputTokens;
  }
  if (model.thinking_billed_separately && model.thinking_multiplier !== null) {
    return Math.round(outputTokens * model.thinking_multiplier);
  }
  return outputTokens;
}

export function computeCostRow(
  model: ModelEntry,
  inputTokens: number,
  outputTokens: number,
  thinkingEnabled: boolean
) {
  const effectiveOutput = computeEffectiveOutputTokens(outputTokens, model, thinkingEnabled);

  // Rates depend on the PROMPT size, so resolve before computing either side.
  const rates = resolveRates(model, inputTokens);

  const inputCost = (inputTokens / 1_000_000) * rates.inputCostPer1m;
  const outputCost = (effectiveOutput / 1_000_000) * rates.outputCostPer1m;
  const totalCost = inputCost + outputCost;

  return {
    longContextApplied: rates.longContextApplied,
    modelId: model.id,
    modelName: model.display_name,
    provider: model.provider,
    inputTokens,
    outputTokens: effectiveOutput,
    inputCost,
    outputCost,
    totalCost,
    contextWindow: model.context_window,
    isThinkingModel: model.thinking_model,
    thinkingBilledSeparately: model.thinking_billed_separately,
    last_human_verified: model.last_human_verified,
  };
}
