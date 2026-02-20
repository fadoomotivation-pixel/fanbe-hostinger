#!/bin/bash

# =============================================================================
# AUTOMATED FTP DEPLOYMENT TO HOSTINGER
# =============================================================================
# Usage: bash deploy-ftp.sh
# First time: Edit FTP credentials below
# =============================================================================

# ⚠️ CONFIGURE YOUR FTP CREDENTIALS HERE (First Time Setup)
# Get these from: https://hpanel.hostinger.com -> Files -> FTP Accounts

FTP_HOST="ftp.yourdomain.com"       # Change this to your FTP hostname
FTP_USER="your-ftp-username"         # Change this to your FTP username
FTP_PASS="your-ftp-password"         # Change this to your FTP password
FTP_DIR="/public_html"               # Usually /public_html (change if different)

# =============================================================================
# DO NOT EDIT BELOW THIS LINE
# =============================================================================

echo "========================================"
echo "🚀 FANBE FTP DEPLOYMENT"
echo "========================================"
echo ""

# Check if credentials are configured
if [ "$FTP_HOST" = "ftp.yourdomain.com" ]; then
    echo "❌ FTP credentials not configured!"
    echo ""
    echo "Please edit deploy-ftp.sh and add your FTP credentials:"
    echo "  1. Open: nano deploy-ftp.sh"
    echo "  2. Update FTP_HOST, FTP_USER, FTP_PASS"
    echo "  3. Save and run again"
    echo ""
    echo "Get credentials from:"
    echo "https://hpanel.hostinger.com -> Files -> FTP Accounts"
    exit 1
fi

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "❌ 'lftp' is not installed!"
    echo ""
    echo "Install it:"
    echo "  Git Bash: pacman -S lftp"
    echo "  Or use Windows FTP client instead"
    exit 1
fi

# Step 1: Build
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete!"
echo ""

# Step 2: Upload via FTP
echo "📤 Uploading to Hostinger..."
echo "Host: $FTP_HOST"
echo "Directory: $FTP_DIR"
echo ""

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
cd $FTP_DIR
mirror -R --delete --verbose dist/ ./
bye
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================================"
    echo ""
    echo "Your website is now live!"
    echo "Visit your website and hard refresh: Ctrl + Shift + R"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check your FTP credentials and try again."
    exit 1
fi
