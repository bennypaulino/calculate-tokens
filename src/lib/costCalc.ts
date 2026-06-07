import type { ModelEntry } from '../types/prices';

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

  const inputCost = (inputTokens / 1_000_000) * model.input_cost_per_1m;
  const outputCost = (effectiveOutput / 1_000_000) * model.output_cost_per_1m;
  const totalCost = inputCost + outputCost;

  return {
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
