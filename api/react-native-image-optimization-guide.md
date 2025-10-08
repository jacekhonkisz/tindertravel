# 🖼️ React Native Image Optimization Guide

## 🔍 **Root Cause of Pixelation Issues**

Your photos appear pixelated in the app due to:

1. **Google Places API**: Using `maxwidth=1600&maxheight=1200` instead of higher resolution
2. **Screen Density**: Modern phones have 2x-3x pixel density requiring higher resolution images
3. **Aspect Ratio**: 1600x1200 (4:3) vs optimal 1920x1080 (16:9) for mobile
4. **React Native Scaling**: Images scaled down from source resolution

## 🚀 **Immediate Fixes**

### 1. **Upgrade Google Places Photos**
Run the upgrade script to fix source image quality:
```bash
node upgrade-google-places-photos.js
```

### 2. **Optimize React Native Image Components**

#### **Current Code Issues:**
```tsx
// ❌ PROBLEMATIC - May cause pixelation
<Image
  source={{ uri: photo }}
  style={styles.heroImage}
  contentFit="cover"
/>
```

#### **Optimized Code:**
```tsx
// ✅ OPTIMIZED - Better quality and performance
<Image
  source={{ uri: photo }}
  style={styles.heroImage}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  recyclingKey={photo}
  placeholder={{ uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' }}
/>
```

### 3. **Add Image Quality Settings**

#### **For Expo Image (Recommended):**
```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: photo }}
  style={styles.heroImage}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  recyclingKey={photo}
  // Quality settings
  priority="high"
  allowDownscaling={false}
/>
```

#### **For React Native Image:**
```tsx
import { Image } from 'react-native';

<Image
  source={{ uri: photo }}
  style={styles.heroImage}
  resizeMode="cover"
  // Performance settings
  fadeDuration={200}
  progressiveRenderingEnabled={true}
  resizeMethod="resize"
  resizeMultiplier={2.0} // Android only
/>
```

### 4. **Screen Density Optimization**

#### **Add Multiple Image Resolutions:**
```tsx
const getImageSource = (baseUrl) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  
  // Calculate optimal image size based on screen density
  const optimalWidth = screenWidth * pixelRatio;
  const optimalHeight = screenHeight * pixelRatio;
  
  // Modify URL parameters for optimal resolution
  if (baseUrl.includes('maps.googleapis.com')) {
    return baseUrl
      .replace(/maxwidth=\d+/, `maxwidth=${Math.max(1920, optimalWidth)}`)
      .replace(/maxheight=\d+/, `maxheight=${Math.max(1080, optimalHeight)}`);
  }
  
  return baseUrl;
};

// Usage
<Image
  source={{ uri: getImageSource(photo) }}
  style={styles.heroImage}
  contentFit="cover"
/>
```

### 5. **Preload High-Quality Images**

#### **Add Image Preloading:**
```tsx
import { Image } from 'expo-image';

// Preload images for better performance
const preloadImages = async (imageUrls) => {
  const preloadPromises = imageUrls.map(url => 
    Image.prefetch(url, { cachePolicy: 'memory-disk' })
  );
  await Promise.all(preloadPromises);
};

// Use in component
useEffect(() => {
  preloadImages(hotel.photos);
}, [hotel.photos]);
```

### 6. **Memory Management**

#### **Add Image Cache Management:**
```tsx
import { Image } from 'expo-image';

// Clear cache periodically to prevent memory issues
const clearImageCache = () => {
  Image.clearMemoryCache();
  Image.clearDiskCache();
};

// Use in component cleanup
useEffect(() => {
  return () => {
    // Clear cache when component unmounts
    Image.clearMemoryCache();
  };
}, []);
```

## 📱 **Device-Specific Optimizations**

### **iPhone Pro Max (3x density):**
- Use images with 3x resolution (2880x1620+)
- Enable `allowDownscaling={false}`

### **iPhone Standard (2x density):**
- Use images with 2x resolution (1920x1080+)
- Standard optimization settings

### **Android High-Density:**
- Use `resizeMultiplier={2.0}` for better quality
- Enable `progressiveRenderingEnabled={true}`

## 🔧 **Implementation Steps**

1. **Run the upgrade script** to fix source images
2. **Update Image components** with optimized settings
3. **Add image preloading** for better performance
4. **Implement screen density detection**
5. **Add memory management** for long sessions

## 📊 **Expected Results**

After implementing these fixes:
- ✅ **No more pixelation** on high-density screens
- ✅ **Faster image loading** with preloading
- ✅ **Better memory management** with caching
- ✅ **Improved user experience** with smooth transitions

## 🎯 **Priority Order**

1. **HIGH**: Run `upgrade-google-places-photos.js` (fixes source quality)
2. **HIGH**: Update Image components with quality settings
3. **MEDIUM**: Add image preloading
4. **MEDIUM**: Implement screen density optimization
5. **LOW**: Add advanced memory management

