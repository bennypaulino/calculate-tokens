#!/usr/bin/env node
'use strict';

/**
 * Reports how long each active model has gone without human verification.
 *
 * Three tiers. The thresholds matter because the previous single-tier version
 * always exited 0: claude-haiku-4-5 carried retired Claude Haiku 3.5's price
 * ($0.80/$4.00 instead of $1.00/$5.00) for ~7 weeks while this script flagged
 * it daily. Detection was never the problem; nothing forced anyone to act.
 *
 *   >= 15 days  WARN      step-summary only
 *   >= 30 days  ERROR     escalation job opens/maintains a GitHub issue
 *   >= 45 days  CRITICAL  escalation job exits 1, so the daily run goes red
 *
 * Default invocation still exits 0, so the `validate` job it runs in cannot
 * block timestamp persistence or price-change alerting. Only the dedicated
 * escalation job passes --fail-on-critical.
 *
 * Flags:
 *   --fail-on-critical        exit 1 if any non-waived model is >= 45 days
 *   --fail-on-expired-waiver  exit 1 if any verification waiver has lapsed
 *   --json                    machine-readable summary on stdout
 */

const fs = require('fs');
const path = require('path');

const WARN_DAYS = 15;
const ERROR_DAYS = 30;
const CRITICAL_DAYS = 45;
/** A waiver is a dated commitment, not an off switch. */
const MAX_WAIVER_DAYS = 90;

const args = process.argv.slice(2);
const failOnCritical = args.includes('--fail-on-critical');
const failOnExpiredWaiver = args.includes('--fail-on-expired-waiver');
const asJson = args.includes('--json');

const pricesPath = path.resolve(__dirname, '../public/api/v1/prices.json');

if (!fs.existsSync(pricesPath)) {
  console.error('[FAIL] public/api/v1/prices.json not found.');
  process.exit(0);
}

const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
const activeModels = prices.models.filter((m) => m.active);

const now = new Date();
const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

const buckets = { critical: [], error: [], warn: [], waived: [], expiredWaiver: [], corrupt: [] };

for (const model of activeModels) {
  const label = `${model.display_name} (${model.id})`;

  if (!model.last_human_verified) {
    buckets.corrupt.push({ ...model, label, why: 'no last_human_verified date' });
    continue;
  }

  const verified = new Date(model.last_human_verified);
  if (Number.isNaN(verified.getTime())) {
    buckets.corrupt.push({ ...model, label, why: `unparseable date ${model.last_human_verified}` });
    continue;
  }

  const diffDays = daysBetween(now, verified);

  // A future date would otherwise age backwards and pass forever.
  if (diffDays < 0) {
    buckets.corrupt.push({
      ...model,
      label,
      why: `last_human_verified is ${-diffDays} days in the FUTURE (${model.last_human_verified})`,
    });
    continue;
  }

  const waiverUntil = model.verification_waiver_until
    ? new Date(model.verification_waiver_until)
    : null;

  if (waiverUntil && !Number.isNaN(waiverUntil.getTime())) {
    const daysLeft = daysBetween(waiverUntil, now);
    if (daysLeft >= 0) {
      // Waived models never go critical, but stay visible so they cannot
      // quietly become permanent.
      buckets.waived.push({ ...model, label, diffDays, daysLeft });
      continue;
    }
    buckets.expiredWaiver.push({ ...model, label, diffDays, daysLeft });
    // fall through: an expired waiver is no waiver
  }

  if (diffDays >= CRITICAL_DAYS) buckets.critical.push({ ...model, label, diffDays });
  else if (diffDays >= ERROR_DAYS) buckets.error.push({ ...model, label, diffDays });
  else if (diffDays >= WARN_DAYS) buckets.warn.push({ ...model, label, diffDays });
}

// Waivers issued for longer than MAX_WAIVER_DAYS are themselves a smell.
const overlongWaivers = buckets.waived.filter((m) => m.daysLeft > MAX_WAIVER_DAYS);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        critical: buckets.critical.map((m) => m.id),
        error: buckets.error.map((m) => m.id),
        warn: buckets.warn.map((m) => m.id),
        waived: buckets.waived.map((m) => ({ id: m.id, daysLeft: m.daysLeft })),
        expiredWaiver: buckets.expiredWaiver.map((m) => m.id),
        corrupt: buckets.corrupt.map((m) => m.id),
      },
      null,
      2
    )
  );
} else {
  for (const m of buckets.corrupt) console.error(`CORRUPT: ${m.label} ${m.why}.`);
  for (const m of buckets.expiredWaiver)
    console.error(
      `EXPIRED WAIVER: ${m.label} waiver lapsed ${-m.daysLeft} days ago (${m.verification_waiver_until}).`
    );
  for (const m of buckets.critical)
    console.error(
      `CRITICAL: ${m.label} last_human_verified ${m.diffDays} days ago (${m.last_human_verified}).`
    );
  for (const m of buckets.error)
    console.error(
      `ERROR: ${m.label} last_human_verified ${m.diffDays} days ago (${m.last_human_verified}). Immediate review required.`
    );
  for (const m of buckets.warn)
    console.warn(
      `WARNING: ${m.label} last_human_verified ${m.diffDays} days ago (${m.last_human_verified}). Review soon.`
    );
  for (const m of buckets.waived)
    console.log(
      `WAIVED: ${m.label} verification waived for ${m.daysLeft} more day(s) — ${m.verification_waiver_reason ?? 'no reason given'}.`
    );
  for (const m of overlongWaivers)
    console.warn(
      `WARNING: ${m.label} waiver runs ${m.daysLeft} days, beyond the ${MAX_WAIVER_DAYS}-day cap.`
    );

  const flagged =
    buckets.critical.length + buckets.error.length + buckets.warn.length + buckets.corrupt.length;
  if (flagged === 0) {
    console.log(
      `[OK] All ${activeModels.length} active models verified within ${WARN_DAYS} days ` +
        `(${buckets.waived.length} waived).`
    );
  }
}

// Emit for the escalation job. Mirrors check-page-changes.js.
const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  const escalate = [...buckets.critical, ...buckets.error].map((m) => m.id).join(',');
  fs.appendFileSync(githubOutput, `stale_models=${escalate}\n`, 'utf8');
  fs.appendFileSync(
    githubOutput,
    `stale_critical=${buckets.critical.map((m) => m.id).join(',')}\n`,
    'utf8'
  );
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  const lines = [
    ...buckets.corrupt.map((m) => `- :rotating_light: CORRUPT ${m.label} — ${m.why}`),
    ...buckets.expiredWaiver.map((m) => `- :rotating_light: EXPIRED WAIVER ${m.label}`),
    ...buckets.critical.map((m) => `- :x: CRITICAL ${m.label} — ${m.diffDays}d`),
    ...buckets.error.map((m) => `- :x: ${m.label} — ${m.diffDays}d`),
    ...buckets.warn.map((m) => `- :warning: ${m.label} — ${m.diffDays}d`),
    ...buckets.waived.map((m) => `- :pause_button: waived ${m.label} — ${m.daysLeft}d left`),
  ];
  if (lines.length > 0) {
    fs.appendFileSync(summaryFile, '## Pricing verification staleness\n' + lines.join('\n') + '\n', 'utf8');
  }
}

let exitCode = 0;
if (failOnCritical && (buckets.critical.length > 0 || buckets.corrupt.length > 0)) exitCode = 1;
if (failOnExpiredWaiver && buckets.expiredWaiver.length > 0) exitCode = 1;
process.exit(exitCode);
