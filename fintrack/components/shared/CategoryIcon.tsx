import {
  Utensils, Car, Home, HeartPulse, GraduationCap, Film, Shirt,
  Laptop, Zap, CreditCard, PawPrint, Plane, Dumbbell, MoreHorizontal,
  Briefcase, Code, TrendingUp, Building, Gift, PlusCircle, Tag,
  Wallet, ShoppingCart, Coffee, Music, Globe, Fuel, Baby, BookOpen,
  Target, PiggyBank, Star, Trophy, Gem, Sparkles, Heart,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  utensils:         Utensils,
  car:              Car,
  home:             Home,
  'heart-pulse':    HeartPulse,
  'graduation-cap': GraduationCap,
  film:             Film,
  shirt:            Shirt,
  laptop:           Laptop,
  zap:              Zap,
  'credit-card':    CreditCard,
  'paw-print':      PawPrint,
  plane:            Plane,
  dumbbell:         Dumbbell,
  'more-horizontal':MoreHorizontal,
  briefcase:        Briefcase,
  code:             Code,
  'trending-up':    TrendingUp,
  building:         Building,
  gift:             Gift,
  'plus-circle':    PlusCircle,
  tag:              Tag,
  wallet:           Wallet,
  'shopping-cart':  ShoppingCart,
  coffee:           Coffee,
  music:            Music,
  globe:            Globe,
  fuel:             Fuel,
  baby:             Baby,
  'book-open':      BookOpen,
  target:           Target,
  'piggy-bank':     PiggyBank,
  star:             Star,
  trophy:           Trophy,
  gem:              Gem,
  sparkles:         Sparkles,
  heart:            Heart,
}

interface CategoryIconProps {
  icon: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap:     Record<string, string> = { xs: 'h-6 w-6',   sm: 'h-8 w-8',   md: 'h-10 w-10', lg: 'h-12 w-12' }
const iconSizeMap: Record<string, string> = { xs: 'h-3 w-3',   sm: 'h-3.5 w-3.5', md: 'h-[18px] w-[18px]', lg: 'h-6 w-6' }

// Pale seed colors (e.g. #d1fae5, #6ee7b7) render as an illegible wash on the
// white surface. Keep the disc's hue, but darken the glyph toward ink when the
// color is too light so it stays readable. Non-hex values pass through.
function readableGlyph(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  return lum > 0.72 ? `color-mix(in srgb, ${hex} 58%, #0f172a)` : hex
}

export function CategoryIcon({ icon, color = '#6366f1', size = 'md', className }: CategoryIconProps) {
  const Icon = iconMap[icon] ?? Tag

  return (
    // Flat at rest by design. The glossy pebble is FinTrack's one tactile
    // signature (GlossyIcon only); CategoryIcon renders dozens of times per
    // screen, so it stays a quiet tinted disc — color carries the meaning,
    // not depth. Do not reintroduce gradient/glow/inset/sheen here.
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        sizeMap[size],
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      <Icon
        className={iconSizeMap[size]}
        style={{ color: readableGlyph(color) }}
        strokeWidth={1.75}
      />
    </div>
  )
}
