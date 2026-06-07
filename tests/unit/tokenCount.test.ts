import { describe, it, expect } from 'vitest'
import { formatCost, heuristicCount } from '@/lib/tokenCount'

describe('formatCost', () => {
  it('returns $0.0000 for zero', () => {
    expect(formatCost(0)).toBe('$0.0000')
  })

  it('returns two decimal places for values >= 1', () => {
    expect(formatCost(1.0)).toBe('$1.00')
    expect(formatCost(5.5)).toBe('$5.50')
    expect(formatCost(100.123)).toBe('$100.12')
  })

  it('returns three decimal places for 0.01 to 0.99', () => {
    expect(formatCost(0.01)).toBe('$0.010')
    expect(formatCost(0.5)).toBe('$0.500')
    expect(formatCost(0.999)).toBe('$0.999')
  })

  it('returns four decimal places for values < 0.01', () => {
    expect(formatCost(0.001)).toBe('$0.0010')
    expect(formatCost(0.0075)).toBe('$0.0075')
    expect(formatCost(0.0001)).toBe('$0.0001')
  })

  it('boundary: exactly 1.00 uses two decimal places', () => {
    expect(formatCost(1.00)).toBe('$1.00')
  })

  it('boundary: exactly 0.01 uses three decimal places', () => {
    expect(formatCost(0.01)).toBe('$0.010')
  })
})

describe('heuristicCount', () => {
  it('divides char count by 4 and rounds up for 400 chars -> 100 tokens', () => {
    expect(heuristicCount(400)).toBe(100)
  })

  it('divides char count by 4 and rounds up for 1000 chars -> 250 tokens', () => {
    expect(heuristicCount(1000)).toBe(250)
  })

  it('rounds up for non-divisible counts', () => {
    // 401 / 4 = 100.25 -> ceil -> 101
    expect(heuristicCount(401)).toBe(101)
  })

  it('returns 0 for 0 chars', () => {
    expect(heuristicCount(0)).toBe(0)
  })

  it('returns 1 for 1-4 chars', () => {
    expect(heuristicCount(1)).toBe(1)
    expect(heuristicCount(4)).toBe(1)
  })
})
