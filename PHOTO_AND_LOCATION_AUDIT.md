# Photo Source & Location Display Audit Report

## Executive Summary

**Date:** October 7, 2025  
**Issue 1:** Only Unsplash source tags visible, Google Places photos not properly identified  
**Issue 2:** Location/address data not displayed despite being available from APIs

---

## 🔍 Issue #1: Photo Source Detection Problems

### Current State
- You're seeing "Unsplash" source tags for ALL photos
- Google Places photos are NOT being properly identified

### Root Causes

#### Problem 1A: Photo Metadata Lost During Storage
**Location:** `api/src/index.ts` line 992-1021

The `parsePhotoUrls()` function extracts ONLY the URL string from photo objects:

```typescript
const parsePhotoUrls = (photos: any[]): string[] => {
  return photos.map(photo => {
    if (typeof photo === 'string' && photo.startsWith('{')) {
      const parsed = JSON.parse(photo);
      return parsed.url || '';  // ⚠️ SOURCE METADATA LOST HERE
    }
    if (typeof photo === 'object' && photo.url) {
      return photo.url;  // ⚠️ SOURCE METADATA LOST HERE
    }
    return photo;
  });
};
```

**Impact:** When photos are stored as `{url: "...", source: "google_places"}`, the source field is discarded.

#### Problem 1B: Frontend Detection Relies on URL Patterns
**Location:** `app/src/utils/photoUtils.ts` line 28-55

The frontend tries to detect source from URL patterns:

```typescript
export const getPhotoSource = (photo: any): string => {
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';  // ✅ Should work
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';  // ✅ Works
    }
  }
  return 'Unknown';
};
```

**Analysis:** This SHOULD work for Google Places photos IF the URLs contain `maps.googleapis.com`.

#### Problem 1C: Database Schema Issue
**Location:** `api/src/database.ts` line 246-248

Database stores photos as TEXT array:
```sql
photos TEXT[],
```

**Issue:** Photos are being stored as simple strings, not JSON objects with metadata.

### Where Are Google Photos Actually Coming From?

#### Source 1: Google Places Client
**Location:** `api/src/google-places.ts` line 228-276

```typescript
async getHotelDetails(placeId: string): Promise<GooglePlacesHotel | null> {
  const hotel: GooglePlacesHotel = {
    photos: (result.photos || []).map((photo: any) => ({
      url: this.generatePhotoUrl(photo.photo_reference, 'ultra'),
      width: this.getPhotoWidth('ultra'),
      height: this.getPhotoHeight('ultra'),
      photoReference: photo.photo_reference
    })),
  };
}
```

These photos SHOULD have URLs like:
```
https://maps.googleapis.com/maps/api/place/photo?maxwidth=2048&photoreference=...&key=...
```

#### Source 2: Global Hotel Fetcher
**Location:** `api/src/global-hotel-fetcher.ts` line 440-492

```typescript
private async fetchAndValidatePhotos(hotels: any[], city: string, countryCode: string) {
  const googleHotel = googleHotels[0];
  const photoUrls = googleHotel.photos.slice(0, 8);  // Google Places photos
  
  const updatedHotel = {
    photos: photoUrls,
    heroPhoto: photoUrls[0]
  };
}
```

**Critical Finding:** Photos are stored as photo OBJECTS with metadata, but then converted to strings!

---

## 🗺️ Issue #2: Location/Address Not Displayed

### Current State
- Frontend shows: `{hotel.city}, {hotel.country}` 
- No detailed address visible
- Google Places API DOES provide `formatted_address`
- But it's NEVER stored or displayed

### Root Causes

#### Problem 2A: Missing Address Field in Database Schema
**Location:** `api/src/types.ts` line 60-79

```typescript
export interface HotelCard {
  id: string;
  name: string;
  city: string;
  country: string;
  coords?: { lat: number; lng: number; };
  // ⚠️ NO ADDRESS FIELD!
  price?: { amount: string; currency: string; };
  description: string;
  amenityTags: string[];
  photos: string[];
  heroPhoto: string;
  bookingUrl?: string;
  rating?: number;
}
```

#### Problem 2B: Address Available But Not Stored
**Location:** `api/src/google-places.ts` line 228-276

