#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRICES_PATH = path.resolve(__dirname, '..', 'public', 'api', 'v1', 'prices.json');

// BOTH files, mirroring compute-csp-hashes.js. Writing only public/_headers was
// the bug: `next build` copies public/ -> out/ BEFORE this runs, so out/_headers
// -- the artifact Cloudflare actually deploys -- kept generate-headers.js's
// literal `X-Content-Hash: placeholder`. Production served that placeholder, so
// the Service Worker's integrity check could never match and has never worked.
const HEADERS_PATHS = [
  path.resolve(__dirname, '..', 'public', '_headers'),
  path.resolve(__dirname, '..', 'out', '_headers'),
];

// Read prices.json
if (!fs.existsSync(PRICES_PATH)) {
  console.error('[FAIL] public/api/v1/prices.json not found. Run this script after prices.json is committed.');
  process.exit(1);
}

const pricesContent = fs.readFileSync(PRICES_PATH, 'utf8');
const hash = crypto.createHash('sha256').update(pricesContent).digest('hex');

// The replacement block for /api/v1/prices.json section
const newPricesSection =
  `/api/v1/prices.json\n` +
  `  X-Content-Hash: ${hash}\n` +
  `  Access-Control-Allow-Origin: *\n` +
  `  Content-Type: application/json; charset=utf-8\n` +
  `  Cache-Control: public, max-age=86400, stale-while-revalidate=86400`;

// Match the existing /api/v1/prices.json section (path line + all indented header lines that follow)
const sectionRegex = /^\/api\/v1\/prices\.json\n(?:[ \t]+[^\n]+\n?)*/m;

let written = 0;
for (const headersPath of HEADERS_PATHS) {
  // out/_headers only exists after a build; skip it when running pre-build.
  if (!fs.existsSync(headersPath)) continue;

  let headersContent = fs.readFileSync(headersPath, 'utf8');
  headersContent = sectionRegex.test(headersContent)
    ? headersContent.replace(sectionRegex, newPricesSection)
    : newPricesSection + '\n\n' + headersContent;

  fs.writeFileSync(headersPath, headersContent, 'utf8');
  console.log(`[compute-prices-hash] Patched ${headersPath}`);
  written++;
}

if (written === 0) {
  console.error('[FAIL] No _headers file found to patch. Run after `next build`.');
  process.exit(1);
}

console.log(`[compute-prices-hash] X-Content-Hash: ${hash}`);
process.exit(0);
