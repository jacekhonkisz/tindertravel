#!/bin/bash

# Glintz iOS Build and Deploy Script
# This script builds your iOS app and prepares it for TestFlight distribution

echo "🚀 Glintz iOS Build & Deploy"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}📦 Installing EAS CLI...${NC}"
    npm install -g eas-cli
fi

# Navigate to app directory
cd "$(dirname "$0")/app" || exit

# Check if logged in to EAS
echo -e "\n${YELLOW}🔐 Checking EAS login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to EAS:${NC}"
    eas login
fi

# Check if EAS is configured
if [ ! -f "eas.json" ]; then
    echo -e "\n${YELLOW}⚙️  Configuring EAS Build...${NC}"
    eas build:configure
fi

# Show current configuration
echo -e "\n${GREEN}📱 Current App Configuration:${NC}"
echo "  Name: Glintz"
echo "  Bundle ID: com.glintz.travel"
echo "  Version: 1.0.0"
echo "  Platform: iOS"

# Ask user what they want to do
echo -e "\n${YELLOW}What would you like to do?${NC}"
echo "  1) Build for iOS (TestFlight)"
echo "  2) Build and Submit to TestFlight"
echo "  3) Check build status"
echo "  4) Exit"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}🔨 Building iOS app...${NC}"
        echo "This will take 10-20 minutes..."
        eas build --platform ios
        echo -e "\n${GREEN}✅ Build complete!${NC}"
        echo "Next steps:"
        echo "1. Go to https://expo.dev/accounts/[your-account]/projects/glintz/builds"
        echo "2. Download the .ipa file"
        echo "3. Upload to App Store Connect manually"
        ;;
    2)
        echo -e "\n${GREEN}🔨 Building and submitting to TestFlight...${NC}"
        echo "This will take 10-20 minutes..."
        eas build --platform ios --auto-submit
        echo -e "\n${GREEN}✅ Build and submit complete!${NC}"
        echo "Next steps:"
        echo "1. Wait 10-30 minutes for App Store processing"
        echo "2. Go to https://appstoreconnect.apple.com"
        echo "3. Navigate to TestFlight tab"
        echo "4. Add testers and share the link!"
        ;;
    3)
        echo -e "\n${GREEN}📊 Recent builds:${NC}"
        eas build:list --platform ios --limit 5
        ;;
    4)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Done!${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo "  eas build:list           - View all builds"
echo "  eas build:view [ID]      - View specific build"
echo "  eas submit --platform ios - Submit existing build"
echo ""
echo -e "${YELLOW}Need help?${NC}"
echo "  Read: IOS_FREE_DEPLOYMENT_GUIDE.md"
echo "  Docs: https://docs.expo.dev/build/introduction/"






