# Deploy from Git Bash (safe + simple)

Use this from your local clone:

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git checkout main
git pull origin main
npm run build
git push origin main
```

## If you edited files before deploy

```bash
git add .
git commit -m "your message"
git push origin main
```

## One-command option (recommended)

This repo now includes a helper script:

```bash
bash scripts/deploy-main.sh ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
```

What it does:

1. Checkout `main`
2. Pull latest `origin/main`
3. Run `npm run build`
4. Auto-commit only if there are uncommitted changes
5. Push to `origin/main`

> Note: If Hostinger is linked to `main`, pushing to `main` triggers deploy automatically.
