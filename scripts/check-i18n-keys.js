#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'))

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? flattenKeys(v, prefix ? `${prefix}.${k}` : k)
      : [`${prefix ? prefix + '.' : ''}${k}`]
  )
}

const enKeys = new Set(flattenKeys(en))
const locales = ['de', 'es', 'fr', 'pt-BR']
let hasWarnings = false

for (const locale of locales) {
  const file = path.join(LOCALES_DIR, `${locale}.json`)
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const localeKeys = new Set(flattenKeys(data))
  for (const key of enKeys) {
    if (!localeKeys.has(key)) {
      console.warn(`[i18n] ${locale}.json missing key: ${key}`)
      hasWarnings = true
    }
  }
}

if (hasWarnings) {
  console.warn('[i18n] Missing keys will fall back to English at runtime.')
} else {
  console.log('[i18n] All locale files are complete.')
}
// Exits 0 always — warnings only, does not block builds
