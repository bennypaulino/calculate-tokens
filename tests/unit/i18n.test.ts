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
})
