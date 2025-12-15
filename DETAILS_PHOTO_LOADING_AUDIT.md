# 🔍 Details Screen Photo Loading Performance Audit

**Date:** December 12, 2025  
**Issue:** Black screen/placeholder visible for 2-5 seconds before photos appear  
**Status:** ⚠️ **PERFORMANCE BOTTLENECK IDENTIFIED**

---

## 🚨 Root Cause Analysis

### The Problem

When you open a hotel details page, you see a **black placeholder** for several seconds before photos load. This happens because:

```
User taps hotel → Details screen opens → BLACK SCREEN → Wait 2-5s → Photos appear
```

---

## 🔬 Technical Analysis

### Current Implementation (`app/src/screens/DetailsScreen.tsx`)

#### Line 60: Initial State
```typescript
const [dimensionsReady, setDimensionsReady] = useState(false); // ❌ Starts as false
```

#### Lines 109-145: Preload Process (THE BOTTLENECK)
```typescript
useEffect(() => {
  const photos = hotel.photos || []; // Could be 9-18 photos!
  
  setDimensionsReady(false); // ❌ Hide images immediately
  
  const preloadDimensions = async () => {
    // ❌ PROBLEM 1: Prefetch ALL photos before showing anything
    const imagePrefetchPromises = photos.map((photo: string) => 
      Image.prefetch(photo).catch(() => {})  // Downloads FULL image file
    );
    
    // ❌ PROBLEM 2: Get dimensions for ALL photos
    await dimensionCache.preload(photos);  // RNImage.getSize() for each
    
    // ❌ PROBLEM 3: Wait for ALL to complete
    await Promise.all(imagePrefetchPromises);
    
    // Only NOW can we show images
    setDimensionsReady(true);  // ❌ Finally set to true after 2-5 seconds
  };
  
  preloadDimensions();
}, [hotel.photos, hotel.heroPhoto]);
```

#### Lines 321-361 & 421-458: Conditional Rendering
```typescript
{dimensionsReady ? (
  <Image source={imageSource} ... />  // ✅ Show real image
) : (
  <View style={{ backgroundColor: '#000' }}>  // ❌ Black placeholder
    <Text>{hotel.name}</Text>
  </View>
)}
```

---

## ⏱️ Performance Impact

### For Partner Hotels with Many Photos

| Hotel | Photos | Estimated Preload Time | User Experience |
|-------|--------|----------------------|-----------------|
| Locanda al Colle | 9 | ~2-3 seconds | ⚠️ Black screen |
| Eremito | 9 | ~2-3 seconds | ⚠️ Black screen |
| Casa Bonay | 10 | ~3-4 seconds | ⚠️ Black screen |
| Haritha Villas | 18 | ~4-5 seconds | 🚨 Unacceptable |
| Pico Bonito | 14 | ~3-4 seconds | ⚠️ Black screen |

### Why So Slow?

1. **Image.prefetch() downloads the FULL image:**
   ```
   - Photo 1: 152 KB (verified via curl)
   - Photo 2: ~150 KB
   - Photo 3: ~150 KB
   - ...
   - Total for 9 photos: ~1.4 MB
   - On 4G: ~2-3 seconds
   - On 3G: ~5-8 seconds
   ```

2. **RNImage.getSize() needs image headers:**
   - Makes separate HTTP requests
   - Downloads image metadata/headers
   - Adds ~200-500ms per photo

3. **Sequential blocking:**
   - User can't see ANYTHING until ALL photos preload
   - Even though they only need to see photo #1 initially

---

## 📊 R2 CDN Performance (NOT the problem)

Tested R2 photo delivery:

```bash
$ curl -I "https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev/..."

HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000  ✅ 1 year cache
ETag: "b4614588eef60efcda0e315f3f8452aa"  ✅ Cache validation
Server: cloudflare  ✅ CDN delivery
Content-Length: 152087  ✅ Reasonable size
```

**Verdict:** R2 CDN is **perfectly configured**. The bottleneck is in the app code, not infrastructure.

---

## 🎯 Why This Design Was Used

Looking at the code comments:

> "Preload ALL photo dimensions ONCE when screen loads using global cache - prevents flicker"

**Intent:** Prevent layout jumps when photos load (images changing size)

**Result:** Worse UX - black screen for 2-5 seconds is more noticeable than minor layout shifts

---

## 💡 Recommended Solutions

### Solution 1: Show First Photo Immediately (Quick Fix - 5 min)

