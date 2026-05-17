'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'

function fmtY(v: number): string {
  if (v === 0) return '$0'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`
  return `$${v.toFixed(0)}`
}

interface MonthlyBarChartProps {
  data: Array<{ month: string; income: number; expenses: number }>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-app-surface border border-app-border rounded-lg px-3 py-2 card-elevated-md text-sm">
      <p className="text-app-text-subtle text-xs mb-1.5 capitalize">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-app-text-muted">{p.name === 'income' ? 'Ingresos' : 'Gastos'}:</span>
          <span className="text-app-text font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-app-text-subtle text-sm">Sin datos para mostrar</div>
  }

  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0)

  return (
    <div
      role="img"
      aria-label={`Ingresos contra gastos por mes. Ingresos totales ${formatCurrency(totalIncome)}, gastos totales ${formatCurrency(totalExpenses)}.`}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={3} barCategoryGap="35%">
          {/* Expenses get a diagonal hatch so income vs expense is legible
              without relying on the red/green pairing alone. */}
          <defs>
            <pattern id="reportsExpenseHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#ef4444" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border) / 0.5)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtY} tickCount={5} domain={[0, 'auto']} width={56} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--app-surface-alt) / 0.6)' }} />
          <Bar dataKey="income"   fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="expenses" fill="url(#reportsExpenseHatch)" stroke="#ef4444" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
