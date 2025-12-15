# 📸 Near-Square Photo Dimension Fix

## Problem Identified
Photos with nearly square dimensions (aspect ratio close to 1.0) are causing jumping because:
1. **Ambiguous classification**: A photo that's 1200x1000 (ratio 1.2) is technically horizontal but visually close to square
2. **Threshold issue**: Current code uses simple `width > height` check
3. **Jumping behavior**: When switching between near-square photos, the height calculation jumps between 60% and 100%

## Example Problem Cases
- **1200x1000** (ratio 1.2) → Classified as horizontal → 60% height
- **1000x1200** (ratio 0.83) → Classified as vertical → 100% height  
- **Switching between them** → Visible jump from 60% to 100% height

## Solution: Smart Aspect Ratio Thresholds

### Current Code (Problematic):
```typescript
const isHorizontal = imageDimensions && imageDimensions.width > imageDimensions.height;
const imageHeight = isHorizontal ? SCREEN_HEIGHT * 0.6 : SCREEN_HEIGHT;
```

### Fixed Code (With Buffer Zone):
```typescript
const getPhotoDisplaySize = (dimensions: { width: number; height: number } | null) => {
  if (!dimensions) return { height: SCREEN_HEIGHT, isHorizontal: false };
  
  const aspectRatio = dimensions.width / dimensions.height;
  
  // Buffer zone for near-square photos (0.75 - 1.33 aspect ratio)
  // These photos work well with a middle-ground sizing
  if (aspectRatio >= 0.75 && aspectRatio <= 1.33) {
    // Near-square: use 80% height (compromise between 60% and 100%)
    return { height: SCREEN_HEIGHT * 0.8, isHorizontal: false, isNearSquare: true };
  }
  
  // Clearly horizontal (wide) photos
  if (aspectRatio > 1.33) {
    return { height: SCREEN_HEIGHT * 0.6, isHorizontal: true, isNearSquare: false };
  }
  
  // Clearly vertical (tall) photos
  return { height: SCREEN_HEIGHT, isHorizontal: false, isNearSquare: false };
};
```

## Threshold Rationale

| Aspect Ratio | Photo Type | Example Dimensions | Height Setting | Reason |
|--------------|------------|-------------------|----------------|---------|
| > 1.33 | Horizontal | 1600x1200, 1920x1080 | 60% | Clearly wide, needs cropping |
| 0.75 - 1.33 | Near-Square | 1200x1000, 1000x1200 | 80% | Ambiguous, use middle ground |
| < 0.75 | Vertical | 1080x1920, 1200x1600 | 100% | Clearly tall, use full height |

## Benefits

1. **No jumping**: Near-square photos consistently use 80% height
2. **Better sizing**: 80% is a good middle ground for slightly rectangular photos
3. **Smoother transitions**: Less dramatic changes when switching photos
4. **Visual consistency**: Photos with similar aspect ratios display similarly

## Implementation Needed

Update both files:
1. `app/src/components/HotelCard.tsx`
2. `app/src/screens/DetailsScreen.tsx`

Replace the simple `isHorizontal` logic with the smart threshold function.

