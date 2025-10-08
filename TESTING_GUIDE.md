# Testing Guide: Photo Sources & Location Display

## 🎯 Quick Start

The fixes are now implemented! Here's how to test them:

---

## Option 1: Test with Current Data (Immediate)

### What Will Work:
✅ Photo source detection from URL patterns  
✅ Address display for NEW hotels (after next seed)  
✅ Graceful fallback to "City, Country" for hotels without addresses

### Steps:
1. **Restart your backend server:**
   ```bash
   cd api
   npm start
   # or
   npm run dev
   ```

2. **Restart your app:**
   ```bash
   cd app
   npm start
   # or expo start
   ```

3. **View Hotels:**
   - Open the app
   - Swipe through hotel cards
   - Check if photo source tags show correct sources
   - Location should show "City, Country" (existing hotels don't have full addresses yet)

---

## Option 2: Test with Fresh Data (Recommended)

This will give you the full experience with addresses and proper photo metadata.

### Steps:

1. **Add address column to database:**
   
   Go to your Supabase dashboard → SQL Editor and run:
   ```sql
   ALTER TABLE hotels ADD COLUMN IF NOT EXISTS address TEXT;
   ```

2. **Clear existing hotels:**
   ```bash
   # Using curl:
   curl -X DELETE http://localhost:3000/api/hotels/clear
   
   # Or using your API client/Postman
   DELETE http://localhost:3000/api/hotels/clear
   ```

3. **Re-seed hotels with new data:**
   ```bash
   # Using curl:
   curl -X POST http://localhost:3000/api/seed
   
   # Or using your API client/Postman
   POST http://localhost:3000/api/seed
   ```
   
   ⏱️ This will take several minutes as it fetches data from Amadeus and Google Places APIs

4. **Restart backend and app** (if not already running)

5. **Test the app:**
   - View hotel cards → should see full street addresses
   - Check photo source tags in dev mode → should see "Google Places", "Unsplash", etc.
   - Tap into Details screen → should see full address
   - Tap "Get Directions" → should open map with precise location

---

## 🔍 What to Look For

### Photo Source Tags (Dev Mode Only)

In development mode, you should see colored tags on photos:

| Source | Color | Icon | Example |
|--------|-------|------|---------|
| Google Places | Blue (#4285F4) | 📸 | Most hotel photos |
| Unsplash | Black (#000000) | 🎨 | Fallback photos |
| SerpAPI | Orange (#FF6B35) | 🔍 | Alternative source |
| Pexels | Green | 📷 | Alternative source |
| Pixabay | - | 🖼️ | Alternative source |

### Location Display

**On Hotel Cards:**
```
Old: Paris, France
New: 123 Rue de Rivoli, Paris, 75001, France
```

**On Details Screen:**
```
Old: Paris, France
New: 123 Rue de Rivoli, Paris, 75001, France
```

If no address is available (old data or API doesn't provide it):
```
Fallback: Paris, France
```

### Map View
- Should show precise hotel location
- "Get Directions" should work correctly
- Address in map marker should match displayed address

---

## 🐛 Troubleshooting

### Issue: Still seeing "Unknown" for photo sources

**Possible causes:**
1. Photos are plain URL strings without metadata
2. URL doesn't match known patterns

**Check:**
- Look at browser console (web) or React Native debugger
- Should see photo URLs being processed
- If URLs contain `maps.googleapis.com` but still show "Unknown", there's a parsing issue

**Fix:**
- Re-seed hotels to get fresh data with proper metadata

---

### Issue: Still seeing only "City, Country"

**Possible causes:**
1. Using old hotel data without addresses
2. Database column not added
3. APIs not providing address data

**Check:**
1. Verify database has `address` column:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'hotels';
   ```
   Should include `address` in the list

2. Check API response:
   ```bash
   curl http://localhost:3000/api/hotels | jq '.[0]'
   ```
   Look for `"address"` field in JSON

**Fix:**
- Add database column (see Option 2, Step 1 above)
- Re-seed hotels

---

### Issue: Map not working

**This fix didn't change map functionality!**

The map was already working because `coords` field existed. If map isn't working:
- Check that Google Maps API key is configured
- Verify `coords` field has valid lat/lng values
- Check console for Google Maps errors

---

## 📊 Expected API Response Format

After fixes, hotel data should look like this:

```json
{
  "id": "HOTEL123",
  "name": "Le Grand Hotel",
  "city": "Paris",
  "country": "France",
  "address": "123 Rue de Rivoli, Paris, 75001, France",
  "coords": {
    "lat": 48.8606,
    "lng": 2.3376
  },
  "photos": [
    "{\"url\":\"https://maps.googleapis.com/maps/api/place/photo?...\",\"source\":\"google_places\"}",
    "https://images.unsplash.com/photo-..."
  ],
  "heroPhoto": "{\"url\":\"https://maps.googleapis.com/maps/api/place/photo?...\",\"source\":\"google_places\"}",
  "price": {
    "amount": "250.00",
    "currency": "EUR"
  },
  "description": "...",
  "amenityTags": ["pool", "spa", "wifi"],
  "bookingUrl": "https://booking.com/...",
  "rating": 4.5
}
```

**Key points:**
- `address` field is present
- Some `photos` are JSON strings with metadata
- Some `photos` are plain URLs (will use pattern detection)

---

## 🎨 Dev Mode Photo Source Tags

To enable photo source tags in development:

**File: `app/src/components/HotelCard.tsx`**

The tags are controlled by the `isDevelopment` prop:

```typescript
<HotelCard 
  hotel={hotel} 
  isDevelopment={true}  // Set to true to see source tags
/>
```

Or check how it's currently configured in your `SwipeDeck` or `HomeScreen`.

---

## ✅ Success Criteria

After testing, you should see:

- [ ] Photo source tags show "Google Places" for maps.googleapis.com URLs
- [ ] Photo source tags show "Unsplash" for unsplash.com URLs  
- [ ] Photo source tags show appropriate names for other sources
- [ ] Hotel cards display full street addresses (or "City, Country" fallback)
- [ ] Details screen displays full street addresses (or "City, Country" fallback)
- [ ] Map view works correctly
- [ ] "Get Directions" opens with correct location
- [ ] No console errors related to photo parsing
- [ ] No missing data or undefined values in UI

---

## 🚀 Performance Notes

These changes should have **no negative performance impact:**

- Photo source detection is client-side (instant)
- Address is just another string field (no extra queries)
- Photo metadata parsing is minimal (simple JSON.parse)
- Fallbacks ensure app works even with incomplete data

---

## 📞 Need Help?

If something isn't working:

1. Check browser console / React Native debugger for errors
2. Verify API response includes expected fields
3. Confirm database schema was updated
4. Try re-seeding data
5. Check that all changes were saved and server was restarted

---

**Happy Testing! 🎉**
