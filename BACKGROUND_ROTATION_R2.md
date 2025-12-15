# Background Rotation with R2 Photos - Complete

**Date:** December 12, 2025  
**Status:** ✅ **INTEGRATED**

---

## 🎯 What's Been Done

### 1. ✅ Backend Endpoint Updated
- **Endpoint:** `/api/onboarding/photos`
- **Source:** Now uses R2 photos from all partners
- **Behavior:** 
  - Collects ALL photos from all active partners
  - Randomizes the selection
  - Returns up to requested limit (default 30, max 50)
  - **Automatically includes new photos** as they're synced

### 2. ✅ Frontend Background Rotation Updated
- **File:** `app/src/utils/backgroundRotation.ts`
- **Changes:**
  - Fetches from `/api/onboarding/photos` (now serves R2 photos)
  - Rotation interval: **6 hours** (was 12 hours)
  - Cache refresh: **12 hours** (was 24 hours)
  - Pool size: **50 photos** (was 30)
  - **Smart randomization** - avoids showing same photo twice in a row

---

## 🔄 How It Works

### Flow:
```
1. App loads → Background rotation fetches photos
2. Backend → Collects ALL R2 photos from all partners
3. Backend → Randomizes and returns selection
4. App → Caches photos for 12 hours
5. App → Rotates background every 6 hours
6. App → Picks random photo from pool (avoids repeats)
```

### Automatic Updates:
- **New photos added?** → Next cache refresh (12h) includes them
- **More partners?** → Automatically included in pool
- **Photo pool grows?** → More variety in backgrounds

---

## 📊 Current Photo Pool

- **Total R2 Photos:** 70 photos
- **Partners:** 6 active partners
- **Background Pool:** Up to 50 random photos
- **Rotation:** Every 6 hours
- **Cache Refresh:** Every 12 hours

---

## 🎲 Randomization Features

1. **Random Selection:** Each fetch gets different random photos
2. **Avoids Repeats:** Tries not to show same photo twice in a row
3. **Scales Automatically:** More photos = more variety
4. **Smart Rotation:** If pool grows, automatically adjusts

---

## ⚙️ Configuration

### Rotation Settings:
- **Rotation Interval:** 6 hours (background changes)
- **Cache Duration:** 12 hours (photo pool refreshes)
- **Pool Size:** 50 photos (can be more if available)

### To Change Settings:
Edit `app/src/utils/backgroundRotation.ts`:
```typescript
const ROTATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const PHOTOS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const PHOTO_POOL_SIZE = 50; // Max photos in pool
```

---

## 🧪 Testing

### Test Backend Endpoint:
```bash
curl "http://192.168.1.107:3001/api/onboarding/photos?limit=10" | jq '.photos | length'
# Should return: 10 (or less if fewer photos available)
```

### Test Randomization:
```bash
# Run multiple times - should get different photos
curl "http://192.168.1.107:3001/api/onboarding/photos?limit=5" | jq '.photos[0].hotelName'
```

---

## 🔄 Adding More Photos

### When you sync new photos:

1. **Run Sync:**
   ```bash
   cd api
   node sync-dropbox-to-r2.js
   ```

2. **Backend Auto-Updates:**
   - R2 mapping reloads (5 min cache)
   - New photos automatically included

3. **App Auto-Updates:**
   - Next cache refresh (12h) includes new photos
   - Or clear app cache to force refresh

### To Force Immediate Update:
```typescript
// In app, clear background cache
await AsyncStorage.removeItem('@glintz_bgPhotosCache');
await AsyncStorage.removeItem('@glintz_bgPhotosFetchTime');
```

---

## ✅ Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Photo Source** | Empty/404 | R2 photos from partners |
| **Photo Count** | 0 | 70+ photos |
| **Rotation** | 12 hours | 6 hours |
| **Variety** | None | Random from all partners |
| **Auto-Update** | No | Yes (includes new photos) |
| **Scalability** | Fixed | Grows with more photos |

---

## 🎉 Status: COMPLETE

✅ Backend serves random R2 photos  
✅ Frontend rotates every 6 hours  
✅ Automatically includes new photos  
✅ Smart randomization  
✅ Scales with more photos  

**The welcome screen will now show beautiful random hotel photos from your partners!**

---

## 📝 Files Modified

1. ✅ `api/src/index.ts` - Updated `/api/onboarding/photos` endpoint
2. ✅ `app/src/utils/backgroundRotation.ts` - Improved rotation logic

---

**Restart the backend server and the app will automatically use R2 photos for backgrounds!**