**Goal:** Eliminate black screen for first photo

```typescript
useEffect(() => {
  const photos = hotel.photos || [];
  
  if (photos.length === 0) {
    setDimensionsReady(true);
    return;
  }
  
  // NEW: Show first photo immediately without waiting
  setDimensionsReady(true);  // ✅ Show UI right away
  
  // Preload dimensions in background (non-blocking)
  const preloadDimensions = async () => {
    await dimensionCache.preload(photos);
    
    // Prefetch remaining photos in background (not first one)
    const remainingPhotos = photos.slice(1);
    remainingPhotos.forEach(photo => {
      Image.prefetch(photo).catch(() => {});
    });
  };
  
  preloadDimensions(); // Don't await - run in background
}, [hotel.photos]);
```

**Impact:**
- ✅ First photo visible in ~200ms (no black screen!)
- ✅ Remaining photos load progressively
- ⚠️ Possible minor layout shift when dimensions load

---

### Solution 2: Use Blur Placeholder (Better UX - 10 min)

**Goal:** Show progressive loading instead of black screen

```typescript
// Use expo-image's built-in blurhash/placeholder
<Image
  source={imageSource}
  placeholder={require('../../assets/placeholder.png')}
  placeholderContentFit="cover"
  transition={300}
  cachePolicy="memory-disk"
  style={...}
/>
```

**Benefits:**
- ✅ No black screen
- ✅ Smooth transition from placeholder to image
- ✅ Better perceived performance
- ✅ No code complexity

---

### Solution 3: Lazy Load Photos (Best Performance - 20 min)

**Goal:** Only load photos when needed

```typescript
// Only preload first 2 photos
const preloadDimensions = async () => {
  const priorityPhotos = photos.slice(0, 2);
  await dimensionCache.preload(priorityPhotos);
  
  // Prefetch first 2 photos
  await Promise.all(priorityPhotos.map(p => Image.prefetch(p)));
  
  setDimensionsReady(true);
  
  // Lazy load remaining photos
  const remainingPhotos = photos.slice(2);
  setTimeout(() => {
    remainingPhotos.forEach(photo => {
      Image.prefetch(photo).catch(() => {});
      dimensionCache.load(photo);
    });
  }, 500);
};
```

**Benefits:**
- ✅ Fast initial load (~500ms for 2 photos)
- ✅ Remaining photos load in background
- ✅ User can start interacting immediately
- ✅ Bandwidth-efficient

---

### Solution 4: Remove Preloading Entirely (Simplest - 2 min)

**Goal:** Let expo-image handle everything

```typescript
// Remove entire preload useEffect
// Just render images directly:
<Image
  source={imageSource}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200}
  style={...}
/>
```

**Why this works:**
- ✅ expo-image has built-in progressive loading
- ✅ Caches automatically (memory + disk)
- ✅ Handles all edge cases
- ✅ Less code = fewer bugs

**Downsides:**
- ⚠️ Possible layout shifts (but minor)
- ⚠️ Each photo loads individually (but cached after first view)

---

## 🎨 Visual Comparison

### Current (Bad):
```
[User taps hotel]
    ↓
┌──────────────────┐
│                  │
│   BLACK SCREEN   │  ← 2-5 seconds! 🚨
│                  │
└──────────────────┘
    ↓ (wait...)
    ↓ (wait...)
    ↓ (wait...)
┌──────────────────┐
│   [Photo]        │  ← Finally appears
│                  │
└──────────────────┘
```

### Solution 1 (Show First Photo):
```
[User taps hotel]
    ↓
┌──────────────────┐
│   [Photo 1]      │  ← Immediate! ✅
│  (loading...)    │  ← Background load
└──────────────────┘
```

### Solution 2 (Blur Placeholder):
```
[User taps hotel]
    ↓
┌──────────────────┐
│  [Blurred        │  ← 50ms
│   Preview]       │
└──────────────────┘
    ↓ (smooth transition)
┌──────────────────┐
│   [Sharp Photo]  │  ← 500ms
│                  │
└──────────────────┘
```

### Solution 4 (No Preload):
```
[User taps hotel]
    ↓
┌──────────────────┐
│   [Photo]        │  ← Progressive load ✅
│  (loads top→bot) │  ← Visible immediately
└──────────────────┘
```

---

## 📈 Recommended Implementation Plan

### Phase 1: Quick Win (Do This Now - 5 min)

**Remove blocking preload:**

