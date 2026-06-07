export type TokenizerType =
  | 'cl100k_base'
  | 'o200k_base'
  | 'claude'
  | 'gemini'
  | 'llama'
  | 'heuristic';

export interface ModelEntry {
  id: string;
  display_name: string;
  provider: string;
  tokenizer: TokenizerType;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  context_window: number;
  thinking_model: boolean;
  thinking_billed_separately: boolean;
  thinking_multiplier: number | null;
  active: boolean;
  last_human_verified: string;
  last_checked: string;
  provider_pricing_url: string;
  supports_context_caching: boolean;
  context_caching_discount: number | null;
  supports_batch_api: boolean;
  batch_api_discount: number | null;
}

export interface PricesData {
  version: string;
  generated_at: string;
  models: ModelEntry[];
}
