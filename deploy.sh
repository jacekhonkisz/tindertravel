#!/bin/bash

# Glintz PWA Deployment Script
# This script deploys the Glintz travel app as a PWA to Vercel

echo "🚀 Starting Glintz PWA Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 1: Clean previous builds
echo -e "\n${YELLOW}🧹 Cleaning previous builds...${NC}"
cd app
rm -rf web-build .expo
cd ../api
rm -rf dist
cd ..

# Step 2: Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps
cd app && npm install --legacy-peer-deps
cd ../api && npm install --legacy-peer-deps
cd ..

# Step 3: Build API
echo -e "\n${YELLOW}🔨 Building API...${NC}"
cd api
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ API build failed${NC}"
    exit 1
fi
cd ..

# Step 4: Export web app
echo -e "\n${YELLOW}🌐 Building web app...${NC}"
cd app
npx expo export --platform web
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Web export failed${NC}"
    exit 1
fi
cd ..

# Step 5: Deploy to Vercel
echo -e "\n${YELLOW}🚀 Deploying to Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "\n${GREEN}📱 Your PWA is now live!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Open your deployment URL in Safari on iOS"
    echo "2. Tap the Share button"
    echo "3. Select 'Add to Home Screen'"
    echo "4. Enjoy your PWA! 🎉"
else
    echo -e "\n${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

