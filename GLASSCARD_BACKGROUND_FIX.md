# GlassCard Background Fix

## Issue
The glass card (login component) was showing with a transparent/glass background instead of the solid Sand color from the brandbook.

## What was changed

### `app/src/components/GlassCard.tsx`

**Before:**
```typescript
backgroundColor: theme.glassBg, // 'rgba(229, 222, 213, 0.85)' - transparent
```

**After:**
```typescript
backgroundColor: '#E5DED5', // Sand color from brandbook (solid, not transparent)
```

## Result
The login component now has a solid sand background matching the brandbook color `#E5DED5`.

---

**Reload the app** to see the solid sand background on the login component.

