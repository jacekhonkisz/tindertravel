# Glintz 3-Mode Photo View System

Premium, fully responsive photo rendering system for Tinder-style swipe cards with global user preferences.

## Overview

This system provides three distinct view modes for displaying hotel photos in the Glintz feed:

1. **FULL_VERTICAL_SCREEN** - Immersive cover mode, fills entire viewport
2. **ORIGINAL_FULL** - Shows complete photo without cropping (contain/fit)
3. **BALANCED** - Smart sweet-spot mode with controlled zoom (default)

### Key Features

- ✅ Global preference persists across sessions
- ✅ Navy blue background (no blurred-photo backgrounds)
- ✅ Fully responsive on all mobile devices
- ✅ Intelligent focal point positioning
- ✅ Smooth mode transitions with animation
- ✅ Debug overlay for development
- ✅ Premium UI with consistent feed rhythm

## Architecture

```
src/
├── types/
│   └── photoView.ts              # Type definitions & constants
├── utils/
│   ├── photoStyleComputer.ts     # Core rendering algorithm
│   └── photoAnchor.ts            # Focal point & positioning
├── hooks/
│   └── usePhotoViewMode.ts       # Global preference management
├── components/
│   ├── SwipePhotoCard.tsx        # Main card component
│   ├── PhotoViewModeToggle.tsx   # Mode toggle button
│   └── PhotoDebugOverlay.tsx     # Debug overlay
└── screens/
    └── HotelFeedScreen.example.tsx  # Example usage
```

## View Modes Explained

### FULL_VERTICAL_SCREEN
```typescript
// Fills entire photo viewport (68% of screen)
// Uses 'cover' fit - crops if necessary
// Best for immersive, Tinder-like experience
```

**When it looks best:** Vertical or square photos, artistic shots where cropping is acceptable.

### ORIGINAL_FULL
```typescript
// Shows entire photo without cropping
// Uses 'contain' fit - navy blue fills gaps
// Best for seeing complete composition
```

**When it looks best:** Photos where full context matters (exterior shots, panoramas).

### BALANCED (Default & Recommended)
```typescript
// Sweet spot between Full and Fit
// Controlled zoom: 1.30x - 1.54x over contain
// Limits crop to ~35% max
// Navy blue background when not fully zoomed
```

**Algorithm:**
```
For standard images (aspect ratio < 1.9):
  - Target multiplier: 1.45x
  - Max multiplier: 1.538x (≈35% crop)
  
For extreme panoramas (aspect ratio ≥ 1.9):
  - Target multiplier: 1.35x
  - Max multiplier: 1.40x (more conservative)

scaleBalanced = min(scaleCover, scaleContain × m)
```

**Why it works:** Most hotel photos are horizontal (16:9 or wider). On a tall viewport, cover mode crops too aggressively. Balanced mode makes photos feel large while keeping important content visible.

## Usage

### Basic Integration

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SwipePhotoCard } from './components/SwipePhotoCard';
import { usePhotoViewMode } from './hooks/usePhotoViewMode';

function MyFeedScreen() {
  const { viewMode, setViewMode } = usePhotoViewMode();
  
  const photo = {
    uri: 'https://example.com/hotel-photo.jpg',
    width: 1920,
    height: 1080,
    tag: 'exterior', // optional: room, pool, lobby, etc.
  };

  return (
    <SafeAreaProvider>
      <SwipePhotoCard
        photo={photo}
        viewMode={viewMode}
        onModeChange={setViewMode}
        hotelInfo={
          <YourHotelInfoComponent />
        }
      />
    </SafeAreaProvider>
  );
}
```

### Photo Metadata

```typescript
interface PhotoMetadata {
  uri: string;           // Image URL
  width: number;         // Original width in pixels
  height: number;        // Original height in pixels
  tag?: PhotoTag;        // Optional: helps with smart positioning
  focalPoint?: {         // Optional: custom focal point
    x: number;           // 0 (left) to 1 (right)
    y: number;           // 0 (top) to 1 (bottom)
  };
}
```

### Photo Tags

Tags enable smart focal point positioning:

| Tag | Use Case | Focal Point |
|-----|----------|-------------|
| `room` | Hotel rooms, bedrooms | (0.5, 0.62) - Lower center |
| `bathroom` | Bathrooms | (0.5, 0.55) - Center |
| `exterior` | Building facades | (0.5, 0.42) - Upper center |
| `pool` | Pool areas | (0.5, 0.5) - Center |
| `lobby` | Lobbies, common areas | (0.5, 0.52) - Center |
| `food` | Restaurant, dining | (0.5, 0.5) - Center |
| `unknown` | Default | (0.5, 0.5) - Center |

Tags can be inferred automatically using `inferPhotoTag(uri)`.

## Layout Specs

### Screen Division
- **Photo Viewport:** 68% of screen height (minus safe area top)
- **Bottom Info Area:** 32% of screen height (minus safe area bottom)
- **Background:** Navy blue (`#0A1929`) always

### Mode Toggle
- **Position:** Absolute top-right
- **Offsets:** 14px from top, 14px from right
- **Size:** 36×36px circular button
- **Hit Slop:** 10px all around
- **Style:** Translucent navy background, white border

### Safe Areas
All measurements respect iOS/Android safe area insets (notch, dynamic island, home indicator).

## Responsive Design

The system computes everything from viewport dimensions:

```typescript
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const insets = useSafeAreaInsets();

const photoViewportHeight = 
  screenHeight * LAYOUT_RATIOS.PHOTO_VIEWPORT - insets.top;
```

