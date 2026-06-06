#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const exemptionsPath = path.resolve(__dirname, '../audit-exemptions.json');

if (!fs.existsSync(exemptionsPath)) {
  process.exit(0);
}

const exemptions = JSON.parse(fs.readFileSync(exemptionsPath, 'utf8'));

if (!Array.isArray(exemptions) || exemptions.length === 0) {
  process.exit(0);
}

const now = new Date();
const summaryLines = [];
let exitCode = 0;

for (const entry of exemptions) {
  const cve = entry.cve || entry.id || entry.rule || JSON.stringify(entry);
  const expiryStr = entry.expires || entry.expiry || entry.expiry_date;

  if (!expiryStr) {
    console.warn(`[WARN] Exemption ${cve} has no expiry date — skipping.`);
    continue;
  }

  const expiryDate = new Date(expiryStr);
  const diffMs = expiryDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const msg = `[FAIL] Expired audit exemption: ${cve} expired on ${expiryStr}. Remove or renew with owner approval.`;
    console.error(msg);
    summaryLines.push(`- :x: ${msg}`);
    exitCode = 1;
  } else if (diffDays <= 7) {
    const msg = `[WARN] Audit exemption ${cve} expires in ${diffDays} day(s) on ${expiryStr}. Owner: ${entry.owner || 'unspecified'}.`;
    console.warn(msg);
    summaryLines.push(`- :warning: ${msg}`);
  } else if (diffDays <= 30) {
    const msg = `[NOTICE] Audit exemption ${cve} expires in ${diffDays} day(s) on ${expiryStr}. Owner: ${entry.owner || 'unspecified'}.`;
    console.log(msg);
    summaryLines.push(`- :information_source: ${msg}`);
  }
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile && summaryLines.length > 0) {
  const header = exitCode !== 0
    ? '## :x: Expired Audit Exemptions\n'
    : '## :warning: Audit Exemption Expiry Notices\n';
  fs.appendFileSync(summaryFile, header + summaryLines.join('\n') + '\n', 'utf8');
}

process.exit(exitCode);
