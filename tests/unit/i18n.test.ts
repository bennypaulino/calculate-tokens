import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('i18n t()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns English string when NEXT_PUBLIC_LOCALE=en', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { t } = await import('@/lib/i18n')
    expect(t('nav.home')).toBe('Calculate Tokens')
  })

  it('returns German string when NEXT_PUBLIC_LOCALE=de', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    const { t } = await import('@/lib/i18n')
    expect(t('nav.home')).toBe('Token-Rechner')
  })

  it('returns pt-BR string when NEXT_PUBLIC_LOCALE=pt-BR', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'pt-BR')
    const { t } = await import('@/lib/i18n')
    expect(t('nav.whatIsToken')).toBe('O que é um token?')
  })

  it('returns key-as-string for nonexistent key without throwing', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { t } = await import('@/lib/i18n')
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('falls back to English when key is missing from de.json', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    vi.doMock('@/locales/de.json', () => ({ default: { nav: {} } }))
    const { t } = await import('@/lib/i18n')
    expect(t('nav.home')).toBe('Calculate Tokens')
  })

  it('interpolates count variable correctly', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { t } = await import('@/lib/i18n')
    const result = t('calculator.compareAll', { count: 5 })
    expect(result).toContain('5')
  })

  it('returns {{count}} sentinel when variable is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { t } = await import('@/lib/i18n')
    const result = t('calculator.compareAll', {})
    expect(result).toContain('{{count}}')
  })

  it('falls back to en when NEXT_PUBLIC_LOCALE is an invalid value', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'zz')
    const { locale } = await import('@/lib/i18n')
    expect(locale).toBe('en')
  })
})

describe('i18n getBaseUrl()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns English root for en locale', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { getBaseUrl } = await import('@/lib/i18n')
    expect(getBaseUrl()).toBe('https://calculatetokens.com')
  })

  it('returns German subdomain for de locale', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    const { getBaseUrl } = await import('@/lib/i18n')
    expect(getBaseUrl()).toBe('https://de.calculatetokens.com')
  })

  it('returns pt-BR subdomain for pt-BR locale', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'pt-BR')
    const { getBaseUrl } = await import('@/lib/i18n')
    expect(getBaseUrl()).toBe('https://pt-br.calculatetokens.com')
  })
})

describe('i18n getHreflangAlternates()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('x-default points to the English canonical URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    const { getHreflangAlternates } = await import('@/lib/i18n')
    const alts = getHreflangAlternates('/models')
    expect(alts['x-default']).toBe('https://calculatetokens.com/models/')
  })

  it('de alternate uses German subdomain with the given path', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    const { getHreflangAlternates } = await import('@/lib/i18n')
    const alts = getHreflangAlternates('/models')
    expect(alts.de).toBe('https://de.calculatetokens.com/models/')
  })

  // Guards the `trailingSlash: true` invariant in next.config.ts: every
  // alternate must end in exactly one slash, and root must not become "//".
  it('appends a trailing slash without doubling it on root', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { getHreflangAlternates } = await import('@/lib/i18n')

    for (const url of Object.values(getHreflangAlternates('/compare'))) {
      expect(url.endsWith('/compare/')).toBe(true)
    }
    for (const url of Object.values(getHreflangAlternates('/'))) {
      expect(url.endsWith('//')).toBe(false)
      expect(url.endsWith('/')).toBe(true)
    }
  })

  it('includes all 5 locale keys plus x-default', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'en')
    const { getHreflangAlternates } = await import('@/lib/i18n')
    const alts = getHreflangAlternates('/')
    expect(Object.keys(alts).sort()).toEqual(['de', 'en', 'fr', 'pt-BR', 'x-default', 'es'].sort())
  })
})

describe('i18n getLocaleConfig()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns correct htmlLang and ogLocale for de', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'de')
    const { getLocaleConfig } = await import('@/lib/i18n')
    expect(getLocaleConfig()).toEqual({ htmlLang: 'de', ogLocale: 'de_DE' })
  })

  it('returns correct htmlLang and ogLocale for pt-BR', async () => {
    vi.stubEnv('NEXT_PUBLIC_LOCALE', 'pt-BR')
    const { getLocaleConfig } = await import('@/lib/i18n')
    expect(getLocaleConfig()).toEqual({ htmlLang: 'pt-BR', ogLocale: 'pt_BR' })
  })
})
