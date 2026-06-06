#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pricesPath = path.resolve(__dirname, '../public/api/v1/prices.json');
const snapshotsDir = path.resolve(__dirname, 'pricing-snapshots');

if (!fs.existsSync(pricesPath)) {
  console.error('[FAIL] public/api/v1/prices.json not found.');
  process.exit(1);
}

const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
const activeModels = prices.models.filter((m) => m.active);

// Deduplicate by provider_pricing_url so we only fetch each URL once
const providerMap = new Map();
for (const model of activeModels) {
  const key = model.provider + '::' + model.provider_pricing_url;
  if (!providerMap.has(key)) {
    providerMap.set(key, {
      id: model.provider.toLowerCase().replace(/\s+/g, '-'),
      provider: model.provider,
      url: model.provider_pricing_url,
      requiresJsRender: !!model.requires_js_render,
    });
  }
}

const providers = Array.from(providerMap.values());

const args = process.argv.slice(2);
const isInit = args.includes('--init');
const isUpdateOnly = args.includes('--update-only');

if (!fs.existsSync(snapshotsDir)) {
  fs.mkdirSync(snapshotsDir, { recursive: true });
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function fetchStatic(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CalculateTokens-PriceBot/1.0)',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchWithPlaywright(url) {
  let playwright;
  try {
    playwright = require('@playwright/test');
  } catch {
    throw new Error('Playwright not available: @playwright/test not installed.');
  }

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
}

async function fetchProvider(provider) {
  if (provider.requiresJsRender) {
    try {
      return await fetchWithPlaywright(provider.url);
    } catch (err) {
      if (err.message.startsWith('Playwright not available')) {
        console.warn(`[WARN] Skipping JS-render provider ${provider.provider}: ${err.message}`);
        return null;
      }
      throw err;
    }
  } else {
    return fetchStatic(provider.url);
  }
}

function snapshotPath(providerId) {
  return path.join(snapshotsDir, `${providerId}.hash`);
}

async function runInit() {
  console.log(`Initializing snapshots for ${providers.length} providers...`);
  for (const provider of providers) {
    try {
      const content = await fetchProvider(provider);
      if (content === null) {
        console.log(`  [SKIP] ${provider.provider} (${provider.url}) — Playwright unavailable.`);
        continue;
      }
      const hash = computeHash(content);
      fs.writeFileSync(snapshotPath(provider.id), hash, 'utf8');
      console.log(`  [OK] ${provider.provider} → ${provider.id}.hash (${hash.slice(0, 12)}...)`);
    } catch (err) {
      console.warn(`  [WARN] ${provider.provider} (${provider.url}): ${err.message}`);
    }
  }
  console.log('Snapshots written. Commit scripts/pricing-snapshots/ directory.');
}

async function runCheck() {
  const changed = [];
  const missing = [];

  for (const provider of providers) {
    const snap = snapshotPath(provider.id);
    if (!fs.existsSync(snap)) {
      missing.push(provider);
      continue;
    }

    const storedHash = fs.readFileSync(snap, 'utf8').trim();

    let content;
    try {
      content = await fetchProvider(provider);
    } catch (err) {
      console.warn(`[WARN] ${provider.provider} (${provider.url}): ${err.message} — skipping.`);
      continue;
    }

    if (content === null) {
      console.log(`[SKIP] ${provider.provider} — Playwright unavailable.`);
      continue;
    }

    const currentHash = computeHash(content);
    if (currentHash !== storedHash) {
      console.log(`[CHANGED] ${provider.provider} (${provider.url})`);
      changed.push(provider);
    } else {
      console.log(`[OK] ${provider.provider} — no change.`);
    }
  }

  if (missing.length > 0) {
    for (const p of missing) {
      console.error(
        `[FAIL] Missing snapshot for provider ${p.id}. Run check-page-changes.js --init locally and commit the snapshots/ directory.`
      );
    }
    process.exit(1);
  }

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput && changed.length > 0) {
    const names = changed.map((p) => p.provider).join(',');
    fs.appendFileSync(githubOutput, `changed_providers=${names}\n`, 'utf8');
    console.log(`GITHUB_OUTPUT: changed_providers=${names}`);
  }

  if (changed.length > 0) {
    console.log(`\n${changed.length} provider(s) changed: ${changed.map((p) => p.provider).join(', ')}`);
  } else {
    console.log('\nAll providers unchanged.');
  }
}

(async () => {
  if (isInit || isUpdateOnly) {
    await runInit();
  } else {
    await runCheck();
  }
})().catch((err) => {
  console.error('[FAIL]', err.message);
  process.exit(1);
});
