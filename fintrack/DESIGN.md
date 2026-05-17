---
name: FinTrack
description: An encouraging financial ledger — warm paper, honest ink, one tactile signature.
colors:
  canvas-cream: "#f6f3ee"
  surface-white: "#ffffff"
  surface-cream-alt: "#f0ede8"
  border-warm: "#d2cdc4"
  ink-primary: "#0f172a"
  ink-muted: "#334155"
  ink-subtle: "#475569"
  dark-canvas: "#0f172a"
  dark-surface: "#1e293b"
  dark-surface-alt: "#334155"
  dark-ink: "#f8fafc"
  dark-ink-muted: "#94a3b8"
  dark-ink-subtle: "#7b8fa3"
  income-green: "#10b981"
  expense-red: "#ef4444"
  action-blue: "#3b82f6"
  domain-accounts-violet: "#8b5cf6"
  domain-budgets-amber: "#f59e0b"
  domain-goals-cyan: "#06b6d4"
  domain-reports-indigo: "#6366f1"
  domain-ai-purple: "#a855f7"
  domain-neutral-slate: "#64748b"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.1em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-income:
    backgroundColor: "{colors.income-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-expense:
    backgroundColor: "{colors.expense-red}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  badge-income:
    backgroundColor: "{colors.surface-cream-alt}"
    textColor: "{colors.income-green}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-expense:
    backgroundColor: "{colors.surface-cream-alt}"
    textColor: "{colors.expense-red}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: FinTrack

## 1. Overview

**Creative North Star: "The Encouraging Ledger"**

FinTrack looks like a serious financial record that happens to be on your side. The substrate is warm paper, not a cold dashboard: a cream canvas, ink-dark figures, and a small number of crafted tactile highlights that reward attention without ever shouting. Encouragement here is *earned and shown*, never decorated on — the energy comes from real numbers moving in the right direction, surfaced honestly, not from animation or ornament.

