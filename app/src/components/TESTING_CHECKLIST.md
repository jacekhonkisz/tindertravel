# Photo View System - Testing Checklist

## Pre-Integration Checks

- [ ] Dependencies installed
  - [ ] `react-native-safe-area-context@^5.6.1`
  - [ ] `@react-native-async-storage/async-storage@^2.2.0`
  
- [ ] App wrapped with `SafeAreaProvider`

- [ ] Photo dimensions available (or using defaults)

## Functional Tests

### Mode Switching
- [ ] Mode toggle button visible in top-right corner
- [ ] Button has correct visual style (translucent navy, white border)
- [ ] Tapping button cycles through modes: Full → Fit → Balance → Full
- [ ] Mode change triggers smooth animation (220ms crossfade)
- [ ] Mode label updates correctly: "Full", "Fit", "Balance"

### FULL_VERTICAL_SCREEN Mode
- [ ] Photo fills entire viewport (68% of screen)
- [ ] Horizontal photos are cropped to fill (cover mode)
- [ ] Vertical photos fit without excessive cropping
- [ ] Navy blue background visible if photo is narrower than screen
- [ ] Focal point positioning works (bed centered for rooms)

### ORIGINAL_FULL Mode
- [ ] Entire photo visible without cropping
- [ ] Photo centered in viewport
- [ ] Navy blue fills empty space (no blurred background)
- [ ] Horizontal photos have navy blue bars top/bottom
- [ ] Vertical photos have navy blue bars left/right

### BALANCED Mode (Default)
- [ ] Photos appear larger than ORIGINAL_FULL
- [ ] Cropping is limited (not as aggressive as FULL)
- [ ] Horizontal photos look premium and "full enough"
- [ ] Navy blue visible in background when appropriate
- [ ] Panoramas use conservative zoom (1.35x-1.40x)
- [ ] Standard photos use standard zoom (1.45x-1.54x)

### Persistence
- [ ] Default mode is BALANCED on first run
- [ ] Changing mode persists immediately
- [ ] Mode restored after app close and reopen
- [ ] Mode persists across app kills (force quit)
- [ ] Storage key correct: `glintz.feedViewMode`

### Layout & Responsiveness
- [ ] Photo viewport is exactly 68% of screen height
- [ ] Bottom info area is exactly 32% of screen height
- [ ] Safe areas respected (notch, dynamic island, home indicator)
- [ ] Works on iPhone SE (small)
- [ ] Works on iPhone 14/15 Pro (notch)
- [ ] Works on iPhone 16/17 Pro (dynamic island)
- [ ] Works on large Android devices
- [ ] Landscape orientation handled (if supported)

### Background Color
- [ ] Background is always navy blue (`#0A1929`)
- [ ] No blurred photo backgrounds ever appear
- [ ] Navy blue visible in ORIGINAL_FULL mode gaps
- [ ] Navy blue visible in BALANCED mode if not fully zoomed
- [ ] Navy blue in loading state

## Performance Tests

### Image Loading
- [ ] Smooth fade-in animation when image loads
- [ ] No flash of unstyled content
- [ ] Loading state shows navy blue background
- [ ] Failed images handled gracefully

### Mode Switching Performance
- [ ] Mode switch is instant (<220ms animation)
- [ ] No jank or stuttering during animation
- [ ] Works smoothly on older devices
- [ ] No memory leaks on repeated mode switching

### Swipe Performance
- [ ] Mode toggle doesn't interfere with swipe gestures
- [ ] Swiping between cards is smooth
- [ ] Preloading next images works
- [ ] No performance degradation after many swipes

## Visual Quality Tests

### Photo Rendering
- [ ] Photos look sharp (no pixelation)
- [ ] Colors accurate
- [ ] No distortion or stretching
- [ ] Focal points keep important content in view
- [ ] Tag-based anchoring works (room/pool/exterior)

