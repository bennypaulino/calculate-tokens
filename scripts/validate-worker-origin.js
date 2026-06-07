#!/usr/bin/env node
// Verifies that workers.calculatetokens.com serves worker JS with correct CORS and CSP headers.
// Exits 0 on pass, exits 1 on any failure.
// Usage: node scripts/validate-worker-origin.js [--url <url>]
// Requires: Node 18+ (fetch global)

if (parseInt(process.versions.node, 10) < 18) {
  console.error(`[validate-worker-origin] FAIL: Node 18+ required (fetch global). Found: ${process.version}`);
  process.exit(1);
}

const DEFAULT_URL = 'https://workers.calculatetokens.com/tiktoken.worker.js';

const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const targetUrl = urlIndex !== -1 && args[urlIndex + 1] ? args[urlIndex + 1] : DEFAULT_URL;

async function validate() {
  let res;
  try {
    res = await fetch(targetUrl);
  } catch (err) {
    console.error(`[validate-worker-origin] FAIL: Could not reach ${targetUrl}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  const failures = [];

  if (res.status !== 200) {
    failures.push(`Expected HTTP 200, got ${res.status}`);
  }

  const acao = res.headers.get('access-control-allow-origin');
  if (acao !== 'https://calculatetokens.com') {
    failures.push(`Expected Access-Control-Allow-Origin: https://calculatetokens.com, got: ${acao ?? '(missing)'}`);
  }

  const corp = res.headers.get('cross-origin-resource-policy');
  if (corp !== 'cross-origin') {
    failures.push(`Expected Cross-Origin-Resource-Policy: cross-origin, got: ${corp ?? '(missing)'}`);
  }

  const csp = res.headers.get('content-security-policy');
  if (!csp || !csp.includes("'wasm-unsafe-eval'")) {
    failures.push(`Expected Content-Security-Policy to contain 'wasm-unsafe-eval', got: ${csp ?? '(missing)'}`);
  }

  if (failures.length > 0) {
    console.error(`[validate-worker-origin] FAIL: ${targetUrl}`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log(`[validate-worker-origin] PASS: ${targetUrl}`);
  console.log(`  access-control-allow-origin: ${acao}`);
  console.log(`  cross-origin-resource-policy: ${corp}`);
  console.log(`  content-security-policy: ${csp}`);
}

validate();
