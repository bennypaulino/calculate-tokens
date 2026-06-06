#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const pricesPath = path.resolve(__dirname, '../public/api/v1/prices.json');
const outDir = path.resolve(__dirname, '../out/compare');

if (!fs.existsSync(pricesPath)) {
  console.error('[FAIL] public/api/v1/prices.json not found.');
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  console.error('[FAIL] out/compare/ directory not found. Run next build first.');
  process.exit(1);
}

const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
const activeModels = prices.models.filter((m) => m.active);

// Build a lookup: model id -> { input_cost_per_1m, output_cost_per_1m }
const modelPrices = {};
for (const model of activeModels) {
  modelPrices[model.id] = {
    input: model.input_cost_per_1m,
    output: model.output_cost_per_1m,
  };
}

// Generate all unique a-vs-b pairs (a < b alphabetically to match Next.js route convention)
const ids = activeModels.map((m) => m.id).sort();
const pairs = [];
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    pairs.push([ids[i], ids[j]]);
  }
}

const failures = [];
let checked = 0;

for (const [a, b] of pairs) {
  const htmlPath = path.join(outDir, `${a}-vs-${b}`, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    // Try reversed order in case the page was generated with different ordering
    const htmlPathReversed = path.join(outDir, `${b}-vs-${a}`, 'index.html');
    if (!fs.existsSync(htmlPathReversed)) {
      failures.push(`MISSING: out/compare/${a}-vs-${b}/index.html`);
      continue;
    }
    // Use reversed
    checkPage(htmlPathReversed, b, a, failures);
  } else {
    checkPage(htmlPath, a, b, failures);
  }
  checked++;
}

function checkPage(htmlPath, modelA, modelB, failures) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract all data-price-input and data-price-output values in document order
  const inputMatches = [...html.matchAll(/data-price-input="([^"]+)"/g)].map((m) => parseFloat(m[1]));
  const outputMatches = [...html.matchAll(/data-price-output="([^"]+)"/g)].map((m) => parseFloat(m[1]));

  const expectedA = modelPrices[modelA];
  const expectedB = modelPrices[modelB];

  if (!expectedA || !expectedB) return;

  // We expect 2 input values and 2 output values (one per model)
  // The first value corresponds to modelA, second to modelB
  if (inputMatches.length < 2 || outputMatches.length < 2) {
    failures.push(
      `MISSING_ATTRS: ${path.basename(path.dirname(htmlPath))} — found ${inputMatches.length} data-price-input, ${outputMatches.length} data-price-output (expected 2 each)`
    );
    return;
  }

  const pricesInHtml = [
    { model: modelA, input: inputMatches[0], output: outputMatches[0] },
    { model: modelB, input: inputMatches[1], output: outputMatches[1] },
  ];

  for (const { model, input, output } of pricesInHtml) {
    const expected = modelPrices[model];
    if (!expected) continue;

    if (Math.abs(input - expected.input) > 0.001) {
      failures.push(
        `PRICE_MISMATCH: ${model} input in ${modelA}-vs-${modelB}: HTML=${input}, prices.json=${expected.input}`
      );
    }
    if (Math.abs(output - expected.output) > 0.001) {
      failures.push(
        `PRICE_MISMATCH: ${model} output in ${modelA}-vs-${modelB}: HTML=${output}, prices.json=${expected.output}`
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`[FAIL] Build integrity check failed with ${failures.length} issue(s):`);
  for (const f of failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
}

console.log(`[OK] Build integrity check passed. Verified ${checked} compare page(s) against prices.json.`);
process.exit(0);
