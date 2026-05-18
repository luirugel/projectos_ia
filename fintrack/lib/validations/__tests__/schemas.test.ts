import { describe, it, expect } from 'vitest'
import { budgetSchema } from '../budget'
import { goalSchema, goalContributionSchema } from '../goal'

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

// ── Budget ─────────────────────────────────────────────────────────────────

describe('budgetSchema', () => {
  const BASE = {
    category_id: VALID_UUID,
    amount_limit: 500,
    period: 'monthly' as const,
    alert_at_50: true,
    alert_at_80: true,
    alert_at_100: true,
    rollover: false,
  }

  it('accepts valid budget', () => {
    expect(budgetSchema.safeParse(BASE).success).toBe(true)
  })

  it('rejects invalid category_id', () => {
    const r = budgetSchema.safeParse({ ...BASE, category_id: 'not-uuid' })
    expect(r.success).toBe(false)
  })

  it('rejects non-positive amount', () => {
    expect(budgetSchema.safeParse({ ...BASE, amount_limit: 0 }).success).toBe(false)
    expect(budgetSchema.safeParse({ ...BASE, amount_limit: -1 }).success).toBe(false)
  })

  it('rejects invalid period', () => {
    const r = budgetSchema.safeParse({ ...BASE, period: 'daily' })
    expect(r.success).toBe(false)
  })

  it('accepts all valid periods', () => {
    for (const period of ['weekly', 'monthly', 'yearly'] as const) {
      expect(budgetSchema.safeParse({ ...BASE, period }).success).toBe(true)
    }
  })
})

// ── Goal ───────────────────────────────────────────────────────────────────

describe('goalSchema', () => {
  const BASE = {
    name: 'Vacaciones',
    target_amount: 2000,
    current_amount: 500,
    icon: 'plane',
    color: '#10b981',
  }

  it('accepts valid goal', () => {
    expect(goalSchema.safeParse(BASE).success).toBe(true)
  })

  it('requires non-empty name', () => {
    expect(goalSchema.safeParse({ ...BASE, name: '' }).success).toBe(false)
  })

  it('caps name at 100 chars', () => {
    expect(goalSchema.safeParse({ ...BASE, name: 'a'.repeat(101) }).success).toBe(false)
  })

  it('rejects non-positive target', () => {
    expect(goalSchema.safeParse({ ...BASE, target_amount: 0 }).success).toBe(false)
  })

  it('rejects negative current_amount', () => {
    expect(goalSchema.safeParse({ ...BASE, current_amount: -1 }).success).toBe(false)
  })

  it('rejects invalid hex color', () => {
    expect(goalSchema.safeParse({ ...BASE, color: 'red' }).success).toBe(false)
    expect(goalSchema.safeParse({ ...BASE, color: '#gggggg' }).success).toBe(false)
    expect(goalSchema.safeParse({ ...BASE, color: '#fff' }).success).toBe(false)
  })

  it('accepts valid hex color', () => {
    expect(goalSchema.safeParse({ ...BASE, color: '#FF5733' }).success).toBe(true)
  })

  it('accepts undefined target_date (optional)', () => {
    const r = goalSchema.safeParse({ ...BASE, target_date: undefined })
    expect(r.success).toBe(true)
  })

  it('accepts null target_date', () => {
    const r = goalSchema.safeParse({ ...BASE, target_date: null })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.target_date).toBeNull()
  })

  it('rejects malformed target_date', () => {
    expect(goalSchema.safeParse({ ...BASE, target_date: '15-01-2025' }).success).toBe(false)
  })

  it('rejects empty string target_date (regex requires valid ISO date)', () => {
    // The regex runs before the transform, so an empty string fails validation.
    // Forms should send null/undefined for empty date fields, not empty string.
    expect(goalSchema.safeParse({ ...BASE, target_date: '' }).success).toBe(false)
  })
})

// ── Goal Contribution ──────────────────────────────────────────────────────

describe('goalContributionSchema', () => {
  const BASE = { amount: 100, date: '2024-06-01' }

  it('accepts valid contribution', () => {
    expect(goalContributionSchema.safeParse(BASE).success).toBe(true)
  })

  it('rejects non-positive amount', () => {
    expect(goalContributionSchema.safeParse({ ...BASE, amount: 0 }).success).toBe(false)
    expect(goalContributionSchema.safeParse({ ...BASE, amount: -5 }).success).toBe(false)
  })

  it('rejects invalid date', () => {
    expect(goalContributionSchema.safeParse({ ...BASE, date: '01/06/2024' }).success).toBe(false)
  })

  it('coerces empty note to null', () => {
    const r = goalContributionSchema.safeParse({ ...BASE, note: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.note).toBeNull()
  })

  it('caps note at 200 chars', () => {
    const r = goalContributionSchema.safeParse({ ...BASE, note: 'a'.repeat(201) })
    expect(r.success).toBe(false)
  })
})
