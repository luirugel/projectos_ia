#!/bin/bash
# =============================================================================
# Vibe Coding Agent Pack — Setup Script
# Installs the agent scaffold into the current project directory.
#
# Usage (from any project root):
#   bash setup.sh
#
# What it does:
#   1. Copies agents/ and .claude/ directories into your project
#   2. Creates CLAUDE.md if it doesn't exist
#   3. Installs the pre-commit hook
#   4. Makes all scripts executable
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PWD}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Vibe Coding Agent Pack — Setup v2.0        ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Installing into: $PROJECT_DIR"
echo ""

# ── Copy agents/ directory ─────────────────────────────────────────────────
echo "📁 Copying agents/..."
cp -r "$SCRIPT_DIR/agents" "$PROJECT_DIR/"
chmod +x "$PROJECT_DIR/agents/pipeline.sh"
chmod +x "$PROJECT_DIR/agents/pre-commit"
echo "  ✅ agents/ directory ready"

# ── Copy .claude/commands/ ─────────────────────────────────────────────────
echo "⚡ Installing Claude Code custom commands..."
mkdir -p "$PROJECT_DIR/.claude/commands"
cp -r "$SCRIPT_DIR/.claude/commands/." "$PROJECT_DIR/.claude/commands/"
echo "  ✅ .claude/commands/ ready"
echo "     Available: /project:audit /project:security /project:db-review /project:ux-spec /project:devops-check"

# ── Create CLAUDE.md if it doesn't exist ──────────────────────────────────
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
  echo "📝 Creating CLAUDE.md..."
  cp "$SCRIPT_DIR/CLAUDE.md" "$PROJECT_DIR/CLAUDE.md"
  echo "  ✅ CLAUDE.md created — customize it with your project stack"
else
  echo "  ⏭️  CLAUDE.md already exists — skipping (not overwritten)"
fi

# ── Install pre-commit hook ────────────────────────────────────────────────
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "🔐 Installing pre-commit hook..."
  if [ -f "$PROJECT_DIR/.git/hooks/pre-commit" ]; then
    cp "$PROJECT_DIR/.git/hooks/pre-commit" "$PROJECT_DIR/.git/hooks/pre-commit.bak"
    echo "  ⚠️  Existing pre-commit hook backed up → .git/hooks/pre-commit.bak"
  fi
  cp "$PROJECT_DIR/agents/pre-commit" "$PROJECT_DIR/.git/hooks/pre-commit"
  chmod +x "$PROJECT_DIR/.git/hooks/pre-commit"
  echo "  ✅ Pre-commit security hook installed"
else
  echo "  ⏭️  No .git directory found — skipping pre-commit hook"
  echo "     Run 'git init' first, then copy agents/pre-commit to .git/hooks/pre-commit"
fi

# ── Add agents/ to .gitignore if not already ignored ──────────────────────
GITIGNORE="$PROJECT_DIR/.gitignore"
if [ -f "$GITIGNORE" ]; then
  if ! grep -q "review_*.md" "$GITIGNORE"; then
    echo "" >> "$GITIGNORE"
    echo "# Vibe Coding Agent Pack — generated reports" >> "$GITIGNORE"
    echo "review_*.md" >> "$GITIGNORE"
    echo "  ✅ Added review_*.md to .gitignore"
  fi
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Setup complete!                           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Next steps:"
echo "  1. Edit CLAUDE.md with your project stack"
echo "  2. Open Claude Code: claude"
echo "  3. Try a command: /project:audit src/"
echo "  4. Run full pipeline: ./agents/pipeline.sh src/"
echo ""
