// No reliable npm Wasm tokenizer exists for Gemini models.
// Using chars/3.5 heuristic — source is honestly reported as 'heuristic'.
import type { TokenizeRequest, TokenizeResponse } from '../types/worker';

self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { requestId, text } = event.data;

  const response: TokenizeResponse = {
    requestId,
    tokenCount: Math.ceil(text.length / 3.5),
    source: 'heuristic',
  };
  self.postMessage(response);
};
