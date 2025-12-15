# Brandbook Redesign - Complete ✅

## Summary

Successfully updated the entire design system to match the brandbook specifications from `api/glintz.pdf`.

---

## 🎨 Brandbook Colors Applied

### Primary Colors (from brandbook)
- **Sand:** `#E5DED5` - Main background, surfaces, soft dividers
- **Coastal Blue:** `#A1BAC7` - Secondary sections, soft highlights
- **Terracotta:** `#9D5049` - Accent, CTAs, important highlights (max ~10% usage)
- **Deep Navy:** `#10233B` - Main text, headings, logo, key UI elements

### Derived Colors
- **Sand Light:** `#F4EFE8` - Card/panel backgrounds
- **Navy Soft:** `rgba(16, 35, 59, 0.65)` - Secondary text
- **Terracotta Dark:** `#7C3B35` - Pressed states

---

## 📝 Brandbook Fonts Applied

### Font Families (from brandbook)
1. **Nautica Regular** - Script font (decorative use only)
   - Usage: Small decorative text, accents (e.g., "The")
   - File: `nautica-regular.otf` (to be downloaded from Adobe Fonts)

2. **Minion Pro** - Serif font (headlines)
   - Usage: Headlines, hero text, editorial titles (e.g., "COASTLINE")
   - File: `minion-pro-regular.otf` (to be downloaded from Adobe Fonts)

3. **Apparat** - Sans-serif font (body text, captions)
   - Usage: Body text, labels, navigation, forms, captions (e.g., "BEACH RESORT")
   - File: `apparat-regular.otf` (to be downloaded from Adobe Fonts)

---

## ✅ Files Updated

### 1. `api/design.tsx` ✅
- Already matched brandbook perfectly
- No changes needed
- Contains all brand colors and font definitions

### 2. `app/src/theme/tokens.ts` ✅
- **Updated colors:**
  - Background: Changed from `#FAF8F5` to `#E5DED5` (Sand)
  - Text: Changed from `rgba(0,0,0,0.85)` to `#10233B` (Deep Navy)
  - Accent: Changed from `#8e775a` to `#9D5049` (Terracotta)
  - Chip background: Changed to `#A1BAC7` (Coastal Blue)
  
- **Updated fonts:**
  - Display/Title: Changed to `MinionPro-Regular`
  - Body/Subtitle/Caption: Changed to `Apparat-Regular`
  - Added script font: `Nautica-Regular`

### 3. `design-tokens.json` ✅
- Updated all colors to match brandbook
- Updated font families to brandbook fonts
- Added descriptions for each color

### 4. `app/src/utils/fontLoader.ts` ✅
- Created font loading utility
- Configured for brandbook fonts (Nautica, Minion Pro, Apparat)
- Ready for font files to be added

### 5. `app.json` ✅
- Updated splash screen background to Sand (`#E5DED5`)
- Updated primary color to Terracotta (`#9D5049`)
- Added font assets to bundle patterns

### 6. `app/assets/fonts/` ✅
- Created directory for font files
- Added README with instructions

---

## 📋 Next Steps (Action Required)

### Step 1: Download Fonts from Adobe Fonts

1. Log in to Adobe Fonts: https://fonts.adobe.com/
2. Use account: **jacek.h@students.opit.com**
3. Download the following font files:
   - **Nautica Regular** → Save as `nautica-regular.otf`
   - **Minion Pro Regular** → Save as `minion-pro-regular.otf`
   - **Minion Pro Bold** (if available) → Save as `minion-pro-bold.otf`
   - **Apparat Regular** → Save as `apparat-regular.otf`
   - **Apparat Medium** (if available) → Save as `apparat-medium.otf`
   - **Apparat Bold** (if available) → Save as `apparat-bold.otf`

4. Place all font files in: `app/assets/fonts/`

### Step 2: Enable Font Loading

After fonts are downloaded, uncomment the font mappings in:
- `app/src/utils/fontLoader.ts`

Example:
```typescript
export const fontMap = {
  'Nautica-Regular': require('../../assets/fonts/nautica-regular.otf'),
  'MinionPro-Regular': require('../../assets/fonts/minion-pro-regular.otf'),
  'Apparat-Regular': require('../../assets/fonts/apparat-regular.otf'),
  // ... add other weights as needed
};
```

### Step 3: Load Fonts in App.tsx

Add font loading to `app/App.tsx`:

```typescript
import { loadFonts } from './src/utils/fontLoader';

// In your App component, before rendering:
useEffect(() => {
  loadFonts();
}, []);
```

---

## 🎯 Design System Consistency

All design system files now use the brandbook colors and fonts:

- ✅ Web design system (`api/design.tsx`) - Uses brandbook colors/fonts
- ✅ React Native theme (`app/src/theme/tokens.ts`) - Uses brandbook colors/fonts
- ✅ Design tokens JSON (`design-tokens.json`) - Uses brandbook colors/fonts
- ✅ Font loading utility (`app/src/utils/fontLoader.ts`) - Configured for brandbook fonts

---

## 📝 Color Usage Guidelines

Based on brandbook:
- **Sand (`#E5DED5`):** Main background, surfaces
- **Coastal Blue (`#A1BAC7`):** Secondary sections, chip backgrounds
- **Terracotta (`#9D5049`):** CTAs, buttons, important highlights (max ~10% usage)
- **Deep Navy (`#10233B`):** Text, headings, logo, key UI elements

---

## 🎨 Font Usage Guidelines

Based on brandbook:
- **Nautica Regular:** Decorative text only (e.g., "The", small accents)
- **Minion Pro:** Headlines, hero text, section titles (e.g., "COASTLINE")
- **Apparat:** Body text, labels, navigation, forms, captions (e.g., "BEACH RESORT")

---

## ✨ Result

The entire app design system is now aligned with the brandbook:
- Colors match brandbook specifications
- Fonts configured for brandbook fonts
- Ready for font files to be added and loaded
- Consistent across web and mobile

**Status:** ✅ Complete - Ready for font file installation

