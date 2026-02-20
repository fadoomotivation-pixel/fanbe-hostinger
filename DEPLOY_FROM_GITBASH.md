# 🚀 DEPLOY FROM GIT BASH - ONE COMMAND!

**Date:** February 20, 2026, 9:47 PM IST  
**For:** Windows Git Bash Users  

---

## 🎯 QUICK DEPLOY (What You Want):

### **Option 1: Build Only (Fastest - Recommended)**

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git pull origin main
bash deploy.sh
```

Then upload `dist` folder using **FileZilla** or **Hostinger File Manager**.

---

### **Option 2: Fully Automated FTP Deploy**

#### **First Time Setup:**

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git pull origin main

# Edit FTP credentials
nano deploy-ftp.sh

# Add your FTP details:
# FTP_HOST="ftp.fanbegroup.com"     # Your FTP server
# FTP_USER="u123456789"              # Your FTP username  
# FTP_PASS="YourPassword123"         # Your FTP password

# Save: Ctrl+O, Enter, Ctrl+X
```

#### **Deploy (Every Time):**

```bash
bash deploy-ftp.sh
```

**Done!** Website deployed automatically! ✅

---

## 📋 STEP-BY-STEP GUIDE:

### **Step 1: Pull Latest Changes**

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git pull origin main
```

This gets the hover detection code.

---

### **Step 2: Run Deployment Script**

```bash
bash deploy.sh
```

**What it does:**
- ✅ Builds your project (`npm run build`)
- ✅ Creates `dist` folder with all files
- ✅ Shows you deployment options

---

### **Step 3: Upload to Hostinger**

#### **Method A: FileZilla (Recommended for Windows)**

1. **Download FileZilla:** https://filezilla-project.org/download.php?type=client

2. **Get FTP Credentials from Hostinger:**
   - Login: https://hpanel.hostinger.com
   - Go to: Files → FTP Accounts
   - Copy: Host, Username, Password

3. **Connect in FileZilla:**
   - Host: `ftp.yourdomain.com`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: `21`
   - Click "Quickconnect"

4. **Upload Files:**
   - **Left side:** Navigate to `dist` folder
   - **Right side:** Navigate to `/public_html`
   - **Select all files** in left `dist` folder
   - **Drag to right side** (to `public_html`)
   - Click "OK" to overwrite
   - **Wait for upload** (2-3 minutes)

5. **Done!** Visit your website and refresh!

---

#### **Method B: WinSCP (Alternative)**

1. **Download WinSCP:** https://winscp.net/eng/download.php

2. **Connect:**
   - File protocol: FTP
   - Host name: `ftp.yourdomain.com`
   - Port: 21
   - User name: Your FTP username
   - Password: Your FTP password
   - Click "Login"

3. **Upload:**
   - Navigate to `dist` folder (local)
   - Navigate to `/public_html` (remote)
   - Select all files from `dist`
   - Click "Upload"
   - Confirm overwrite

---

#### **Method C: Automated Script (Advanced)**

**Requires:** `lftp` installed in Git Bash

```bash
# Install lftp (one-time)
pacman -S lftp

# Configure credentials (one-time)
nano deploy-ftp.sh
# Edit FTP_HOST, FTP_USER, FTP_PASS
# Save and exit

# Deploy (every time)
bash deploy-ftp.sh
```

**Deploys automatically!** No manual FTP needed.

---

## 💻 COMPLETE WORKFLOW:

### **Every Time You Make Changes:**

```bash
# 1. Navigate to project
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean

# 2. Pull latest code from GitHub
git pull origin main

# 3. Make your changes (if any)
nano src/pages/ProjectsPage.jsx

# 4. Build and deploy
bash deploy.sh

# 5. Upload dist folder via FileZilla
# (Or use automated: bash deploy-ftp.sh)

# 6. Visit website and test!
```

---

## ✅ **RIGHT NOW - DEPLOY HOVER FEATURE:**

```bash
# In Git Bash:
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean

# Pull the hover detection code
git pull origin main

# Build (creates dist folder)
bash deploy.sh

# Upload dist folder using FileZilla to /public_html
# OR use Hostinger File Manager
```

**Done!** Hover feature is live! 🎉

---

## 🔍 TROUBLESHOOTING:

### **Script won't run?**

```bash
# Make script executable
chmod +x deploy.sh
chmod +x deploy-ftp.sh

# Then run
bash deploy.sh
```

### **Can't find dist folder?**

```bash
# It's in your project root:
ls -la dist/

# Or full path:
ls ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean/dist/
```

### **FileZilla connection failed?**

- Check FTP credentials in Hostinger
- Try Port 21 (FTP) or Port 22 (SFTP)
- Disable firewall temporarily
- Check if FTP is enabled in Hostinger

---

## 📁 FILES:

- **`deploy.sh`** - Build script (no FTP)
- **`deploy-ftp.sh`** - Automated FTP deployment
- **`dist/`** - Built files ready to upload

---

## ⏱️ TIME ESTIMATE:

- **First time:** 10-15 minutes (with FileZilla setup)
- **After setup:** 3-5 minutes (just run script + upload)
- **With automation:** 2 minutes (just run script)

---

## 🎯 YOUR PREFERRED WORKFLOW:

**Based on what you've been doing:**

```bash
# Simple 3-command deploy:
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git pull origin main
bash deploy.sh

# Then upload dist/ via FileZilla or File Manager
```

**This matches your Git Bash workflow!** ✅

---

**Ready to deploy? Run these commands now:**

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean
git pull origin main
bash deploy.sh
```

Then I'll help you upload the files! 🚀
