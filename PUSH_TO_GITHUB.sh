#!/bin/bash

# Glintz Legal Documents - GitHub Push Script
# This script will push your privacy policy to GitHub Pages

echo "🚀 Glintz Legal Documents - GitHub Setup"
echo "=========================================="
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI detected"
    USE_GH_CLI=true
else
    echo "ℹ️  GitHub CLI not installed (will use manual method)"
    USE_GH_CLI=false
fi

echo ""
echo "📝 Step 1: GitHub Repository Setup"
echo "-----------------------------------"

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

echo ""
echo "Your privacy policy URL will be:"
echo "https://$GITHUB_USERNAME.github.io/glintz-legal/privacy.html"
echo ""

# Navigate to the glintz-legal directory
cd /Users/ala/tindertravel/glintz-legal || exit 1

# Check if repo already has a remote
if git remote get-url origin &> /dev/null; then
    echo "✅ Git remote already configured"
else
    echo "📦 Configuring git remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/glintz-legal.git"
fi

echo ""
echo "🔧 Step 2: Creating GitHub Repository"
echo "--------------------------------------"

if [ "$USE_GH_CLI" = true ]; then
    # Use GitHub CLI to create repo
    echo "Creating repository using GitHub CLI..."
    gh repo create glintz-legal --public --source=. --remote=origin --push
    
    if [ $? -eq 0 ]; then
        echo "✅ Repository created and pushed!"
        REPO_CREATED=true
    else
        echo "⚠️  GitHub CLI failed, will use manual method"
        REPO_CREATED=false
    fi
else
    REPO_CREATED=false
fi

if [ "$REPO_CREATED" = false ]; then
    echo ""
    echo "📋 Manual Setup Required:"
    echo "-------------------------"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: glintz-legal"
    echo "3. Description: Privacy Policy for Glintz App"
    echo "4. Public: ✅ (must be public)"
    echo "5. Initialize: ❌ (don't check any boxes)"
    echo "6. Click 'Create repository'"
    echo ""
    read -p "Press Enter when you've created the repository on GitHub..."
    
    echo ""
    echo "📤 Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
    else
        echo "❌ Push failed. You may need to authenticate with GitHub."
        echo ""
        echo "Try running these commands manually:"
        echo "  cd /Users/ala/tindertravel/glintz-legal"
        echo "  git push -u origin main"
        exit 1
    fi
fi

echo ""
echo "🌐 Step 3: Enabling GitHub Pages"
echo "---------------------------------"
echo ""
echo "Now go to your repository settings:"
echo "1. Visit: https://github.com/$GITHUB_USERNAME/glintz-legal/settings/pages"
echo "2. Under 'Source', select: main branch"
echo "3. Folder: / (root)"
echo "4. Click 'Save'"
echo "5. Wait 2-3 minutes for deployment"
echo ""
read -p "Press Enter when you've enabled GitHub Pages..."

echo ""
echo "🔄 Step 4: Updating App with Privacy Policy URL"
echo "------------------------------------------------"

# Update the AuthScreen.tsx with the actual GitHub username
cd /Users/ala/tindertravel

# Create backup
cp app/src/screens/AuthScreen.tsx app/src/screens/AuthScreen.tsx.backup

# Update the URL
sed -i '' "s/YOUR_GITHUB_USERNAME/$GITHUB_USERNAME/g" app/src/screens/AuthScreen.tsx

echo "✅ Updated AuthScreen.tsx with your GitHub username"

# Also update the README in glintz-legal
sed -i '' "s/YOUR_GITHUB_USERNAME/$GITHUB_USERNAME/g" glintz-legal/README.md

# Commit and push the README update
cd glintz-legal
git add README.md
git commit -m "Update README with correct username"
git push origin main

echo ""
echo "✅ ALL DONE!"
echo "============"
echo ""
echo "Your privacy policy is now live at:"
echo "https://$GITHUB_USERNAME.github.io/glintz-legal/privacy.html"
echo ""
echo "Next steps:"
echo "1. Test the URL in your browser (wait 2-3 minutes if it's not live yet)"
echo "2. Restart your app: cd app && npm start --clear"
echo "3. Test the privacy policy link in your app"
echo ""
echo "When submitting to App Store, use this URL:"
echo "https://$GITHUB_USERNAME.github.io/glintz-legal/privacy.html"
echo ""
echo "🎉 You're ready for App Store submission!"

