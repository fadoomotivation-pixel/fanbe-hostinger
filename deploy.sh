#!/bin/bash

# =============================================================================
# FANBE HOSTINGER DEPLOYMENT SCRIPT
# =============================================================================
# Run this from Git Bash: bash deploy.sh
# =============================================================================

echo "========================================"
echo "🚀 FANBE HOSTINGER DEPLOYMENT"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Step 1: Build the project
echo "📦 Step 1: Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Step 2: Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found after build!"
    exit 1
fi

echo "📁 Dist folder ready with $(du -sh dist | cut -f1) of files"
echo ""

# Step 3: Deploy instructions
echo "========================================"
echo "✅ BUILD COMPLETE!"
echo "========================================"
echo ""
echo "Your files are ready in the 'dist' folder."
echo ""
echo "📤 DEPLOYMENT OPTIONS:"
echo ""
echo "Option A: FTP Upload (Recommended)"
echo "  1. Open FileZilla or WinSCP"
echo "  2. Connect to your Hostinger FTP"
echo "  3. Upload all files from 'dist/' to '/public_html/'"
echo ""
echo "Option B: Hostinger File Manager"
echo "  1. Login: https://hpanel.hostinger.com"
echo "  2. Go to File Manager"
echo "  3. Navigate to public_html"
echo "  4. Upload all files from 'dist/' folder"
echo ""
echo "Option C: Automated FTP (Setup Required)"
echo "  Run: bash deploy-ftp.sh"
echo ""
echo "========================================"
echo "📊 FILES READY FOR DEPLOYMENT:"
echo "========================================"
ls -lh dist/
echo ""
echo "✅ Ready to deploy! Choose an option above."
echo ""
