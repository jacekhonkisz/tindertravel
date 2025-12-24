# Visual Guide: 3-Mode Photo View System

## Mode Comparison

### Horizontal Photo (16:9 - Most Common)
```
Original Image: 1920 × 1080 (16:9 aspect ratio)
Viewport: 393 × 540 (iPhone 14 Pro photo area)

┌─────────────────────────────────────────────┐
│           FULL_VERTICAL_SCREEN              │
│  ┌─────────────────────────────────────┐   │
│  │░░░░░░░░░░░CROPPED AREA░░░░░░░░░░░░│   │
│  ├─────────────────────────────────────┤   │
│  │                                     │   │
│  │         VISIBLE PHOTO               │   │
│  │        (fills viewport)             │   │
│  │                                     │   │
│  ├─────────────────────────────────────┤   │
│  │░░░░░░░░░░░CROPPED AREA░░░░░░░░░░░░│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Scale: 2.31× (cover)                      │
│  Crop: ~57% of image                        │
│  Background: None (fills completely)        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              ORIGINAL_FULL                  │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │        COMPLETE PHOTO               │   │
│  │       (entire image visible)        │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│                                             │
│  Scale: 0.36× (contain)                    │
│  Crop: 0%                                   │
│  Background: Navy blue bars top/bottom      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               BALANCED ⭐                    │
│  ■■NAVY■■                                   │
│  ┌─────────────────────────────────────┐   │
│  │░SLIGHTLY CROPPED░│                  │   │
│  ├──────────────────┤                  │   │
│  │                                     │   │
│  │      VISIBLE PHOTO                  │   │
│  │    (large but not excessive)        │   │
│  │                                     │   │
│  ├──────────────────┤                  │   │
│  │░SLIGHTLY CROPPED░│                  │   │
│  └─────────────────────────────────────┘   │
│  ■■NAVY■■                                   │
│                                             │
│  Scale: 0.52× (1.45× contain)              │
│  Crop: ~31% relative to contain             │
│  Background: Small navy blue areas          │
└─────────────────────────────────────────────┘
```

### Vertical Photo (2:3 - Less Common)
```
Original Image: 1080 × 1620 (2:3 aspect ratio)
Viewport: 393 × 540 (iPhone 14 Pro photo area)

┌─────────────────────────────────────────────┐
│           FULL_VERTICAL_SCREEN              │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │                                     │   │
│  │          VISIBLE PHOTO              │   │
│  │         (fills viewport)            │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Scale: 0.50× (cover, minimal crop)        │
│  Crop: ~17% (less aggressive)               │
│  Background: None or minimal navy           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              ORIGINAL_FULL                  │
│  ■NAVY■                                     │
│  ┌───┐                                      │
│  │   │                                      │
│  │   │                                      │
│  │ C │                                      │
│  │ O │      COMPLETE                        │
│  │ M │       PHOTO                          │
│  │ P │     (entire                          │
│  │ L │      image)                          │
│  │ E │                                      │
│  │ T │                                      │
│  │ E │                                      │
│  │   │                                      │
│  └───┘                                      │
│  ■NAVY■                                     │
│                                             │
│  Scale: 0.24× (contain)                    │
│  Crop: 0%                                   │
│  Background: Navy blue bars left/right      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               BALANCED ⭐                    │
│  ┌─────────────┐                            │
│  │             │                            │
│  │             │                            │
│  │             │                            │
│  │  VISIBLE    │                            │
│  │   PHOTO     │                            │
│  │  (larger    │                            │
│  │   than      │                            │
│  │   fit)      │                            │
│  │             │                            │
│  │             │                            │
│  │             │                            │
│  └─────────────┘                            │
│                                             │
│  Scale: 0.36× (1.45× contain, = cover)     │
│  Crop: ~31% (controlled)                    │
│  Background: Minimal or none                │
└─────────────────────────────────────────────┘
```

