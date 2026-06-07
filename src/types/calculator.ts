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
}

export interface UrlParams {
  out: number;
  think: boolean;
  models: string[];
}

export interface CalculatorStoreState {
  text: string;
  outputMultiplier: number;
  thinkingEnabled: boolean;
  modelTokenStates: Record<string, ModelTokenState>;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setText: (text: string) => void;
  setOutputMultiplier: (multiplier: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setModelTokenState: (modelId: string, state: Partial<ModelTokenState>) => void;
  initializeModelStates: (modelIds: string[], charCount: number) => void;
  setSortColumn: (column: SortColumn) => void;
}
