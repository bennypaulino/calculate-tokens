export type SortColumn = 'name' | 'input' | 'output' | 'total';
export type SortDirection = 'asc' | 'desc';
export type TokenizerStatus = 'pending' | 'heuristic' | 'wasm' | 'error';

export interface ModelTokenState {
  tokenCount: number;
  status: TokenizerStatus;
}

export interface CostRow {
  modelId: string;
  modelName: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  contextWindow: number;
  inputStatus: TokenizerStatus;
  outputStatus: TokenizerStatus;
  isThinkingModel: boolean;
  thinkingBilledSeparately: boolean;
  /** Prompt exceeded the model's long-context threshold; higher rates were billed. */
  longContextApplied: boolean;
  last_human_verified: string;
}

export interface UrlParams {
  out: number;
  think: boolean;
  models: string[];
  vol?: number;
  cache?: boolean;
  batch?: boolean;
}

export interface CalculatorStoreState {
  text: string;
  outputTokens: number;
  thinkingEnabled: boolean;
  modelTokenStates: Record<string, ModelTokenState>;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  selectedModelIds: string[] | null;
  volumeRequests: number;
  cachingEnabled: boolean;
  batchEnabled: boolean;
  setText: (text: string) => void;
  setOutputTokens: (tokens: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setModelTokenState: (modelId: string, state: Partial<ModelTokenState>) => void;
  initializeModelStates: (modelIds: string[], charCount: number) => void;
  setSortColumn: (column: SortColumn) => void;
  setSelectedModelIds: (ids: string[] | null) => void;
  setVolumeRequests: (vol: number) => void;
  setCachingEnabled: (enabled: boolean) => void;
  setBatchEnabled: (enabled: boolean) => void;
}
