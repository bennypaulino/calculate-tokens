#!/usr/bin/env node
// Compiles worker TS files from src/workers/ into plain JS for the workers subdomain.
// Output lands in workers-pages/dist/ which is what Cloudflare Pages serves.
// Run: cd workers-pages && npm install && npm run build:workers
//
// IMPORTANT: After modifying src/workers/tiktoken.worker.ts or heuristic.worker.ts,
// re-run this script and commit the updated dist/ files. CI does not detect stale
// compiled workers — shipping without this step silently serves outdated code from
// workers.calculatetokens.com.
//
// If js-tiktoken's embedded Wasm causes an esbuild error, add:
//   loader: { '.wasm': 'binary' }
// to the build() options below.

const { build } = require('esbuild');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src/workers');
const outDir = path.resolve(__dirname, 'dist');

const workers = ['tiktoken.worker.ts', 'heuristic.worker.ts'];

Promise.all(
  workers.map((entry) =>
    build({
      entryPoints: [path.join(srcDir, entry)],
      bundle: true,
      format: 'esm',
      outfile: path.join(outDir, entry.replace('.ts', '.js')),
      platform: 'browser',
    })
  )
)
  .then(() => {
    console.log('Workers built successfully → workers-pages/dist/');
  })
  .catch((err) => {
    console.error('Worker build failed:', err);
    process.exit(1);
  });
