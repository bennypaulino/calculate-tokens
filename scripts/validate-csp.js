#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const mode = process.env.NEXT_PUBLIC_CSP_MODE;

if (!mode) {
  console.error('[FAIL] NEXT_PUBLIC_CSP_MODE is not set. Must be "analytics" or "adsense".');
  process.exit(1);
}

if (mode !== 'analytics' && mode !== 'adsense') {
  console.error(`[FAIL] NEXT_PUBLIC_CSP_MODE="${mode}" is invalid. Must be "analytics" or "adsense".`);
  process.exit(1);
}

const headersPath = path.resolve(__dirname, '../public/_headers');

if (!fs.existsSync(headersPath)) {
  console.error('[FAIL] public/_headers not found.');
  process.exit(1);
}

const headersContent = fs.readFileSync(headersPath, 'utf8');

// Extract the Content-Security-Policy value
const cspMatch = headersContent.match(/Content-Security-Policy:\s*(.+)/i);
if (!cspMatch) {
  console.error('[FAIL] No Content-Security-Policy header found in public/_headers.');
  process.exit(1);
}

const csp = cspMatch[1].trim();

if (mode === 'analytics') {
  const hasWasmUnsafeEval = csp.includes('wasm-unsafe-eval');
  const hasAdSense = csp.includes('googlesyndication.com');

  if (!hasWasmUnsafeEval) {
    console.error('[FAIL] analytics mode requires "wasm-unsafe-eval" in Content-Security-Policy.');
    process.exit(1);
  }

  if (hasAdSense) {
    console.error('[FAIL] analytics mode must NOT contain "googlesyndication.com" in Content-Security-Policy.');
    process.exit(1);
  }

  console.log('[OK] CSP mode=analytics: "wasm-unsafe-eval" present, "googlesyndication.com" absent.');
}

if (mode === 'adsense') {
  const hasWasmUnsafeEval = csp.includes('wasm-unsafe-eval');

  if (hasWasmUnsafeEval) {
    console.error('[FAIL] adsense mode must NOT contain "wasm-unsafe-eval" in Content-Security-Policy.');
    process.exit(1);
  }

  console.log('[OK] CSP mode=adsense: "wasm-unsafe-eval" absent.');
}

process.exit(0);
