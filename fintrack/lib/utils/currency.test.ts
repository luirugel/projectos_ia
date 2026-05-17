import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats USD with two decimals', () => {
    const out = formatCurrency(1234.5)
    expect(out).toContain('1.234,5') // es-EC grouping/decimal
    expect(out).toMatch(/\$/)
  })

  it('handles zero and negatives', () => {
    expect(formatCurrency(0)).toMatch(/0,00/)
    expect(formatCurrency(-10)).toMatch(/10,00/)
  })
})

describe('parseCurrency', () => {
  it('parses a plain numeric string', () => {
    expect(parseCurrency('1234.56')).toBeCloseTo(1234.56, 2)
  })

  it('strips a leading currency symbol', () => {
    expect(parseCurrency('$50')).toBe(50)
  })

  it('returns 0 for non-numeric input', () => {
    expect(parseCurrency('abc')).toBe(0)
  })
})
