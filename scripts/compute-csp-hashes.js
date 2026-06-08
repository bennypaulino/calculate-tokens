#!/usr/bin/env node
// Post-build: scans all HTML in out/ for inline <script> tags, computes their
// SHA-256 hashes, and patches them into the Content-Security-Policy in both
// public/_headers and out/_headers. Also adds static.cloudflareinsights.com
// for Cloudflare Web Analytics.
//
// Run on every deployment — not just once. The hashes change with each build
// because Next.js embeds build-time data in inline scripts. Each Cloudflare
// Pages project must run `npm run build` (which calls this script) with its
// own NEXT_PUBLIC_CSP_MODE set ("analytics" or "adsense") so the committed
// public/_headers always reflects the most recent deployment's hashes.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT_DIR = path.resolve(__dirname, '../out');
const HEADERS_PATHS = [
  path.resolve(__dirname, '../public/_headers'),
  path.resolve(__dirname, '../out/_headers'),
];

if (!fs.existsSync(OUT_DIR)) {
  console.error('[compute-csp-hashes] out/ directory not found — run `next build` first.');
  process.exit(1);
}

function findHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtml(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const hashSet = new Set();

for (const htmlFile of findHtml(OUT_DIR)) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const inlineScriptRe = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = inlineScriptRe.exec(html)) !== null) {
    const content = m[1];
    if (!content.trim()) continue;
    const hash = crypto.createHash('sha256').update(content).digest('base64');
    hashSet.add(`'sha256-${hash}'`);
  }
}

if (hashSet.size === 0) {
  console.log('[compute-csp-hashes] No inline scripts found — nothing to patch.');
  process.exit(0);
}

const hashes = Array.from(hashSet).join(' ');
console.log(`[compute-csp-hashes] Found ${hashSet.size} unique inline script hash(es).`);

for (const p of HEADERS_PATHS) {
  if (!fs.existsSync(p)) continue;
  const original = fs.readFileSync(p, 'utf8');
  const patched = original.replace(
    /script-src ([^;]+);/,
    (_, existing) => {
      const base = existing
        .replace(/'sha256-[^']+'/g, '')
        .replace(/https:\/\/static\.cloudflareinsights\.com/g, '')
        .trim()
        .replace(/\s+/g, ' ');
      return `script-src ${base} https://static.cloudflareinsights.com ${hashes};`;
    }
  );
  if (patched === original) {
    console.error(`[compute-csp-hashes] Could not find script-src in ${p} — skipping.`);
    continue;
  }
  fs.writeFileSync(p, patched, 'utf8');
  console.log(`[compute-csp-hashes] Patched ${p}`);
}
