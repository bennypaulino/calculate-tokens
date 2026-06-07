import llamaTokenizer from 'llama-tokenizer-js';
import type { TokenizeRequest, TokenizeResponse, TokenizeError } from '../types/worker';

self.onmessage = (event: MessageEvent<TokenizeRequest>) => {
  const { requestId, text } = event.data;

  try {
    // llama-tokenizer-js is a pure-JS SentencePiece implementation.
    // add_bos_token=true, add_preceding_space=true match standard Llama 2 defaults.
    const tokens = llamaTokenizer.encode(text, true, true);

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
