#!/usr/bin/env node
'use strict';

// Enforces that every `canonical:` assignment in a .tsx page file routes
// through the canonicalUrl() helper from src/lib/i18n.ts.
// Raw string literals or bare getBaseUrl() calls bypass trailing-slash
// enforcement and will eventually cause GSC "Page with redirect" warnings.

const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const output = execSync(
  'grep -rn "canonical:" app/ --include="*.tsx" 2>/dev/null || true',
  { encoding: 'utf8', cwd: root }
);

const violations = output
  .split('\n')
  .filter(Boolean)
  .filter(line => !line.includes('canonicalUrl('));

if (violations.length > 0) {
  console.error('[FAIL] canonical: values found that do not use canonicalUrl():');
  violations.forEach(v => console.error('  ' + v));
  console.error('\nEvery canonical: must call canonicalUrl() from @/lib/i18n.');
  process.exit(1);
}

console.log('[OK] All canonical: values use canonicalUrl()');
