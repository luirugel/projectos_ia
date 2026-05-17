import { describe, it, expect } from 'vitest'
import { transactionSchema } from './transaction'

const ACC_A = '11111111-1111-1111-1111-111111111111'
const ACC_B = '22222222-2222-2222-2222-222222222222'

const base = {
  amount: 50,
  account_id: ACC_A,
  date: '2026-05-15',
  is_recurring: false,
  tags: [],
}

describe('transactionSchema — transfer integrity (C1)', () => {
  it('rejects a transfer with no destination account', () => {
    const r = transactionSchema.safeParse({ ...base, type: 'transfer' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('to_account_id'))).toBe(true)
    }
  })

  it('rejects a transfer whose destination equals the source', () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: 'transfer',
      to_account_id: ACC_A,
    })
    expect(r.success).toBe(false)
  })

  it('accepts a transfer between two distinct accounts', () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: 'transfer',
      to_account_id: ACC_B,
    })
    expect(r.success).toBe(true)
  })

  it('does not require to_account_id for a plain expense', () => {
    const r = transactionSchema.safeParse({ ...base, type: 'expense' })
    expect(r.success).toBe(true)
  })

  it('normalizes empty description/notes to null', () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: 'income',
      description: '',
      notes: '',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.description).toBeNull()
      expect(r.data.notes).toBeNull()
    }
  })
})
