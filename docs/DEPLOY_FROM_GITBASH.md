# Deploy from Git Bash (exact flow)

Use exactly this sequence:

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git checkout main
git pull origin main
npm run build
git push origin main
```

## Why your deploy may not happen

If `git push origin main` prints **`Everything up-to-date`**, there is no new commit to deploy.

If you changed files, do this before push:

```bash
git add .
git commit -m "your message"
git push origin main
```

## Quick status checks

```bash
git status --short
git rev-parse --short HEAD
```

- `git status --short` empty = clean working tree.
- New deployment requires a **new commit hash** on `main`.

## Optional helper

You can run the same flow via helper script:

```bash
bash scripts/deploy-main.sh ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
```

The helper runs the same 4 commands and stops if local changes are uncommitted.
