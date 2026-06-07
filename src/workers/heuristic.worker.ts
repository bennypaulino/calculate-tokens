import type { TokenizeRequest, TokenizeResponse } from '../types/worker';

self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { requestId, text } = event.data;

  const response: TokenizeResponse = {
    requestId,
    tokenCount: Math.ceil(text.length / 4),
    source: 'heuristic',
  };
  self.postMessage(response);
};
