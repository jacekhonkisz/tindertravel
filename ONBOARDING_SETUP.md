# 🎨 Onboarding Background Setup Guide

## Overview

The new onboarding screen features rotating background images that change every 12 hours. This guide explains how to add your background images.

---

## 📁 Quick Setup

### Step 1: Add Background Images

Place **3 high-quality hotel/boutique images** in:
```
/app/assets/hotels/
```

Required files:
- `bg1.jpg`
- `bg2.jpg`
- `bg3.jpg`

### Step 2: Image Specifications

| Property | Requirement |
|----------|-------------|
| Orientation | Vertical/Portrait |
| Resolution | Minimum 1125 x 2436 px |
| File Size | ≤ 350 KB each (optimized) |
| Format | JPG (compressed) |
| Style | Warm, boutique, light-filled |

### Step 3: Verify

Run the app - background should rotate every 12 hours automatically!

---

## 🎯 Image Guidelines

### Visual Style
- ✅ Light, airy, warm color palette
- ✅ Boutique hotel aesthetic
- ✅ Good contrast for white glass card overlay
- ✅ Works well with subtle blur (intensity: 6)
- ❌ Avoid busy patterns
- ❌ Avoid dark/moody images

### Example Sources
1. **Unsplash** - Free high-quality photos
2. **Pexels** - Free stock photography
3. **Your Own Photography** - Best for brand consistency
4. **Commission** - Hire photographer for custom shots

### Recommended Search Terms
- "boutique hotel interior"
- "luxury hotel lobby"
- "mediterranean hotel"
- "coastal hotel architecture"
- "design hotel room"

---

## 🔄 How Rotation Works

### Logic
```typescript
// Rotation interval: 12 hours
const ROTATION_INTERVAL = 12 * 60 * 60 * 1000;
```

### Behavior
1. **First Launch:** Random image selected, cached for 12 hours
2. **Within 12h:** Same image displayed
3. **After 12h:** New random image selected, cached again

### Storage
- Current index: `AsyncStorage: @glintz_bgIndex`
- Last change time: `AsyncStorage: @glintz_lastBgChange`

---

## 🛠️ Temporary Solution (Testing)

If you don't have images yet, you can test with placeholder images:

### Option 1: Use Existing Asset
Temporarily copy any existing image 3 times:
```bash
cd /Users/ala/tindertravel/app/assets/hotels
cp ../icon.png bg1.jpg
cp ../icon.png bg2.jpg
cp ../icon.png bg3.jpg
```

### Option 2: Download Free Images
Quick download from Unsplash:
```bash
# Download directly via curl (requires image URLs)
curl -L "https://source.unsplash.com/1125x2436/?hotel,luxury" > bg1.jpg
curl -L "https://source.unsplash.com/1125x2436/?boutique,interior" > bg2.jpg
curl -L "https://source.unsplash.com/1125x2436/?coastal,hotel" > bg3.jpg
```

---

## 🎨 Photo Credits

Each background has a caption displayed at the bottom:

```typescript
const captions = [
  'Photo: Boutique Mediterranean Stay',    // bg1
  'Photo: Coastal Luxury Retreat',          // bg2
  'Photo: Urban Design Hotel',              // bg3
];
```

Update these captions in `/app/src/utils/backgroundRotation.ts` to match your actual photos.

---

## 🚨 Troubleshooting

### Error: "Cannot find module '../../assets/hotels/bg1.jpg'"

**Cause:** Background images not present

**Solution:**
1. Add the 3 required JPG files to `/app/assets/hotels/`
2. Restart Metro bundler: `npx expo start --clear`
3. Rebuild the app

### Images Not Changing After 12 Hours

**Cause:** AsyncStorage cache might be stuck

**Solution:**
```javascript
// Clear cache manually (dev tool)
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('@glintz_bgIndex');
await AsyncStorage.removeItem('@glintz_lastBgChange');
```

### Images Look Blurry

**Cause:** Resolution too low or compression too high

**Solution:**
- Use minimum 1125 x 2436 px resolution
- Export at high quality (80-90% JPEG quality)
- Test on actual device, not just simulator

---

## 📊 Performance Notes

### Bundle Size
- 3 images × ~300 KB = ~900 KB total
- Acceptable for mobile apps
- Consider WebP format for smaller size (requires additional setup)

### Memory Usage
- Only 1 image loaded at a time
- Background fades in smoothly (250ms animation)
- No memory leaks from rotation logic

### Frame Rate
- Target: 60 FPS maintained
- Blur overlay: Low performance impact (intensity: 6)
- Glass card: Optimized with single BlurView

---

## ✅ QA Checklist

Before deploying:

- [ ] All 3 background images present
- [ ] Each image < 350 KB
- [ ] Images are portrait orientation
- [ ] Photo credits updated with accurate information
- [ ] Tested on iOS (real device)
- [ ] Tested on Android (real device)
- [ ] Background rotates after 12 hours
- [ ] No console errors about missing images
- [ ] Glass card is clearly readable over all 3 backgrounds
- [ ] Animations are smooth (60 FPS)

---

## 🎉 Result

Once images are added, you'll have:
- ✨ Beautiful rotating backgrounds every 12 hours
- 🪟 Smooth glassmorphism effects
- 🎯 Professional boutique aesthetic
- ⚡ 60 FPS performance
- 📱 Production-ready onboarding

---

*For technical details, see:*
- `/app/src/utils/backgroundRotation.ts` - Rotation logic
- `/app/src/components/AuthBackground.tsx` - Background component
- `/app/src/screens/AuthScreen.tsx` - Main auth UI

