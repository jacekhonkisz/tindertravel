#!/bin/bash

echo "🚀 DEPLOYING YOUR GLINTZ APP - FINAL ATTEMPT"
echo "============================================="
echo ""

# Kill any existing processes
echo "Cleaning up any existing processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*metro" 2>/dev/null || true
sleep 2

cd /Users/ala/tindertravel/app

echo ""
echo "✅ Environment: /Users/ala/tindertravel/app"
echo "✅ Expo account: jachon"
echo "✅ App slug: glintz-travel"
echo "✅ ngrok: Installed locally"
echo ""
echo "Starting Expo with tunnel mode..."
echo ""
echo "⏱️  This will take 20-30 seconds to:"
echo "   1. Start Metro Bundler"
echo "   2. Connect tunnel via ngrok"
echo "   3. Generate shareable URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Expo and show output
npx expo start --tunnel

# This command will run interactively and show:
# - QR code
# - exp:// URL
# - All logs
#
# The URL will look like: exp://abc-xyz.exp.direct:443
#
# Press Ctrl+C to stop the server when done





