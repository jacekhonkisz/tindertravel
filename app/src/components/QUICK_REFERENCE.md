# 🎯 Quick Reference Card - Photo View System

## 🚀 Quick Start (Copy & Paste)

```tsx
// 1. Import
import { SwipePhotoCard, usePhotoViewMode, hotelHeroToMeta } from './src/photo-view-system';

// 2. Use in component
function MyScreen({ hotel }) {
  const { viewMode, setViewMode } = usePhotoViewMode();
  const photo = hotelHeroToMeta(hotel);
  
  return (
    <SwipePhotoCard
      photo={photo}
      viewMode={viewMode}
      onModeChange={setViewMode}
      hotelInfo={<YourHotelInfo />}
    />
  );
}
```

## 📋 Essential Props

```tsx
<SwipePhotoCard
  photo={{
    uri: string,           // Required
    width: number,         // Required (image width)
    height: number,        // Required (image height)
    tag?: PhotoTag,        // Optional: 'room' | 'pool' | 'exterior' | etc.
    focalPoint?: {x, y},   // Optional: (0-1, 0-1)
  }}
  viewMode="BALANCED"      // Required: 'FULL_VERTICAL_SCREEN' | 'ORIGINAL_FULL' | 'BALANCED'
  onModeChange={fn}        // Required: (mode) => void
  hotelInfo={<View />}     // Optional: Bottom content
  showDebug={false}        // Optional: Show debug overlay
  style={styles}           // Optional: Additional styles
/>
```

## 🎨 Three Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **BALANCED** ⭐ | Sweet spot, controlled zoom | **Default - recommended** |
| FULL_VERTICAL_SCREEN | Immersive, fills viewport | Tinder-like experience |
| ORIGINAL_FULL | Complete photo visible | See entire composition |

## 🎯 View Mode Hook

```tsx
const { viewMode, setViewMode, isLoading } = usePhotoViewMode();

// viewMode: 'BALANCED' | 'FULL_VERTICAL_SCREEN' | 'ORIGINAL_FULL'
// setViewMode: (mode) => void (persists automatically)
// isLoading: boolean (true while loading saved preference)
```

## 🔄 Data Conversion

```tsx
import { hotelHeroToMeta, hotelPhotosToMeta, hotelPhotoToMetaAsync } from './src/photo-view-system';

// Quick conversion (uses default dimensions)
const photo = hotelHeroToMeta(hotel);

// Multiple photos
const photos = hotelPhotosToMeta([url1, url2, url3]);

// With real dimensions (async)
const photo = await hotelPhotoToMetaAsync(hotel.heroPhoto);
```

## 🏷️ Photo Tags

| Tag | Use For | Focal Point |
|-----|---------|-------------|
| `'room'` | Hotel rooms, bedrooms | Lower center (bed) |
| `'exterior'` | Building facades | Upper center (building) |
| `'pool'` | Pool areas | Center |
| `'bathroom'` | Bathrooms | Center |
| `'lobby'` | Lobbies, common areas | Center |
| `'food'` | Restaurants, dining | Center |

```tsx
const photo = {
  uri: url,
  width: 1920,
  height: 1080,
  tag: 'room', // ← Smart positioning!
};
```

## 🎨 Colors

```tsx
import { COLORS } from './src/photo-view-system';

COLORS.NAVY_BLUE              // '#0A1929' - Background
COLORS.NAVY_BLUE_TRANSLUCENT  // 'rgba(10, 25, 41, 0.7)'
COLORS.WHITE                  // '#FFFFFF'
COLORS.WHITE_TRANSLUCENT      // 'rgba(255, 255, 255, 0.9)'
```

## 📏 Layout Ratios

```tsx
import { LAYOUT_RATIOS } from './src/photo-view-system';

LAYOUT_RATIOS.PHOTO_VIEWPORT  // 0.68 (68% of screen)
LAYOUT_RATIOS.BOTTOM_INFO     // 0.32 (32% of screen)
```

## 🐛 Debug Mode

```tsx
<SwipePhotoCard
  showDebug={true}  // or showDebug={__DEV__}
  // Shows: mode, aspect ratio, scale, crop %, focal point, dimensions
/>
```

## ⚡ Performance

```tsx
import { preloadImages } from './src/photo-view-system';

// Preload next images
const nextUrls = upcomingHotels.map(h => h.heroPhoto);
preloadImages(nextUrls);
```

## 🔧 Utilities

```tsx
import {
  computePhotoStyles,    // Compute rendering styles
  getModeDisplayName,    // 'Full' | 'Fit' | 'Balance'
  cycleViewMode,         // Get next mode in cycle
  getFocalPoint,         // Get focal point for tag
  inferPhotoTag,         // Infer tag from URL
} from './src/photo-view-system';
```

