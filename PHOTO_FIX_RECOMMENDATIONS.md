# 📸 Photo Display Fix Recommendations

## Goal
Fix flickering/jumping while maintaining:
- **60% screen height** for horizontal images
- **Full screen height** for vertical images

---

## 🎯 Recommended Solution Strategy

### **Priority 1: Create Global Dimension Cache** ⭐⭐⭐
**Why:** Dimensions are loaded multiple times across components, causing race conditions.

**Solution:**
- Create a shared dimension cache utility (`app/src/utils/dimensionCache.ts`)
- Store dimensions by photo URL in a global Map
- All components read from this cache
- Prevents duplicate `getSize()` calls
- Dimensions available instantly after first load

**Impact:** Eliminates race conditions and duplicate dimension loading

---

### **Priority 2: Preload Dimensions Before First Render** ⭐⭐⭐
**Why:** Images render with `null` dimensions, then jump when dimensions load.

**Solution:**
- Add a `dimensionsReady` state that blocks image rendering until dimensions are loaded
- Show a placeholder with correct aspect ratio during loading
- Only render actual image once dimensions are confirmed
- Use the same placeholder size for all photos (prevents layout shift)

**Impact:** Eliminates layout jumps - images render with correct size from start

---

### **Priority 3: Fix Carousel Individual Dimensions** ⭐⭐⭐
**Why:** Carousel uses current photo's dimensions for all photos, causing wrong sizing.

**Solution:**
- Preload dimensions for ALL photos in carousel (already done)
- Each photo in carousel should look up its OWN dimensions from `dimensionsMap`
- Don't use shared `imageDimensions` state for carousel photos
- Calculate `isHorizontal` per photo using its own dimensions

**Impact:** Each carousel photo displays with correct dimensions immediately

---

### **Priority 4: Stabilize Layout with Fixed Placeholder** ⭐⭐
**Why:** Layout shifts when dimensions update from null to actual values.

**Solution:**
- Use a fixed placeholder container that matches expected size
- For horizontal: Use 60% height placeholder
- For vertical: Use full screen height placeholder
- Placeholder shows while dimensions are loading
- Smooth transition to actual image when ready

**Impact:** No visible layout shift - smooth transition from placeholder to image

---

### **Priority 5: Memoize Image Sources** ⭐⭐
**Why:** New source objects created on each render cause unnecessary re-renders.

**Solution:**
- Cache image source objects by URL
- Return same object reference for same URL
- Prevents expo-image from treating it as new source

**Impact:** Prevents unnecessary image reloads

---

### **Priority 6: Standardize Transitions** ⭐
**Why:** Inconsistent transitions cause different visual behaviors.

**Solution:**
- Use `transition={200}` consistently across all components
- Provides smooth, consistent fade-in experience
- Matches `DetailsScreen` and `AuthBackground` behavior

**Impact:** Consistent, polished user experience

---

## 🏗️ Implementation Plan

### Step 1: Create Dimension Cache Utility
```typescript
// app/src/utils/dimensionCache.ts
// Global cache for image dimensions
// Methods: getDimensions(url), setDimensions(url, dims), preloadDimensions(urls[])
```

### Step 2: Update HotelCard Component
- Use dimension cache instead of local state
- Add `dimensionsReady` state
- Show placeholder until dimensions ready
- Use cached dimensions for instant lookup

### Step 3: Update DetailsScreen Component
- Use dimension cache for all carousel photos
- Each photo looks up its own dimensions
- Fix carousel to use individual photo dimensions
- Add placeholder during loading

### Step 4: Memoize Image Sources
- Update `imageUtils.ts` to cache source objects
- Return same reference for same URL

### Step 5: Standardize Transitions
- Change `HotelCard` from `transition={0}` to `transition={200}`
- Ensure all components use consistent transition

---

## 📊 Expected Results

| Issue | Before | After |
|-------|--------|-------|
| **Layout Jump on Load** | 100-300ms jump | ✅ No jump - smooth |
| **Carousel Flicker** | Flickers during scroll | ✅ Smooth - correct dimensions |
| **Photo Switch Jump** | Brief wrong size | ✅ Instant correct size |
| **Background Color Flash** | Visible flash | ✅ Smooth transition |
| **Dimension Loading** | Duplicate calls | ✅ Single call, cached |

---

## 🔧 Technical Details

### Dimension Cache Structure
```typescript
interface DimensionCache {
  get(url: string): { width: number; height: number } | null
  set(url: string, dims: { width: number; height: number }): void
  preload(urls: string[]): Promise<void>
  has(url: string): boolean
}
```

### Placeholder Strategy
- **Horizontal images:** Placeholder height = `SCREEN_HEIGHT * 0.6`
- **Vertical images:** Placeholder height = `SCREEN_HEIGHT`
- Placeholder has same background color as final image container
- Smooth fade transition when actual image loads

### Carousel Fix
```typescript
// Instead of:
const isPhotoHorizontal = imageDimensions && imageDimensions.width > imageDimensions.height;

// Use:
const photoDims = dimensionsMap.get(photo) || null;
const isPhotoHorizontal = photoDims ? photoDims.width > photoDims.height : false;
```

---

## ✅ Benefits

1. **No Flickering:** Dimensions available before render
2. **Smooth Transitions:** Consistent 200ms fade-in
3. **Correct Sizing:** Each photo uses its own dimensions
4. **Better Performance:** Single dimension load, cached globally
5. **Maintains Your Design:** 60% horizontal, full screen vertical preserved

---

## 🚀 Ready to Implement?

This approach will:
- ✅ Fix all flickering/jumping issues
- ✅ Keep your 60%/full screen design
- ✅ Improve performance with caching
- ✅ Provide smooth, consistent UX

**Should I proceed with implementation?**

