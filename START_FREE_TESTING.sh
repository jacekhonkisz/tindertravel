#!/bin/bash

# Glintz - 100% FREE Testing with Expo Go
# No Apple Developer account needed!

echo "🎉 Glintz - FREE iOS Testing"
echo "============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to app directory
cd "$(dirname "$0")/app" || exit

echo -e "\n${YELLOW}📱 This is 100% FREE - No Apple Developer account needed!${NC}"
echo ""
echo "How it works:"
echo "1. Install 'Expo Go' app on your iPhone (FREE from App Store)"
echo "2. Scan the QR code that appears"
echo "3. Your app opens instantly!"
echo ""

# Check if expo is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${BLUE}Choose an option:${NC}"
echo "  1) Start on local network (WiFi - same network required)"
echo "  2) Start with tunnel (Internet - share with anyone!)"
echo "  3) Exit"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}🚀 Starting Expo Go on local network...${NC}"
        echo -e "${YELLOW}Make sure your iPhone is on the same WiFi network!${NC}"
        echo ""
        npx expo start
        ;;
    2)
        echo -e "\n${GREEN}🌐 Starting Expo Go with public tunnel...${NC}"
        echo -e "${YELLOW}This creates a public URL you can share with anyone!${NC}"
        echo ""
        npx expo start --tunnel
        ;;
    3)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ App is running!${NC}"
echo ""
echo -e "${YELLOW}On your iPhone:${NC}"
echo "1. Open 'Expo Go' app"
echo "2. Scan the QR code above"
echo "3. Your app will open!"
echo ""
echo -e "${YELLOW}To stop: Press Ctrl+C${NC}"






