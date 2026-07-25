#!/usr/bin/env node
'use strict';

/**
 * Renders the body of the pricing-staleness escalation issue.
 *
 * Model-keyed, unlike generate-issue-body.js which is provider-keyed and
 * hard-exits when PRICE_CHANGES is unset -- overloading it would couple two
 * unrelated alerts.
 *
 * Embeds a machine-readable state comment so the workflow can tell a genuine
 * change from a no-op and comment only on a delta, rather than daily.
 */

const fs = require('fs');
const path = require('path');

const prices = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../public/api/v1/prices.json'), 'utf8')
);

const now = new Date();
const days = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

const active = prices.models.filter((m) => m.active);
const critical = [];
const overdue = [];
const waived = [];

for (const m of active) {
  if (!m.last_human_verified) continue;
  const age = days(now, new Date(m.last_human_verified));
  const waiver = m.verification_waiver_until ? new Date(m.verification_waiver_until) : null;
  if (waiver && days(waiver, now) >= 0) {
    waived.push({ ...m, age, left: days(waiver, now) });
  } else if (age >= 45) {
    critical.push({ ...m, age });
  } else if (age >= 30) {
    overdue.push({ ...m, age });
  }
}

const row = (m) =>
  `| ${m.display_name} (\`${m.id}\`) | ${m.provider} | ${m.age}d | $${m.input_cost_per_1m} / $${m.output_cost_per_1m} | ${m.provider_pricing_url} |`;

const out = [];
out.push('Model pricing has gone unverified past the escalation threshold.');
out.push('');
out.push(
  'This is opened by the daily pricing check. It is **not** about a provider page changing — ' +
    'it means nobody has confirmed these numbers against the vendor recently.'
);
out.push('');
out.push(
  'Context for why this exists: `claude-haiku-4-5` carried retired Claude Haiku 3.5 pricing ' +
    '($0.80/$4.00 rather than $1.00/$5.00) for roughly seven weeks while the staleness check ' +
    'flagged it every day. Detection was never the gap.'
);
out.push('');

if (critical.length > 0) {
  out.push(`## Critical — 45+ days (fails the daily run)`);
  out.push('');
  out.push('| Model | Provider | Age | Recorded price | Pricing page |');
  out.push('|---|---|---|---|---|');
  critical.forEach((m) => out.push(row(m)));
  out.push('');
}

if (overdue.length > 0) {
  out.push(`## Overdue — 30+ days`);
  out.push('');
  out.push('| Model | Provider | Age | Recorded price | Pricing page |');
  out.push('|---|---|---|---|---|');
  overdue.forEach((m) => out.push(row(m)));
  out.push('');
}

if (waived.length > 0) {
  out.push('## Waived — not blocking, but expiring');
  out.push('');
  out.push('| Model | Waiver expires | Days left | Reason |');
  out.push('|---|---|---|---|');
  waived.forEach((m) =>
    out.push(
      `| ${m.display_name} (\`${m.id}\`) | ${m.verification_waiver_until} | ${m.left}d | ${m.verification_waiver_reason} |`
    )
  );
  out.push('');
}

out.push('## To resolve');
out.push('');
out.push('For each model above, open its pricing page and confirm input price, output price,');
out.push('context window, and any long-context tier. Then either:');
out.push('');
out.push('- set `last_human_verified` to today, **or**');
out.push(
  '- if the price genuinely cannot be verified (vendor delisted or retired the model), add ' +
    '`verification_waiver_until` + `verification_waiver_reason`. Waivers are capped at 90 days ' +
    'and an expired one fails CI, so they are a dated commitment rather than an off switch.'
);
out.push('');
out.push('Do not bump `last_human_verified` for a model you did not actually check — that field');
out.push('is the audit trail, and a false entry is worse than a stale one.');
out.push('');
out.push(
  `<!-- staleness-state: ${JSON.stringify({
    critical: critical.map((m) => m.id).sort(),
    overdue: overdue.map((m) => m.id).sort(),
  })} -->`
);

process.stdout.write(out.join('\n') + '\n');
