#!/bin/bash

# Monster ASP.NET Deployment Script
# This script builds and deploys the SalahPlanner API to Monster ASP.NET

set -e  # Exit on error

# Configuration
PROJECT_DIR="/home/mostafa/Documents/Projects/SalahPlanner-FullStack/PrayerTime-Tasker/src/PrayerTasker.Api"
PUBLISH_DIR="$PROJECT_DIR/publish"
FTP_HOST="site41963.siteasp.net"
FTP_USER="site41963"
FTP_PASS="N+r58S=hs?2R"
FTP_PATH="/site41963"

echo "========================================="
echo "  SalahPlanner API Deployment Script"
echo "========================================="
echo ""

# Step 1: Clean old publish folder
echo "[1/4] Cleaning old publish folder..."
rm -rf "$PUBLISH_DIR"

# Step 2: Build and publish
echo "[2/4] Building and publishing application..."
cd "$PROJECT_DIR"
dotnet publish -c Release -o "$PUBLISH_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

echo "✓ Build successful!"

# Step 3: Upload via FTP
echo "[3/4] Uploading to Monster ASP.NET..."

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "⚠️  lftp is not installed."
    echo "   Install it with: sudo pacman -S lftp"
    echo "   Or use FileZilla to manually upload files from: $PUBLISH_DIR"
    exit 1
fi

echo "Attempting FTP connection..."
echo "Host: $FTP_HOST"
echo "User: $FTP_USER"
echo ""

# Upload using lftp with passive mode and additional settings
lftp <<EOF
set ftp:passive-mode true
set ftp:ssl-allow false
set ftp:ssl-force false
set ssl:verify-certificate false
set net:timeout 30
set net:max-retries 3
set net:reconnect-interval-base 5
open -u "$FTP_USER","$FTP_PASS" "$FTP_HOST"
lcd "$PUBLISH_DIR"
mirror -R --delete --verbose --parallel=2 . $FTP_PATH
bye
EOF

if [ $? -ne 0 ]; then
    echo "❌ Upload failed!"
    exit 1
fi

echo "✓ Upload successful!"

# Step 4: Completion
echo "[4/4] Deployment complete!"
echo ""
echo "========================================="
echo "✅ Deployment successful!"
echo "========================================="
echo ""
echo "Your application should be available at:"
echo "🌐 http://salahplanner.runasp.net/"
echo ""
echo "Next steps:"
echo "1. Test your API endpoints"
echo "2. Check the logs in Monster ASP.NET control panel"
echo "3. Verify database connection"
echo ""
