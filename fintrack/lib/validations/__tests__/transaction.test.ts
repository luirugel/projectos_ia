import { describe, it, expect } from 'vitest'
import { transactionSchema } from '../transaction'

const BASE = {
  type: 'expense' as const,
  amount: 50,
  account_id: '00000000-0000-0000-0000-000000000001',
  date: '2024-01-15',
  is_recurring: false,
  tags: [],
}

describe('transactionSchema', () => {
  it('accepts valid expense', () => {
    expect(transactionSchema.safeParse(BASE).success).toBe(true)
  })

  it('rejects negative amount', () => {
    const r = transactionSchema.safeParse({ ...BASE, amount: -10 })
    expect(r.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const r = transactionSchema.safeParse({ ...BASE, amount: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects amount over limit', () => {
    const r = transactionSchema.safeParse({ ...BASE, amount: 1_000_000_000 })
    expect(r.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const r = transactionSchema.safeParse({ ...BASE, date: '15/01/2024' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid account_id', () => {
    const r = transactionSchema.safeParse({ ...BASE, account_id: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })

  it('coerces empty description to null', () => {
    const r = transactionSchema.safeParse({ ...BASE, description: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.description).toBeNull()
  })

  it('coerces empty notes to null', () => {
    const r = transactionSchema.safeParse({ ...BASE, notes: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.notes).toBeNull()
  })

  it('caps tags at 10', () => {
    const r = transactionSchema.safeParse({ ...BASE, tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) })
    expect(r.success).toBe(false)
  })

  it('caps each tag at 50 chars', () => {
    const r = transactionSchema.safeParse({ ...BASE, tags: ['a'.repeat(51)] })
    expect(r.success).toBe(false)
  })

  describe('transfer validation', () => {
    const TRANSFER = {
      ...BASE,
      type: 'transfer' as const,
      to_account_id: '00000000-0000-0000-0000-000000000002',
    }

    it('accepts valid transfer with different accounts', () => {
      expect(transactionSchema.safeParse(TRANSFER).success).toBe(true)
    })

    it('rejects transfer without destination account', () => {
      const r = transactionSchema.safeParse({ ...TRANSFER, to_account_id: null })
      expect(r.success).toBe(false)
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path.join('.'))
        expect(paths).toContain('to_account_id')
      }
    })

    it('rejects transfer with same source and destination', () => {
      const r = transactionSchema.safeParse({
        ...TRANSFER,
        to_account_id: BASE.account_id,
      })
      expect(r.success).toBe(false)
      if (!r.success) {
        const paths = r.error.issues.map((i) => i.path.join('.'))
        expect(paths).toContain('to_account_id')
      }
    })
  })
})
