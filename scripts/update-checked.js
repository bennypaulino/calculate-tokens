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

// Document-level, not per-model. The check runs once per provider pricing
// page, so a per-model field was writing the SAME value to every model --
// 20 lines of daily churn that conflicted with any open PR touching this
// file. One line, at the top, well away from the models array.
prices.last_checked = timestamp;

fs.writeFileSync(PRICES_PATH, JSON.stringify(prices, null, 2) + '\n', 'utf8');

console.log(`Updated last_checked to ${timestamp}`);
process.exit(0);
