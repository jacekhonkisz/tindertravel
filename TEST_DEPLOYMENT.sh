#!/bin/bash

echo "🧪 TESTING DEPLOYMENT - STEP BY STEP"
echo "====================================="
echo ""

cd /Users/ala/tindertravel/app

echo "Step 1: Starting Expo WITHOUT tunnel (for testing)..."
echo ""
echo "This will:"
echo "  ✅ Verify your app builds correctly"
echo "  ✅ Show you a QR code"
echo "  ✅ Give you a local URL"
echo ""
echo "If this works, we'll enable tunnel mode for worldwide sharing."
echo ""
echo "Starting in 3 seconds..."
sleep 3
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start

# After this works, you can:
# 1. Press 's' in the terminal
# 2. Choose 'tunnel' to enable worldwide sharing
# 3. Get your exp:// URL to share





