#!/bin/bash

# =============================================================================
# FANBE HOSTINGER - CONFIGURED DEPLOYMENT
# =============================================================================
# Run: bash deploy-configured.sh
# =============================================================================

# FTP Configuration for Fanbe Group
FTP_HOST="145.79.213.160"
FTP_USER="u891384752.fanbegroup.com"
FTP_PASS="Major@1k"
FTP_DIR="/public_html"

echo "========================================"
echo "🚀 FANBE HOSTINGER DEPLOYMENT"
echo "========================================"
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "⚠️  'lftp' not found. Using alternative method..."
    echo ""
    
    # Build first
    echo "📦 Building project..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
    
    echo "✅ Build complete!"
    echo ""
    echo "========================================"
    echo "📤 READY TO UPLOAD"
    echo "========================================"
    echo ""
    echo "Use FileZilla or WinSCP with these details:"
    echo ""
    echo "Host: $FTP_HOST"
    echo "Username: $FTP_USER"
    echo "Password: $FTP_PASS"
    echo "Port: 21"
    echo "Directory: $FTP_DIR"
    echo ""
    echo "Upload all files from: dist/"
    echo ""
    exit 0
fi

# Build
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete!"
echo ""

# Upload via FTP
echo "📤 Uploading to Hostinger..."
echo "Host: $FTP_HOST"
echo "Directory: $FTP_DIR"
echo ""

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:passive-mode on
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
    echo "🎉 Your website is now LIVE!"
    echo ""
    echo "Visit: https://fanbegroup.com"
    echo "Hard refresh: Ctrl + Shift + R"
    echo ""
    echo "✨ Hover feature is now active!"
    echo ""
else
    echo ""
    echo "❌ FTP upload failed!"
    echo ""
    echo "Alternative: Use FileZilla"
    echo "Host: $FTP_HOST"
    echo "User: $FTP_USER"
    echo "Pass: $FTP_PASS"
    echo "Upload: dist/ to $FTP_DIR"
    exit 1
fi
