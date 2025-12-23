# 🚀 Giata Partners API - Quick Start Guide

## Overview

This guide will help you connect to the **Giata Partners API** (second database) and start fetching hotel data with photos from Cloudflare R2.

## Prerequisites

- Node.js installed
- API credentials from Giata Partners system
- Access to the CRM API

## 🔧 Step 1: Configure Environment Variables

1. Copy the environment example file (if you don't have a `.env` file):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Giata API credentials:
   ```bash
   # Giata Partners API (Second CRM Database)
   GIATA_API_BASE_URL=https://your-giata-domain.com
   GIATA_API_KEY=your-actual-api-key-here
   ```

   **Important:** Replace with your actual values:
   - `GIATA_API_BASE_URL`: The base URL of your Giata Partners API
   - `GIATA_API_KEY`: Your API key for authentication

## 🧪 Step 2: Test the Connection

Run the automated test suite to verify everything is working:

```bash
cd api
npm run test:giata
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║  GIATA PARTNERS API CONNECTION TEST (Second Database)       ║
╚══════════════════════════════════════════════════════════════╝

✅ PASS: API URL configured
✅ PASS: Successfully connected to Giata Partners API
✅ PASS: Retrieved 10 partners
✅ PASS: Retrieved partner statistics
✅ PASS: Retrieved 15 photos

🎉 All tests passed! Giata Partners API is working correctly.
```

## 🚀 Step 3: Start the Server

Start the development server:

```bash
cd api
npm run dev
```

The server will automatically:
- Initialize the Giata Partners API client
- Test the connection on startup
- Log the connection status

**Look for this in the logs:**
```
✅ Giata Partners API initialized successfully
   Base URL: https://your-giata-domain.com
```

## 📡 Step 4: Test the API Endpoints

### Test 1: Check API Connection

```bash
curl http://localhost:3001/api/giata-partners/test
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Giata Partners API",
  "details": {
    "api_key_provided": true,
    "api_key_valid": true
  }
}
```

### Test 2: Fetch Approved Partners

```bash
curl "http://localhost:3001/api/giata-partners?partner_status=approved&per_page=10"
```

**Expected Response:**
```json
{
  "success": true,
  "partners": [
    {
      "partner_id": "uuid-here",
      "giata_id": 12345,
      "partner_status": "approved",
      "hotel_name": "Grand Hotel Athens",
      "country_name": "Greece",
      "city_name": "Athens",
      "selected_photo_count": 10
    }
    // ... more partners
  ],
  "total": 150,
  "page": 1,
  "per_page": 10,
  "total_pages": 15
}
```

### Test 3: Fetch Hotel Photos

```bash
curl "http://localhost:3001/api/giata/12345/photos/selected"
```

**Expected Response:**
```json
{
  "giata_id": 12345,
  "photos": [
    {
      "id": "photo-uuid",
      "cloudflare_public_url": "https://presigned-url.com/photo.jpg",
      "is_hero": true,
      "display_order": 0
    }
    // ... more photos
  ],
  "count": 10
}
```

### Test 4: Fetch Statistics

```bash
curl http://localhost:3001/api/giata-partners/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "by_status": {
      "approved": 120,
      "candidate": 20,
      "rejected": 5,
      "archived": 5
    },
    "by_country": [
      ["Greece", 45],
      ["Italy", 30]
    ]
  }
}
```

### Test 5: Fetch Unified Hotels (Both Databases)

```bash
curl "http://localhost:3001/api/hotels/unified?limit=20&source=all"
```

**Expected Response:**
```json
{
  "hotels": [
    // Hotels from both Supabase and Giata
  ],
  "total": 20,
  "hasMore": true,
  "sources": {
    "supabase": 10,
    "giata": 10
  }
}
```

## 🔍 Troubleshooting

### Problem: "Environment variables not set"

**Solution:** Make sure you've added the credentials to your `.env` file:
```bash
GIATA_API_BASE_URL=https://your-domain.com
GIATA_API_KEY=your-key-here
```

### Problem: "Connection failed: 401 Unauthorized"

**Solution:** Check that your API key is correct and valid.

### Problem: "Connection failed: Network error"

**Solution:** 
- Verify the API base URL is correct
- Check your internet connection
- Ensure the Giata API server is running

### Problem: "No partners with photos found"

**Solution:** This is normal if the database doesn't have approved partners with photos yet. The test will skip this check.

## 📚 Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/giata-partners` | GET | List all partners with filtering |
| `/api/giata-partners/:id` | GET | Get single partner details |
| `/api/giata/:giataId/photos/selected` | GET | Get hotel photos from Cloudflare |
| `/api/giata-partners/stats` | GET | Get partner statistics |
| `/api/giata-partners/test` | GET | Test API connection |
| `/api/hotels/unified` | GET | Get hotels from both databases |

## 🎯 Next Steps

Once the connection is working:

1. **Integrate with your mobile app** - Use the unified endpoint to fetch hotels
2. **Set up photo caching** - Photos are cached for 50 minutes automatically
3. **Monitor API usage** - Check logs for any errors or issues
4. **Add more filters** - Extend the API with custom filters as needed

## 💡 Tips

- **Photo URLs expire after 1 hour** - The system automatically refreshes them
- **Use pagination** - Don't fetch all partners at once, use `per_page` parameter
- **Cache responses** - The server caches photo URLs for better performance
- **Check logs** - Server logs show detailed information about API calls

## 📖 Documentation

For complete API documentation, see:
- `giatapartners.md` - Complete API reference from the CRM provider
- `GIATA_INTEGRATION_REPORT.md` - Technical integration details

## ✅ Success Checklist

- [ ] Environment variables configured
- [ ] Test suite passes (`npm run test:giata`)
- [ ] Server starts without errors
- [ ] Can fetch partners list
- [ ] Can fetch hotel photos
- [ ] Unified endpoint returns data from both databases

---

**Need Help?**
- Check the server logs for detailed error messages
- Review the test output for specific failure points
- Ensure your API credentials are correct

**Happy coding! 🎉**

