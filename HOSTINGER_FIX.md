# 🔧 FIX: Hostinger "Unsupported Framework" Error

## The Problem

Hostinger is showing: **"Unsupported framework or invalid project structure"**

This happens because your current repository contains:
- Horizons-specific development plugins
- Custom build configurations
- Files that Hostinger doesn't recognize as a standard Vite project

## The Solution

Use this **clean, standard Vite project structure** that Hostinger will recognize.

---

## OPTION 1: Create New Repository (RECOMMENDED)

### Step 1: Create New GitHub Repository

1. Go to GitHub → New Repository
2. Name it: `fanbe-website` (or any name)
3. Make it **Private**
4. **DO NOT** initialize with README
5. Click "Create repository"

### Step 2: Upload This Clean Version

```bash
# Navigate to the hostinger-clean folder
cd path/to/hostinger-clean

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Hostinger compatible"

# Add your new repository (replace with your URL)
git remote add origin https://github.com/YOUR-USERNAME/fanbe-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Connect to Hostinger

1. In Hostinger dashboard
2. Click "Import Git repository"
3. Select your **NEW** repository: `fanbe-website`
4. Configure settings:

```
Framework: Vite
Node version: 22.x
Root directory: ./
Build command: npm run build
Output directory: dist
```

5. Click "Deploy"

---

## OPTION 2: Clean Existing Repository

If you want to keep the same repository name:

### Step 1: Backup Current Repository

```bash
# Clone your current repo to backup location
git clone https://github.com/YOUR-USERNAME/fanbe-website-clean.git fanbe-backup
```

### Step 2: Clean the Repository

```bash
# Clone the repository fresh
git clone https://github.com/YOUR-USERNAME/fanbe-website-clean.git
cd fanbe-website-clean

# Remove everything except .git
rm -rf *
rm -rf .gitignore .htaccess

# Copy clean files from hostinger-clean folder
cp -r path/to/hostinger-clean/* .
cp path/to/hostinger-clean/.gitignore .

# Stage all changes
git add .
git add -A

# Commit
git commit -m "Restructure for Hostinger compatibility"

# Force push (overwrites repository)
git push -f origin main
```

### Step 3: Redeploy on Hostinger

1. Go to Hostinger dashboard
2. Settings → Verify settings are:

```
Framework: Vite
Node version: 22.x
Root directory: ./
Build command: npm run build
Output directory: dist
```

3. Click "Redeploy All"

---

## Why This Works

### ✅ Clean Structure
```
fanbe-website/
├── package.json          ← Standard Vite dependencies
├── vite.config.js        ← Minimal Vite config
├── index.html           ← Entry point
├── src/                 ← Source code
├── public/              ← Static assets
└── README.md            ← Documentation
```

### ❌ What Was Removed
- `plugins/` folder (Horizons custom plugins)
- `tools/` folder (Custom build tools)
- `.nvmrc` (Not needed on Hostinger)
- `eslint.config.mjs` (Development only)
- Complex vite.config.js (Simplified)

### ✅ What Hostinger Sees Now
A standard, clean Vite + React project that matches their expected structure.

---

## Verification Checklist

After deploying, verify these files exist in your repository:

**Root Level:**
- [ ] `package.json` (with clean scripts)
- [ ] `vite.config.js` (minimal configuration)
- [ ] `index.html`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`
- [ ] `README.md`
- [ ] `.gitignore`

**Folders:**
- [ ] `src/` (all your source code)
- [ ] `public/` (static assets)

**Should NOT exist:**
- [ ] ❌ `plugins/` folder
- [ ] ❌ `tools/` folder
- [ ] ❌ `.nvmrc` file
- [ ] ❌ `eslint.config.mjs`

---

## Testing Locally First

Before deploying to Hostinger, test locally:

```bash
cd hostinger-clean

# Install dependencies
npm install

# Start dev server
npm run dev
# Should open at http://localhost:5173

# Build for production
npm run build
# Should create dist/ folder

# Preview production build
npm run preview
# Should open at http://localhost:4173
```

If all three commands work without errors, you're ready to deploy!

---

## Expected Build Output (Success)

When Hostinger builds successfully, you'll see:

```
> fanbe-website@1.0.0 build
> vite build

vite v5.0.8 building for production...
✓ 1740 modules transformed.
dist/index.html                   1.26 kB
dist/assets/index-[hash].css     16.71 kB
dist/assets/index-[hash].js     335.31 kB
✓ built in 3.5s
```

---

## Troubleshooting

### Still Getting "Unsupported Framework"?

1. **Check package.json** - Must have standard scripts:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

2. **Check vite.config.js** - Must be minimal:
   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
   })
   ```

3. **Check file structure** - Must have:
   - `index.html` at root
   - `src/` folder with source code
   - `package.json` at root

### Build Fails?

**Error: "Cannot find module"**
- Check all imports in your code
- Verify all dependencies are in package.json

**Error: "Vite not found"**
- Ensure `vite` is in `devDependencies`
- Hostinger will run `npm install` first

### Routes Not Working After Deploy?

Make sure `.htaccess` is in `public/` folder with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

---

## Quick Reference

### Hostinger Settings (Copy These)
```
Framework: Vite
Node version: 22.x
Root directory: ./
Build command: npm run build
Output directory: dist
```

### Test Commands
```bash
npm install    # Install dependencies
npm run dev    # Test development server
npm run build  # Test production build
```

### GitHub Commands
```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Need Help?

**Hostinger Support:**
- Click the chat icon in Hostinger dashboard
- Available 24/7

**Check Build Logs:**
1. Hostinger Dashboard
2. Your Website → Deployments
3. Click on failed deployment
4. View logs to see exact error

---

**Status**: Ready to deploy ✅

Choose **Option 1** (new repository) for cleanest setup, or **Option 2** (clean existing) if you want to keep the same repo name.
