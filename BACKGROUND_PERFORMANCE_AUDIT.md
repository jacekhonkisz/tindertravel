# Background Loading Performance Audit

## 🐌 Current Issues

### 1. **Sequential Loading Chain**
```
App Start → API Call (200-500ms) → Image Prefetch (2-5s) → Display
Total: 2-6 seconds before image shows
```

### 2. **No Image Caching**
- Every load downloads full image (2-20MB)
- No local cache
- Network required every time

### 3. **Blocking UI**
- Screen shows loading state
- User waits for image before seeing UI
- Poor perceived performance

### 4. **Large Image Files**
- R2 photos are full resolution (2-20MB each)
- Slow download on mobile networks
- No optimization/compression

### 5. **Using ImageBackground**
- React Native's ImageBackground has no caching
- Not optimized for performance

---

## ✅ Solutions to Implement

### 1. **Switch to expo-image** (Already installed!)
- ✅ Built-in disk cache
- ✅ Progressive loading
- ✅ Better performance
- ✅ Memory efficient

### 2. **Show UI Immediately**
- Display screen with placeholder/gradient
- Load image in background
- Fade in when ready

### 3. **Preload & Cache**
- Preload next image while showing current
- Cache images locally
- Use cached version if available

### 4. **Optimize Images**
- Use CDN image transformations
- Serve optimized sizes (e.g., 1080p instead of 4K)
- Progressive JPEG loading

### 5. **Parallel Loading**
- Don't wait for prefetch
- Show image as it streams
- Use expo-image's onLoad callback

---

## 🚀 Implementation Plan

1. Replace ImageBackground with expo-image
2. Add immediate UI display
3. Implement progressive loading
4. Add image caching
5. Optimize image sizes

