# Vercel Setup & Configuration

## What's Been Configured

Your Glintz app is now ready to deploy as a PWA to Vercel! Here's what's set up:

### 1. Vercel Configuration Files

- **`/vercel.json`** - Root configuration (monorepo setup)
- **`/app/vercel.json`** - Frontend PWA configuration
- **`/api/vercel.json`** - Backend API configuration

### 2. PWA Assets

- **`/app/public/manifest.json`** - PWA manifest with iOS support
- **`/app/public/sw.js`** - Service Worker for offline caching
- **`/app/public/index.html`** - Entry point with PWA meta tags

### 3. Build Configuration

- **`/app/app.config.js`** - Expo web configuration
- **`/app/webpack.config.js`** - Custom webpack config for PWA
- **`/app/metro.config.js`** - Updated for web support

## Deployment Strategy

### Option 1: Monorepo Deployment (Recommended for Production)

Deploy everything together from the root:

```bash
vercel --prod
```

**What happens:**
- API gets deployed as serverless functions at `/api/*`
- Frontend gets deployed at root `/`
- Single domain for everything

### Option 2: Separate Deployments (Recommended for Development)

Deploy frontend and API separately:

**API:**
```bash
cd api
vercel --prod
# Note the API URL (e.g., https://glintz-api.vercel.app)
```

**Frontend:**
```bash
cd app
vercel --prod
# Note the App URL (e.g., https://glintz-app.vercel.app)
```

Then set `EXPO_PUBLIC_API_URL` environment variable in frontend to point to API URL.

## Environment Variables Setup

### Via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

#### API Environment Variables
```
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_super_secret_jwt_key_here
MAILERSEND_API_KEY=your_mailersend_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Frontend Environment Variables
```
EXPO_PUBLIC_API_URL=https://your-api.vercel.app
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

### Via Vercel CLI

```bash
# Set API variables
cd api
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add JWT_SECRET production
vercel env add MAILERSEND_API_KEY production
vercel env add GOOGLE_MAPS_API_KEY production

# Set Frontend variables
cd ../app
vercel env add EXPO_PUBLIC_API_URL production
vercel env add EXPO_PUBLIC_GOOGLE_MAPS_KEY production
```

## Build Process

### What Gets Built

1. **API** (`/api/dist/`)
   - TypeScript compiled to JavaScript
   - Express server bundled for serverless

2. **Frontend** (`/app/web-build/`)
   - React Native code transpiled to web
   - Static HTML/CSS/JS bundle
   - PWA assets (manifest, service worker)
   - Optimized for production

### Build Commands

```bash
# API
cd api
npm run build

# Frontend
cd app
npx expo export:web
```

## Testing Locally

### Test Web Build Locally

```bash
cd app
npm run web
# Opens at http://localhost:8081
```

### Test Production Build Locally

```bash
# Build everything
cd api && npm run build && cd ..
cd app && npx expo export:web && cd ..

# Install serve
npm install -g serve

# Serve the build
cd app/web-build
serve -s .
```

## Deployment Checklist

Before deploying:

- [ ] All dependencies installed (`npm install` in root, app, and api)
- [ ] API builds successfully (`cd api && npm run build`)
- [ ] Web export works (`cd app && npx expo export:web`)
- [ ] Environment variables set in Vercel
- [ ] Database (Supabase) is set up and accessible
- [ ] API keys are valid (Google Maps, MailerSend, etc.)

## Post-Deployment

### Verify Deployment

1. **Check Frontend**
   - Visit your Vercel URL
   - Test "Add to Home Screen" on iOS Safari
   - Verify offline mode works (airplane mode)
   - Check service worker in DevTools

2. **Check API**
   - Test API endpoints: `https://your-app.vercel.app/api/health`
   - Verify authentication works
   - Check database connection

### Monitor

- **Vercel Dashboard**: Real-time logs and analytics
- **Browser Console**: Check for any JS errors
- **Service Worker**: Verify caching in DevTools → Application

## Troubleshooting

### Build Fails

**Error**: `Cannot find module 'expo'`
```bash
cd app
npm install expo@~54.0.9
```

**Error**: `API build failed`
```bash
cd api
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Fails

**Error**: `No build output found`
- Check that `app/web-build` exists
- Re-run: `cd app && npx expo export:web`

**Error**: `Serverless function size exceeded`
- Check API dependencies
- Remove unused packages
- Consider code splitting

### Runtime Issues

**Issue**: API 404 errors
- Verify API is deployed
- Check `EXPO_PUBLIC_API_URL` environment variable
- Test API endpoint directly

**Issue**: Service Worker not registering
- PWA requires HTTPS (Vercel provides this)
- Check browser console for SW errors
- Clear cache and hard reload

**Issue**: Can't install on iOS
- Must use Safari browser
- Check manifest.json is accessible
- Verify HTTPS certificate is valid

## Vercel Free Tier Limits

- ✅ 100GB bandwidth/month
- ✅ Unlimited projects
- ✅ Automatic HTTPS
- ✅ Serverless functions (100GB-hours/month)
- ✅ CDN included

Your app should easily fit within these limits!

## Advanced Configuration

### Custom Domain

```bash
vercel domains add your-domain.com
```

### Preview Deployments

Every `git push` creates a preview deployment:
```bash
git push origin feature-branch
# Vercel automatically deploys preview
```

### Rollback

```bash
vercel rollback
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

---

**Ready to deploy?** Run `./deploy.sh` or `vercel --prod`!



