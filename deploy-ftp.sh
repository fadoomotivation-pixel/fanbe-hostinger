#!/bin/bash

# =============================================================================
# AUTOMATED FTP DEPLOYMENT TO HOSTINGER
# =============================================================================
# Usage: bash deploy-ftp.sh
# =============================================================================

FTP_HOST="145.79.213.160"
FTP_USER="u891384752.fanbegroup.com"
FTP_PASS="${FTP_PASS:-}"                # Set via: export FTP_PASS="yourpassword"
FTP_PORT="21"
FTP_DIR="/public_html"

# =============================================================================
# DO NOT EDIT BELOW THIS LINE
# =============================================================================

echo "========================================"
echo "🚀 FANBE FTP DEPLOYMENT"
echo "========================================"
echo ""

# Check password is set
if [ -z "$FTP_PASS" ]; then
    echo "❌ FTP password not set!"
    echo ""
    echo "Run this first (one time per terminal session):"
    echo "  export FTP_PASS=\"your_ftp_password\""
    echo ""
    echo "Then run: bash deploy-ftp.sh"
    echo ""
    echo "Get your password from:"
    echo "https://hpanel.hostinger.com -> Files -> FTP Accounts"
    exit 1
fi

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "❌ 'lftp' is not installed!"
    echo ""
    echo "Install it with:"
    echo "  pacman -S lftp    (Git Bash / MSYS2)"
    echo ""
    echo "Or use WinSCP / FileZilla to manually upload the /dist folder to public_html"
    exit 1
fi

# Check dist folder exists
if [ ! -d "dist" ]; then
    echo "📦 No dist folder found. Building first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "📤 Uploading to Hostinger..."
echo "Host: $FTP_HOST:$FTP_PORT"
echo "User: $FTP_USER"
echo "Dir:  $FTP_DIR"
echo ""

lftp -u "$FTP_USER,$FTP_PASS" "ftp://$FTP_HOST:$FTP_PORT" <<EOF
set ssl:verify-certificate no
set ftp:passive-mode yes
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
    echo "🌐 Live at: https://fanbegroup.com"
    echo "🔄 Hard refresh: Ctrl + Shift + R"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check FTP credentials or network and try again."
    exit 1
fi