### UI Consistency
- [ ] Feed rhythm consistent across different photos
- [ ] Bottom info area always same size
- [ ] Mode toggle always in same position
- [ ] Navy blue shade matches brand (#0A1929)

### Edge Cases
- [ ] Extreme panoramas (3:1 ratio) render correctly
- [ ] Very vertical photos (1:2 ratio) render correctly
- [ ] Square photos (1:1 ratio) render correctly
- [ ] Very small images (<500px) render acceptably
- [ ] Very large images (>4K) don't crash

## Debug Mode Tests

- [ ] Debug overlay appears when enabled
- [ ] Shows correct mode name
- [ ] Shows correct aspect ratio
- [ ] Shows correct scale value
- [ ] Shows correct crop percentage
- [ ] Shows correct focal point coordinates
- [ ] Shows correct image dimensions
- [ ] Shows correct viewport dimensions
- [ ] Debug overlay doesn't interfere with interaction

## Integration Tests

### With Existing Swipe Deck
- [ ] SwipePhotoCard integrates with existing deck
- [ ] Swipe gestures work correctly
- [ ] No z-index conflicts
- [ ] Mode persists across card swipes
- [ ] Hotel info area renders correctly

### With Hotel Data
- [ ] HotelCard data converts to PhotoMetadata
- [ ] Photo URLs load correctly
- [ ] Tags inferred from URLs when needed
- [ ] Default dimensions work when real ones unavailable

### Error Handling
- [ ] Invalid photo URL handled gracefully
- [ ] Missing photo dimensions use defaults
- [ ] Storage errors logged but don't crash
- [ ] Invalid mode values fall back to default
- [ ] Network errors during image load handled

## Accessibility Tests

- [ ] Mode toggle button has sufficient hit area (36px + 10px slop)
- [ ] Buttons respond to touch correctly
- [ ] Text contrast sufficient for readability
- [ ] VoiceOver/TalkBack support (if required)

## Cross-Platform Tests

### iOS
- [ ] Works on iOS 14+
- [ ] Safe areas correct on all iPhone models
- [ ] Dynamic island handled correctly
- [ ] Home indicator area respected
- [ ] Status bar doesn't overlap content

### Android
- [ ] Works on Android 10+
- [ ] Status bar handled correctly
- [ ] Navigation bar handled correctly
- [ ] Different screen sizes work
- [ ] Different aspect ratios work

### Web (if applicable)
- [ ] Responsive design works
- [ ] Mouse interactions work
- [ ] Touch interactions work
- [ ] Browser resize handled

## User Experience Tests

### First-Time User
- [ ] Default BALANCED mode looks good immediately
- [ ] Mode toggle is discoverable
- [ ] Photos look premium right away
- [ ] No configuration needed

### Power User
- [ ] Can quickly switch modes
- [ ] Preference remembered
- [ ] Consistent behavior across sessions
- [ ] Debug mode available for feedback

## Regression Tests

- [ ] Existing hotel feed functionality unchanged
- [ ] Swipe actions still work
- [ ] Like/dismiss buttons still work
- [ ] Navigation still works
- [ ] No performance degradation

## Documentation Tests

- [ ] README.md is comprehensive
- [ ] INTEGRATION_GUIDE.md is clear
- [ ] Code comments are helpful
- [ ] Example code runs correctly
- [ ] TypeScript types are accurate

## Production Readiness

- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Bundle size acceptable
- [ ] Memory usage acceptable
- [ ] Battery usage acceptable
- [ ] Network usage acceptable (preloading)

## Post-Launch Monitoring

- [ ] Analytics for mode usage
- [ ] Crash reporting configured
- [ ] User feedback mechanism
- [ ] A/B test infrastructure (if needed)
- [ ] Performance monitoring

---

## Test Scenarios by Device

### iPhone SE (Small Screen)
```
Screen: 375 × 667
Photo viewport: ~453px height
Bottom info: ~214px height
- Test all modes render correctly
- Test mode toggle visible and usable
```

### iPhone 14 Pro (Notch)
```
Screen: 393 × 852
Safe area top: 59px
Safe area bottom: 34px
Photo viewport: ~520px height
- Test notch doesn't overlap photo
- Test home indicator doesn't overlap buttons
```

### iPhone 17 Pro (Dynamic Island)
```
Screen: 393 × 852
Safe area top: 59px (dynamic island)
Safe area bottom: 34px
- Test dynamic island handling
- Test mode toggle visible above island
```

### Large Android
```
Screen: 412 × 915 (example)
Various safe areas
- Test navigation bar handling
- Test status bar handling
- Test different aspect ratios
```

---

## Quick Smoke Test

**For rapid validation:**

1. Open app → Default is BALANCED ✓
2. Tap mode toggle → Cycles to FULL ✓
3. Tap again → Cycles to FIT ✓
4. Tap again → Cycles to BALANCED ✓
5. Close app completely ✓
6. Reopen app → Still BALANCED ✓
7. Swipe to next hotel → Still BALANCED ✓
8. Navy blue background visible in FIT mode ✓

**Pass all 8? System is working!**

