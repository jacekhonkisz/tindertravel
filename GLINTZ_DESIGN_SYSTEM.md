# Glintz Design System

## Overview

The Glintz design system implements a modern, elegant UI inspired by "Instagram/Pinterest meets boutique luxury" aesthetic. The system prioritizes clean imagery, minimal chrome, soft glass morphism, and subtle color palettes with excellent readability and accessibility.

## Design Philosophy

- **Visual Hierarchy**: Clear typography scale with SF Pro system font
- **Breathing Room**: Generous spacing and minimal text density
- **Luxury Feel**: Soft shadows, blur effects, and premium materials
- **Accessibility**: WCAG AA contrast ratios and 44pt minimum tap targets
- **Responsiveness**: Automatic light/dark mode with semantic color tokens

## Color Palette

### Coastal Sand Theme (Light/Dark)

The design system uses the warm "Coastal Sand" variant with automatic light/dark mode switching.

#### Light Mode
```typescript
bg: '#FAF7F2'           // Main background
surface: '#F2ECE5'       // Card/panel backgrounds  
surfaceElev: '#EDE6DE'   // Elevated surfaces
textPrimary: '#0F1215'   // Primary text
textSecondary: '#5F646B' // Secondary text
accent: '#FFB86B'        // CTA/accent color (Golden Hour)
accentPressed: '#E69E54' // Pressed state
chipBg: '#EFE8E0'       // Chip backgrounds
chipBorder: '#E3DBD2'    // Chip borders
success: '#3CCB7F'       // Success states
danger: '#FF6B6B'        // Error/danger states
overlay: 'rgba(0,0,0,0.55)' // Image overlays
```

#### Dark Mode
```typescript
bg: '#0E1012'           // Main background
surface: '#14171A'       // Card/panel backgrounds
surfaceElev: '#1A1F24'   // Elevated surfaces  
textPrimary: '#ECEAE5'   // Primary text
textSecondary: '#9BA3AC' // Secondary text
accent: '#FFC07A'        // CTA/accent color (brighter for contrast)
accentPressed: '#E2A85F' // Pressed state
chipBg: '#1B1F23'       // Chip backgrounds
chipBorder: '#2A2F34'    // Chip borders
success: '#3CCB7F'       // Success states
danger: '#FF6B6B'        // Error/danger states
overlay: 'rgba(0,0,0,0.55)' // Image overlays
```

## Typography

Uses iOS SF Pro system font with the following scale:

- **Display (34pt/41pt)**: Large headings, semibold
- **Title (22pt/28pt)**: Section titles, semibold  
- **Body (17pt/24pt)**: Regular body text, regular weight
- **Caption (13pt/18pt)**: Small text, regular weight

### Text Hierarchy
- Use normal case for all text (no ALL CAPS except brand elements)
- Ensure proper contrast ratios (4.5:1 minimum for body text)
- Leverage text shadows on image overlays for readability

## Spacing System

Consistent 4pt grid system:

```typescript
xs: 4px   // Micro spacing
s: 8px    // Small spacing  
m: 12px   // Medium spacing
l: 16px   // Large spacing
xl: 24px  // Extra large spacing
xxl: 32px // Extra extra large spacing
```

## Border Radius

Consistent radius system for different component types:

```typescript
card: 24px   // Cards and major containers
btn: 22px    // Buttons
chip: 18px   // Chips and tags
input: 16px  // Form inputs
```

## Shadows & Elevation

Subtle, iOS-style shadows using the theme system:

```typescript
card: {
  shadowColor: '#000',
  shadowOpacity: 0.08, // Light mode: subtle
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 }
}

// Dark mode uses higher opacity (0.4) for visibility
```

## Components

### Button
- **Height**: 52pt (meets accessibility requirements)
- **Variants**: Primary (accent), Secondary (surface), Danger
- **States**: Default, Pressed (darker accent)
- **Typography**: 17pt, semibold, white text on primary

### Chip  
- **Padding**: 12pt horizontal, 8pt vertical
- **Typography**: 13pt, medium weight
- **States**: Default (chipBg), Selected (accent background)
- **Border**: 1pt chipBorder

