# Photo View System - Quick Start Guide

## Installation

All required dependencies are already installed in the project:
- ✅ `react-native-safe-area-context@^5.6.1`
- ✅ `@react-native-async-storage/async-storage@^2.2.0`

## Integration Steps

### 1. Wrap your app with SafeAreaProvider (if not already done)

```tsx
// App.tsx or your root component
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Your app content */}
    </SafeAreaProvider>
  );
}
```

### 2. Convert HotelCard photos to PhotoMetadata

Add a utility to transform your existing hotel data:

```tsx
// src/utils/hotelToPhotoMeta.ts
import { PhotoMetadata } from '../types/photoView';
import { inferPhotoTag } from './photoAnchor';

export function hotelPhotosToMeta(
  photoUrls: string[],
  defaultWidth = 1920,
  defaultHeight = 1080
): PhotoMetadata[] {
  return photoUrls.map(uri => ({
    uri,
    width: defaultWidth,
    height: defaultHeight,
    tag: inferPhotoTag(uri),
  }));
}
```

### 3. Update your SwipeDeck component

Replace your current photo rendering with the new system:

```tsx
// Before
<Image source={{ uri: hotel.heroPhoto }} style={styles.photo} />

// After
import { SwipePhotoCard } from '../components/PhotoViewSystem';
import { usePhotoViewMode } from '../hooks/usePhotoViewMode';
import { hotelPhotosToMeta } from '../utils/hotelToPhotoMeta';

function HotelSwipeDeck() {
  const { viewMode, setViewMode } = usePhotoViewMode();
  const [currentHotel, setCurrentHotel] = useState<HotelCard | null>(null);

  if (!currentHotel) return null;

  const photos = hotelPhotosToMeta([currentHotel.heroPhoto]);
  const photo = photos[0];

  return (
    <SwipePhotoCard
      photo={photo}
      viewMode={viewMode}
      onModeChange={setViewMode}
      showDebug={__DEV__}
      hotelInfo={
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
            {currentHotel.name}
          </Text>
          <Text style={{ fontSize: 16, color: '#666' }}>
            {currentHotel.city}, {currentHotel.country}
          </Text>
          
          {/* Your action buttons */}
        </View>
      }
    />
  );
}
```

### 4. Get actual image dimensions (recommended)

For best results, fetch real image dimensions from your API or when loading images:

```tsx
import { Image } from 'react-native';

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject
    );
  });
}

// Usage
const dimensions = await getImageDimensions(hotel.heroPhoto);
const photo: PhotoMetadata = {
  uri: hotel.heroPhoto,
  width: dimensions.width,
  height: dimensions.height,
  tag: inferPhotoTag(hotel.heroPhoto),
};
```

### 5. Implement photo preloading (performance)

Preload next images in the background:

```tsx
import { Image } from 'react-native';

function preloadImages(urls: string[]) {
  urls.forEach(url => {
    Image.prefetch(url);
  });
}

// In your deck component
useEffect(() => {
  const nextHotels = hotels.slice(currentIndex + 1, currentIndex + 3);
  const nextUrls = nextHotels.map(h => h.heroPhoto);
  preloadImages(nextUrls);
}, [currentIndex, hotels]);
```

## Complete Example

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SwipePhotoCard } from '../components/PhotoViewSystem';
import { usePhotoViewMode } from '../hooks/usePhotoViewMode';
import { PhotoMetadata } from '../types/photoView';
import { inferPhotoTag } from '../utils/photoAnchor';
import { HotelCard } from '../types';

interface Props {
  hotels: HotelCard[];
  onSwipe: (action: 'like' | 'dismiss') => void;
}

export function HotelFeed({ hotels, onSwipe }: Props) {
  const { viewMode, setViewMode } = usePhotoViewMode();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentHotel = hotels[currentIndex];

  if (!currentHotel) {
    return <Text>No more hotels</Text>;
  }

  const photo: PhotoMetadata = {
    uri: currentHotel.heroPhoto,
    width: 1920,
    height: 1080,
    tag: inferPhotoTag(currentHotel.heroPhoto),
  };

  const handleLike = () => {
    onSwipe('like');
    setCurrentIndex(i => i + 1);
  };

  const handleDismiss = () => {
    onSwipe('dismiss');
    setCurrentIndex(i => i + 1);
  };

  return (
    <SafeAreaProvider>
      <SwipePhotoCard
        photo={photo}
        viewMode={viewMode}
        onModeChange={setViewMode}
        showDebug={__DEV__}
        hotelInfo={
          <View style={styles.info}>
            <View style={styles.textContent}>
              <Text style={styles.name}>{currentHotel.name}</Text>
              <Text style={styles.location}>
                {currentHotel.city}, {currentHotel.country}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.dismiss]}
                onPress={handleDismiss}
              >
                <Text style={styles.btnText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.like]}
                onPress={handleLike}
              >
                <Text style={styles.btnText}>♥</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  info: {
    flex: 1,
    padding: 24,
  },
  textContent: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 'auto',
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dismiss: {
    backgroundColor: '#FF4458',
  },
  like: {
    backgroundColor: '#00D68F',
  },
  btnText: {
    fontSize: 28,
    color: '#FFF',
  },
});
```

## API Reference

See [PhotoViewSystem.README.md](./PhotoViewSystem.README.md) for complete documentation.

## Testing Your Integration

1. **Run with debug overlay:**
   ```tsx
   <SwipePhotoCard showDebug={true} ... />
   ```

2. **Check all three modes:**
   - Tap the mode toggle button (top-right)
   - Cycle through: Full → Fit → Balance → Full
   - Verify navy blue background (no blurred photos)

3. **Test persistence:**
   - Change mode to FULL_VERTICAL_SCREEN
   - Close app (cmd+shift+H on simulator)
   - Reopen app
   - Should restore FULL_VERTICAL_SCREEN mode

4. **Test responsiveness:**
   - Try different device sizes in simulator
   - Verify layout adapts correctly

## Troubleshooting

**Issue:** Photos appear tiny  
**Fix:** Ensure `width` and `height` in PhotoMetadata are actual image dimensions, not 0 or 1.

**Issue:** Mode doesn't persist  
**Fix:** Check AsyncStorage permissions and that SafeAreaProvider wraps your app.

**Issue:** Toggle button not visible  
**Fix:** Ensure there's no other View with higher zIndex covering it.

**Issue:** Layout looks wrong  
**Fix:** Make sure SafeAreaProvider wraps your entire navigation tree.

## Next Steps

1. Update your existing hotel screen to use SwipePhotoCard
2. Implement image dimension fetching for accurate rendering
3. Add image preloading for smooth swiping
4. Test on physical devices (various sizes)
5. Gather user feedback on default BALANCED mode
6. Consider adding photo tags to your hotel API response

---

For detailed technical documentation, see [PhotoViewSystem.README.md](./PhotoViewSystem.README.md)

