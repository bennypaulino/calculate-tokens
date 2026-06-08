import en from '../locales/en.json'
import de from '../locales/de.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import pt_BR from '../locales/pt-BR.json'

// All imports unconditional — Turbopack cannot tree-shake dynamic template imports.
// All locale JSONs are ~5–10 KB each; overhead is negligible.
const LOCALE_MAP = { en, de, es, fr, 'pt-BR': pt_BR } as const
export type Locale = 'en' | 'de' | 'es' | 'fr' | 'pt-BR'

const raw = (process.env.NEXT_PUBLIC_LOCALE ?? 'en') as Locale
export const locale: Locale = (raw in LOCALE_MAP) ? raw : 'en'
const strings = LOCALE_MAP[locale]

export function t(path: string, vars?: Record<string, string | number>): string {
  const walk = (obj: unknown, keys: string[]): string | undefined => {
    for (const key of keys) {
      if (obj == null || typeof obj !== 'object') return undefined
      obj = (obj as Record<string, unknown>)[key]
    }
    return typeof obj === 'string' ? obj : undefined
  }
  const keys = path.split('.')
  const resolved =
    walk(strings, keys) ??
    (locale !== 'en' ? walk(en, keys) : undefined) ??
    path
  if (!vars) return resolved
  return resolved.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`))
}

const BASE_URLS: Record<Locale, string> = {
  en: 'https://calculatetokens.com',
  de: 'https://de.calculatetokens.com',
  es: 'https://es.calculatetokens.com',
  fr: 'https://fr.calculatetokens.com',
  'pt-BR': 'https://pt-br.calculatetokens.com',
}
export const getBaseUrl = (): string => BASE_URLS[locale]

export function getHreflangAlternates(path: string): Record<string, string> {
  return {
    en: `https://calculatetokens.com${path}`,
    de: `https://de.calculatetokens.com${path}`,
    es: `https://es.calculatetokens.com${path}`,
    fr: `https://fr.calculatetokens.com${path}`,
    'pt-BR': `https://pt-br.calculatetokens.com${path}`,
    'x-default': `https://calculatetokens.com${path}`,
  }
}

const LOCALE_CONFIG: Record<Locale, { htmlLang: string; ogLocale: string }> = {
  en:      { htmlLang: 'en',    ogLocale: 'en_US' },
  de:      { htmlLang: 'de',    ogLocale: 'de_DE' },
  es:      { htmlLang: 'es',    ogLocale: 'es_ES' },
  fr:      { htmlLang: 'fr',    ogLocale: 'fr_FR' },
  'pt-BR': { htmlLang: 'pt-BR', ogLocale: 'pt_BR' },
}
export const getLocaleConfig = () => LOCALE_CONFIG[locale]
