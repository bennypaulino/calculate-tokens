#!/usr/bin/env node
// Warns when a locale value is identical to the English value — possible untranslated content.
// Skips intentionally-English terms: presets.*, model names, provider names, technical glossary.
'use strict'
const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'))

// Keys whose values are intentionally identical to English across all locales
const SKIP_PREFIXES = ['presets.']
// Values that are never translated regardless of key
const ALWAYS_ENGLISH = new Set([
  'token', 'context window', 'API', 'WebAssembly', 'batch',
  'Calculate Tokens', 'MIT License',
])

function flattenPairs(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const fullKey = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null
      ? flattenPairs(v, fullKey)
      : [{ key: fullKey, value: String(v) }]
  })
}

const enPairs = flattenPairs(en)
const locales = ['de', 'es', 'fr', 'pt-BR']
let warned = false

for (const locale of locales) {
  const file = path.join(LOCALES_DIR, `${locale}.json`)
  if (!fs.existsSync(file)) continue
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
  // Build map once per locale — O(N) instead of O(N²) from calling flattenPairs inside the enPairs loop
  const localeMap = new Map(flattenPairs(data).map(p => [p.key, p.value]))

  for (const { key, value: enValue } of enPairs) {
    if (SKIP_PREFIXES.some(p => key.startsWith(p))) continue
    if (ALWAYS_ENGLISH.has(enValue)) continue
    if (enValue.length < 4) continue // skip short tokens, symbols, punctuation

    const localeValue = localeMap.get(key)
    if (localeValue !== undefined && localeValue === enValue) {
      console.warn(`[i18n-stale?] ${locale}.${key} — value identical to English: "${enValue}"`)
      warned = true
    }
  }
}

if (warned) {
  console.warn('[i18n-stale] Review warnings above — these may be untranslated strings.')
} else {
  console.log('[i18n-stale] No stale translations detected.')
}
// Exits 0 always — warnings only, does not block builds
