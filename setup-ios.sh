#!/bin/bash

# Glintz iOS Setup Script
echo "🏨 Setting up Glintz for iOS development..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This app requires macOS for iOS development"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is required but not installed"
    echo "Please install Xcode from the App Store"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required (current: $(node -v))"
    exit 1
fi

echo "✅ macOS and Xcode detected"
echo "✅ Node.js $(node -v) detected"

# Install Expo CLI if not present
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ Expo CLI ready"

# Install dependencies
echo "📦 Installing API dependencies..."
cd api && npm install

echo "📦 Installing iOS app dependencies..."
cd ../app && npm install

# Setup environment files
echo "⚙️  Setting up environment files..."

# API environment
cd ../api
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created api/.env - Please add your Amadeus API credentials"
fi

# App environment  
cd ../app
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created app/.env"
fi

# iOS-specific setup
echo "📱 Configuring for iOS..."

# Check iOS Simulator
echo "🔍 Checking iOS Simulator..."
xcrun simctl list devices available | grep -q "iPhone" && echo "✅ iOS Simulator available" || echo "⚠️  iOS Simulator may not be available"

# Install iOS dependencies
echo "📦 Installing iOS-specific dependencies..."
npx expo install expo-haptics @react-native-community/blur

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit api/.env with your Amadeus API credentials"
echo "2. Run: npm run dev (starts both API and app)"
echo "3. Run: npm run ios (opens in iOS Simulator)"
echo ""
echo "🔗 Get Amadeus API credentials: https://developers.amadeus.com"
echo ""
echo "📱 iOS-specific features enabled:"
echo "   • Native blur effects"
echo "   • Haptic feedback"
echo "   • 60fps animations"
echo "   • iOS gesture patterns"
echo ""

cd .. 