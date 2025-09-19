# 💾 Supabase Setup for TinderTravel Hotels

## 🎯 Goal
Save your **60 hotels with beautiful photos** to Supabase database for persistent storage and fast retrieval.

## ✅ Current Status
- ✅ **Hotels Generated**: 60 hotels with 3 beautiful photos each
- ✅ **Supabase Code**: Complete database integration ready
- ✅ **Photo System**: Working with curated Unsplash images
- ⏳ **Credentials Needed**: Supabase URL and API key

## 🔧 Setup Steps

### 1. Get Supabase Credentials

1. **Go to**: https://supabase.com/dashboard
2. **Sign in** or create account
3. **Create new project** or select existing
4. **Go to**: Settings → API
5. **Copy these values**:
   - `Project URL` (looks like: `https://abcdefgh.supabase.co`)
   - `anon public` key (long string starting with `eyJ...`)

### 2. Add to Environment File

Add to your `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Database Tables

In your Supabase dashboard, go to **SQL Editor** and run:

```sql
-- Hotels table with photos
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

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  country_affinity JSONB DEFAULT '{}',
  amenity_affinity JSONB DEFAULT '{}',
  seen_hotels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_country ON hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels(created_at);
```

## 🚀 Test the Connection

Once you have credentials, test with:

```bash
# In your API directory
npm run seed-supabase
```

This will:
1. ✅ Connect to your Supabase database
2. ✅ Create tables if needed
3. ✅ Save all 60 hotels with beautiful photos
4. ✅ Verify the data was saved correctly

## 📸 What Gets Saved

Each hotel will have:
- **3 beautiful photos** (curated Unsplash images)
- **Hotel details** (name, location, price, rating)
- **Amenities** (WiFi, Pool, Spa, etc.)
- **Booking information**

### Sample Hotel Data:
```json
{
  "id": "hotel_123",
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

## 🎉 Benefits

Once saved to Supabase:
- ✅ **Persistent storage** - Hotels won't disappear on restart
- ✅ **Fast queries** - Optimized database indexes
- ✅ **User preferences** - Track what users like/dislike
- ✅ **Scalable** - Handle thousands of users
- ✅ **Real-time** - Instant updates across devices

## 🔗 Next Steps

1. **Get Supabase credentials** (5 minutes)
2. **Add to .env file** (1 minute)
3. **Run the seed command** (2 minutes)
4. **Test your iOS app** with persistent data! 🎉

Your TinderTravel app will then have beautiful, persistent hotel data ready for production! 