## 📱 Safe Areas

```tsx
// Automatically handled! Just wrap app with:
import { SafeAreaProvider } from 'react-native-safe-area-context';

<SafeAreaProvider>
  <YourApp />
</SafeAreaProvider>
```

## 🎯 Common Patterns

### Basic Hotel Feed
```tsx
function HotelFeed({ hotels }) {
  const { viewMode, setViewMode } = usePhotoViewMode();
  const [index, setIndex] = useState(0);
  
  const hotel = hotels[index];
  const photo = hotelHeroToMeta(hotel);
  
  return (
    <SwipePhotoCard
      photo={photo}
      viewMode={viewMode}
      onModeChange={setViewMode}
      hotelInfo={
        <View style={{ padding: 24 }}>
          <Text>{hotel.name}</Text>
          <Text>{hotel.location}</Text>
        </View>
      }
    />
  );
}
```

### With Real Dimensions
```tsx
const [photo, setPhoto] = useState(null);

useEffect(() => {
  hotelPhotoToMetaAsync(hotel.heroPhoto)
    .then(setPhoto);
}, [hotel]);

if (!photo) return <Loading />;

return <SwipePhotoCard photo={photo} ... />;
```

### Custom Focal Point
```tsx
const photo = {
  uri: hotel.heroPhoto,
  width: 1920,
  height: 1080,
  focalPoint: { x: 0.3, y: 0.4 }, // Focus left-upper area
};
```

## 🧪 Quick Test

1. ✅ Default mode is BALANCED
2. ✅ Tap top-right button → cycles modes
3. ✅ Close app → reopen → mode persists
4. ✅ Navy blue background (no blurred photos)
5. ✅ Works on different device sizes

## 📚 Documentation

| File | Purpose |
|------|---------|
| `INTEGRATION_GUIDE.md` | **Start here** - Quick setup |
| `PhotoViewSystem.README.md` | Complete technical docs |
| `VISUAL_GUIDE.md` | Visual diagrams & examples |
| `TESTING_CHECKLIST.md` | Comprehensive test matrix |
| `FILE_INDEX.md` | File structure reference |

## 🆘 Troubleshooting

**Photos too small?**
→ Check `width` and `height` are actual image dimensions, not 0 or 1

**Mode doesn't persist?**
→ Ensure `SafeAreaProvider` wraps your app

**Toggle button not visible?**
→ Check z-index conflicts

**Layout looks wrong?**
→ Verify `SafeAreaProvider` wraps navigation tree

## 📦 Dependencies

```json
{
  "react-native-safe-area-context": "^5.6.1",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

## 🎓 Learning Path

1. **Quick Start** → Copy code above
2. **Integration** → Read `INTEGRATION_GUIDE.md`
3. **Visual** → Check `VISUAL_GUIDE.md`
4. **Deep Dive** → Read `PhotoViewSystem.README.md`
5. **Testing** → Follow `TESTING_CHECKLIST.md`

## ⚙️ Customization

### Adjust Balanced Mode Zoom
```tsx
// In photoStyleComputer.ts
const BALANCED_PARAMS = {
  DEFAULT_M_TARGET: 1.45,  // ← Change this (1.3-1.6)
  // ...
};
```

### Change Colors
```tsx
// In types/photoView.ts
export const COLORS = {
  NAVY_BLUE: '#0A1929',  // ← Change this
  // ...
};
```

### Add Custom Tags
```tsx
// In photoAnchor.ts
const TAG_BASED_ANCHORS = {
  room: { x: 0.5, y: 0.62 },
  myCustomTag: { x: 0.4, y: 0.5 },  // ← Add this
};
```

## 🎯 Key Concepts

**View Mode**
- Global preference (applies to all photos)
- Persists across sessions
- User-selectable via toggle button

**Balanced Mode**
- Default and recommended
- Controlled zoom (1.3x-1.54x over contain)
- Limits crop to ~35%
- Conservative for panoramas

**Focal Point**
- Smart positioning for cropped photos
- Tag-based (room, pool, exterior, etc.)
- Custom override available
- Reduces bad crops

**Navy Blue Background**
- Brand consistent (#0A1929)
- No blurred photos
- Clean, premium look
- Visible in FIT and BALANCED modes

---

## 💡 Pro Tips

✅ Use `hotelPhotoToMetaAsync()` for accurate dimensions  
✅ Preload next 2-3 images for smooth swiping  
✅ Enable debug mode during development  
✅ Test on multiple device sizes  
✅ Add photo tags to your API if possible  

---

**Main Export:** `./src/photo-view-system.ts`  
**Main Component:** `SwipePhotoCard`  
**Main Hook:** `usePhotoViewMode`  
**Default Mode:** `BALANCED` ⭐

