# Final Pre-Deploy Checklist (Supabase CRM)

Use this checklist exactly before deploying to Hostinger.

## 0) Branch and clean working tree

```bash
git checkout main
git pull origin main
git status --short
```

**PASS**: `git status --short` prints nothing.

---

## 1) Verify no merge markers exist

```bash
git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" || true
node scripts/check-merge-conflicts.mjs
```

**PASS**:
- `git grep` returns no files.
- merge-conflict script exits successfully.

---

## 2) Ensure Supabase env is present locally

```bash
cat .env.local
```

Expected keys:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**PASS**: both keys are present and non-empty.

---

## 3) Install and build

```bash
npm install
npm run build
```

**PASS**: Vite build completes and outputs `dist/` successfully.

---

## 4) Optional local production preview smoke test

```bash
npm run preview
```

Open app and verify:
1. `/crm/login` loads.
2. Admin login succeeds.
3. Admin creates employee from Employee Management.
4. Credentials are shown (toast + modal).
5. Logout and login with created employee username.
6. Role redirects go to correct namespace:
   - `super_admin -> /crm/admin/dashboard`
   - `sales_manager -> /crm/manager/dashboard`
   - `sales_executive -> /crm/employee/dashboard`

**PASS**: all six checks succeed.

---

## 5) Verify Supabase function deployment prerequisites

```bash
supabase --version
supabase link --project-ref <PROJECT_REF>
supabase secrets list
```

Required secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**PASS**: CLI works, project linked, all secrets exist.

---

## 6) Deploy/create_employee Edge Function

```bash
supabase functions deploy create_employee
supabase functions list
```

**PASS**: `create_employee` appears in function list.

---

## 7) Git push for frontend deploy

```bash
git add .
git commit -m "chore: pre-deploy checks passed"
git push origin main
```

**PASS**: push succeeds.

---

## 8) Hostinger runtime env check

In Hostinger project settings, verify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build settings:
- Build command: `npm run build`
- Output directory: `dist`

**PASS**: both vars configured and build settings match.

---

## 9) Post-deploy production smoke test

Validate on production domain:
1. Admin login works.
2. Employee creation works.
3. New user appears in Supabase Auth and `profiles`.
4. Employee login by username works.
5. Employee login by email works.

**PASS**: all five checks succeed.

---

## Quick rollback plan (if fail)

1. Revert to previous stable commit:
```bash
git log --oneline -n 10
git revert <bad_commit_sha>
git push origin main
```
2. Re-deploy from Hostinger.
3. Disable new feature path temporarily if needed.
