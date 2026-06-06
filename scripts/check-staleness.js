#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const pricesPath = path.resolve(__dirname, '../public/api/v1/prices.json');

if (!fs.existsSync(pricesPath)) {
  console.error('[FAIL] public/api/v1/prices.json not found.');
  process.exit(0);
}

const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
const activeModels = prices.models.filter((m) => m.active);

const now = new Date();
const summaryLines = [];
let hasWarnings = false;
let hasErrors = false;

for (const model of activeModels) {
  if (!model.last_human_verified) {
    const msg = `WARNING: ${model.display_name} (${model.id}) has no last_human_verified date.`;
    console.warn(msg);
    summaryLines.push(`- ${msg}`);
    hasWarnings = true;
    continue;
  }

  const verified = new Date(model.last_human_verified);
  const diffMs = now - verified;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    const msg = `ERROR: ${model.display_name} (${model.id}) last_human_verified ${diffDays} days ago (${model.last_human_verified}). Immediate review required.`;
    console.error(msg);
    summaryLines.push(`- :x: ${msg}`);
    hasErrors = true;
  } else if (diffDays >= 15) {
    const msg = `WARNING: ${model.display_name} (${model.id}) last_human_verified ${diffDays} days ago (${model.last_human_verified}). Review soon.`;
    console.warn(msg);
    summaryLines.push(`- :warning: ${msg}`);
    hasWarnings = true;
  }
}

if (!hasWarnings && !hasErrors) {
  console.log(`[OK] All ${activeModels.length} active models have recent human verification (within 15 days).`);
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile && summaryLines.length > 0) {
  const header = hasErrors
    ? '## :x: Pricing Staleness Errors\n'
    : '## :warning: Pricing Staleness Warnings\n';
  const body = header + summaryLines.join('\n') + '\n';
  fs.appendFileSync(summaryFile, body, 'utf8');
}

process.exit(0);
