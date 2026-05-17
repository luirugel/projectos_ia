import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'

interface AmountDisplayProps {
  amount: number
  type?: 'expense' | 'income' | 'transfer' | 'neutral'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSign?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
  xl: 'text-3xl font-bold tabular-nums',
}

// DESIGN.md — The Honest Signal Rule + a11y: direction is NEVER conveyed by
// colour alone. `showSign` defaults to true so income/expense always carry a
// +/− glyph, and an aria-label states the direction in words for screen readers.
export function AmountDisplay({ amount, type = 'neutral', size = 'md', showSign = true, className }: AmountDisplayProps) {
  const colorClass =
    type === 'income'   ? 'text-income' :
    type === 'expense'  ? 'text-expense' :
    type === 'transfer' ? 'text-primary' :
    'text-app-text'

  const sign = showSign ? (type === 'expense' ? '−' : type === 'income' ? '+' : '') : ''

  const directionWord =
    type === 'income'   ? 'Ingreso' :
    type === 'expense'  ? 'Gasto' :
    type === 'transfer' ? 'Transferencia' :
    ''

  return (
    <span
      className={cn(sizeClasses[size], colorClass, className)}
      aria-label={`${directionWord} ${formatCurrency(amount)}`.trim()}
    >
      {sign}{formatCurrency(amount)}
    </span>
  )
}
