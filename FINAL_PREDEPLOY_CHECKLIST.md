# Final Pre-Deploy Checklist (Single Copy-Paste)

> Run this block from repo root. It performs hard checks and exits on failure.

```bash
set -euo pipefail

echo "[1/10] Sync branch"
git checkout main
git pull origin main

echo "[2/10] Ensure clean working tree"
if [ -n "$(git status --short)" ]; then
  echo "FAIL: working tree not clean"
  git status --short
  exit 1
fi
echo "PASS: working tree clean"

echo "[3/10] Check merge markers"
if git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" >/tmp/conflicts.txt; then
  echo "FAIL: merge markers found"
  cat /tmp/conflicts.txt
  exit 1
fi
echo "PASS: no merge markers"

node scripts/check-merge-conflicts.mjs

echo "[4/10] Validate required local env vars"
if [ ! -f .env.local ]; then
  echo "FAIL: .env.local missing"
  exit 1
fi

if ! grep -q '^VITE_SUPABASE_URL=' .env.local; then
  echo "FAIL: VITE_SUPABASE_URL missing in .env.local"
  exit 1
fi
if ! grep -q '^VITE_SUPABASE_ANON_KEY=' .env.local; then
  echo "FAIL: VITE_SUPABASE_ANON_KEY missing in .env.local"
  exit 1
fi

echo "PASS: required env keys found"

echo "[5/10] Install dependencies"
npm install

echo "[6/10] Build production bundle"
npm run build

echo "PASS: build succeeded"

echo "[7/10] Verify Supabase CLI and project link"
supabase --version
# Replace with your project ref before running:
# supabase link --project-ref <PROJECT_REF>

echo "[8/10] Verify function secrets (must exist): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
supabase secrets list

echo "[9/10] Deploy Edge Function"
supabase functions deploy create_employee
supabase functions list

echo "[10/10] Push for Hostinger deployment"
# Only if you made changes:
# git add .
# git commit -m "chore: pre-deploy checks passed"
git push origin main

echo "DONE: pre-deploy checks completed"
```

## Pass/Fail Criteria

- **PASS** when all 10 steps complete with no command failure.
- **FAIL** immediately if:
  - working tree is dirty
  - merge markers are found
  - `.env.local` is missing required keys
  - build fails
  - Supabase function deploy fails
  - `git push origin main` fails

## Post-Deploy Smoke Test (Manual)

1. Login as admin.
2. Create an employee from `/crm/admin/employees`.
3. Confirm user appears in Supabase Auth and `profiles`.
4. Logout and login with employee username.
5. Confirm role redirect:
   - `super_admin -> /crm/admin/dashboard`
   - `sales_manager -> /crm/manager/dashboard`
   - `sales_executive -> /crm/employee/dashboard`
