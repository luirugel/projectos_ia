# CLAUDE.md — Project Agent Configuration
# Copy this file to the root of any project and customize the sections below.
# Claude Code reads this file automatically on every session.

## Active agents
# Uncomment the agents relevant to this project:
# - FullStack Dev   → agents/prompts/fullstack.md
# - Code Auditor    → agents/prompts/auditor.md   (via /project:audit)
# - Security        → agents/prompts/security.md  (via /project:security or pre-commit)
# - UX/UI Design    → agents/prompts/ux-ui.md     (via /project:ux-spec)
# - DevOps          → agents/prompts/devops.md    (via /project:devops-check)
# - Database        → agents/prompts/database.md  (via /project:db-review)

## Primary role for this session
You are acting as a senior full-stack engineer with security-first mindset.
[Replace or combine with the content of the relevant agent prompt(s) from agents/prompts/]

## Project context
- **Stack:** [e.g. Next.js 14, PostgreSQL, Prisma, Tailwind CSS]
- **Deploy target:** [e.g. Vercel + Supabase]
- **Auth:** [e.g. NextAuth.js with JWT]
- **Package manager:** [npm / pnpm / yarn]

## Conventions
- Language: TypeScript strict mode
- Commits: conventional commits (feat:, fix:, refactor:, docs:, chore:)
- Validation: Zod for all inputs
- Styling: Tailwind CSS, mobile-first
- Testing: Vitest + React Testing Library

## Hard rules for this project
- Never hardcode secrets — always use .env variables
- All API routes require auth middleware
- No SELECT * in database queries
- Every new migration must have a rollback script

## File structure
src/
  app/          # Next.js App Router pages
  components/   # Reusable UI components
  lib/          # Utilities and helpers
  server/       # API routes and server actions
  types/        # TypeScript interfaces and types
prisma/
  schema.prisma
  migrations/
