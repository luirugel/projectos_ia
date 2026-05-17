import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subWeeks,
  subQuarters,
  subYears,
  differenceInCalendarDays,
  parseISO,
  isValid,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { DashboardPeriod } from '@/types/database'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDate(date: string | Date, pattern = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return format(d, pattern, { locale: es })
}

/** Short fixed date — used in compact table/list contexts: "14 may" or "14 may 2024" */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return format(d, sameYear ? 'd MMM' : 'd MMM yyyy', { locale: es })
}

/** Long date with day of week — "Miércoles, 14 de mayo de 2026" */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  return capitalize(format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }))
}

/**
 * Smart relative date:
 *   today          → "Hoy"
 *   yesterday      → "Ayer"
 *   2–6 days ago   → "Lunes" / "Martes" … (day name)
 *   same year      → "14 may"
 *   older          → "14 may 2024"
 */
export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return ''
  const now = new Date()
  const diff = differenceInCalendarDays(startOfDay(now), startOfDay(d))
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff === -1) return 'Mañana'
  // Future dates (transactions allow them): never label as a past weekday.
  if (diff < 0) {
    return d.getFullYear() === now.getFullYear()
      ? format(d, 'd MMM', { locale: es })
      : format(d, 'd MMM yyyy', { locale: es })
  }
  if (diff < 7) return capitalize(format(d, 'EEEE', { locale: es }))
  if (d.getFullYear() === now.getFullYear()) return format(d, 'd MMM', { locale: es })
  return format(d, 'd MMM yyyy', { locale: es })
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: toISODate(startOfMonth(now)),
    end: toISODate(endOfMonth(now)),
  }
}

export function getLastMonthRange(): { start: string; end: string } {
  const last = subMonths(new Date(), 1)
  return {
    start: toISODate(startOfMonth(last)),
    end: toISODate(endOfMonth(last)),
  }
}

export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: toISODate(startOfWeek(now, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(now, { weekStartsOn: 1 })),
  }
}

export function getCurrentYearRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: toISODate(startOfYear(now)),
    end: toISODate(endOfYear(now)),
  }
}

export function getCurrentQuarterRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: toISODate(startOfQuarter(now)),
    end: toISODate(endOfQuarter(now)),
  }
}

export function getPeriodRange(p: DashboardPeriod): { start: string; end: string } {
  if (p === 'week') return getCurrentWeekRange()
  if (p === 'quarter') return getCurrentQuarterRange()
  if (p === 'year') return getCurrentYearRange()
  return getCurrentMonthRange()
}

export function getPrevPeriodRange(p: DashboardPeriod): { start: string; end: string } {
  const now = new Date()
  if (p === 'week') {
    const prev = subWeeks(now, 1)
    return { start: toISODate(startOfWeek(prev, { weekStartsOn: 1 })), end: toISODate(endOfWeek(prev, { weekStartsOn: 1 })) }
  }
  if (p === 'quarter') {
    const prev = subQuarters(now, 1)
    return { start: toISODate(startOfQuarter(prev)), end: toISODate(endOfQuarter(prev)) }
  }
  if (p === 'year') {
    const prev = subYears(now, 1)
    return { start: toISODate(startOfYear(prev)), end: toISODate(endOfYear(prev)) }
  }
  return getLastMonthRange()
}

export function getPeriodLabel(p: DashboardPeriod): string {
  const now = new Date()
  if (p === 'week') return 'semana pasada'
  if (p === 'quarter') return 'trimestre pasado'
  if (p === 'year') return String(now.getFullYear() - 1)
  return format(subMonths(now, 1), 'MMMM', { locale: es })
}

export function getBudgetPeriodRange(period: 'weekly' | 'monthly' | 'yearly'): { start: string; end: string } {
  if (period === 'weekly') return getCurrentWeekRange()
  if (period === 'yearly') return getCurrentYearRange()
  return getCurrentMonthRange()
}

export function daysRemaining(targetDate: string): number {
  return differenceInCalendarDays(parseISO(targetDate), startOfDay(new Date()))
}

export function getLast6Months(): Array<{ label: string; start: string; end: string }> {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      label: format(d, 'MMM', { locale: es }),
      start: toISODate(startOfMonth(d)),
      end: toISODate(endOfMonth(d)),
    }
  })
}
