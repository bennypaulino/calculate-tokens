import { getEncoding } from 'js-tiktoken';
import type { TokenizeRequest, TokenizeResponse, TokenizeError } from '../types/worker';

self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { requestId, text, encoding } = event.data;

  try {
    const enc = getEncoding((encoding ?? 'o200k_base') as Parameters<typeof getEncoding>[0]);
    const tokens = enc.encode(text);

    const response: TokenizeResponse = {
      requestId,
      tokenCount: tokens.length,
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
