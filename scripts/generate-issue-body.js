#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PRICES_PATH = path.resolve(__dirname, '..', 'public', 'api', 'v1', 'prices.json');

const rawProviders = process.env.PRICE_CHANGES;

if (!rawProviders) {
  console.error('[FAIL] PRICE_CHANGES environment variable is not set. ' +
    'Provide a comma-separated list of provider display names or IDs (e.g. "OpenAI,Anthropic").');
  process.exit(1);
}

const providerNames = rawProviders
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

if (providerNames.length === 0) {
  console.error('[FAIL] PRICE_CHANGES is set but contains no provider names after parsing.');
  process.exit(1);
}

let prices;
try {
  prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
} catch (err) {
  console.error(`[FAIL] Could not read/parse prices.json: ${err.message}`);
  process.exit(1);
}

const activeModels = prices.models.filter((m) => m.active);

// Build a lookup: provider name (case-insensitive) → models[]
const providerToModels = {};
for (const model of activeModels) {
  const key = (model.provider || '').toLowerCase();
  if (!providerToModels[key]) providerToModels[key] = [];
  providerToModels[key].push(model);
}

// Also index by model id for fallback matching
const idToModel = {};
for (const model of activeModels) {
  idToModel[model.id.toLowerCase()] = model;
}

// Resolve each requested provider
const resolvedProviders = [];
const notFound = [];

for (const name of providerNames) {
  const nameLower = name.toLowerCase();
  // Try provider field match first
  if (providerToModels[nameLower]) {
    const models = providerToModels[nameLower];
    resolvedProviders.push({
      displayName: models[0].provider,
      models,
      pricingUrl: models[0].provider_pricing_url,
    });
  } else {
    // Try partial provider match
    const matchKey = Object.keys(providerToModels).find((k) => k.includes(nameLower) || nameLower.includes(k));
    if (matchKey) {
      const models = providerToModels[matchKey];
      resolvedProviders.push({
        displayName: models[0].provider,
        models,
        pricingUrl: models[0].provider_pricing_url,
      });
    } else {
      notFound.push(name);
    }
  }
}

if (notFound.length > 0) {
  console.error(
    `[FAIL] The following provider(s) were not found in prices.json: ${notFound.join(', ')}. ` +
    `Available providers: ${[...new Set(activeModels.map((m) => m.provider))].join(', ')}`
  );
  process.exit(1);
}

// Build the Markdown issue body
const lines = [];

lines.push('## Pricing Verification Required');
lines.push('');
lines.push(
  'The CI pricing check detected potential changes on one or more provider pricing pages. ' +
  'A human must verify the current prices and update `prices.json` accordingly.'
);
lines.push('');

for (const { displayName, models, pricingUrl } of resolvedProviders) {
  lines.push(`### ${displayName}`);
  lines.push('');
  lines.push(`**Pricing page:** ${pricingUrl}`);
  lines.push('');

  // Table header
  lines.push('| Model | Input (per 1M tokens) | Output (per 1M tokens) | Last Human Verified |');
  lines.push('|---|---|---|---|');

  for (const model of models) {
    const inputCost = model.input_cost_per_1m != null ? `$${model.input_cost_per_1m.toFixed(2)}` : 'N/A';
    const outputCost = model.output_cost_per_1m != null ? `$${model.output_cost_per_1m.toFixed(2)}` : 'N/A';
    const lastVerified = model.last_human_verified || 'Never';
    lines.push(`| ${model.display_name} (\`${model.id}\`) | ${inputCost} | ${outputCost} | ${lastVerified} |`);
  }

  lines.push('');
}

lines.push('## Resolution Instructions');
lines.push('');
lines.push('1. Navigate to each provider URL listed above.');
lines.push('2. Verify the current pricing matches the values in the table.');
lines.push('3. Update `public/api/v1/prices.json` with correct values.');
lines.push('4. Set `last_human_verified` to today\'s date in ISO 8601 format (e.g. `' + new Date().toISOString().split('T')[0] + 'T00:00:00Z`).');
lines.push('5. Open a pull request with your changes.');
lines.push('');
lines.push('Close this issue with: `Closes #[issue-number]` in your PR description.');

process.stdout.write(lines.join('\n') + '\n');
process.exit(0);
