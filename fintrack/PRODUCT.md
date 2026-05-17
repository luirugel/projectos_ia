# Product

## Register

product

## Users

Global, Spanish-first SaaS audience managing their own personal and household
money in USD. Built initially for Latin America (Spanish-native copy, Ecuador
timezone, USD), but structured to expand to other locales without rework. Users
span a wide range of financial literacy and are mostly on mobile. Their context
is short, frequent, often distracted sessions: logging a transaction in seconds
between other tasks, then occasionally a longer review of progress. They are
not accountants and do not want to feel like they need to be one.

## Product Purpose

FinTrack helps people build and sustain a money habit. It exists because most
personal-finance apps are either cold ledgers people stop opening, or toys that
people stop trusting. Success is not "transactions logged" — it is the user
coming back tomorrow, and the month after, because using the app makes their
own progress visible and saving feel like winning. The product's primary job is
to earn the return visit through an honest daily loop: log → see real progress
→ feel momentum.

## Brand Personality

Encouraging, momentum-driven, and grown-up. Three words: motivating, honest,
confident. The voice celebrates progress like a good coach, not a cartoon: it
acknowledges wins specifically and truthfully, and it never talks down to the
user. Closest reference for the *motivation mechanics* is Duolingo — streaks,
momentum, visible wins, the daily pull to return — but the *execution* is
deliberately adult: the energy comes from the user's real numbers moving in the
right direction, not from decoration. Emotional goal: opening FinTrack should
feel rewarding, never like a chore and never like a chore dressed up as a game.

## Anti-references

**Childish gamification.** No cartoon mascots or mascot equivalents. No confetti
or celebration animation sprayed on every action. No patronizing badges,
trophies, or "Great job!!!" baby-talk for routine behavior. No streak mechanics
that shame or guilt-trip a missed day. The Duolingo reference is the *habit
engine*, explicitly not its character/visual register. Any motivational element
that an adult tracking real money would find patronizing is wrong by default —
when in doubt, the element is cut, not softened.

## Design Principles

1. **The habit engine is the product, not a coat of paint.** Streaks, momentum,
   and visible progress are designed into the core surfaces (dashboard, goals,
   the log-and-see-progress loop) — not bolt-on celebration effects added at the
   end. If the motivation layer were removed, the product would be missing its
   point, not just its polish.

2. **Grown-up gamification.** Every motivational element must survive one
   question: would an adult tracking real money find this respectful, or
   patronizing? Reward through honest progress and earned, restrained moments —
   never through mascots, confetti, or trinket badges.

3. **Progress must be true.** Because the app celebrates wins, the wins must be
   real. Never inflate a number to manufacture a good feeling; never fake-
   celebrate a bad month. A finance app that lies to make you feel good is worse
   than a neutral one. Trust is the precondition for motivation.

4. **Earn the return visit.** The design's success metric is whether opening the
   app tomorrow feels worthwhile. The daily loop (log → see progress → feel
   momentum) is the primary flow; every other screen serves or feeds it.

5. **Spanish-first, scalable voice.** Copy is written Spanish-native — warm and
   encouraging without being childish — and structured so additional locales
   slot in without a rewrite. No translated-feeling strings.

## Accessibility & Inclusion

- **WCAG AA** is the contrast baseline and is already verified per design token
  (light warm-cream and dark navy themes both checked against AA on every text
  role).
- **Reduced motion is honored.** `prefers-reduced-motion` disables non-essential
  animation; loading/spinner states that convey real status are preserved. This
  constrains how the motivation layer celebrates: motion-based rewards must have
  a static, equally legible fallback.
- **Full keyboard operability.** Every flow — transaction entry, modals, forms,
  charts, navigation — must be fully usable without a mouse, with a visible
  focus indicator throughout. Fast keyboard entry is part of "log in seconds."
- **Recommended, not yet committed:** income/expense currently relies on a
  red/green color pairing. For a motivating finance UI this is a known
  color-vision risk and should be revisited so amount direction is never
  conveyed by color alone (pair with sign, icon, or position). Flagged here so a
  future `teach`/`harden` pass can decide deliberately rather than by omission.