### Card
- **Background**: Surface or elevated surface
- **Radius**: 24pt
- **Shadow**: Subtle card shadow from theme
- **Variants**: Surface, Elevated, with optional blur overlay

### GradientOverlay
- **Default Height**: 50-55% of container
- **Colors**: Transparent to theme.overlay
- **Purpose**: Ensures text readability over images
- **Usage**: Bottom gradients on hero images

## Motion & Animation

### Timing
- **Photo transitions**: 150-180ms fade + 8-12px parallax
- **Swipe animations**: ±6° rotation, smooth opacity transitions  
- **Superlike**: Downward swipe with bounce effect
- **Curves**: iOS-style easeOut/spring with 18 damping

### Haptic Feedback
- **Light**: Button presses, photo navigation
- **Medium**: Swipe thresholds, navigation transitions
- **Heavy**: Successful actions (like, superlike)

## Accessibility

### Contrast Requirements
- **Text on backgrounds**: Minimum 4.5:1 ratio (WCAG AA)
- **Text on images**: Guaranteed by gradient overlays
- **Interactive elements**: Clear focus states and sufficient contrast

### Touch Targets
- **Minimum size**: 44pt × 44pt for all interactive elements
- **Spacing**: Adequate spacing between adjacent touch targets
- **Feedback**: Clear pressed states and haptic responses

### Dynamic Type
- **Support**: Full Dynamic Type support, don't block scaling
- **Fallback**: Ellipsis for text that would break layout
- **Testing**: Test with largest accessibility text sizes

## Status Bar

### Light Mode
- **Style**: `dark-content` (dark text on light background)
- **Background**: Matches theme.bg

### Dark Mode  
- **Style**: `light-content` (light text on dark background)
- **Background**: Matches theme.bg

## Implementation

### Theme Usage
```typescript
import { useTheme } from '../theme';

const MyComponent = () => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.bg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.card,
    },
    text: {
      color: theme.textPrimary,
      fontSize: 17,
    },
  });
};
```

### Component Usage
```typescript
import { Button, Card, Chip, GradientOverlay } from '../ui';

// Primary button
<Button title="Book Now" variant="primary" onPress={handlePress} />

// Card with blur effect  
<Card withBlur blurIntensity={30}>
  <Text>Content</Text>
</Card>

// Image with gradient overlay
<View>
  <Image source={imageSource} />
  <GradientOverlay height="55%" />
  <Text>Overlay text</Text>
</View>
```

## Development Guidelines

### File Structure
```
src/
  theme/
    tokens.ts     # Color and spacing tokens
    index.ts      # Theme hook and exports
  ui/
    Button.tsx    # Reusable button component
    Card.tsx      # Card container component  
    Chip.tsx      # Chip/tag component
    GradientOverlay.tsx # Image overlay component
    DebugBadge.tsx # Development indicator
    index.ts      # Component exports
```

### Best Practices

1. **Always use theme tokens** instead of hardcoded colors/spacing
2. **Prefer semantic color names** (textPrimary vs #000)
3. **Use consistent spacing** from the spacing scale
4. **Test in both light and dark modes** during development
5. **Ensure proper contrast** especially on image overlays
6. **Follow accessibility guidelines** for touch targets and contrast
7. **Use the component library** instead of recreating UI elements

### Quick Fixes Applied

1. **Image gradients**: 55% height bottom gradient for text readability
2. **Amadeus badge**: Smaller (11-12pt), 60% opacity, bottom-right
3. **Photo dots**: Smaller, semi-transparent (35% inactive, 100% active)
4. **CTA buttons**: Consistent accent color, clear pressed states
5. **Dev mode**: Small debug pill instead of prominent display
6. **Glass morphism**: BlurView with 30-50 intensity for auth screens

## Future Considerations

- **Animation library**: Consider adding react-native-reanimated for complex animations
- **Theme variants**: Easy to add new color schemes (Mist Grey variant available)
- **Component expansion**: Add more specialized components as needed
- **Performance**: Monitor blur effect performance on older devices
- **Localization**: Ensure text scaling works with different languages

---

*This design system ensures a cohesive, accessible, and premium user experience across the entire Glintz application while maintaining development efficiency and consistency.* 