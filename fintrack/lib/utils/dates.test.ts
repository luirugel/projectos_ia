import { describe, it, expect } from 'vitest'
import { formatDateRelative, toISODate } from './dates'

function shift(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

describe('formatDateRelative', () => {
  it('labels today and yesterday', () => {
    expect(formatDateRelative(new Date())).toBe('Hoy')
    expect(formatDateRelative(shift(-1))).toBe('Ayer')
  })

  it('labels tomorrow (S3 — future dates)', () => {
    expect(formatDateRelative(shift(1))).toBe('Mañana')
  })

  it('never labels a future date as a past weekday (S3)', () => {
    // 3 days ahead used to fall into the "diff < 7" weekday branch.
    const result = formatDateRelative(shift(3))
    expect(result).not.toMatch(/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i)
  })

  it('returns empty string for an invalid date', () => {
    expect(formatDateRelative('not-a-date')).toBe('')
  })
})

describe('toISODate', () => {
  it('formats as yyyy-MM-dd', () => {
    expect(toISODate(new Date(2026, 4, 9))).toBe('2026-05-09')
  })
})
