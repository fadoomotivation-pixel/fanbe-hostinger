#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$PWD}"

cd "$REPO_DIR"

echo "[1/5] Switching to main"
git checkout main

echo "[2/5] Pull latest"
git pull origin main

echo "[3/5] Build check"
npm run build

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[4/5] Uncommitted changes found. Creating commit before push..."
  git add .
  git commit -m "chore: deploy updates"
else
  echo "[4/5] Working tree clean (no new commit needed)."
fi

echo "[5/5] Push to origin/main"
git push origin main

echo "Done. If Hostinger is connected to main, deployment should trigger automatically."
