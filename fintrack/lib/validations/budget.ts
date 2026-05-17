import { z } from 'zod'

export const budgetSchema = z.object({
  category_id: z.string().uuid('Selecciona una categoría'),
  amount_limit: z.number().positive('El límite debe ser positivo').max(999999999),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  alert_at_50: z.boolean().default(true),
  alert_at_80: z.boolean().default(true),
  alert_at_100: z.boolean().default(true),
  rollover: z.boolean().default(false),
})

export type BudgetFormValues = z.infer<typeof budgetSchema>
