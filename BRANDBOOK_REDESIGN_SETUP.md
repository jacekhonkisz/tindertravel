# Brandbook Redesign Setup Guide

## ✅ What's Been Set Up

1. **Font Loading Structure**
   - Created `app/assets/fonts/` directory for font files
   - Created `app/src/utils/fontLoader.ts` utility for loading fonts
   - Added README in fonts directory with instructions

2. **Template Files**
   - Created `NEW_BRANDBOOK_TEMPLATE.md` for you to fill in brandbook details

## 📋 Next Steps

### Step 1: Download Fonts from Adobe Fonts

1. Log in to Adobe Fonts: https://fonts.adobe.com/
2. Use account: **jacek.h@students.opit.com**
3. Download the required font files (.otf or .ttf format)
4. Place them in: `app/assets/fonts/`

### Step 2: Provide New Brandbook Details

Please fill in the `NEW_BRANDBOOK_TEMPLATE.md` file with:
- New brand colors (hex codes)
- New font families (names and file names)
- Typography scale (sizes, line heights, weights)
- Any other design tokens

**OR** provide the brandbook document/PDF and I can extract the information.

### Step 3: Update Design System Files

Once you provide the brandbook details, I will update:
- ✅ `api/design.tsx` - Web/React design system
- ✅ `app/src/theme/tokens.ts` - React Native theme tokens
- ✅ `design-tokens.json` - Design tokens JSON
- ✅ `app/src/utils/fontLoader.ts` - Font loading configuration
- ✅ `app.json` - Expo font configuration

### Step 4: Install Font Loading Package (if needed)

```bash
cd app
npx expo install expo-font
```

## 🎨 Current Design System (for reference)

### Current Colors (from api/design.tsx):
- Sand: `#E5DED5`
- Coastal Blue: `#A1BAC7`
- Terracotta: `#9D5049`
- Deep Navy: `#10233B`

### Current Fonts:
- Nautica Regular (script)
- Minion Pro (serif)
- Apparat (sans-serif)

## 📝 Files That Will Be Updated

1. **api/design.tsx** - Central design system for web
2. **app/src/theme/tokens.ts** - React Native theme
3. **design-tokens.json** - Design tokens JSON
4. **app/src/utils/fontLoader.ts** - Font loading
5. **app.json** - Expo configuration (if needed)

## 🚀 Ready to Proceed

Once you provide the new brandbook details, I'll:
1. Update all design system files
2. Configure font loading
3. Ensure consistency across web and mobile
4. Test that everything works together

---

**Please provide the new brandbook details so I can proceed with the redesign!**

