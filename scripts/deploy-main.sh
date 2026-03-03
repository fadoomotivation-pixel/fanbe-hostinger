set -euo pipefail

REPO_DIR="${1:-$PWD}"
cd "$REPO_DIR"

echo "[1/4] git checkout main"
git checkout main

echo "[2/4] git pull origin main"
git pull origin main

echo "[3/4] npm run build"
npm run build

echo "[4/4] git push origin main"
git push origin main

echo "✅ Done. Deployment triggered."
