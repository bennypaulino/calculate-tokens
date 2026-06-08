#!/usr/bin/env node
// Bundles each src/workers/*.worker.ts into public/*.worker.js using esbuild.
// Run as a prebuild step before `next build`.
//
// Options used:
//   bundle:   true — inline all imports (no external deps)
//   format:   esm  — workers are loaded with { type: 'module' }
//   platform: browser
//   target:   es2020
//   loader:   { '.wasm': 'binary' } — inlines WASM as Uint8Array so
//             WebAssembly.Module(bytes) works synchronously inside the worker
'use strict';

const esbuild = require('esbuild');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKERS_DIR = path.resolve(ROOT, 'src/workers');
const OUT_DIR = path.resolve(ROOT, 'public');

const WORKER_FILES = [
  'tiktoken.worker.ts',
  'claude.worker.ts',
  'heuristic.worker.ts',
  'gemini.worker.ts',
  'llama.worker.ts',
];

async function main() {
  console.log('[build-workers] Bundling workers...');

  const entryPoints = WORKER_FILES.map((f) => path.join(WORKERS_DIR, f));

  await esbuild.build({
    entryPoints,
    outdir: OUT_DIR,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    loader: { '.wasm': 'binary' },
    // Do NOT externalize anything — each bundle must be fully self-contained
    // so it can be served from a separate cross-origin domain.
    external: [],
  });

  for (const f of WORKER_FILES) {
    const out = f.replace(/\.ts$/, '.js');
    console.log(`[build-workers]   -> public/${out}`);
  }

  console.log('[build-workers] Done.');
}

main().catch((err) => {
  console.error('[build-workers] FAILED:', err);
  process.exit(1);
});