**No hardcoded device sizes.** Works on:
- iPhone SE (small)
- iPhone 14/15/16/17 Pro (notch/dynamic island)
- Large Android devices
- Tablets (if needed)

## Persistence

View mode preference is stored using `AsyncStorage`:

```typescript
// Storage key: 'glintz.feedViewMode'
// Values: 'FULL_VERTICAL_SCREEN' | 'ORIGINAL_FULL' | 'BALANCED'
// Default: 'BALANCED'
```

Automatically loads on app start and persists across sessions.

## Performance

### Image Loading
- Uses `Animated.View` for smooth fade-in (220ms)
- Preload next 2-3 images in feed (implement in parent)
- Use appropriate image sizes for device width

### Rendering
- Memoized style computation with `useMemo`
- GPU-accelerated transforms (`useNativeDriver: true`)
- Minimal re-renders via React optimization

### Memory
- Cancel preload on fast swipe
- Use CDN-resized images (don't decode 4K images on mobile)

## Debug Mode

Enable debug overlay in development:

```tsx
<SwipePhotoCard
  photo={photo}
  viewMode={viewMode}
  onModeChange={setViewMode}
  showDebug={true}  // or showDebug={__DEV__}
/>
```

Shows:
- Current mode
- Aspect ratio
- Scale factor
- Crop percentage
- Focal point
- Image dimensions
- Viewport dimensions

## Customization

### Custom Focal Points

```tsx
const photo = {
  uri: 'https://example.com/custom-photo.jpg',
  width: 1920,
  height: 1080,
  focalPoint: { x: 0.3, y: 0.4 }, // Focus left-upper
};
```

### Adjust Balanced Mode Parameters

Edit `BALANCED_PARAMS` in `photoStyleComputer.ts`:

```typescript
const BALANCED_PARAMS = {
  DEFAULT_M_TARGET: 1.45,  // Target zoom
  DEFAULT_M_MIN: 1.30,     // Minimum zoom
  MAX_CROP: 0.35,          // Max crop (35%)
  
  EXTREME_PANORAMA_RATIO: 1.9,
  PANORAMA_M_TARGET: 1.35,
  PANORAMA_M_MAX: 1.40,
};
```

### Custom Colors

Edit `COLORS` in `types/photoView.ts`:

```typescript
export const COLORS = {
  NAVY_BLUE: '#0A1929',           // Background
  NAVY_BLUE_TRANSLUCENT: 'rgba(10, 25, 41, 0.7)',
  WHITE: '#FFFFFF',
  WHITE_TRANSLUCENT: 'rgba(255, 255, 255, 0.9)',
};
```

## Dependencies

Required packages:

```json
{
  "react-native-safe-area-context": "^4.x",
  "@react-native-async-storage/async-storage": "^1.x"
}
```

Install:
```bash
npm install react-native-safe-area-context @react-native-async-storage/async-storage
# or
yarn add react-native-safe-area-context @react-native-async-storage/async-storage
```

## Testing

### Test Matrix
1. **iPhone 14/15/16 Pro** - Dynamic island
2. **iPhone SE** - Small screen
3. **Large Android** - Tall aspect ratio
4. **Horizontal photos** - Verify balanced mode
5. **Vertical photos** - Verify no unnecessary cropping
6. **Panoramas** - Verify conservative zoom

### Manual Test Scenarios

1. **Mode Persistence**
   - Set mode to FULL_VERTICAL_SCREEN
   - Close app completely
   - Reopen app
   - ✅ Should restore FULL_VERTICAL_SCREEN

2. **Mode Toggle**
   - Tap mode button
   - ✅ Should cycle: Full → Fit → Balance → Full
   - ✅ Smooth crossfade animation (220ms)

3. **Responsive Layout**
   - Test on different device sizes
   - ✅ Photo viewport always 68% of screen
   - ✅ Bottom info always 32% of screen
   - ✅ Navy blue fills gaps, never blurred photo

4. **Focal Point**
   - Load room photo with tag='room'
   - Switch to FULL_VERTICAL_SCREEN
   - ✅ Should center bed area (focal y=0.62)

## Troubleshooting

### Photos appear too small
- Check that photo dimensions (width/height) are correct
- Verify BALANCED mode is active (default)
- Try FULL_VERTICAL_SCREEN for immersive look

### Photos are cropped too much
- Switch to ORIGINAL_FULL to see entire image
- Adjust BALANCED_PARAMS.MAX_CROP (decrease from 0.35)
- Provide custom focalPoint to improve positioning

### Mode doesn't persist
- Check AsyncStorage permissions
- Verify storage key: 'glintz.feedViewMode'
- Check console for storage errors

### Toggle button not visible
- Ensure button is rendered over photo (zIndex: 100)
- Check MODE_TOGGLE_CONFIG positioning
- Verify safe area insets aren't covering it

### Animation stutters
- Check that `useNativeDriver: true` is set
- Verify image sizes aren't too large (use CDN resize)
- Profile with React DevTools / Flipper

## Future Enhancements

Potential improvements:

1. **ML-based focal points** - Use on-device ML to detect important regions
2. **Per-photo mode** - Allow mode override for specific photos
3. **Gesture controls** - Pinch to zoom, pan to reposition
4. **A/B testing** - Test different balanced mode parameters
5. **Photo quality detection** - Adjust rendering based on image quality

## License

Part of Glintz © 2024

---

**Questions?** Check the example implementation in `HotelFeedScreen.example.tsx` or review inline code documentation.

