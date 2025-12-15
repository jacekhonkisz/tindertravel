#!/bin/bash

echo "🚀 Publishing Your REAL Glintz App to Expo!"
echo "============================================"
echo ""

cd /Users/ala/tindertravel/app

echo "Step 1: Logging in to Expo..."
echo "Enter your password when prompted for: jac.honkisz@gmail.com"
echo ""

npx expo login

if [ $? -ne 0 ]; then
  echo "❌ Login failed. Please try again."
  exit 1
fi

echo ""
echo "✅ Logged in successfully!"
echo ""
echo "Step 2: Checking EAS configuration..."
echo ""

# Check if EAS is configured
if [ ! -f "eas.json" ]; then
  echo "Creating EAS configuration..."
  npx eas build:configure
fi

echo ""
echo "Step 3: Installing expo-updates (required for publishing)..."
echo ""

npx expo install expo-updates

echo ""
echo "Step 4: Publishing your app..."
echo ""

npx eas update --branch production --message "Glintz App - Initial Release"

echo ""
echo "============================================"
echo "🎉 YOUR APP IS PUBLISHED!"
echo "============================================"
echo ""
echo "You'll see a URL above like:"
echo "  exp://u.expo.dev/[your-id]"
echo ""
echo "Share that link with anyone!"
echo "They just need to:"
echo "  1. Install Expo Go (free)"
echo "  2. Tap your link"
echo "  3. Your app opens!"
echo ""





