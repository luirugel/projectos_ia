import { z } from 'zod'

export const transactionSchema = z
  .object({
    type: z.enum(['expense', 'income', 'transfer']),
    amount: z.number().positive('El monto debe ser positivo').max(999999999),
    account_id: z.string().uuid('Selecciona una cuenta'),
    category_id: z.string().uuid().optional().nullable(),
    description: z.string().max(100).optional().nullable().transform(v => v === '' ? null : v),
    notes: z.string().max(500).optional().nullable().transform(v => v === '' ? null : v),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    tags: z.array(z.string().max(50)).max(10).optional().default([]),
    to_account_id: z.string().uuid().optional().nullable(),
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  })
  // A transfer moves money between two distinct accounts. Without these guards
  // a transfer can be saved with no destination (the source is debited and the
  // amount vanishes from net worth) or with source === destination (a no-op
  // that still mutates balances on a misconfigured view).
  .superRefine((data, ctx) => {
    if (data.type !== 'transfer') return
    if (!data.to_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to_account_id'],
        message: 'Selecciona la cuenta destino',
      })
      return
    }
    if (data.to_account_id === data.account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to_account_id'],
        message: 'La cuenta destino debe ser distinta a la de origen',
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionSchema>
