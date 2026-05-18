import { describe, it, expect, vi, beforeEach } from 'vitest'

// exportTransactionsToCsv triggers DOM APIs (Blob, URL.createObjectURL, document.createElement).
// We verify the CSV content by intercepting the Blob constructor.

import type { Transaction } from '@/types/database'

const ACCOUNT = { id: 'a1', name: 'Efectivo', type: 'cash' as const, user_id: 'u1', initial_balance: 0, color: '#10b981', icon: 'wallet', is_active: true, created_at: '' }
const CATEGORY = { id: 'c1', name: 'Alimentación', type: 'expense' as const, user_id: null, icon: 'utensils', color: '#f59e0b', is_active: true, created_at: '' }

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx1',
    user_id: 'u1',
    account_id: 'a1',
    category_id: 'c1',
    type: 'expense',
    amount: 25.5,
    description: 'Almuerzo',
    notes: null,
    date: '2024-06-01',
    is_recurring: false,
    recurrence_rule: null,
    receipt_url: null,
    tags: ['comida'],
    to_account_id: null,
    created_at: '',
    updated_at: '',
    account: ACCOUNT,
    category: CATEGORY,
    ...overrides,
  }
}

describe('exportTransactionsToCsv — formula injection prevention', () => {
  let capturedCsv = ''

  beforeEach(() => {
    capturedCsv = ''
    const BlobOrig = global.Blob
    vi.spyOn(global, 'Blob').mockImplementation((parts, opts) => {
      capturedCsv = (parts as string[]).join('')
      return new BlobOrig(parts, opts)
    })
    // jsdom doesn't implement URL.createObjectURL — define it on the prototype
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:mock'), configurable: true, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true })
    const link = { href: '', download: '', click: vi.fn(), style: {} } as unknown as HTMLAnchorElement
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => link)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => link)
    vi.spyOn(document, 'createElement').mockReturnValue(link)
  })

  it('prefixes = with apostrophe to prevent formula injection', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction({ description: '=SUM(A1:A10)' })])
    expect(capturedCsv).toContain("'=SUM(A1:A10)")
    expect(capturedCsv).not.toContain(',=SUM(A1:A10)')
  })

  it('prefixes + with apostrophe', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction({ description: '+cmd|calc' })])
    expect(capturedCsv).toContain("'+cmd|calc")
  })

  it('prefixes @ with apostrophe', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction({ description: '@SUM(1+1)' })])
    expect(capturedCsv).toContain("'@SUM(1+1)")
  })

  it('includes UTF-8 BOM for Excel compatibility', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction()])
    expect(capturedCsv.charCodeAt(0)).toBe(0xfeff)
  })

  it('outputs correct CSV header row', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction()])
    expect(capturedCsv).toContain('Fecha,Tipo,Monto,Cuenta,Categoría,Descripción,Notas,Etiquetas')
  })

  it('joins tags with semicolons', async () => {
    const { exportTransactionsToCsv } = await import('../export')
    exportTransactionsToCsv([makeTransaction({ tags: ['a', 'b', 'c'] })])
    expect(capturedCsv).toContain('a; b; c')
  })
})
