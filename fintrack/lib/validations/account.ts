import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(60),
  type: z.enum(['cash', 'bank', 'credit_card', 'savings', 'investment']),
  initial_balance: z.number().default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  icon: z.string().regex(/^[a-z0-9-]+$/, 'Icono inválido').default('wallet'),
})

export type AccountFormValues = z.infer<typeof accountSchema>
