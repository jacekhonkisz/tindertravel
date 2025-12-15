#!/bin/bash

echo "🚀 Deploying Your REAL Glintz App to Expo (Fixed Version)"
echo "=========================================================="
echo ""

cd /Users/ala/tindertravel/app

echo "Step 1: Checking if you're logged in..."
echo ""

# Check if already logged in
EXPO_USER=$(npx expo whoami 2>&1)

if [[ "$EXPO_USER" == *"Not logged in"* ]]; then
  echo "Please log in with your Expo account (jac.honkisz@gmail.com):"
  npx expo login
  
  if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
  fi
else
  echo "✅ Already logged in as: $EXPO_USER"
fi

echo ""
echo "Step 2: Creating EAS update..."
echo ""
echo "This will publish your REAL Glintz app to Expo!"
echo "It includes:"
echo "  ✅ Authentication (Email + OTP)"
echo "  ✅ Hotel card swiping"
echo "  ✅ Maps integration"
echo "  ✅ Saved hotels"
echo "  ✅ All your screens"
echo ""

# Publish the update
eas update --branch production --message "Glintz App v1.0 - Full Release"

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================"
  echo "🎉 SUCCESS! YOUR REAL APP IS LIVE!"
  echo "============================================"
  echo ""
  echo "Your app is now published and accessible!"
  echo ""
  echo "Next steps:"
  echo "1. Build a development client to test updates:"
  echo "   eas build --profile development --platform ios"
  echo ""
  echo "2. Or use Expo Go for quick testing:"
  echo "   npx expo start"
  echo ""
  echo "Note: To share your app via Expo Go, you need to:"
  echo "  1. Run: npx expo start --tunnel"
  echo "  2. Share the QR code or exp:// URL"
  echo "  3. Users install Expo Go and scan/tap the link"
  echo ""
else
  echo ""
  echo "❌ Update failed. Please check the error messages above."
  exit 1
fi






