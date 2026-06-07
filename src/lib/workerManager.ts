import type { TokenizerType } from '../types/prices';
import type { TokenizeRequest, TokenizeResponse, TokenizeError } from '../types/worker';

type PendingCallback = (result: TokenizeResponse | TokenizeError) => void;

class ManagedWorker {
  private worker: Worker;
  private pending = new Map<string, PendingCallback>();

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = (event: MessageEvent<TokenizeResponse | TokenizeError>) => {
      const { requestId } = event.data;
      const cb = this.pending.get(requestId);
      if (cb) {
        this.pending.delete(requestId);
        cb(event.data);
      }
    };
    this.worker.onerror = (err: ErrorEvent) => {
      const workerUrl = err.filename || 'unknown';
      console.warn('[WorkerManager] Worker failed to load:', workerUrl, err.message);
      for (const cb of this.pending.values()) {
        cb({ requestId: '', error: 'worker_load_failed' } as TokenizeError);
      }
      this.pending.clear();
    };
  }

  send(request: TokenizeRequest, callback: PendingCallback) {
    this.pending.set(request.requestId, callback);
    this.worker.postMessage(request);
  }

  cancelAll() {
    this.pending.clear();
  }
}

// Factories keep new Worker(new URL(...)) as a single static expression so
// Turbopack/webpack can detect and bundle each worker as a separate chunk.
// When NEXT_PUBLIC_WORKERS_ORIGIN is set, workers load from the cross-origin
// subdomain (adsense build); otherwise they use bundled relative paths (dev /
// analytics build). The new URL(...) branch must remain a literal expression.
function createTiktokenWorker(): Worker {
  const origin = process.env.NEXT_PUBLIC_WORKERS_ORIGIN;
  if (origin) {
    return new Worker(`${origin}/tiktoken.worker.js`, { type: 'module' });
  }
  return new Worker(new URL('../workers/tiktoken.worker.ts', import.meta.url), { type: 'module' });
}

function createHeuristicWorker(): Worker {
  const origin = process.env.NEXT_PUBLIC_WORKERS_ORIGIN;
  if (origin) {
    return new Worker(`${origin}/heuristic.worker.js`, { type: 'module' });
  }
  return new Worker(new URL('../workers/heuristic.worker.ts', import.meta.url), { type: 'module' });
}

function createClaudeWorker(): Worker {
  const origin = process.env.NEXT_PUBLIC_WORKERS_ORIGIN;
  if (origin) {
    return new Worker(`${origin}/claude.worker.js`, { type: 'module' });
  }
  return new Worker(new URL('../workers/claude.worker.ts', import.meta.url), { type: 'module' });
}

function createGeminiWorker(): Worker {
  const origin = process.env.NEXT_PUBLIC_WORKERS_ORIGIN;
  if (origin) {
    return new Worker(`${origin}/gemini.worker.js`, { type: 'module' });
  }
  return new Worker(new URL('../workers/gemini.worker.ts', import.meta.url), { type: 'module' });
}

function createLlamaWorker(): Worker {
  const origin = process.env.NEXT_PUBLIC_WORKERS_ORIGIN;
  if (origin) {
    return new Worker(`${origin}/llama.worker.js`, { type: 'module' });
  }
  return new Worker(new URL('../workers/llama.worker.ts', import.meta.url), { type: 'module' });
}

export class WorkerManager {
  private workers = new Map<string, ManagedWorker>();
  private latestRequestIds = new Map<string, string>();

  private getOrCreateWorker(tokenizer: TokenizerType): ManagedWorker | null {
    if (tokenizer === 'heuristic') return null;

    let key: string;
    let factory: () => Worker;

    if (tokenizer === 'o200k_base' || tokenizer === 'cl100k_base') {
      key = `tiktoken-${tokenizer}`;
      factory = createTiktokenWorker;
    } else if (tokenizer === 'claude') {
      key = 'claude-worker';
      factory = createClaudeWorker;
    } else if (tokenizer === 'gemini') {
      key = 'gemini-worker';
      factory = createGeminiWorker;
    } else if (tokenizer === 'llama') {
      key = 'llama-worker';
      factory = createLlamaWorker;
    } else {
      key = 'heuristic-worker';
      factory = createHeuristicWorker;
    }

    if (!this.workers.has(key)) {
      this.workers.set(key, new ManagedWorker(factory()));
    }
    return this.workers.get(key)!;
  }

  tokenize(
    modelId: string,
    text: string,
    tokenizer: TokenizerType,
    encoding: string | undefined,
    onResult: (tokenCount: number, isWasm: boolean) => void,
    onError: () => void
  ): string {
    const requestId = `${modelId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.latestRequestIds.set(modelId, requestId);

    if (tokenizer === 'heuristic') {
      const count = Math.ceil(text.length / 4);
      onResult(count, false);
      return requestId;
    }

    const worker = this.getOrCreateWorker(tokenizer);
    if (!worker) {
      onResult(Math.ceil(text.length / 4), false);
      return requestId;
    }

    const request: TokenizeRequest = { requestId, text, encoding };

    worker.send(request, (result) => {
      if (this.latestRequestIds.get(modelId) !== requestId) return;
      if ('error' in result) {
        onError();
        return;
      }
      onResult(result.tokenCount, result.source === 'wasm');
    });

    return requestId;
  }

  cancelPending(modelId: string) {
    this.latestRequestIds.delete(modelId);
  }

  cancelAll() {
    this.latestRequestIds.clear();
    for (const worker of this.workers.values()) {
      worker.cancelAll();
    }
  }
}