### Extreme Panorama (21:9 - Rare)
```
Original Image: 2560 × 1080 (21:9 aspect ratio)
Viewport: 393 × 540 (iPhone 14 Pro photo area)

┌─────────────────────────────────────────────┐
│           FULL_VERTICAL_SCREEN              │
│  ┌─────────────────────────────────────┐   │
│  │░░░░░░░░HUGE CROP░░░░░░░░│         │   │
│  ├──────────────────────────┤         │   │
│  │       VISIBLE            │         │   │
│  ├──────────────────────────┤         │   │
│  │░░░░░░░░HUGE CROP░░░░░░░░│         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Scale: 5.47× (cover)                      │
│  Crop: ~81% (VERY AGGRESSIVE!)              │
│  Background: None                           │
│  ⚠️  Destroys composition                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              ORIGINAL_FULL                  │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│  ┌─────────────────────────────────────┐   │
│  │    COMPLETE PANORAMA                │   │
│  └─────────────────────────────────────┘   │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│  ■■■■■■■■■■NAVY BLUE■■■■■■■■■■■           │
│                                             │
│  Scale: 0.15× (contain)                    │
│  Crop: 0%                                   │
│  Background: Large navy bars top/bottom     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               BALANCED ⭐                    │
│  ■■■■■■■■NAVY BLUE■■■■■■■■                │
│  ┌─────────────────────────────────────┐   │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│  ├─────────────────────────────────────┤   │
│  │      VISIBLE PANORAMA               │   │
│  │    (conservative zoom 1.35×)        │   │
│  ├─────────────────────────────────────┤   │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│  └─────────────────────────────────────┘   │
│  ■■■■■■■NAVY BLUE■■■■■■■■                 │
│                                             │
│  Scale: 0.21× (1.40× contain, max)         │
│  Crop: ~29% (MORE CONSERVATIVE!)            │
│  Background: Navy blue visible              │
│  ✅ Preserves panoramic feel                │
└─────────────────────────────────────────────┘
```

## Layout Structure

```
┌───────────────────────────────────────┐ ▲
│ ████████████ STATUS BAR █████████████ │ │ Safe Area Top
├───────────────────────────────────────┤ ▼
│                                       │
│  ┌───────────────────────────────┐   │ ▲
│  │                               │   │ │
│  │                               │   │ │
│  │      PHOTO VIEWPORT           │   │ │
│  │                               │   │ │ 68% of
│  │         (68%)                 │   │ │ screen
│  │                               │   │ │ height
│  │     [Mode Toggle ⚙]          │   │ │
│  │                               │   │ │
│  │                               │   │ │
│  └───────────────────────────────┘   │ ▼
│  ╔═══════════════════════════════╗   │
│  ║                               ║   │ ▲
│  ║    Hotel Name                 ║   │ │
│  ║    Location                   ║   │ │
│  ║                               ║   │ │ 32% of
│  ║    BOTTOM INFO AREA           ║   │ │ screen
│  ║                               ║   │ │ height
│  ║        (32%)                  ║   │ │
│  ║                               ║   │ │
│  ║      [ ✕ ]     [ ♥ ]         ║   │ │
│  ╚═══════════════════════════════╝   │ ▼
├───────────────────────────────────────┤ ▲
│ ████████ HOME INDICATOR █████████████ │ │ Safe Area Bottom
└───────────────────────────────────────┘ ▼
```

## Mode Toggle Button

```
Top-right position (absolute):
  top: 14px
  right: 14px

┌─────────┐
│  ⛶      │  ← FULL mode icon
│ Full    │  ← Label
└─────────┘
   36×36px circular
   Translucent navy background
   White border
   10px hit slop all sides

Cycle order:
Full → Fit → Balance → Full → ...
```

## Background Color Rules

```
Navy Blue: #0A1929 (RGB: 10, 25, 41)

FULL_VERTICAL_SCREEN:
  ✅ Navy blue visible if image narrower than viewport
  ✅ Usually none visible (fills completely)

ORIGINAL_FULL:
  ✅ Navy blue bars top/bottom (horizontal images)
  ✅ Navy blue bars left/right (vertical images)
  ✅ ALWAYS VISIBLE (by design)

BALANCED:
  ✅ Small navy blue areas when not fully zoomed
  ✅ More visible for panoramas
  ✅ Minimal for standard images

❌ NEVER:
  - Blurred photo background
  - Black background
  - White background
  - Per-image background color
```

