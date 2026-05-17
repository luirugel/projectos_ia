import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlossyIconProps {
  icon: LucideIcon
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  active?: boolean
  className?: string
}

const sizeMap:     Record<string, { container: string; icon: string; stroke: number }> = {
  xs: { container: 'h-6 w-6',   icon: 'h-3 w-3',           stroke: 1.75 },
  sm: { container: 'h-8 w-8',   icon: 'h-3.5 w-3.5',       stroke: 1.75 },
  md: { container: 'h-10 w-10', icon: 'h-[18px] w-[18px]', stroke: 1.75 },
  lg: { container: 'h-12 w-12', icon: 'h-6 w-6',           stroke: 1.5 },
}

export function GlossyIcon({ icon: Icon, color, size = 'md', active = true, className }: GlossyIconProps) {
  const s = sizeMap[size]
  const opacity = active ? 1 : 0.65

  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 relative overflow-hidden', s.container, className)}
      style={{
        opacity,
        /* Light background: white → subtle color tint */
        background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.96) 0%, color-mix(in srgb, ${color} 20%, white) 100%)`,
        boxShadow: `
          0 2px 8px ${color}26,
          0 1px 2px rgba(0,0,0,0.06),
          inset 0 1px 1.5px rgba(255,255,255,0.7)
        `,
        border: `1.5px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      {/* Gloss overlay — top-left highlight */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 35% 26%, rgba(255,255,255,0.40) 0%, transparent 62%)' }}
      />
      {/* Icon */}
      <Icon
        className={cn(s.icon, 'relative z-10')}
        strokeWidth={s.stroke}
        style={{ color }}
      />
    </div>
  )
}
