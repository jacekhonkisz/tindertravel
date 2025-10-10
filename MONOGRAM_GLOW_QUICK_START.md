# MonogramGlow - Quick Start Guide

## 🚀 Get Started in 30 Seconds

### Import
```tsx
import MonogramGlow from './components/MonogramGlow';
```

### Basic Usage
```tsx
<MonogramGlow />
```

That's it! The component works with sensible defaults.

---

## 📖 Common Patterns

### Splash Screen
```tsx
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}>
  <MonogramGlow letter="G" size={160} tone="light" />
</View>
```

### Loading with Text
```tsx
<View style={{ alignItems: 'center' }}>
  <MonogramGlow letter="H" size={120} />
  <Text style={{ marginTop: 16, fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
    Loading amazing stays…
  </Text>
</View>
```

### Button/Inline
```tsx
<MonogramGlow size={48} />
```

### Dark Background
```tsx
<View style={{ backgroundColor: '#0F0F10' }}>
  <MonogramGlow tone="dark" size={120} />
</View>
```

---

## 🎨 Props at a Glance

| Prop | Options | Default | Use When |
|------|---------|---------|----------|
| `letter` | `'G'` or `'H'` | `'G'` | Brand initial needed |
| `size` | `32-180` | `96` | Adjusting for context |
| `tone` | `'light'` or `'dark'` | `'light'` | Matching background |
| `accentColor` | Any hex/rgb | `'#FDBA74'` | Custom brand color |

---

## 💡 Tips

### Size Guide
- **32-48px**: Buttons, inline loaders
- **80-120px**: Feed loading, modals
- **140-180px**: Splash screens

### Theme Matching
- Light background → `tone="light"`
- Dark background → `tone="dark"`
- Component auto-adjusts colors

### Performance
- Already optimized (60fps)
- No additional config needed
- Works great on all devices

---

## 📍 Where It's Used

Currently implemented in:
1. `App.tsx` - App initialization
2. `SwipeDeck.tsx` - Hotel feed loading
3. `AuthScreen.tsx` - Login screen

---

## 🎯 Recommended Sizes

```tsx
// Splash
<MonogramGlow size={160} letter="G" />

// Feed
<MonogramGlow size={120} letter="H" />

// Modal
<MonogramGlow size={80} />

// Button
<MonogramGlow size={48} />

// Inline
<MonogramGlow size={32} />
```

---

## ✨ Animation Details

- **Duration**: 1.6 seconds per cycle
- **Loop**: Infinite
- **FPS**: 60
- **Effect**: Smooth left-to-right shimmer

---

## 🔍 Need More Info?

- Full docs: `MonogramGlow.README.md`
- Examples: `MonogramGlow.preview.tsx`
- Implementation: `MONOGRAM_GLOW_IMPLEMENTATION.md`

---

**That's all you need to know to get started!** 🎉

