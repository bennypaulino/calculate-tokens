export interface TokenizeRequest {
  requestId: string;
  text: string;
  encoding?: string;
}

export type TokenizeSource = 'wasm' | 'heuristic';

export interface TokenizeResponse {
  requestId: string;
  tokenCount: number;
  source: TokenizeSource;
}

export interface TokenizeError {
  requestId: string;
  error: string;
}

export type WorkerIncoming = TokenizeRequest;
export type WorkerOutgoing = TokenizeResponse | TokenizeError;
