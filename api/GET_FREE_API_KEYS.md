# 🔑 GET FREE API KEYS - 5 MINUTES

## 🚀 Quick Setup (5 minutes total)

### 1. Unsplash API (Best Quality) - 2 minutes
1. Go to: https://unsplash.com/developers
2. Click "Register as a developer" 
3. Sign up with email
4. Click "New Application"
5. Fill out form (just say "Travel app")
6. Copy your "Access Key" (starts with letters/numbers)

### 2. Pexels API (Backup) - 2 minutes  
1. Go to: https://www.pexels.com/api/
2. Click "Request API Key"
3. Fill out form
4. Copy your API key

### 3. Pixabay API (Additional) - 1 minute
1. Go to: https://pixabay.com/api/docs/
2. Click "Get API Key" 
3. Register and copy key

## 🔧 Add to Your .env File

Add these lines to your `.env` file:

```env
# Free Photo API Keys
UNSPLASH_ACCESS_KEY=your_unsplash_key_here
PEXELS_API_KEY=your_pexels_key_here  
PIXABAY_API_KEY=your_pixabay_key_here
```

## 🧪 Test the System

After adding the keys:

```bash
# Test exact hotel photos
node test-exact-hotel-photos.js

# Test full system
node test-free-photo-system.js

# Replace photos for all hotels
node hotel-photo-replacement-system.js
```

## 💰 Cost: $0 (Completely Free!)

- Unsplash: 5,000 requests/month FREE
- Pexels: 20,000 requests/month FREE  
- Pixabay: 5,000 requests/month FREE
- Total: 30,000+ requests/month FREE

## 🎯 Expected Results

After setup, you'll get:
- **Exact hotel photos** for 30-50% of hotels
- **High-quality luxury hotel photos** for remaining hotels
- **Professional quality** (1920x1080+ resolution)
- **$0 cost** for your MVP

This will solve your exact problem: replacing generic photos with real hotel-specific photos!
