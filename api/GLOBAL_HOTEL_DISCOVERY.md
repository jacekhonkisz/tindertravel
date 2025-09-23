# Global Luxury Hotel Discovery System

## Overview

The Global Luxury Hotel Discovery System is designed to automatically find and curate 1000+ unique luxury and boutique hotels from around the world. This system creates a comprehensive database of beautiful, high-quality hotels perfect for a travel inspiration app like yours.

## Key Features

### 🌍 Global Coverage
- **70+ Premium Destinations** across all continents
- **Diverse Location Types**: Islands, coastal areas, mountains, lakes, cultural sites, deserts
- **Hidden Gems**: Discovers lesser-known luxury properties in unique locations

### 🏨 Quality Standards
- **Luxury & Boutique Focus**: Filters for premium properties only
- **Photo Quality**: Minimum 4 high-resolution photos per hotel
- **Rating Requirements**: 4.0+ star ratings
- **Amenity Validation**: Spa, pool, premium dining, etc.

### 📸 Photo Excellence
- **Google Places Integration**: High-quality 1600x1200 photos
- **Strict Validation**: Drops hotels without sufficient quality photos
- **Mobile Optimized**: Perfect for your swipe-based app

### 💰 Live Pricing & Availability
- **Amadeus Integration**: Real-time pricing and availability
- **Multiple Currencies**: Supports global pricing
- **Booking URLs**: Direct links for reservations

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Amadeus API   │    │  Google Places   │    │   Supabase DB   │
│                 │    │       API        │    │                 │
│ • Hotel Search  │    │ • Photo Fetching │    │ • Hotel Storage │
│ • Pricing       │    │ • Location Data  │    │ • User Prefs    │
│ • Availability  │    │ • Quality Check  │    │ • Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │  Global Discovery       │
                    │      Controller         │
                    │                         │
                    │ • Location Strategy     │
                    │ • Quality Filtering     │
                    │ • Progress Monitoring   │
                    │ • Session Management    │
                    └─────────────────────────┘
```

## Discovery Locations

### Europe (10 locations)
- **Greek Islands**: Santorini, Mykonos, Crete
- **Italian Coast**: Amalfi Coast, Tuscany
- **French Riviera**: Nice, Cannes region
- **Spanish Islands**: Ibiza, Mallorca
- **Swiss Alps**: Luxury mountain resorts
- **Iceland**: Unique Nordic luxury

### Asia (10 locations)
- **Tropical Islands**: Bali, Maldives, Phuket
- **Cultural Destinations**: Kyoto, Siem Reap
- **Mountain Retreats**: Bhutan, Japanese Alps
- **Coastal Gems**: Langkawi, Jeju Island
- **Heritage Sites**: Rajasthan, Goa

### North America (7 locations)
- **Wine Country**: Napa Valley, Sonoma
- **Coastal**: Big Sur, Martha's Vineyard
- **Mountain**: Aspen, Banff
- **Tropical**: Tulum, Los Cabos

### South America (5 locations)
- **Adventure**: Patagonia, Atacama Desert
- **Islands**: Fernando de Noronha, Galápagos
- **Natural Wonders**: Iguazu Falls region

### Africa (6 locations)
- **Safari**: Serengeti, Masai Mara
- **Islands**: Zanzibar, Seychelles
- **Cultural**: Marrakech, Cape Town

### Oceania (5 locations)
- **Paradise Islands**: Bora Bora, Fiji
- **Adventure**: Queenstown, Great Barrier Reef
- **Exclusive**: Lord Howe Island

## API Endpoints

### Start Discovery
```bash
POST /api/discovery/start
Content-Type: application/json

{
  "targetCount": 1000,
  "continents": ["Europe", "Asia", "North America"],
  "skipExisting": true,
  "batchSize": 20,
  "qualityThreshold": {
    "minPhotos": 4,
    "minRating": 4.0
  }
}
```

### Monitor Progress
```bash
GET /api/discovery/status
```

Response:
```json
{
  "currentSession": {
    "id": "discovery_1695456789",
    "status": "running",
    "startTime": "2023-09-23T14:18:00Z",
    "config": {...}
  },
  "liveProgress": {
    "totalLocations": 43,
    "processedLocations": 15,
    "totalHotelsFound": 234,
    "totalHotelsWithPhotos": 156,
    "totalHotelsStored": 142,
    "currentLocation": "Santorini, Greece"
  },
  "stats": {
    "totalHotels": 567,
    "totalSessions": 3,
    "activeSessions": 1,
    "completedSessions": 2
  }
}
```

### Stop Discovery
```bash
POST /api/discovery/stop
```

### Get All Sessions
```bash
GET /api/discovery/sessions
```

### Export Results
```bash
GET /api/discovery/sessions/{sessionId}/export
```

## Usage Examples

### Quick Test (10 hotels from Europe)
```bash
curl -X POST http://localhost:3001/api/discovery/start \
  -H "Content-Type: application/json" \
  -d '{
    "targetCount": 10,
    "continents": ["Europe"],
    "batchSize": 2
  }'
