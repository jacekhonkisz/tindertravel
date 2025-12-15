# MonogramGlow Component

A premium, lightweight loader animation component featuring a single outlined letter with a smooth shimmer effect. Perfect for boutique travel apps requiring elegant, fast, and smooth loading states.

## 🎨 Design Philosophy

- **Minimalist**: Clean line, smooth light reflection
- **Performance**: 60fps on mid-range devices, <10KB footprint
- **Brand-Aligned**: Feels like "Apple / Airbnb intro" minimal motion
- **Versatile**: Works on both light and dark backgrounds

## 📦 Installation

The component uses `react-native-svg` which is already included in the project dependencies.

```bash
# Already installed in this project
npm install react-native-svg
```

## 🚀 Usage

### Basic Usage

```tsx
import MonogramGlow from './components/MonogramGlow';

// Default configuration (G letter, 96px, light theme)
<MonogramGlow />
```

### Common Use Cases

#### Splash Screen
```tsx
<MonogramGlow 
  letter="H" 
  size={160} 
  tone="light"
/>
```

#### Feed Loading
```tsx
<MonogramGlow 
  letter="G" 
  size={120} 
  tone="light"
/>
```

#### Button/Modal Loading
```tsx
<MonogramGlow 
  size={48} 
  tone="light"
/>
```

#### Dark Theme
```tsx
<MonogramGlow 
  letter="H" 
  size={120} 
  tone="dark"
/>
```

#### With Loading Text
```tsx
<View style={{ alignItems: 'center' }}>
  <MonogramGlow letter="H" size={120} />
  <Text style={{ marginTop: 16, fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
    Loading amazing stays…
  </Text>
</View>
```

## 🎛️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `letter` | `'G' \| 'H'` | `'G'` | The letter to display in the monogram |
| `size` | `number` | `96` | Size of the component in pixels |
| `accentColor` | `string` | `'#FDBA74'` | Color of the shimmer glow effect |
| `strokeColor` | `string` | Auto | Color of the letter outline (auto-adjusts with tone) |
| `tone` | `'light' \| 'dark'` | `'light'` | Theme tone - adjusts background and colors |
| `style` | `ViewStyle` | `undefined` | Additional styles for the container |

## 🎯 Design Tokens

```css
/* Light Theme */
--gl-bg-light: #FAF8F5;
--gl-fg-light: rgba(0,0,0,0.85);

/* Dark Theme */
--gl-bg-dark: #0F0F10;
--gl-fg-dark: rgba(255,255,255,0.85);

/* Accent */
--gl-accent: #FDBA74;
```

## ⚡ Performance

- **Animation**: 1.6s smooth loop with ease-in-out
- **Frame Rate**: Consistent 60fps on mid-range devices
- **Bundle Size**: <10KB
- **GPU Acceleration**: Uses native driver for transforms and opacity
- **Memory**: Minimal - only 3 SVG layers

### Performance Optimizations Applied

1. **Native Driver**: All animations use `useNativeDriver: true`
2. **GPU Rendering**: SVG with hardware acceleration
3. **Minimal DOM**: Only 3 layers (base, shimmer, halo)
4. **No Heavy Filters**: Subtle effects without blur filters
5. **Reusable**: Single component instance can be reused

## 🏗️ Implementation Details

### Animation Architecture

The component uses three layers:

1. **Base Layer**: Static outlined letter (30% opacity)
2. **Shimmer Layer**: Animated gradient that moves horizontally
3. **Halo Layer**: Subtle glow that pulses with shimmer

### Animation Timing

```javascript
Duration: 1600ms (1.6s)
Loop: Infinite
Easing: Linear (smooth continuous motion)
Interpolation:
  - translateX: -50% → 0% → 50%
  - opacity: 0.6 → 1.0 → 0.6
```

### SVG Structure

```xml
<Svg viewBox="0 0 100 100">
  <Defs>
    <LinearGradient id="shimmerGradient">
      <Stop offset="0%" stopOpacity="0" />
      <Stop offset="50%" stopOpacity="1" />
      <Stop offset="100%" stopOpacity="0" />
    </LinearGradient>
  </Defs>
  <Text stroke="url(#shimmerGradient)" />
</Svg>
```

## 🎨 Customization

### Custom Accent Color

```tsx
<MonogramGlow 
  accentColor="#FF6B6B"  // Coral red
/>
```

### Custom Stroke Color

```tsx
<MonogramGlow 
  strokeColor="rgba(100,100,255,0.85)"
  accentColor="#7B68EE"
/>
```

### Custom Container Styles

```tsx
<MonogramGlow 
  style={{
    borderRadius: 24,
    padding: 20,
  }}
/>
```

## 🔄 Integration Examples

### Replace Loading Spinner

**Before:**
```tsx
<ActivityIndicator size="large" color="#FDBA74" />
```

**After:**
```tsx
<MonogramGlow size={120} tone="light" />
```

### In SwipeDeck Component

```tsx
if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <MonogramGlow 
        letter="H" 
        size={120} 
        tone="light"
      />
      <Text style={styles.loadingText}>Loading amazing stays…</Text>
    </View>
  );
}
```

### In App Root

```tsx
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <MonogramGlow 
      letter="G" 
      size={160} 
      tone="light"
    />
  </View>
);
```

## 🎬 Motion Specification

The shimmer effect creates a premium "light sweep" animation:

```css
@keyframes shimmerMove {
  0% { 
    transform: translateX(-50%); 
    opacity: 0.6; 
  }
  50% { 
    transform: translateX(0%); 
    opacity: 1.0; 
  }
  100% { 
    transform: translateX(50%); 
    opacity: 0.6; 
  }
}
```

## 🌓 Theme Behavior

### Light Tone (`tone="light"`)
- Background: `#FAF8F5` (warm off-white)
- Stroke: `rgba(0,0,0,0.85)` (near-black)
- Shimmer: `#FDBA74` (warm amber)

### Dark Tone (`tone="dark"`)
- Background: `#0F0F10` (near-black)
- Stroke: `rgba(255,255,255,0.85)` (near-white)
- Shimmer: `#FDBA74` (warm amber)

## 📱 Responsive Behavior

The component automatically scales with the `size` prop:
- All internal proportions maintain consistency
- Letter size, stroke width, and shimmer speed scale appropriately
- Recommended sizes:
  - Small: 32-48px (buttons, inline loaders)
  - Medium: 80-120px (feed loading)
  - Large: 140-180px (splash screens)

## 🔍 Troubleshooting

### Animation feels choppy
- Ensure you're testing on device, not simulator
- Check that no heavy background processes are running
- Verify `useNativeDriver: true` is set

### Letter not displaying
- Ensure `react-native-svg` is properly installed
- Check that font weight 700 is available
- Verify the component has appropriate parent dimensions

### Wrong colors showing
- Check the `tone` prop matches your background
- Override `strokeColor` if needed for custom backgrounds
- Ensure `accentColor` contrasts with background

## 🚀 Future Enhancements

Potential improvements for future versions:
- [ ] Additional letter options (full alphabet)
- [ ] Custom font family support
- [ ] Adjustable animation speed
- [ ] Multiple shimmer effects (double-pass, rainbow)
- [ ] Pulse animation variant
- [ ] Accessibility improvements (reduced motion support)

## 📄 License

Part of the Glintz Travel App project.

## 👥 Credits

Designed for a premium boutique travel app experience.
Inspired by Apple and Airbnb's minimal motion design language.

