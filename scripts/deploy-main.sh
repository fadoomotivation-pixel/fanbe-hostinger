#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$PWD}"
cd "$REPO_DIR"

echo "[1/4] git checkout main"
git checkout main

echo "[2/4] git pull origin main"
git pull origin main

echo "[3/4] npm run build"
npm run build

if [[ -n "$(git status --porcelain)" ]]; then
  echo ""
  echo "❌ Deployment blocked: you have local file changes."
  echo "Run these first, then re-run this script:"
  echo "  git add ."
  echo "  git commit -m 'your message'"
  exit 1
fi

echo "[4/4] git push origin main"
git push origin main

echo "✅ Done. If Hostinger is linked to origin/main, deployment is triggered by this push."