The system holds two ideas in tension on purpose and resolves them with one rule. Depth is part of the identity (the glossy domain "pebble" is the brand's signature object), but surfaces are otherwise refined and restrained: flat cream and white planes, quiet borders, generous air. Tactility is a single voice, spent deliberately on the things that carry meaning — domain identity, key metrics, the act of pressing — and withheld everywhere else. A ledger you trust does not glitter; it is precise, and the one polished detail is the point.

This system explicitly rejects childish gamification: no cartoon mascots, no confetti sprayed on actions, no patronizing badges or trophies. It also rejects the generic SaaS dashboard reflex — no big-number hero-metric template, no identical icon-card grids, no gradient text. It is warm without being cute, motivating without being a toy.

**Key Characteristics:**
- Warm-cream paper canvas (`#f6f3ee`), ink-dark figures — light is the default, dark navy is the considered alternate.
- A mapped domain spectrum: each financial domain owns one learnable hue; color is wayfinding and signal, never decoration.
- One tactile signature (the glossy icon pebble) against otherwise flat, restrained surfaces.
- Honest progress made visible: every metric carries a real trend against the previous period.
- Tabular-figure discipline: money always aligns and never reflows.

## 2. Colors: The Mapped Domain Spectrum

A warm neutral stage on which a disciplined, learnable set of hues each carry a fixed financial or domain meaning. Color is never mood lighting; it is navigation and signal.

### Primary
- **Action Blue** (`#3b82f6`): Neutral primary actions, default buttons, the Dashboard domain, and informational/transfer amounts. The "do the thing" color, not an identity color.

### Secondary
- **Income Green** (`#10b981`): Income amounts, positive trend pills, the Transactions domain, on-track progress. Always a *good-direction* signal — never used decoratively.
- **Expense Red** (`#ef4444`): Expense amounts, negative trend, over-budget and off-track states, destructive actions. A *direction* signal, never an alarm color sprayed for emphasis.

### Tertiary — the Domain Hues
Each surface owns one identity color, learned through repetition (used in nav, headers, and that domain's GlossyIcon):
- **Accounts Violet** (`#8b5cf6`) · **Budgets Amber** (`#f59e0b`) · **Goals Cyan** (`#06b6d4`) · **Reports Indigo** (`#6366f1`) · **Assistant Purple** (`#a855f7`) · **Settings/Neutral Slate** (`#64748b`).

### Neutral
- **Canvas Cream** (`#f6f3ee`): The default app background. The paper.
- **Surface White** (`#ffffff`): Raised cards and inputs on the cream.
- **Surface Cream Alt** (`#f0ede8`): Recessed wells, hover fills, tinted chip backgrounds.
- **Border Warm** (`#d2cdc4`): Hairline borders and dividers — visible, never harsh.
- **Ink Primary / Muted / Subtle** (`#0f172a` / `#334155` / `#475569`): The three-step text hierarchy, each verified at WCAG AA on cream.
- **Dark mode**: Canvas `#0f172a`, Surface `#1e293b`, Surface Alt / Border `#334155`, ink `#f8fafc` / `#94a3b8` / `#7b8fa3`.

### Named Rules
**The Color-Is-Meaning Rule.** Every color on screen must answer "what does this signify?" — income, expense, a domain, a state. A hue used purely to look lively is forbidden. The cream does the calming; the hues do the work.

**The Honest Signal Rule.** Green and red encode *direction of truth*, not sentiment. Never recolor a real loss green to soften it; never red-flash a neutral number for drama. The palette must never lie to make the user feel good.

## 3. Typography

**Display / Body Font:** Plus Jakarta Sans (with ui-sans-serif, system-ui fallback)
**Figure Font:** Geist Mono, used for tabular numerals on monetary values

**Character:** One confident, slightly geometric humanist sans carries the entire interface; its weight range (400–800) does all the hierarchy work. Money breaks to a monospaced figure face so amounts align in a column and never reflow as digits change — the ledger feeling, made literal.

### Hierarchy
- **Display** (700, 1.875rem, line-height 1, tabular-nums): Hero figures — primary balances and headline amounts only.
- **Headline** (700, 1.5rem): Page and major section titles.
- **Title** (600, 1.125rem): Card titles, dialog headers.
- **Body** (400–500, 0.875rem, line-height 1.5): Default text. Cap measure at 65–75ch.
- **Label** (600, 0.625–0.75rem, letter-spacing 0.1em, UPPERCASE): Section eyebrows, metric captions, nav group headers.

### Named Rules
**The Tabular Money Rule.** Every monetary value renders with `tabular-nums` (Geist Mono). Proportional digits on money are prohibited — columns must align and totals must not jump.

**The Weight-Not-Color Hierarchy Rule.** Emphasis comes from weight and scale (≥1.25 step ratio), never from gradient text and never from coloring a heading for importance.

## 4. Elevation

Dimensional and tactile by identity, restrained by default. The system uses a real shadow vocabulary in light mode (soft, warm, ambient) and switches to border-defined layering in dark mode where shadows read as mud. Against this quiet baseline sits exactly one deliberately dimensional object: the GlossyIcon pebble.

### Shadow Vocabulary
- **Card (light)** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`): Default resting elevation for cards.
- **Md / Lg** (`0 4px 12px rgba(0,0,0,0.08)…` / `0 8px 24px rgba(0,0,0,0.10)…`): Hover lift and overlays/dialogs.
- **Dark mode**: Shadows collapse to near-invisible; depth is carried by `border-app-border` instead.
- **Glossy pebble**: Layered colored glow + inset highlight (`0 3px 10px {hue}35, inset 0 1.5px 2px rgba(255,255,255,0.9)`) — the signature, not a reusable elevation step.

### Named Rules
**The One Tactile Voice Rule.** Dimensional depth is spent in exactly one place: the glossy domain pebble. Cards, inputs, sheets, and panels stay flat at rest and lift only on interaction. Two competing 3D treatments on one screen is prohibited — tactility loses its meaning when it is everywhere.

## 5. Components

### Buttons
- **Shape:** Gently rounded (6px, `rounded-md`).
- **Primary:** Action Blue fill, white text, height 40px, padding 8px 16px.
- **Semantic:** `income` (green) and `expense` (red) fills exist for money-committing actions only — not for general emphasis.
- **Hover / Focus / Press:** Fill darkens ~10% on hover; 2px focus-visible ring with 2px offset; `active:scale(0.97)` press feedback on every button. The press-scale is the core tactile micro-interaction — restrained, physical, never bouncy.

### Chips / Badges
- **Style:** Fully pill (`rounded-full`), 0.75rem semibold. Income/expense variants use a tinted background (`hue/20`) with hue-colored text — a quiet status tint, not a loud fill.
- **State:** Trend pills pair a TrendingUp/Down icon **and** a sign **and** color, so direction never depends on color alone.

### Cards / Containers
- **Corner Style:** 12px (`rounded-xl`).
- **Background:** Surface White on Canvas Cream; recessed areas use Cream Alt.
- **Shadow Strategy:** Card shadow in light, `border-app-border/60` in dark (see Elevation).
- **Border:** 1px Border Warm. **Internal Padding:** 24px (`p-6`).
- **Nested cards are prohibited.** A card inside a card means the hierarchy is wrong.

### Inputs / Fields
- **Style:** White fill, 1px Border Input, 6px radius, 40px height.
- **Focus:** 2px focus-visible ring + 2px offset; border warms on hover. No glow, no color shift for state alone.
- **Error:** Convey with text and the destructive token, never color alone.

### Navigation
- **Style:** Fixed left sidebar on Surface, 240px expanded / 68px collapsed, smooth 300ms width transition; mobile becomes a drawer behind a `black/60` scrim.
- **Items:** `rounded-xl`, GlossyIcon + label; active state is a faint domain-hue wash (`{hue}12`, ~7% alpha) plus the icon's active state — never a heavy fill or a side-stripe.

### Signature Component — The GlossyIcon Pebble
A circular icon "well": a radial gradient from near-white to a ~20% tint of the domain hue, a soft colored outer glow, an inset top-left highlight, and a hue-tinted hairline border. It gives every domain and key metric a small, premium, physical object. This is FinTrack's one indulgence and the entire reason the system can feel rewarding without confetti. Use it for domain identity and primary metrics; do not multiply it into decoration.

## 6. Do's and Don'ts

### Do:
- **Do** keep Canvas Cream (`#f6f3ee`) as the default; treat dark navy as the considered alternate, not an afterthought.
- **Do** render every monetary value in tabular Geist Mono so columns align and totals never jump.
- **Do** make every color answer "what does this signify?" — income, expense, domain, or state.
- **Do** pair direction with a non-color cue (sign, ↑/↓ icon, or position) everywhere a gain/loss is shown.
- **Do** spend dimensional depth only on the GlossyIcon pebble; keep cards and panels flat at rest.
- **Do** show progress honestly — real trend vs. the previous period, even when the trend is bad.

### Don't:
- **Don't** add childish gamification: no cartoon mascots, no confetti sprayed on actions, no patronizing badges or trophies, no "Great job!!!" tone. (PRODUCT.md anti-reference, enforced visually.)
- **Don't** rely on red/green alone to convey income vs. expense — known color-vision failure; always add sign/icon/position. (Open risk flagged in PRODUCT.md; treat as a hard Don't going forward.)
- **Don't** use the generic SaaS look: no big-number hero-metric template, no grid of identical icon cards, no gradient text (`background-clip: text`).
- **Don't** use side-stripe borders (`border-left`/`border-right` > 1px as a colored accent). Use the domain-hue wash or a GlossyIcon instead.
- **Don't** nest a card inside a card, or wrap every element in a container.
- **Don't** introduce a second 3D/tactile treatment to compete with the pebble. One tactile voice.
- **Don't** recolor a real loss to look positive, or flash neutral numbers red for drama. The ledger does not lie.
