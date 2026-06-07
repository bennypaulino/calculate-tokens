import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { decodeUrlState, encodeUrlState } from '@/lib/urlState'

describe('decodeUrlState — malformed / missing params use defaults', () => {
  it('returns empty object for empty search string', () => {
    const result = decodeUrlState('')
    expect(result).toEqual({})
  })

  it('ignores NaN out value and falls back to no out key', () => {
    const result = decodeUrlState('?out=abc')
    expect(result.out).toBeUndefined()
  })

  it('clamps out to 0 minimum', () => {
    const result = decodeUrlState('?out=-100')
    expect(result.out).toBe(0)
  })

  it('clamps out to 8000 maximum', () => {
    const result = decodeUrlState('?out=99999')
    expect(result.out).toBe(8000)
  })

  it('clamps vol to 1 minimum', () => {
    const result = decodeUrlState('?vol=0')
    expect(result.vol).toBe(1)
  })

  it('clamps vol to 100000000 maximum', () => {
    const result = decodeUrlState('?vol=999999999')
    expect(result.vol).toBe(100000000)
  })

  it('parses out=500 correctly', () => {
    const result = decodeUrlState('?out=500')
    expect(result.out).toBe(500)
  })

  it('parses vol=10000 correctly', () => {
    const result = decodeUrlState('?vol=10000')
    expect(result.vol).toBe(10000)
  })

  it('parses think=1 as true', () => {
    const result = decodeUrlState('?think=1')
    expect(result.think).toBe(true)
  })

  it('parses think=0 as false', () => {
    const result = decodeUrlState('?think=0')
    expect(result.think).toBe(false)
  })

  it('parses models list', () => {
    const result = decodeUrlState('?models=gpt-4o,claude-3-5-sonnet')
    expect(result.models).toEqual(['gpt-4o', 'claude-3-5-sonnet'])
  })

  it('ignores empty models string', () => {
    const result = decodeUrlState('?models=')
    expect(result.models).toBeUndefined()
  })
})

describe('decodeUrlState — prototype pollution safety', () => {
  let originalProto: Record<string, unknown>

  beforeEach(() => {
    originalProto = { ...Object.prototype }
  })

  afterEach(() => {
    // Clean up any pollution that may have occurred
    const protoAny = Object.prototype as Record<string, unknown>
    for (const key of Object.keys(protoAny)) {
      if (!(key in originalProto)) {
        delete protoAny[key]
      }
    }
  })

  it('does not modify Object.prototype via __proto__ param', () => {
    decodeUrlState('?__proto__[x]=y&constructor=evil')
    expect(({} as Record<string, unknown>).x).toBeUndefined()
  })

  it('does not add constructor pollution via URL params', () => {
    decodeUrlState('?constructor[prototype][polluted]=true')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('encodeUrlState — never includes text/prompt content', () => {
  it('does not include t= parameter', () => {
    const encoded = encodeUrlState({ out: 500, think: false })
    expect(encoded).not.toContain('t=')
  })

  it('does not include text= parameter', () => {
    const encoded = encodeUrlState({ out: 500 })
    expect(encoded).not.toContain('text=')
  })

  it('omits out when it is the default (500)', () => {
    const encoded = encodeUrlState({ out: 500 })
    expect(encoded).not.toContain('out=')
  })

  it('includes out when non-default', () => {
    const encoded = encodeUrlState({ out: 200 })
    expect(encoded).toContain('out=200')
  })

  it('omits vol when it is the default (10000)', () => {
    const encoded = encodeUrlState({ vol: 10000 })
    expect(encoded).not.toContain('vol=')
  })

  it('includes vol when non-default', () => {
    const encoded = encodeUrlState({ vol: 5000 })
    expect(encoded).toContain('vol=5000')
  })

  it('includes think=1 when true', () => {
    const encoded = encodeUrlState({ think: true })
    expect(encoded).toContain('think=1')
  })

  it('omits think when false', () => {
    const encoded = encodeUrlState({ think: false })
    expect(encoded).not.toContain('think=')
  })

  it('returns empty string when all params are defaults', () => {
    const encoded = encodeUrlState({ out: 500, think: false, vol: 10000 })
    expect(encoded).toBe('')
  })

  it('returns string starting with ? when params exist', () => {
    const encoded = encodeUrlState({ out: 100 })
    expect(encoded).toMatch(/^\?/)
  })
})
