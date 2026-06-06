#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PRICES_PATH = path.resolve(__dirname, '..', 'public', 'api', 'v1', 'prices.json');

if (!fs.existsSync(PRICES_PATH)) {
  console.error('[FAIL] public/api/v1/prices.json not found.');
  process.exit(1);
}

let prices;
try {
  prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
} catch (err) {
  console.error(`[FAIL] Could not parse prices.json: ${err.message}`);
  process.exit(1);
}

const timestamp = new Date().toISOString();
const activeModels = prices.models.filter((m) => m.active);

for (const model of prices.models) {
  if (model.active) {
    model.last_checked = timestamp;
  }
}

fs.writeFileSync(PRICES_PATH, JSON.stringify(prices, null, 2) + '\n', 'utf8');

console.log(`Updated last_checked for ${activeModels.length} model(s) to ${timestamp}`);
process.exit(0);