```typescript
// Change line 120 from:
setDimensionsReady(false);  // ❌ Hide everything

// To:
setDimensionsReady(true);   // ✅ Show immediately
```

**That's it!** Photos will load progressively, no black screen.

---

### Phase 2: Polish (Later - 10 min)

**Add placeholder images for smooth loading:**

1. Generate small blur placeholders (~1-2 KB each)
2. Use expo-image's `placeholder` prop
3. Add smooth transitions

---

### Phase 3: Optimize (Optional - 20 min)

**Implement smart preloading:**

1. Preload only first 2 photos
2. Lazy load rest in background
3. Track which photos are visible (viewport detection)
4. Cancel preloading when user navigates away

---

## 🐛 Additional Issues Found

### Issue 1: Dimension Cache Complexity

**Lines 59-72 in `dimensionCache.ts`:**
```typescript
RNImage.getSize(url, (width, height) => { ... })
```

**Problem:** `getSize()` makes a network request for EACH photo

**Impact:** Adds 200-500ms per photo

**Fix:** Store dimensions in photo metadata on backend:
```json
{
  "photo": "https://...",
  "width": 1920,
  "height": 1080
}
```

Then skip `getSize()` entirely!

---

### Issue 2: Excessive Logging

**Lines 337, 434:**
```typescript
console.log('✅ Photo loaded successfully');
console.log(`✅ Photo ${index} loaded`);
```

**Problem:** Logging every photo load slows down UI thread

**Fix:** Remove or use `__DEV__` flag:
```typescript
if (__DEV__) {
  console.log('✅ Photo loaded');
}
```

---

### Issue 3: Preload on Wrong Trigger

**Line 145:**
```typescript
}, [hotel.photos, hotel.heroPhoto]);  // Runs when hotel changes
```

**Problem:** If user quickly swipes through hotels and opens details, preload runs multiple times

**Fix:** Add cleanup:
```typescript
useEffect(() => {
  let cancelled = false;
  
  const preload = async () => {
    // ... preload logic ...
    if (!cancelled) {
      setDimensionsReady(true);
    }
  };
  
  preload();
  
  return () => {
    cancelled = true;  // Cancel if unmounted
  };
}, [hotel.id]);  // Use hotel.id instead of photos array
```

---

## 📊 Expected Performance Improvements

| Metric | Current | After Solution 1 | After Solution 2 | After Solution 4 |
|--------|---------|------------------|------------------|------------------|
| **Time to first photo** | 2-5s | 200ms | 50ms + transition | 100ms |
| **Black screen duration** | 2-5s | 0ms | 0ms | 0ms |
| **Total load time** | 2-5s | Same (background) | Same (background) | On-demand |
| **Perceived speed** | 🐌 Slow | ⚡ Fast | ⚡ Fast | ⚡ Fast |
| **Code complexity** | High | Medium | Medium | **Low** |
| **Maintenance** | Hard | Medium | Medium | **Easy** |

---

## ✅ Immediate Action: Quick Fix

**File:** `app/src/screens/DetailsScreen.tsx`  
**Line:** 120  
**Change:**

```typescript
// BEFORE (line 120):
setDimensionsReady(false);  // ❌ Causes black screen

// AFTER:
// Don't set to false - keep showing images while preloading
// setDimensionsReady(false);  // Commented out
```

**And line 141:**

```typescript
// BEFORE:
await dimensionCache.preload(photos);
await Promise.all(imagePrefetchPromises);
setDimensionsReady(true);

// AFTER:
setDimensionsReady(true);  // ✅ Show immediately
// Preload in background (don't await)
dimensionCache.preload(photos);
Promise.all(imagePrefetchPromises);
```

---

## 🎯 Summary

### Root Cause:
**Blocking preload** of ALL photos before showing ANY photo

### Impact:
**2-5 second black screen** on every details page open

### Fix:
**Remove blocking behavior** - show photos immediately

### Implementation Time:
**5 minutes** for quick fix  
**10 minutes** for polished solution

### Expected Result:
**0ms black screen**, photos visible immediately with progressive loading

---

## 📚 Related Files

| File | Issue | Priority |
|------|-------|----------|
| `app/src/screens/DetailsScreen.tsx` | Blocking preload (lines 109-145) | 🔴 High |
| `app/src/utils/dimensionCache.ts` | Network requests for dimensions | ⚠️ Medium |
| `api/sync-dropbox-to-r2.js` | Could add dimensions to sync results | ⚠️ Low |

---

**Ready to implement? See below for exact code changes.**

