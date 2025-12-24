# Image.getSize() Error Fix

## Issue
```
ERROR [TypeError: _expoImage.Image.getSize is not a function (it is undefined)]
```

## Root Cause
The code was importing `Image` from `expo-image` and then calling `Image.getSize()`, but:
- **expo-image**: Advanced image component with caching, placeholders, etc. - does NOT have `getSize()` method
- **react-native Image**: Core RN component - HAS the `getSize()` static method

## Files Fixed

### 1. `app/src/components/HotelCard.tsx`
**Before:**
```typescript
import { Image } from 'expo-image';
// ...
Image.getSize(currentPhoto, (width, height) => { /* ... */ });
```

**After:**
```typescript
import { Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
// ...
RNImage.getSize(currentPhoto, (width, height) => { /* ... */ });
```

### 2. `app/src/utils/hotelPhotoConverter.ts`
**Before:**
```typescript
if (typeof Image !== 'undefined' && Image.getSize) {
  Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
}
```

**After:**
```typescript
import { Image as RNImage } from 'react-native';
// ...
if (typeof RNImage !== 'undefined' && RNImage.getSize) {
  RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
}
```

Also added proper fallback handling:
```typescript
else if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
  // Web fallback
} else {
  // Ultimate fallback - return default dimensions
  resolve({ width: 1920, height: 1080 });
}
```

## Why This Matters
- **HotelCard**: Uses `getSize()` to fetch actual image dimensions for BALANCED photo mode calculations
- **hotelPhotoConverter**: Helper utility for getting dimensions of any image URL

## Solution Summary
- Import `Image` from `react-native` as `RNImage` for `getSize()` calls
- Keep `expo-image`'s `Image` for actual rendering (better performance, caching)
- Added safer fallback chain to prevent crashes

## Testing
✅ No linter errors  
✅ Proper separation of concerns (RN Image for dimension queries, expo-image for rendering)  
✅ Safe fallbacks for web and edge cases  

The error should now be resolved! 🎉