```

### Full Global Discovery (1000 hotels)
```bash
curl -X POST http://localhost:3001/api/discovery/start \
  -H "Content-Type: application/json" \
  -d '{
    "targetCount": 1000,
    "continents": ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"],
    "skipExisting": true,
    "batchSize": 20
  }'
```

### Monitor Progress
```bash
# Check status every 30 seconds
watch -n 30 'curl -s http://localhost:3001/api/discovery/status | jq'
```

## Quality Filters

### Hotel Selection Criteria
1. **Luxury Keywords**: resort, spa, boutique, villa, palace, manor, château
2. **Boutique Keywords**: design, art, contemporary, unique, intimate, charming
3. **Rating**: Minimum 4.0 stars
4. **Photos**: Minimum 4 high-quality images
5. **Amenities**: Premium facilities (spa, pool, fine dining)

### Photo Quality Standards
- **Resolution**: Minimum 1600x1200 pixels
- **Count**: 4-10 photos per hotel
- **Quality**: Mobile-optimized, high-resolution
- **Source**: Google Places API for authenticity

## Pricing & Availability

### How Pricing Works
The system fetches **live pricing and availability** from Amadeus:

1. **Real-time Data**: Prices are current market rates
2. **Cheapest Options**: Finds lowest available rates
3. **Date Range**: Uses flexible check-in/out dates
4. **Multiple Currencies**: Supports global pricing
5. **Availability Status**: Shows current booking availability

### Price Fetching Strategy
- **Check-in**: Next available date (usually 7-30 days out)
- **Duration**: 2-3 night stays for accurate pricing
- **Room Type**: Standard/cheapest available room
- **Booking**: Direct links to Amadeus booking system

## Testing

### Run API Tests
```bash
cd api
node test-discovery.js api
```

### Run Quick Discovery Test
```bash
node test-discovery.js quick
```

### Run Full System Test
```bash
node test-discovery.js full
```

## Performance & Monitoring

### Expected Performance
- **Processing Rate**: 2-3 locations per minute
- **Success Rate**: 85-90% (depends on API availability)
- **Photo Validation**: ~70% pass quality checks
- **Total Time**: 2-4 hours for 1000 hotels

### Monitoring Features
- **Real-time Progress**: Live updates on processing
- **Session Management**: Multiple discovery sessions
- **Error Tracking**: Failed locations and reasons
- **Statistics**: Comprehensive analytics

### Rate Limiting
- **Amadeus**: Built-in caching and batching
- **Google Places**: 200ms delays between requests
- **Batch Processing**: 20 locations per batch
- **Automatic Retries**: Failed requests are retried

## Configuration Options

### Target Count
- **Minimum**: 1 hotel
- **Maximum**: 5000 hotels
- **Recommended**: 1000 for full global coverage

### Continents
- **All**: Complete global coverage
- **Selective**: Focus on specific regions
- **Custom**: Mix and match continents

### Quality Thresholds
- **Photos**: 1-20 minimum photos (recommended: 4)
- **Rating**: 1-5 stars (recommended: 4.0)
- **Batch Size**: 1-100 locations (recommended: 20)

## Troubleshooting

### Common Issues

1. **API Keys Missing**
   ```
   Error: Amadeus client not initialized
   Solution: Check AMADEUS_API_KEY and AMADEUS_API_SECRET
   ```

2. **Google Places Quota**
   ```
   Error: OVER_QUERY_LIMIT
   Solution: Check Google Places API quota and billing
   ```

3. **Database Connection**
   ```
   Error: Supabase service not available
   Solution: Check SUPABASE_URL and SUPABASE_ANON_KEY
   ```

### Performance Optimization

1. **Reduce Batch Size**: Lower from 20 to 10 for slower connections
2. **Limit Continents**: Start with Europe/Asia for faster results
3. **Skip Existing**: Set `skipExisting: true` for incremental updates
4. **Lower Quality**: Reduce `minPhotos` to 3 for more results

## Next Steps

1. **Start the API server**: `npm run dev`
2. **Test the system**: `node test-discovery.js api`
3. **Run discovery**: Use the `/api/discovery/start` endpoint
4. **Monitor progress**: Check `/api/discovery/status`
5. **View results**: Access hotels via `/api/hotels`

## Support

For issues or questions:
1. Check the API logs for detailed error messages
2. Verify all environment variables are set
3. Test individual components (Amadeus, Google Places, Supabase)
4. Monitor rate limits and quotas

---

**Ready to discover the world's most beautiful hotels!** 🌍✨ 