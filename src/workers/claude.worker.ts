import { countTokens } from '@anthropic-ai/tokenizer';
import type { TokenizeRequest, TokenizeResponse, TokenizeError } from '../types/worker';

self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { requestId, text } = event.data;

  try {
    const tokenCount = countTokens(text);

    const response: TokenizeResponse = {
      requestId,
      tokenCount,
      source: 'wasm',
    };
    self.postMessage(response);
  } catch (err) {
    const error: TokenizeError = {
      requestId,
      error: String(err),
    };
    self.postMessage(error);
  }
};
