#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRICES_PATH = path.resolve(__dirname, '..', 'public', 'api', 'v1', 'prices.json');
const HEADERS_PATH = path.resolve(__dirname, '..', 'public', '_headers');

// Read prices.json
if (!fs.existsSync(PRICES_PATH)) {
  console.error('[FAIL] public/api/v1/prices.json not found. Run this script after prices.json is committed.');
  process.exit(1);
}

const pricesContent = fs.readFileSync(PRICES_PATH, 'utf8');
const hash = crypto.createHash('sha256').update(pricesContent).digest('hex');

// Read existing _headers or start with empty string
let headersContent = '';
if (fs.existsSync(HEADERS_PATH)) {
  headersContent = fs.readFileSync(HEADERS_PATH, 'utf8');
}

// The replacement block for /api/v1/prices.json section
const newPricesSection =
  `/api/v1/prices.json\n` +
  `  X-Content-Hash: ${hash}\n` +
  `  Access-Control-Allow-Origin: *\n` +
  `  Content-Type: application/json; charset=utf-8\n` +
  `  Cache-Control: public, max-age=86400, stale-while-revalidate=86400`;

// Match the existing /api/v1/prices.json section (path line + all indented header lines that follow)
const sectionRegex = /^\/api\/v1\/prices\.json\n(?:[ \t]+[^\n]+\n?)*/m;

if (sectionRegex.test(headersContent)) {
  // Replace existing section
  headersContent = headersContent.replace(sectionRegex, newPricesSection);
} else {
  // Prepend new section at the top
  headersContent = newPricesSection + '\n\n' + headersContent;
}

fs.writeFileSync(HEADERS_PATH, headersContent, 'utf8');

console.log(`Computed X-Content-Hash: ${hash}`);
console.log(`Updated public/_headers with X-Content-Hash for /api/v1/prices.json`);
process.exit(0);