Google Places API returns:
```typescript
const hotel: GooglePlacesHotel = {
  id: placeId,
  name: result.name,
  address: result.formatted_address,  // ✅ AVAILABLE HERE
  rating: result.rating,
  photos: [...],
  location: result.geometry.location
};
```

But when stored in database, `address` is IGNORED!

#### Problem 2C: Amadeus Also Provides Address
**Location:** `api/src/types.ts` line 51-56

```typescript
export interface AmadeusHotelContent {
  address?: {
    lines: string[];
    postalCode?: string;
    cityName?: string;
    countryCode?: string;
  };
}
```

This is also NEVER extracted or stored!

#### Problem 2D: Frontend Doesn't Display Address
**Location:** `app/src/components/HotelCard.tsx` line 218-220

```typescript
<Text style={styles.location}>
  {hotel.city}, {hotel.country}
</Text>
```

Even if address were available, it's not being displayed!

---

## 📊 Data Flow Analysis

### Current Flow (BROKEN):
```
Google Places API
  ↓
  photos: [{url: "maps.googleapis.com/...", source: "google_places"}]
  address: "123 Main St, City, Country"
  ↓
Database Storage (parsePhotoUrls strips metadata)
  ↓
  photos: ["maps.googleapis.com/..."]  ← SOURCE LOST
  (address not stored at all)
  ↓
Frontend Display
  ↓
  getPhotoSource() tries to detect from URL pattern
  ↓
  Shows "Unsplash" if detection fails
  Shows only: "City, Country" (no address)
```

### What SHOULD Happen:
```
Google Places API
  ↓
  photos: [{url: "...", source: "google_places"}]
  address: "123 Main St, City, Country"
  ↓
Database Storage (PRESERVE METADATA)
  ↓
  photos: [{"url": "...", "source": "google_places"}]
  address: "123 Main St, City, Country"
  ↓
Frontend Display
  ↓
  Reads source directly from photo object
  Displays full address below hotel name
```

---

## 🔧 Required Fixes

### Fix 1: Update Database Schema
Add `address` field to hotels table:
```sql
ALTER TABLE hotels ADD COLUMN address TEXT;
```

Update TypeScript types:
```typescript
export interface HotelCard {
  // ... existing fields
  address?: string;  // NEW
  coords?: { lat: number; lng: number; };
}
```

### Fix 2: Store Photo Metadata Properly
Option A: Store as JSONB array (RECOMMENDED)
```sql
ALTER TABLE hotels ALTER COLUMN photos TYPE JSONB USING photos::jsonb;
```

Option B: Keep as TEXT[] but store JSON strings (SIMPLER)
```typescript
photos: hotel.photos.map(p => JSON.stringify(p))
```

### Fix 3: Update Photo Parsing
Remove the metadata-stripping behavior:
```typescript
const parsePhotoUrls = (photos: any[]): Array<{url: string, source?: string}> => {
  return photos.map(photo => {
    if (typeof photo === 'string' && photo.startsWith('{')) {
      return JSON.parse(photo);  // PRESERVE ALL METADATA
    }
    if (typeof photo === 'object') {
      return photo;  // PRESERVE OBJECT
    }
    return { url: photo };  // Convert string to object
  });
};
```

### Fix 4: Extract and Store Address
In Amadeus client and hotel fetchers:
```typescript
const hotel = {
  // ... existing fields
  address: googleHotel.address || 
           amadeusContent.address?.lines.join(', ') ||
           `${city}, ${country}`,
};
```

### Fix 5: Display Address in Frontend
Update HotelCard component:
```typescript
<Text style={styles.location}>
  {hotel.address || `${hotel.city}, ${hotel.country}`}
</Text>
```

---

## 🎯 Verification Steps

After fixes:
1. ✅ Photo source tags should show "Google Places" for maps.googleapis.com URLs
2. ✅ Photo source tags should show correct source for all photos
3. ✅ Hotel cards should display full street address
4. ✅ Details screen should show full address
5. ✅ Map view should work with precise coordinates

---

## 📝 Notes

- Currently using Unsplash as fallback when Google Photos aren't available
- Google Places API has usage limits - monitor costs
- Photo source detection currently relies on URL patterns as fallback
- coords field EXISTS and is populated (that's why map works)
- Address field is MISSING entirely from the schema
