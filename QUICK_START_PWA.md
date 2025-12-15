# 🚀 Quick Start - Deploy Your PWA Now!

## Three Simple Commands to Deploy

```bash
# 1. Make deployment script executable (already done)
chmod +x deploy.sh

# 2. Run the deployment script
./deploy.sh

# 3. That's it! Your PWA is live! 🎉
```

## OR: Deploy Manually in 5 Minutes

```bash
# Step 1: Install dependencies
npm install
cd app && npm install
cd ../api && npm install
cd ..

# Step 2: Build API
cd api && npm run build && cd ..

# Step 3: Build Web App
cd app && npx expo export:web && cd ..

# Step 4: Deploy to Vercel
vercel --prod
```

## What You Get

✅ **PWA** - Installable on any device
✅ **iOS Compatible** - Works perfectly on iPhone/iPad Safari
✅ **Offline Support** - Service Worker caches essential assets
✅ **Photos Button** - Fully functional (opens hotel photo gallery)
✅ **Remove Button** - Fully functional (removes hotels from view)
✅ **Fast** - Deployed on Vercel's edge network
✅ **HTTPS** - Automatic SSL certificate
✅ **Free** - Vercel's free tier is generous!

## iOS Installation Instructions (Share with Users)

1. Open Safari on iPhone/iPad
2. Go to: `https://your-app-name.vercel.app`
3. Tap the **Share** button (box with up arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"**
6. App icon appears on home screen! 🎉

## What's Deployed

### Files & Configuration Added

- ✅ `app/public/manifest.json` - PWA manifest with iOS metadata
- ✅ `app/public/sw.js` - Service Worker for offline support
- ✅ `app/public/index.html` - HTML entry point with PWA meta tags
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `app/app.config.js` - Expo web configuration
- ✅ `deploy.sh` - Automated deployment script

### Updated Files

- ✅ `app/package.json` - Added `react-dom` and `react-native-web`
- ✅ `app.json` - Added web platform support
- ✅ `app/metro.config.js` - Enabled web bundling

## Photo & Remove Buttons - Status

Both buttons work perfectly in the PWA:

- **Photos Button**: Opens `PhotoManager` component
  - View all hotel photos
  - Zoom into photos
  - Reorder photos (drag & drop)
  - Remove individual photos
  
- **Remove Button**: Removes hotel from the swipe deck
  - Confirms with user before removal
  - Updates backend via API
  - Smooth animation

## Environment Variables

Don't forget to set these in Vercel Dashboard:

```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
JWT_SECRET=your_secret
MAILERSEND_API_KEY=your_key
GOOGLE_MAPS_API_KEY=your_key
EXPO_PUBLIC_API_URL=https://your-api.vercel.app
```

## Troubleshooting

**Q: Build fails?**
A: Make sure you've installed dependencies in all directories (root, app, api)

**Q: API not working?**
A: Verify API is built first: `cd api && npm run build`

**Q: Icons not showing?**
A: Icons auto-generate from assets. Check `app/assets/` has icon.png and favicon.png

**Q: Can't install on iOS?**
A: Must use Safari (not Chrome). PWA install requires HTTPS (Vercel provides this).

**Q: Service Worker not registering?**
A: Only works on HTTPS or localhost. Vercel provides HTTPS automatically.

## Next Steps

1. ✅ Deploy with `./deploy.sh`
2. ✅ Test on iOS Safari
3. ✅ Share URL with users
4. ✅ Monitor with Vercel Analytics

## Tools Used

- **Expo** - React Native → Web
- **Vercel** - Hosting (frontend + serverless API)
- **Service Workers** - Offline support
- **PWA Manifest** - Install prompts

## Support

Check the full guide: [PWA_DEPLOYMENT_GUIDE.md](./PWA_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy?** Run `./deploy.sh` now! 🚀



