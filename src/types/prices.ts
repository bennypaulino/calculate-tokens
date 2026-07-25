export type TokenizerType =
  | 'cl100k_base'
  | 'o200k_base'
  | 'claude'
  | 'claude-new'
  | 'gemini'
  | 'llama'
  | 'heuristic';

/**
 * Long-context pricing tier. When the prompt exceeds `threshold_input_tokens`,
 * the entire request -- input and output -- is billed at these rates instead of
 * the model's standard ones. A step function on the whole request, not a
 * marginal/graduated tier.
 *
 * Real thresholds differ by provider: 272,000 for OpenAI GPT-5.x, 200,000 for
 * Google Gemini Pro. Never hardcode one.
 */
export interface LongContextPricing {
  threshold_input_tokens: number;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
}

export interface ModelEntry {
  id: string;
  display_name: string;
  provider: string;
  tokenizer: TokenizerType;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  /** Absent for flat-rate models. */
  long_context?: LongContextPricing;
  context_window: number;
  thinking_model: boolean;
  thinking_billed_separately: boolean;
  thinking_multiplier: number | null;
  active: boolean;
  last_human_verified: string;
  provider_pricing_url: string;
  supports_context_caching: boolean;
  context_caching_discount: number | null;
  supports_batch_api: boolean;
  batch_api_discount: number | null;
}

export interface PricesData {
  version: string;
  generated_at: string;
  /** Document-level: the pricing check runs per provider page, not per model. */
  last_checked: string;
  models: ModelEntry[];
}