## Focal Point Positioning

```
Example: Room Photo (16:9)
Focal Point: (0.5, 0.62) - Below center

┌─────────────────────────────────┐
│         CEILING / LIGHTING      │ ← Often boring
├─────────────────────────────────┤
│                                 │
│           BED AREA              │ ● ← Focal (0.5, 0.62)
│        (most interesting)       │
│                                 │
├─────────────────────────────────┤
│         FLOOR / RUG             │ ← Less important
└─────────────────────────────────┘

In FULL mode:
- Crops top (ceiling) more aggressively
- Keeps bed area centered
- Crops bottom (floor) more aggressively

In BALANCED mode:
- Still centers bed area
- But crops less overall
```

## Scale Examples

```
Scenario: Horizontal photo 1920×1080 in viewport 393×540

scaleContain = min(393/1920, 540/1080) = 0.20
scaleCover   = max(393/1920, 540/1080) = 0.50

FULL_VERTICAL_SCREEN:
  scale = scaleCover = 0.50
  image dimensions = 960×540
  crop = (0.50 - 0.20) / 0.50 = 60%

ORIGINAL_FULL:
  scale = scaleContain = 0.20
  image dimensions = 393×221
  crop = 0%

BALANCED:
  m = 1.45
  scaleBalanced = min(scaleCover, scaleContain × m)
                = min(0.50, 0.20 × 1.45)
                = min(0.50, 0.29)
                = 0.29
  image dimensions = 556×313
  crop relative to contain = (0.29 - 0.20) / 0.29 = 31%
```

## User Experience Flow

```
1. App opens
   └─> Load saved mode from storage
       └─> Default: BALANCED ⭐

2. User views first hotel
   └─> Photo renders in BALANCED mode
       └─> Looks premium immediately

3. User taps mode toggle
   └─> Cycle to FULL_VERTICAL_SCREEN
       └─> Smooth 220ms animation
       └─> Save to storage

4. User swipes to next hotel
   └─> Photo renders in FULL mode
       └─> (preference persists)

5. App closes

6. App reopens
   └─> Load saved mode
       └─> Restore: FULL_VERTICAL_SCREEN
       └─> (persistence works!)
```

## Performance Characteristics

```
Mode Switching:
  ┌─────┐    220ms    ┌─────┐
  │ Old │ ─crossfade─ │ New │
  │Mode │   +scale    │Mode │
  └─────┘             └─────┘
  
  GPU-accelerated ✅
  60fps smooth ✅
  No jank ✅

Image Loading:
  ┌──────┐   load   ┌──────┐   220ms   ┌──────┐
  │ Navy │ ──────→  │Image │ ─fade-in─ │Fully │
  │ Blue │          │Ready │           │Visible│
  └──────┘          └──────┘           └──────┘

Preloading:
  Current Card: n
  Preload: n+1, n+2, n+3
  Cancel on fast swipe ✅
```

## Decision Tree: Which Mode to Use?

```
User wants...

Immersive, Tinder-like feel?
  └─> FULL_VERTICAL_SCREEN
      - Photos fill screen
      - Cropping acceptable
      - Maximum impact

See complete photo composition?
  └─> ORIGINAL_FULL
      - Entire image visible
      - Navy blue fills gaps
      - Academic/precise view

Best overall experience? ⭐
  └─> BALANCED (default)
      - Large photos
      - Controlled cropping
      - Premium feel
      - Sweet spot for most use cases
```

---

## Quick Reference

| Metric | FULL | ORIGINAL | BALANCED |
|--------|------|----------|----------|
| **Fit Type** | cover | contain | custom |
| **Crop** | Unlimited | None | ~35% max |
| **Best For** | Immersion | Precision | Daily use ⭐ |
| **Navy Blue** | Minimal | Always | Sometimes |
| **Horizontal** | Heavy crop | Small image | Large image |
| **Vertical** | Light crop | Medium image | Large image |
| **Panorama** | VERY heavy | Very small | Conservative |

**Default: BALANCED** - Optimized for most hotel photos (horizontal, 16:9).

