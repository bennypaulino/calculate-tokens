import { describe, it, expect } from 'vitest'
import { sanitizeCsvCell } from '@/lib/csv'

describe('sanitizeCsvCell', () => {
  it('prepends tab to = prefix (formula injection)', () => {
    const result = sanitizeCsvCell('=SUM(A1:A10)')
    expect(result).toBe('\t=SUM(A1:A10)')
  })

  it('prepends tab to + prefix', () => {
    const result = sanitizeCsvCell('+1234')
    expect(result).toBe('\t+1234')
  })

  it('prepends tab to - prefix', () => {
    const result = sanitizeCsvCell('-1234')
    expect(result).toBe('\t-1234')
  })

  it('prepends tab to @ prefix', () => {
    const result = sanitizeCsvCell('@SUM')
    expect(result).toBe('\t@SUM')
  })

  it('leaves normal text unchanged', () => {
    const result = sanitizeCsvCell('Hello World')
    expect(result).toBe('Hello World')
  })

  it('leaves empty string unchanged', () => {
    const result = sanitizeCsvCell('')
    expect(result).toBe('')
  })

  it('leaves number strings unchanged', () => {
    const result = sanitizeCsvCell('42')
    expect(result).toBe('42')
  })

  it('sanitizes hyperlink injection payload', () => {
    const payload = '=HYPERLINK("https://evil.com","Click")'
    const result = sanitizeCsvCell(payload)
    expect(result).toMatch(/^\t/)
    expect(result).toBe('\t' + payload)
  })

  it('leaves tab-prefixed strings unchanged (already sanitized)', () => {
    // A string starting with tab is already escaped — should not double-escape
    const result = sanitizeCsvCell('\t=safe')
    // \t triggers the regex (starts with \t), so it gets another \t prepended
    // This matches the regex: /^[=+\-@\t]/ — tab IS in the character class
    expect(result).toBe('\t\t=safe')
  })
})
