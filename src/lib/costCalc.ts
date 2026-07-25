import type { LongContextPricing, ModelEntry } from '../types/prices';

/**
 * Minimum shape `resolveRates` needs. Structural rather than `ModelEntry` so
 * the statically-rendered pages, which each declare their own trimmed-down
 * model interface, can route through the same rate logic instead of reading
 * the rate fields directly.
 */
export interface RateBearingModel {
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  long_context?: LongContextPricing;
}

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
export function resolveRates(model: RateBearingModel, inputTokens: number): ResolvedRates {
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

export interface MonthlyProjectionArgs {
  model: ModelEntry;
  /** Prompt tokens for a SINGLE request. Never the monthly aggregate. */
  inputTokens: number;
  /** Output tokens for a single request, before any thinking multiplier. */
  outputTokens: number;
  thinkingEnabled: boolean;
  cachingEnabled: boolean;
  batchEnabled: boolean;
  volumeRequests: number;
}

export interface MonthlyProjection {
  monthlyTotal: number;
  cachingApplied: boolean;
  batchApplied: boolean;
  longContextApplied: boolean;
}

/**
 * Projects monthly spend for a fixed request shape repeated `volumeRequests`
 * times.
 *
 * The long-context threshold is evaluated against a SINGLE request's prompt,
 * never against `inputTokens * volumeRequests`. Providers price each request
 * independently, so a million small requests never reach a long-context tier.
 * Getting this wrong would long-context-price every model at high volume.
 */
export function computeMonthlyProjection(args: MonthlyProjectionArgs): MonthlyProjection {
  const {
    model,
    inputTokens,
    outputTokens,
    thinkingEnabled,
    cachingEnabled,
    batchEnabled,
    volumeRequests,
  } = args;

  const cachingApplied = cachingEnabled && model.supports_context_caching;
  const cachingFactor =
    cachingApplied && model.context_caching_discount !== null
      ? 1 - model.context_caching_discount
      : 1;

  const batchApplied = batchEnabled && model.supports_batch_api;
  const batchFactor =
    batchApplied && model.batch_api_discount !== null ? 1 - model.batch_api_discount : 1;

  // Thinking inflates billable output tokens; must match what the cost grid
  // shows for the same model, or the two panels disagree on the same page.
  const effectiveOutput = computeEffectiveOutputTokens(outputTokens, model, thinkingEnabled);

  const rates = resolveRates(model, inputTokens);

  const perRequestInput = (inputTokens / 1_000_000) * rates.inputCostPer1m * cachingFactor;
  const perRequestOutput = (effectiveOutput / 1_000_000) * rates.outputCostPer1m;
  const perRequest = (perRequestInput + perRequestOutput) * batchFactor;

  return {
    monthlyTotal: perRequest * volumeRequests,
    cachingApplied,
    batchApplied,
    longContextApplied: rates.longContextApplied,
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
