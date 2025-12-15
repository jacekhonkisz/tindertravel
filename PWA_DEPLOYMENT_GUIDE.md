# Glintz PWA Deployment Guide

## 🚀 Quick Deploy to Vercel

Your app is now configured as a Progressive Web App (PWA) that can be installed on iOS devices without going through the App Store!

### Prerequisites

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Ensure you're logged into Vercel**:
   ```bash
   vercel login
   ```

### Deployment Steps

#### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install all dependencies**:
   ```bash
   npm install
   cd app && npm install
   cd ../api && npm install
   cd ..
   ```

2. **Build the API first**:
   ```bash
   cd api
   npm run build
   cd ..
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy via GitHub + Vercel Dashboard

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add PWA support for iOS deployment"
   git push origin main
   ```

2. **Import project in Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all required environment variables (see below)

### Environment Variables

Set these in your Vercel project settings:

#### API Variables
```
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
MAILERSEND_API_KEY=your_mailersend_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### App Variables (Frontend)
```
EXPO_PUBLIC_API_URL=https://your-api.vercel.app
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 📱 Installing as PWA on iOS

### For Users (Share This With Your Users)

1. **Open Safari** on your iPhone/iPad
2. Navigate to your deployed URL: `https://your-app.vercel.app`
3. Tap the **Share** button (box with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Customize the name if desired
6. Tap **"Add"**
7. The app icon will appear on your home screen!

### iOS PWA Features Enabled

✅ **Standalone Mode** - Runs without Safari UI
✅ **Offline Support** - Service Worker caches essential resources
✅ **App Icon** - Custom icon on home screen
✅ **Splash Screen** - Loading screen on app launch
✅ **Status Bar Styling** - Matches your app design
✅ **No Pull-to-Refresh** - Native app feel
✅ **Touch Gestures** - Swipe navigation works perfectly

---

## 🎨 Icons and Assets

Make sure you have these icon files in `/app/assets/`:

- `icon.png` (1024x1024) - Main app icon
- `favicon.png` (192x192) - Browser favicon
- `splash-icon.png` (2048x2048) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon

**Auto-generate icons** from a single source:
```bash
cd app
npx expo install expo-asset
# Use online tools like https://www.pwabuilder.com/ to generate all sizes
```

---

## 🔧 Local Development

### Test PWA Locally

1. **Start the web development server**:
   ```bash
   cd app
   npm run web
   ```

2. **Test on real iOS device**:
   - Get your computer's local IP (e.g., `192.168.1.100`)
   - Make sure your iPhone is on the same WiFi
   - Open Safari on iPhone: `http://192.168.1.100:8081`
   - Test "Add to Home Screen" functionality

### Test Service Worker

1. Open Chrome DevTools → Application → Service Workers
2. Check "Offline" to test offline functionality
3. Reload the page to verify cached resources load

---

## 📊 Vercel Deployment Architecture

Your deployment consists of:

1. **Frontend (PWA)**: `/app` → Deployed as static site at root
2. **Backend API**: `/api` → Deployed as serverless functions at `/api/*`

### API Routes

All API routes are automatically available at:
```
https://your-app.vercel.app/api/auth/login
https://your-app.vercel.app/api/hotels
https://your-app.vercel.app/api/hotels/:id
```

### Troubleshooting

**Issue**: Build fails with "expo: command not found"
**Solution**: Make sure `expo` is installed in root and app directories

**Issue**: API endpoints return 404
**Solution**: Verify API is built before deployment: `cd api && npm run build`

**Issue**: Photos/Remove buttons not working
**Solution**: These are preserved and functional! Check browser console for any CORS issues.

**Issue**: Service Worker not registering
**Solution**: PWA features require HTTPS. Vercel provides this automatically.

---

## 🔒 Security & Performance

### Enabled Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Cache control for static assets
- Service Worker scope configuration

### Performance Optimizations

- Static asset caching (1 year)
- Service Worker caching strategy
- Lazy loading of routes
- Code splitting enabled

---

## 📝 Photo Management

Your **Photos** and **Remove** buttons are fully functional in the PWA:

- Users can tap "Photos" to view hotel image gallery
- Users can tap "Remove" to remove hotels from their view
- All manual photo management features are preserved
- Changes sync with the backend API

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test PWA installation on iOS Safari
3. ✅ Share installation link with users
4. ✅ Monitor usage in Vercel Analytics
5. ✅ Consider adding push notifications (future enhancement)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [PWA on iOS Guide](https://web.dev/install-criteria/)
- [Service Workers Guide](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)

---

## 🆘 Support

If you encounter any issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test on different iOS devices

**Note**: The app runs as a PWA, meaning it's web-based but feels like a native app. It won't be in the App Store, but users can easily install it from Safari!



