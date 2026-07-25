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

function ensureTrailingSlash(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.endsWith('/') ? p : `${p}/`;
}

/** Returns the canonical URL for a page path, always with a trailing slash.
 *  Consistent with `trailingSlash: true` in next.config.ts. */
export function canonicalUrl(path: string = '/'): string {
  return `${getBaseUrl()}${ensureTrailingSlash(path)}`;
}

export function getHreflangAlternates(path: string): Record<string, string> {
  const p = ensureTrailingSlash(path);
  return {
    en: `https://calculatetokens.com${p}`,
    de: `https://de.calculatetokens.com${p}`,
    es: `https://es.calculatetokens.com${p}`,
    fr: `https://fr.calculatetokens.com${p}`,
    'pt-BR': `https://pt-br.calculatetokens.com${p}`,
    'x-default': `https://calculatetokens.com${p}`,
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

/**
 * Metadata fragment for pages that exist only in English.
 *
 * /learn/what-is-a-token/, /about/, /contact/ and /privacy/ are hardcoded
 * English JSX with no locale keys, but the static export builds them for every
 * locale subdomain and the nav links them from every page. Each one
 * self-canonicalised to its own subdomain, so de/es/fr/pt-BR each served a
 * verbatim English duplicate declaring <html lang="de"> — 16 duplicate URLs,
 * including the site's flagship explainer cannibalised four times.
 *
 * noindex rather than a cross-host canonical: these are untranslated pages that
 * do not belong in a German or Spanish index at all, and a canonical pointing
 * across hosts is advisory only. follow stays true so the links still pass.
 */
export function englishOnlyRobots() {
  return locale === 'en' ? {} : { robots: { index: false, follow: true } };
}
