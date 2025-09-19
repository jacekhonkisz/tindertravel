# Google Places API Setup Guide

## 🌟 **Why Google Places API?**

Google Places API provides **REAL, high-quality hotel photos** with:
- ✅ Actual hotel photos (not placeholders)
- ✅ Multiple photos per hotel
- ✅ Reliable Google infrastructure
- ✅ Global coverage
- ✅ Rich hotel data (ratings, addresses, etc.)

## 🚀 **Quick Setup (5 minutes)**

### Step 1: Get Google Cloud Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. **New users get $200 free credit!** 💰

### Step 2: Create Project
1. Click "Select a project" → "New Project"
2. Name it "TinderTravel" or similar
3. Click "Create"

### Step 3: Enable Places API
1. Go to "APIs & Services" → "Library"
2. Search for "Places API"
3. Click "Places API" → "Enable"

### Step 4: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (starts with `AIza...`)

### Step 5: Add to Environment
Add to your `.env` file:
```bash
GOOGLE_PLACES_API_KEY=AIzaSyC-your-actual-api-key-here
```

### Step 6: Test It!
```bash
# Restart your server
npm run dev

# Test the photo endpoint
curl "http://localhost:3001/api/photos/Lisbon"
```

## 💰 **Pricing & Usage**

### Current Pricing (2024):
- **Text Search**: $17 per 1,000 requests
- **Photo Requests**: $7 per 1,000 requests
- **Free Tier**: $200 credit per month for new accounts

### Cost Examples:
```
For 1,000 users per day:
- City photo searches: ~30 requests/day = $0.51/day = $15.30/month
- Photo loads: ~180 requests/day = $1.26/day = $37.80/month
- Total: ~$53/month for 1,000 daily users
```

### Cost Optimization:
- ✅ **Caching**: Results cached for 24 hours
- ✅ **Limits**: Max 6 photos per city
- ✅ **Efficient**: Only 1 search + photo requests per city

## 🔧 **API Endpoints**

### Get Photos for a City
```bash
GET /api/photos/:cityName?limit=6

# Examples:
curl "http://localhost:3001/api/photos/Lisbon"
curl "http://localhost:3001/api/photos/Barcelona?limit=4"
```

**Response:**
```json
{
  "city": "Lisbon",
  "photos": [
    "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=...",
    "https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=..."
  ],
  "count": 6,
  "source": "google_places"
}
```

### Get Photos for Specific Hotel
```bash
GET /api/photos/hotel/:hotelName?city=CityName&limit=6

# Example:
curl "http://localhost:3001/api/photos/hotel/Hotel%20Lisboa%20Plaza?city=Lisbon"
```

## 🔒 **Security Best Practices**

### Restrict API Key (Recommended):
1. Go to Google Cloud Console → Credentials
2. Click your API key → "Edit"
3. Under "API restrictions" → "Restrict key"
4. Select "Places API"
5. Under "Application restrictions" → "HTTP referrers"
6. Add your domains: `localhost:*`, `yourdomain.com/*`

### Environment Variables:
```bash
# .env file
GOOGLE_PLACES_API_KEY=your_api_key_here

# Never commit API keys to git!
# Add .env to .gitignore
```

## 📱 **Frontend Integration**

### React/React Native Example:
```typescript
// Get photos for a city
const getHotelPhotos = async (cityName: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photos/${cityName}`);
    const data = await response.json();
    return data.photos; // Array of photo URLs
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return [];
  }
};

// Usage in component
const [photos, setPhotos] = useState<string[]>([]);

useEffect(() => {
  getHotelPhotos('Lisbon').then(setPhotos);
}, []);

// Render photos
{photos.map((photoUrl, index) => (
  <Image key={index} source={{ uri: photoUrl }} style={styles.hotelPhoto} />
))}
```

## 🛠 **Advanced Usage**

### Custom Photo Sizes:
```typescript
// In google-places.ts, modify generatePhotoUrl:
generatePhotoUrl(photoReference: string, maxWidth: number = 800): string {
  // Available sizes: 50-1600px
  return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
}

// Usage:
const smallPhoto = client.generatePhotoUrl(photoRef, 400);  // 400px wide
const largePhoto = client.generatePhotoUrl(photoRef, 1200); // 1200px wide
```

### Hotel Details with Photos:
```typescript
// Get detailed hotel info including photos
const hotel = await googlePlacesClient.getHotelDetails(placeId);
console.log(hotel.name, hotel.rating, hotel.photos.length);
```

## 🚨 **Troubleshooting**

### Common Issues:

#### 1. "API key not configured"
```bash
# Check your .env file
cat .env | grep GOOGLE_PLACES_API_KEY

# Restart your server after adding the key
npm run dev
```

#### 2. "This API project is not authorized"
- Enable Places API in Google Cloud Console
- Wait 5-10 minutes for changes to propagate

#### 3. "REQUEST_DENIED"
- Check API key restrictions
- Ensure billing is enabled in Google Cloud

#### 4. "ZERO_RESULTS"
- Try different city names
- Check spelling and use English names

#### 5. Photos not loading
- Photo URLs expire after some time
- Always fetch fresh URLs for display

### Debug Mode:
```typescript
// Add to your .env for detailed logging
DEBUG_GOOGLE_PLACES=true
```

## 📊 **Monitoring & Analytics**

### Google Cloud Console:
1. Go to "APIs & Services" → "Dashboard"
2. View usage statistics and quotas
3. Set up billing alerts

### Usage Tracking:
```typescript
// Add usage logging in your API
console.log(`Google Places API call: ${cityName}, Photos: ${photos.length}`);
```

## 🎯 **Production Checklist**

- [ ] API key configured and restricted
- [ ] Billing account set up with alerts
- [ ] Caching implemented (24h TTL)
- [ ] Error handling for API failures
- [ ] Rate limiting on your endpoints
- [ ] Photo URL validation
- [ ] Fallback images for failed loads
- [ ] Usage monitoring and logging

## 💡 **Tips for Success**

1. **Cache Everything**: Google Places data doesn't change often
2. **Batch Requests**: Get multiple photos per API call
3. **Fallback Strategy**: Have placeholder images ready
4. **Monitor Costs**: Set up billing alerts
5. **Optimize Images**: Consider resizing for mobile
6. **User Experience**: Show loading states while fetching

## 🔗 **Useful Links**

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com)
- [Places API Pricing](https://developers.google.com/maps/billing/gmp-billing)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## 🎉 **You're Ready!**

With Google Places API, your TinderTravel app will have **real, beautiful hotel photos** that users will love. The setup takes just 5 minutes, and you get $200 free credit to start! 🚀📸 