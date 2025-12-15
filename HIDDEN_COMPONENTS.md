# Hidden Components - Temporary Fix

## Components Currently Hidden

### 1. MonogramGlow (SVG-based component)
**File**: `app/src/components/MonogramGlow.tsx`  
**Uses**: `react-native-svg`  
**Problem**: "Cannot read property 'S' of undefined" error  
**Current Status**: ✅ **HIDDEN** - Replaced with `SimpleMonogram`

**Replacement** (in `App.tsx`):
```typescript
const SimpleMonogram = ({ letter, size, style }: any) => (
  <View style={[{ 
    width: size, 
    height: size, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(253, 186, 116, 0.1)',
    borderRadius: 12,
  }, style]}>
    <Text style={{ 
      fontSize: size * 0.6, 
      fontWeight: '700', 
      color: '#FDBA74',
      letterSpacing: -2,
    }}>{letter}</Text>
  </View>
);
```

**Used in**:
- `App.tsx` - LoadingScreen component

## Other Potentially Problematic Components

These components use native modules but haven't been hidden yet:

### 2. SwipeDeck
**File**: `app/src/components/SwipeDeck.tsx`  
**Uses**: `react-native-gesture-handler`, `react-native-reanimated`  
**Status**: ⏳ **ACTIVE** - Monitor for issues

### 3. HotelMapView  
**File**: `app/src/components/HotelMapView.tsx`  
**Uses**: `react-native-maps`, `expo-maps`  
**Status**: ⏳ **ACTIVE** - Monitor for issues

### 4. HotelCard
**File**: `app/src/components/HotelCard.tsx`  
**Uses**: `expo-linear-gradient`, `expo-blur`  
**Status**: ⏳ **ACTIVE** - Monitor for issues

## How to Restore MonogramGlow

When the SVG issue is fixed, restore it:

### Step 1: In `App.tsx`, remove SimpleMonogram
```typescript
// DELETE THIS:
const SimpleMonogram = ({ letter, size, style }: any) => (
  <View style={[{ 
    width: size, 
    height: size, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(253, 186, 116, 0.1)',
    borderRadius: 12,
  }, style]}>
    <Text style={{ 
      fontSize: size * 0.6, 
      fontWeight: '700', 
      color: '#FDBA74',
      letterSpacing: -2,
    }}>{letter}</Text>
  </View>
);
```

### Step 2: In `App.tsx`, restore MonogramGlow usage
```typescript
// CHANGE FROM:
<SimpleMonogram 
  letter="G" 
  size={160}
/>

// BACK TO:
<MonogramGlow 
  letter="G" 
  size={160} 
  tone="light"
/>
```

## Testing Strategy

1. ✅ **First**: Test with SimpleMonogram (no SVG)
2. ⏭️ **Next**: If app works, test each native module component:
   - AuthScreen (basic functionality)
   - HomeScreen with SwipeDeck
   - DetailsScreen with maps
   - SavedScreen with grids

3. 🔧 **Finally**: Once all working, restore MonogramGlow

## Expected Result

With SimpleMonogram replacing MonogramGlow:
- ✅ App should load without "Cannot read property 'S'" error
- ✅ Loading screen shows simple "G" text instead of animated glow
- ✅ All other functionality intact
- ✅ Authentication should work
- ✅ Navigation should work

## If Errors Persist

If you still see errors after hiding MonogramGlow, the problem is NOT SVG. Check:

1. **Reanimated**: The version mismatch warning
2. **Store/Zustand**: Module initialization
3. **React Navigation**: Stack navigator issues
4. **Other imports**: Check for circular dependencies

## Quick Reference

**Hide a component**:
1. Create a simple replacement using only React Native primitives (View, Text, etc.)
2. Replace usage throughout the app
3. Keep original component file intact (just don't import it)
4. Document in this file

**Restore a component**:
1. Remove the replacement
2. Restore the original import and usage
3. Test thoroughly
4. Update this file

---

**Status**: MonogramGlow hidden, testing in progress...  
**Last Updated**: $(date)


