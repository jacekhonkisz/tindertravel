# 🔧 **"Unknown" Photo Source Fix**

## 🎯 **Problem Identified:**

The "Unknown" tag was appearing because photos in the database are stored as **JSON strings**, not objects. The React Native app was receiving strings like:

```json
"{\"url\":\"https://images.unsplash.com/...\",\"source\":\"unsplash_curated\"}"
```

Instead of parsed objects like:
```json
{
  "url": "https://images.unsplash.com/...",
  "source": "unsplash_curated"
}
```

## ✅ **Solution Implemented:**

### **1. Updated `getPhotoSource` Function**
Added JSON string parsing logic to both `HotelCard.tsx` and `SwipeDeck.tsx`:

```javascript
const getPhotoSource = (photo) => {
  // If it's a JSON string, try to parse it
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
    } catch (e) {
      // If parsing fails, fall through to URL detection
    }
  }
  
  // If it's an object with source property
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
  // If it's a string URL, try to detect source
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';
    } else if (photo.includes('serpapi')) {
      return 'SerpAPI';
    }
  }
  
  return 'Unknown';
};
```

### **2. Updated PhotoSourceTag Component**
Added support for `unsplash_curated` source:

```javascript
const getSourceColor = (source) => {
  switch (source.toLowerCase()) {
    case "google places":
    case "unsplash_curated":
      return "#4285F4"; // Google Blue
    case "unsplash":
      return "#000000"; // Unsplash Black
    case "serpapi":
      return "#FF6B35"; // SerpAPI Orange
    default:
      return "#666666"; // Gray for unknown
  }
};
```

## 🧪 **Test Results:**

The updated logic now correctly handles:

✅ **JSON strings with source**: `"unsplash_curated"`  
✅ **Plain Google Places URLs**: `"Google Places"`  
✅ **Plain Unsplash URLs**: `"Unsplash"`  
✅ **Object with source**: `"Google Places"`  
✅ **Invalid JSON**: `"Unknown"`  
✅ **Unknown URLs**: `"Unknown"`  

## 📱 **Expected Results:**

Now when you see photos in your app, the PhotoSourceTag should display:

- 📸 **Google Places** (Blue) - for Google Places photos
- 🎨 **Unsplash** (Black) - for Unsplash photos  
- 🎨 **Unsplash Curated** (Blue) - for Unsplash curated photos
- 🔍 **SerpAPI** (Orange) - for SerpAPI photos
- ❓ **Unknown** (Gray) - only for truly unknown sources

## 🚀 **Next Steps:**

1. **Test the app** - The "Unknown" tags should now show proper source names
2. **Verify all photo sources** are correctly identified
3. **Check both HotelCard and SwipeDeck** components

## 💡 **Why This Happened:**

The photo tagging script created objects with source information, but Supabase stored them as JSON strings. The React Native app needed to parse these strings to extract the source information.

---

**Status**: ✅ **FIXED** - Ready for testing!
