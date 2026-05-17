#!/bin/bash
# =============================================================================
# Vibe Coding Agent Pipeline v2.0
# Runs Code Auditor + Security Validator + Database Architect sequentially
# and produces a unified Markdown report.
#
# Usage:
#   ./agents/pipeline.sh <path>          # review a file or directory
#   ./agents/pipeline.sh src/api/users/  # review a folder
#   ./agents/pipeline.sh --all           # review entire src/ directory
#
# Requirements: Claude Code CLI installed and authenticated (claude --version)
# =============================================================================

set -euo pipefail

AGENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:---all}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="review_${TIMESTAMP}.md"

# Resolve target path
if [ "$TARGET" = "--all" ]; then
  SCAN_PATH="src/"
else
  SCAN_PATH="$TARGET"
fi

# Check claude CLI is available
if ! command -v claude &> /dev/null; then
  echo "❌ Claude Code CLI not found. Install it from: https://claude.ai/code"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Vibe Coding Agent Pipeline v2.0          ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Target : $SCAN_PATH"
echo "  Report : $REPORT"
echo ""

# ── Report header ──────────────────────────────────────────────────────────
cat > "$REPORT" << EOF
# Code Review Report
**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Target:** \`$SCAN_PATH\`
**Pipeline:** Code Audit → Security → Database Review

---

EOF

# ── Agent 1: Code Auditor ───────────────────────────────────────────────────
echo "🔍 [1/3] Running Code Auditor..."
echo "## 🔍 Code Audit" >> "$REPORT"
echo "" >> "$REPORT"

claude -p "$(cat "$AGENTS_DIR/prompts/auditor.md")" \
  --allowedTools "Read,LS" \
  "Audit all source files in: $SCAN_PATH" >> "$REPORT" 2>/dev/null || \
  echo "_Code Auditor could not complete — check that the target path exists._" >> "$REPORT"

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "" >> "$REPORT"
echo "  ✅ Code audit complete"

# ── Agent 2: Security Validator ────────────────────────────────────────────
echo "🔐 [2/3] Running Security Validator..."
echo "## 🔐 Security Review" >> "$REPORT"
echo "" >> "$REPORT"

claude -p "$(cat "$AGENTS_DIR/prompts/security.md")" \
  --allowedTools "Read,LS" \
  "Security review of all files in: $SCAN_PATH" >> "$REPORT" 2>/dev/null || \
  echo "_Security Validator could not complete — check that the target path exists._" >> "$REPORT"

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "" >> "$REPORT"
echo "  ✅ Security review complete"

# ── Agent 3: Database Architect ────────────────────────────────────────────
echo "🗄️  [3/3] Running Database Architect..."
echo "## 🗄️ Database Review" >> "$REPORT"
echo "" >> "$REPORT"

# Look for schema/migration files specifically
DB_FILES=$(find "$SCAN_PATH" -name "*.prisma" -o -name "*.sql" -o -name "*migration*" -o -name "*schema*" 2>/dev/null | head -20 | tr '\n' ' ')

if [ -n "$DB_FILES" ]; then
  claude -p "$(cat "$AGENTS_DIR/prompts/database.md")" \
    --allowedTools "Read" \
    "Review these database files for schema design, query patterns, and migration safety: $DB_FILES" >> "$REPORT" 2>/dev/null || \
    echo "_Database review could not complete._" >> "$REPORT"
else
  echo "_No schema or migration files found in \`$SCAN_PATH\`. Skipping database review._" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "" >> "$REPORT"
echo "  ✅ Database review complete"

# ── Summary footer ─────────────────────────────────────────────────────────
cat >> "$REPORT" << EOF

## 📋 Review Metadata
| Field | Value |
|-------|-------|
| Generated | $(date '+%Y-%m-%d %H:%M:%S') |
| Target | \`$SCAN_PATH\` |
| Agents | Code Auditor, Security Validator, Database Architect |
| Pipeline | vibe-coding-agents v2.0 |
EOF

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Pipeline complete                         ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Report saved → $REPORT"
echo ""
