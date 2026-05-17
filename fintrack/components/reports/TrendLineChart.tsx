'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'

interface TrendLineChartProps {
  data: Array<{ date: string; amount: number }>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-app-surface border border-app-border rounded-lg px-3 py-2 card-elevated-md text-sm">
      <p className="text-app-text-subtle text-xs mb-1">{label}</p>
      <p className="text-expense font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-app-text-subtle text-sm">Sin datos para mostrar</div>
  }
  const total = data.reduce((s, d) => s + d.amount, 0)
  return (
    <div
      role="img"
      aria-label={`Tendencia de gasto diario, ${data.length} días, total ${formatCurrency(total)}.`}
    >
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border) / 0.5)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(var(--app-border))', strokeWidth: 1 }} />
        <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGradient)" dot={false} activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  )
}
