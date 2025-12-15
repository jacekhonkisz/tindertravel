#!/bin/bash

echo "🚀 Glintz Privacy Policy - GitHub Push"
echo "======================================"
echo ""
echo "Your GitHub username: jacekhonkisz"
echo "Your privacy policy URL: https://jacekhonkisz.github.io/glintz-legal/privacy.html"
echo ""

# Navigate to glintz-legal directory
cd /Users/ala/tindertravel/glintz-legal || exit 1

echo "📋 Step 1: Create GitHub Repository"
echo "------------------------------------"
echo ""
echo "Please open this link in your browser:"
echo "https://github.com/new"
echo ""
echo "Fill in:"
echo "  Repository name: glintz-legal"
echo "  Description: Privacy Policy for Glintz App"
echo "  Public: ✅ (MUST check this)"
echo "  Initialize: ❌ (leave ALL boxes unchecked)"
echo ""
echo "Then click 'Create repository'"
echo ""

read -p "Press Enter when you've created the repository..."

echo ""
echo "📤 Step 2: Pushing to GitHub..."
echo "-------------------------------"

# Try to push
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
else
    echo ""
    echo "⚠️  Push failed. This usually means authentication is needed."
    echo ""
    echo "Please run this command manually:"
    echo "  cd /Users/ala/tindertravel/glintz-legal"
    echo "  git push -u origin main"
    echo ""
    echo "If you get an authentication error, try:"
    echo "  gh auth login"
    echo ""
    exit 1
fi

echo ""
echo "🌐 Step 3: Enable GitHub Pages"
echo "-------------------------------"
echo ""
echo "Please open this link in your browser:"
echo "https://github.com/jacekhonkisz/glintz-legal/settings/pages"
echo ""
echo "Settings:"
echo "  Source: Deploy from a branch"
echo "  Branch: main"
echo "  Folder: / (root)"
echo ""
echo "Click 'Save'"
echo ""

read -p "Press Enter when you've enabled GitHub Pages..."

echo ""
echo "⏰ Step 4: Waiting for Deployment"
echo "----------------------------------"
echo ""
echo "GitHub Pages takes 2-3 minutes to deploy."
echo "Your privacy policy will be available at:"
echo "https://jacekhonkisz.github.io/glintz-legal/privacy.html"
echo ""
echo "Opening in browser in 10 seconds..."
sleep 10

# Try to open in browser
if command -v open &> /dev/null; then
    open "https://jacekhonkisz.github.io/glintz-legal/privacy.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://jacekhonkisz.github.io/glintz-legal/privacy.html"
fi

echo ""
echo "✅ ALL DONE!"
echo "============"
echo ""
echo "Your privacy policy is now at:"
echo "https://jacekhonkisz.github.io/glintz-legal/privacy.html"
echo ""
echo "If you get a 404, wait another minute and refresh."
echo ""
echo "📱 Next Steps:"
echo "-------------"
echo "1. Test the privacy policy URL in your browser ✅"
echo "2. Restart your app: cd /Users/ala/tindertravel/app && npm start --clear"
echo "3. Test the privacy link on login screen ✅"
echo "4. You're ready for App Store submission! 🎉"
echo ""
echo "📝 For App Store Connect, use this URL:"
echo "https://jacekhonkisz.github.io/glintz-legal/privacy.html"
echo ""

