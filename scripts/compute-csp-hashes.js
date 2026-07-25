#!/usr/bin/env node
'use strict';

/**
 * Post-build guard on Cloudflare Pages' _headers line limit.
 *
 * This script used to scan every HTML file in out/, hash each inline <script>,
 * and union all of them into one script-src. That does not scale: Next.js
 * static export embeds a unique RSC payload per page, so the hash set grew with
 * the page count. At 388 pages it produced 4,064 hashes in a single
 * 219,918-byte header line -- 110x Cloudflare's documented 2,000-character
 * limit per line in _headers.
 *
 * Cloudflare silently DISCARDS the over-length line and keeps the rest, so
 * production served every other security header and no Content-Security-Policy
 * at all. validate-csp.js passed throughout, because it inspects the generated
 * file rather than what actually ships.
 *
 * CSP is now emitted whole by generate-headers.js using 'unsafe-inline' instead
 * of per-page hashes. This script's remaining job is to make sure nothing ever
 * silently exceeds the limit again.
 */

const fs = require('fs');
const path = require('path');

const MAX_LINE_BYTES = 2000;

const HEADERS_PATHS = [
  path.resolve(__dirname, '../public/_headers'),
  path.resolve(__dirname, '../out/_headers'),
];

let checked = 0;
let failed = false;

for (const p of HEADERS_PATHS) {
  if (!fs.existsSync(p)) continue;
  checked++;

  const lines = fs.readFileSync(p, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const bytes = Buffer.byteLength(line, 'utf8');
    if (bytes > MAX_LINE_BYTES) {
      console.error(
        `[compute-csp-hashes] FAIL ${p}:${i + 1} is ${bytes} bytes, over Cloudflare's ` +
          `${MAX_LINE_BYTES}-byte limit. Cloudflare drops the line silently, so this header ` +
          `would never reach production.\n  ${line.slice(0, 80)}...`
      );
      failed = true;
    }
  });

  const hasCsp = lines.some((l) => /^\s*Content-Security-Policy:/i.test(l));
  if (!hasCsp) {
    console.error(`[compute-csp-hashes] FAIL ${p} has no Content-Security-Policy header.`);
    failed = true;
  }
}

if (checked === 0) {
  console.error('[compute-csp-hashes] FAIL no _headers file found. Run after `next build`.');
  process.exit(1);
}
if (failed) process.exit(1);

console.log(`[compute-csp-hashes] OK ${checked} _headers file(s); all lines within ${MAX_LINE_BYTES} bytes.`);
process.exit(0);
