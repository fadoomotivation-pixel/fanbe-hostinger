# 🚀 AUTOMATED DEPLOYMENT TO HOSTINGER

**Setup Date:** February 20, 2026, 9:30 PM IST  
**Status:** ⚙️ Requires Configuration  

---

## ✨ WHAT THIS DOES:

Once configured, every time you push code to GitHub, it will **automatically**:
1. ✅ Build your project
2. ✅ Deploy to Hostinger
3. ✅ Update your live website

**No manual upload needed!**

---

## 🔧 SETUP INSTRUCTIONS (One-Time Only):

### Step 1: Get Your Hostinger FTP Details

1. **Login to Hostinger:** https://hpanel.hostinger.com
2. **Go to Files → FTP Accounts**
3. **Note down:**
   - **FTP Server:** Usually `ftp.yourdomain.com` or shown in Hostinger
   - **FTP Username:** Your FTP username (usually like `u123456789`)
   - **FTP Password:** Your FTP password

---

### Step 2: Add Secrets to GitHub

1. **Go to Your Repository:**
   - https://github.com/fadoomotivation-pixel/fanbe-hostinger

2. **Click Settings** (top right)

3. **Go to:** Secrets and variables → Actions

4. **Click "New repository secret"**

5. **Add These 5 Secrets:**

   | Secret Name | Value | Example |
   |-------------|-------|----------|
   | `FTP_SERVER` | Your FTP hostname | `ftp.fanbegroup.com` |
   | `FTP_USERNAME` | Your FTP username | `u123456789` or `fanbe@fanbegroup.com` |
   | `FTP_PASSWORD` | Your FTP password | `YourSecurePassword123` |
   | `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

   **For each secret:**
   - Click "New repository secret"
   - Name: Enter the secret name (e.g., `FTP_SERVER`)
   - Value: Paste the value
   - Click "Add secret"

---

### Step 3: Test the Deployment

#### Option A: Manual Trigger (Test First)

1. Go to: https://github.com/fadoomotivation-pixel/fanbe-hostinger/actions
2. Click "Deploy to Hostinger" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait 2-3 minutes
5. Check your website!

#### Option B: Automatic (Push to GitHub)

Just push any change:
```bash
git add .
git commit -m "test deployment"
git push origin main
```

GitHub will automatically deploy!

---

## 📊 HOW IT WORKS:

```
You push to GitHub
       ↓
GitHub Actions triggers
       ↓
Installs dependencies (npm ci)
       ↓
Builds project (npm run build)
       ↓
Uploads dist/ to Hostinger via FTP
       ↓
Your website is live! ✅
```

**Time:** 2-3 minutes from push to live

---

## ✅ VERIFICATION:

### Check if deployment worked:

1. **Go to Actions tab:**
   https://github.com/fadoomotivation-pixel/fanbe-hostinger/actions

2. **Look for latest workflow run**
   - Green checkmark ✅ = Success
   - Red X ❌ = Failed (check logs)

3. **Visit your website**
   - Hard refresh: `Ctrl + Shift + R`
   - Check if changes are live

---

## 🔍 TROUBLESHOOTING:

### ❌ Deployment Failed?

#### 1. Check FTP Credentials:
```bash
# Test FTP connection manually:
# Open FileZilla or WinSCP
# Try connecting with your FTP details
# If connection fails, credentials are wrong
```

#### 2. Check Secrets in GitHub:
- Go to Settings → Secrets and variables → Actions
- Make sure all 5 secrets are added
- Secret names must match EXACTLY (case-sensitive)

#### 3. Check Workflow Logs:
- Go to Actions tab
- Click on failed workflow
- Click on "build-and-deploy" job
- Read error message

### Common Errors:

| Error | Solution |
|-------|----------|
| `FTP connection failed` | Check FTP_SERVER, FTP_USERNAME, FTP_PASSWORD |
| `Authentication failed` | Check FTP_PASSWORD is correct |
| `Directory not found` | Change `server-dir` in workflow file |
| `npm ci failed` | Run `npm install` locally first |

---

## 🎯 WHAT TO DO AFTER SETUP:

### Every time you make changes:

```bash
# 1. Make your changes in code

# 2. Commit and push
git add .
git commit -m "your change description"
git push origin main

# 3. Wait 2-3 minutes
# GitHub will automatically deploy!

# 4. Visit your website and verify
```

**That's it! No manual FTP upload anymore!** 🎉

---

## 📁 FILES INVOLVED:

- **Workflow:** `.github/workflows/deploy-to-hostinger.yml`
- **This Guide:** `AUTOMATED_DEPLOYMENT_SETUP.md`

---

## ⚙️ ADVANCED OPTIONS:

### Deploy Only Specific Branches:

Edit `.github/workflows/deploy-to-hostinger.yml`:
```yaml
on:
  push:
    branches:
      - main      # Deploy only from main
      - production # Or add production branch
```

### Deploy to Different Folder:

Change `server-dir` in workflow:
```yaml
server-dir: /public_html/subfolder/  # Deploy to subfolder
```

### Manual Deploy Only (Disable Auto-Deploy):

Remove `push:` section, keep only:
```yaml
on:
  workflow_dispatch:  # Manual trigger only
```

---

## 📞 GETTING YOUR FTP CREDENTIALS:

### Hostinger:
1. Login: https://hpanel.hostinger.com
2. Select your website
3. Go to: Files → FTP Accounts
4. Create new FTP account or view existing
5. Copy: Hostname, Username, Password

### Hostinger FTP Server Format:
```
ftp.yourdomain.com
OR
ftp.yourdomain.in
OR
shown in FTP Accounts section
```

---

## 🔐 SECURITY NOTES:

✅ **Secrets are encrypted** in GitHub  
✅ **Never visible** in code or logs  
✅ **Only workflow can access** them  
❌ **Never commit** FTP credentials to code  
❌ **Never share** your secrets publicly  

---

## 📋 SETUP CHECKLIST:

- [ ] Got FTP credentials from Hostinger
- [ ] Added FTP_SERVER secret to GitHub
- [ ] Added FTP_USERNAME secret to GitHub
- [ ] Added FTP_PASSWORD secret to GitHub
- [ ] Added VITE_SUPABASE_URL secret (if using Supabase)
- [ ] Added VITE_SUPABASE_ANON_KEY secret (if using Supabase)
- [ ] Ran test deployment
- [ ] Verified website is live
- [ ] Tested with a small change

---

## ✅ ONCE SETUP IS COMPLETE:

**Your workflow will be:**
```bash
# Make changes
nano src/pages/ProjectsPage.jsx

# Push to GitHub
git add .
git commit -m "updated projects page"
git push

# ☕ Grab coffee (2 min)
# ✅ Changes are live!
```

**No more manual FTP uploads!** 🚀

---

**Status:** ⏳ Waiting for you to add FTP secrets to GitHub

**After Setup:** ✅ Fully automated deployment ready!
