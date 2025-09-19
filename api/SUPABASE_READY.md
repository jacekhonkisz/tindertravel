# 🎉 Your Supabase Credentials Are Ready!

## ✅ **Credentials Confirmed:**
- **URL**: `https://qlpxseihykemsblusojx.supabase.co`
- **Key**: `eyJhbGciOiJIUzI1NiIs...` ✅

## 🚀 **Next Steps (5 minutes):**

### 1. Create the Database Table

1. **Go to**: https://supabase.com/dashboard/project/qlpxseihykemsblusojx/editor
2. **Click**: "SQL Editor" 
3. **Paste and run this SQL**:

```sql
-- Create hotels table with photos
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  coords JSONB,
  price JSONB,
  description TEXT,
  amenity_tags TEXT[],
  photos TEXT[],  -- Array of beautiful photo URLs
  hero_photo TEXT,
  booking_url TEXT,
  rating REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_country ON hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels(created_at);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  country_affinity JSONB DEFAULT '{}',
  amenity_affinity JSONB DEFAULT '{}',
  seen_hotels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. **Click**: "Run" button

### 2. Create Your .env File

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

### 3. Save Hotels to Supabase

Run this command:

```bash
npm run seed-supabase
```

This will:
- ✅ Generate 60 hotels with beautiful photos
- ✅ Save them to your Supabase database
- ✅ Verify the data was saved correctly

## 🖼️ **What You'll Get:**

Each hotel will have **3 beautiful photos**:

### Santorini Hotels:
- Greek island paradise photos
- White buildings with blue domes
- Stunning sunset views

### Rome Hotels:
- Classic Italian architecture
- Colosseum and historic buildings
- City skyline views

### Lisbon Hotels:
- Portuguese coastal charm
- Colorful buildings and trams
- Waterfront views

### Split & Dubrovnik Hotels:
- Croatian coastal beauty
- Medieval architecture
- Crystal clear waters

## 🎯 **Result:**

Your TinderTravel app will have:
- ✅ **60 hotels** with gorgeous photos
- ✅ **Persistent storage** in Supabase
- ✅ **Fast queries** for mobile app
- ✅ **Production ready** database

## 🔗 **Quick Links:**

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qlpxseihykemsblusojx
- **SQL Editor**: https://supabase.com/dashboard/project/qlpxseihykemsblusojx/editor
- **Table Editor**: https://supabase.com/dashboard/project/qlpxseihykemsblusojx/editor

**Ready to create the table and save your beautiful hotel photos? 🚀** 