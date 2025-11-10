#!/bin/bash

# Simple build script for Linux
# Just builds the application - you upload manually via FileZilla

set -e

PROJECT_DIR="/home/mostafa/Documents/Projects/SalahPlanner-FullStack/PrayerTime-Tasker/src/PrayerTasker.Api"
PUBLISH_DIR="$PROJECT_DIR/publish"

echo "========================================="
echo "  Building SalahPlanner API"
echo "========================================="
echo ""

# Clean old publish folder
echo "[1/2] Cleaning old build..."
rm -rf "$PUBLISH_DIR"

# Build and publish
echo "[2/2] Building application..."
cd "$PROJECT_DIR"
dotnet publish -c Release -o "$PUBLISH_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Build successful!"
echo "========================================="
echo ""
echo "📁 Published files are in:"
echo "   $PUBLISH_DIR"
echo ""
echo "📤 Next steps:"
echo "   1. Open FileZilla"
echo "   2. Connect to: site41963.siteasp.net"
echo "   3. Username: site41963"
echo "   4. Password: N+r58S=hs?2R"
echo "   5. Upload ALL files from the publish folder above"
echo ""
echo "🌐 After upload, visit: http://salahplanner.runasp.net/"
echo ""
