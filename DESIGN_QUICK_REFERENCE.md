# Glintz Design System - Quick Reference

## 🎨 Colors

```typescript
// Primary
theme.bg                 // #FAF8F5
theme.surface            // #F4F2EE
theme.surfaceElev        // #EFEAE3

// Text
theme.textPrimary        // rgba(0,0,0,0.85)
theme.textSecondary      // rgba(0,0,0,0.55)
theme.textTertiary       // rgba(0,0,0,0.35)

// Accent (Warm Amber)
theme.accent             // #FDBA74
theme.accentPressed      // #F5A957
theme.accentGradientStart // #FDBA74
theme.accentGradientEnd   // #FFD79E

// Glass
theme.glassBg            // rgba(255,255,255,0.65)
theme.glassBorder        // rgba(255,255,255,0.4)
```

## 📝 Typography

```typescript
// Display (34/41)
fontSize: theme.typography.displaySize
lineHeight: theme.typography.displayLineHeight

// Title (22/28)
fontSize: theme.typography.titleSize
lineHeight: theme.typography.titleLineHeight

// Body (17/24)
fontSize: theme.typography.bodySize
lineHeight: theme.typography.bodyLineHeight

// Caption (13/18)
fontSize: theme.typography.captionSize
lineHeight: theme.typography.captionLineHeight

// Always add:
letterSpacing: theme.typography.letterSpacing // 0.01
```

## 📐 Spacing

```typescript
theme.spacing.xs    // 4
theme.spacing.s     // 8
theme.spacing.m     // 12
theme.spacing.l     // 16
theme.spacing.xl    // 24
theme.spacing.xxl   // 32
theme.spacing.xxxl  // 48
```

## 🔘 Border Radius

```typescript
theme.radius.card   // 24
theme.radius.btn    // 22
theme.radius.chip   // 18
theme.radius.input  // 16
theme.radius.pill   // 32
```

## 🌟 Shadows

```typescript
// Card
...theme.shadow.card
// shadowColor: '#FFBE82', opacity: 0.25, radius: 12, offset: (0,4)

// Button
...theme.shadow.button
// shadowColor: '#FFBE82', opacity: 0.35, radius: 10, offset: (0,2)

// Subtle
...theme.shadow.subtle
// shadowColor: '#000', opacity: 0.05, radius: 20, offset: (0,2)
```

## 🎬 Animations

```typescript
// Timing
SWIPE_OUT: 220ms
DETAILS_ANIMATION: 280ms

// Easing
easing: Animated.Easing.out(Animated.Easing.ease)

// Springs
damping: 18
stiffness: 150
useNativeDriver: true
```

## 🧩 Components

### Button
```typescript
<Button
  title="Text"
  variant="primary" // primary | secondary | danger
  onPress={handler}
  fullWidth={false}
/>
```

### Card
```typescript
<Card
  variant="surface" // surface | elevated
  withBlur={false}
  blurIntensity={30}
>
  {children}
</Card>
```

### Chip
```typescript
<Chip
  label="Text"
  selected={false}
  variant="default" // default | accent
  onPress={handler}
/>
```

## 📱 Status Bar

```typescript
// Light screens (auth, profile)
<StatusBar
  barStyle="dark-content"
  backgroundColor="transparent"
  translucent={true}
  hidden={false}
/>

// Full-screen photos
<StatusBar
  barStyle="light-content"
  backgroundColor="transparent"
  translucent={true}
  hidden={true}
/>
```

## 🎯 Quick Tips

1. **Always use theme tokens** - Never hardcode colors/spacing
2. **Typography scale** - Use predefined sizes with letter spacing
3. **Native animations** - Always set `useNativeDriver: true`
4. **1 blur max** - Limit BlurView usage per screen
5. **60fps target** - Optimize all animations
6. **Accessibility** - 52pt minimum touch targets
7. **Editorial spacing** - Use xxxl for breathing room

## 🚫 Don'ts

- ❌ Don't hardcode colors or sizes
- ❌ Don't use multiple blurs in one view
- ❌ Don't skip letter spacing
- ❌ Don't ignore line heights
- ❌ Don't use animations without native driver
- ❌ Don't create touch targets < 44pt

## ✅ Do's

- ✅ Use theme tokens everywhere
- ✅ Apply letter spacing (0.01em)
- ✅ Use proper line heights
- ✅ Add warm amber shadows
- ✅ Optimize for 60fps
- ✅ Test on real devices
- ✅ Follow 4pt grid spacing

---

*Glintz Design System v2.0 - Editorial Minimalism + Boutique Luxury*

