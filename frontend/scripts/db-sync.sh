#!/usr/bin/env bash
# =============================================================================
# db-sync.sh — Automatically sync Prisma schema to Supabase
# =============================================================================
# Usage:
#   ./scripts/db-sync.sh           → push schema + regenerate Prisma client
#   ./scripts/db-sync.sh --migrate → create a named migration (production-safe)
#   ./scripts/db-sync.sh --reset   → ⚠️  RESET the whole DB and re-push (destructive!)
#
# Requirements:
#   - DATABASE_URL must be set in .env (already configured)
#   - Prisma CLI installed (it's in devDependencies)
# =============================================================================

set -e

# Resolve node — non-interactive shells (like npm scripts) don't have the
# user's PATH, so we probe common install locations explicitly.
for NODE_PATH in \
  "/opt/homebrew/bin" \
  "/usr/local/bin" \
  "$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin" \
  "$HOME/.volta/bin"; do
  if [ -x "$NODE_PATH/node" ]; then
    export PATH="$NODE_PATH:$PATH"
    break
  fi
done

if ! command -v node &>/dev/null; then
  echo "❌  Could not find node. Make sure Node.js is installed."
  exit 1
fi

PRISMA="./node_modules/.bin/prisma"

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌  DATABASE_URL is not set. Make sure it's in your .env file."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀  Supabase Schema Sync"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DB: $(echo $DATABASE_URL | sed 's/:\/\/.*@/:\/\/****@/')"
echo ""

case "$1" in

  --migrate)
    # -----------------------------------------------------------------------
    # Create a formal, versioned migration (safe for production)
    # -----------------------------------------------------------------------
    read -p "  Migration name (e.g. add_tutor_state): " MIG_NAME
    if [ -z "$MIG_NAME" ]; then
      echo "❌  Migration name cannot be empty."
      exit 1
    fi
    echo ""
    echo "  📝  Creating migration: $MIG_NAME..."
    $PRISMA migrate dev --name "$MIG_NAME"
    echo ""
    echo "  ✅  Migration '$MIG_NAME' applied and Prisma client regenerated."
    ;;

  --reset)
    # -----------------------------------------------------------------------
    # ⚠️  Dangerous: drops and recreates all tables
    # -----------------------------------------------------------------------
    echo "  ⚠️   WARNING: This will DROP all tables and re-apply the schema."
    read -p "  Type 'yes' to confirm: " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      echo "  Aborted."
      exit 0
    fi
    $PRISMA migrate reset --force
    echo ""
    echo "  ✅  Database reset complete."
    ;;

  *)
    # -----------------------------------------------------------------------
    # Default: push current schema directly to Supabase (no migration history)
    # Best for development — no prompt needed.
    # -----------------------------------------------------------------------
    echo "  📤  Pushing schema to Supabase..."
    $PRISMA db push
    echo ""
    echo "  🔄  Regenerating Prisma client..."
    $PRISMA generate
    echo ""
    echo "  ✅  Done! Schema is up to date on Supabase."
    ;;

esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
