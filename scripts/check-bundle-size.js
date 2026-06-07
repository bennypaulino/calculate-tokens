#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const THRESHOLD = 150_000;
const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, '.next', 'build-manifest.json');

if (!fs.existsSync(MANIFEST)) {
  console.error('[bundle-size] FAIL: .next/build-manifest.json not found. Run build first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const chunks = (manifest.pages && manifest.pages['/']) || manifest.rootMainFiles || [];

let total = 0;
const seen = new Set();

for (const chunk of chunks) {
  if (!chunk.endsWith('.js')) continue;

  const candidates = [
    path.join(ROOT, '.next', chunk),
    path.join(ROOT, '.next', 'static', chunk.replace(/^static\//, '')),
    path.join(ROOT, '.next', 'static', 'chunks', path.basename(chunk)),
  ];

  const full = candidates.find((c) => fs.existsSync(c));
  if (!full || seen.has(full)) continue;
  seen.add(full);

  const gz = zlib.gzipSync(fs.readFileSync(full));
  total += gz.length;
}

const kb = (total / 1024).toFixed(1);

if (total > THRESHOLD) {
  console.error(`[bundle-size] FAIL: ${kb}KB > 150KB (${total} bytes)`);
  process.exit(1);
}

console.log(`[bundle-size] OK: ${kb}KB (limit: 150KB)`);
process.exit(0);
