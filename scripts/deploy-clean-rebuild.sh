#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🧹 Cleaning old build artifacts"
rm -rf dist
rm -rf node_modules/.vite 2>/dev/null || true

echo "📦 Creating fresh Vite build"
npm run build

echo "🧾 Build version"
cat dist/version.json

echo "✅ Clean rebuild completed. Deploy dist/ to Hostinger public_html/."
