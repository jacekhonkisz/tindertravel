# 🎯 Complete Supabase Setup for TinderTravel

## 📋 Step-by-Step Instructions

### 1. Go to Supabase SQL Editor
- Visit: https://supabase.com/dashboard/project/qlpxseihykemsblusojx/editor
- Click "SQL Editor"
- Create a "New Query"

### 2. Copy and Paste This SQL

```sql
-- TinderTravel Database Setup
-- Complete schema for hotels with beautiful photos

-- 1. Create hotels table with photos
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  coords JSONB,
  price JSONB,
  description TEXT,
  amenity_tags TEXT[],
  photos TEXT[],
  hero_photo TEXT,
  booking_url TEXT,
  rating REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  country_affinity JSONB DEFAULT '{}',
  amenity_affinity JSONB DEFAULT '{}',
  seen_hotels TEXT[] DEFAULT '{}',
  liked_hotels TEXT[] DEFAULT '{}',
  disliked_hotels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create hotel interactions table
CREATE TABLE IF NOT EXISTS hotel_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_country ON hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_interactions_user_id ON hotel_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_interactions_hotel_id ON hotel_interactions(hotel_id);

-- 5. Add constraints
ALTER TABLE hotel_interactions 
ADD CONSTRAINT check_action 
CHECK (action IN ('like', 'dislike', 'save', 'book'));

-- 6. Add foreign key constraint
ALTER TABLE hotel_interactions 
ADD CONSTRAINT fk_hotel_interactions_hotel_id 
FOREIGN KEY (hotel_id) REFERENCES hotels(id);
```

### 3. Click "Run" Button

The SQL will create all necessary tables and indexes.

## 🚀 Now Seed Your Data

### 4. Create Your .env File

Create `/Users/ala/tindertravel/api/.env` with:

```env
# Supabase Configuration
SUPABASE_URL=https://qlpxseihykemsblusojx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs

# Amadeus API (for hotel data)
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_BASE_URL=https://test.api.amadeus.com

# Hotellook API (for photos)
HOTELLOOK_TOKEN=29e012534d2df34490bcb64c40b70f8d
HOTELLOOK_MARKER=673946
```

### 5. Run the Seed Command

```bash
cd /Users/ala/tindertravel/api
npm run seed-supabase
```

## 📊 What You'll Get

### Hotels Table Structure:
- **id**: Unique hotel identifier
- **name**: Hotel name
- **city**: City location
- **country**: Country location
- **coords**: GPS coordinates (JSON)
- **price**: Price information (JSON)
- **description**: Hotel description
- **amenity_tags**: Array of amenities
- **photos**: Array of 3 beautiful photo URLs
- **hero_photo**: Main photo URL
- **booking_url**: Booking link
- **rating**: Hotel rating (1-5)

### Sample Hotel Data:
```json
{
  "id": "hotel_santorini_001",
  "name": "Luxury Santorini Resort",
  "city": "Santorini",
  "country": "Greece",
  "photos": [
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop"
  ],
  "rating": 4.8,
  "price": {"amount": 250, "currency": "EUR"}
}
```

## 🔍 Useful Queries for Your App

### Get Hotels for User (excluding seen ones):
```sql
SELECT h.* 
FROM hotels h
LEFT JOIN user_preferences up ON up.user_id = 'user123'
WHERE NOT (h.id = ANY(COALESCE(up.seen_hotels, '{}')))
ORDER BY h.rating DESC
LIMIT 20;
```

### Mark Hotel as Seen:
```sql
INSERT INTO user_preferences (user_id, seen_hotels)
VALUES ('user123', ARRAY['hotel_id'])
ON CONFLICT (user_id)
DO UPDATE SET 
  seen_hotels = array_append(user_preferences.seen_hotels, 'hotel_id'),
  updated_at = NOW();
```

### Record User Interaction:
```sql
INSERT INTO hotel_interactions (user_id, hotel_id, action)
VALUES ('user123', 'hotel_id', 'like');
```

### Get Hotel Statistics:
```sql
SELECT 
  COUNT(*) as total_hotels,
  COUNT(DISTINCT city) as cities,
  COUNT(DISTINCT country) as countries,
  AVG(rating) as avg_rating,
  SUM(array_length(photos, 1)) as total_photos
FROM hotels;
```

## 🎉 You're Ready!

After running the setup:
- ✅ **60 hotels** with 3 beautiful photos each
- ✅ **Complete database schema** for production
- ✅ **User tracking** for personalization
- ✅ **Performance indexes** for fast queries
- ✅ **Analytics capabilities** for insights

Your TinderTravel app now has persistent, beautiful hotel data! 🚀 