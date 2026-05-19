import { z } from 'zod'

export const goalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(300).optional().nullable().transform(v => v === '' ? null : v),
  target_amount: z.number().positive('La meta debe ser positiva').max(999999999),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().transform(v => v === '' ? null : v),
  icon: z.string().regex(/^[a-z0-9-]+$/, 'Icono inválido').default('target'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#10b981'),
})

export const goalContributionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo').max(999999999),
  note: z.string().max(200).optional().nullable().transform(v => v === '' ? null : v),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type GoalFormValues = z.infer<typeof goalSchema>
export type GoalContributionFormValues = z.infer<typeof goalContributionSchema>
