#!/bin/bash

echo "🚀 Starting Your REAL Glintz App with Shareable Link!"
echo "====================================================="
echo ""
echo "Your app includes:"
echo "  ✅ Authentication (Email + OTP)"
echo "  ✅ Hotel card swiping"
echo "  ✅ Maps integration"
echo "  ✅ Saved hotels"
echo "  ✅ All your beautiful screens"
echo ""
echo "Starting server with tunnel (this makes it accessible worldwide)..."
echo ""

cd /Users/ala/tindertravel/app
npx expo start --tunnel

# This will show:
# 1. A QR code
# 2. An exp:// URL you can share
#
# Share the exp:// URL with anyone!
# They install Expo Go (free) and tap your link
# Your complete app opens on their iPhone!





