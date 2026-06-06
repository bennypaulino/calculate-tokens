#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SECURITY_TXT_PATH = path.resolve(__dirname, '..', 'public', '.well-known', 'security.txt');

if (!fs.existsSync(SECURITY_TXT_PATH)) {
  console.error('[FAIL] public/.well-known/security.txt not found.');
  process.exit(1);
}

const content = fs.readFileSync(SECURITY_TXT_PATH, 'utf8');

// Extract the Expires: line value (RFC 9116)
const expiresMatch = content.match(/^Expires:\s*(.+)$/m);
if (!expiresMatch) {
  console.error('[FAIL] No "Expires:" field found in security.txt (required by RFC 9116).');
  process.exit(1);
}

const expiresStr = expiresMatch[1].trim();
const expiresDate = new Date(expiresStr);

if (isNaN(expiresDate.getTime())) {
  console.error(`[FAIL] Could not parse Expires date: "${expiresStr}"`);
  process.exit(1);
}

const now = new Date();

if (expiresDate < now) {
  console.error(`[FAIL] security.txt expired on ${expiresStr}. Update the Expires field.`);
  process.exit(1);
}

// Check if Expires is more than 12 months in the future (RFC 9116 §2.5.5)
const twelveMonthsFromNow = new Date(now);
twelveMonthsFromNow.setFullYear(twelveMonthsFromNow.getFullYear() + 1);

if (expiresDate > twelveMonthsFromNow) {
  console.error(
    `[FAIL] security.txt Expires (${expiresStr}) exceeds the 12-month maximum allowed by RFC 9116. ` +
    `Maximum allowed: ${twelveMonthsFromNow.toISOString()}`
  );
  process.exit(1);
}

const diffMs = expiresDate - now;
const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
console.log(`[PASS] security.txt Expires: ${expiresStr} — valid for ${diffDays} more day(s).`);
process.exit(0);
