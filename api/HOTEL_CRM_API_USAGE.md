# Hotel CRM API Integration

This document explains how to use the Hotel CRM API service in your application.

## 📁 Files Created

- `api/src/services/hotelCrmApi.ts` - TypeScript service class
- `api/src/services/hotelCrmApi.js` - JavaScript service class
- `api/test-hotel-crm-connection.js` - Basic connection test
- `api/test-hotel-crm-service.js` - Service usage test

## ✅ Connection Status

**Status: ✅ Connected and Tested**

The API connection has been successfully tested and is working correctly.

## 🚀 Quick Start

### Using the Service in JavaScript/Node.js

```javascript
const { hotelCrmApi } = require('./api/src/services/hotelCrmApi.js');

// Get statistics
const stats = await hotelCrmApi.getStats();
console.log(`Total hotels: ${stats.statistics.total}`);

// Get hotels
const hotels = await hotelCrmApi.getHotels({ page: 1, per_page: 50 });
console.log(`Found ${hotels.hotels.length} hotels`);

// Get hotels with filters
const s1Hotels = await hotelCrmApi.getHotels({ 
  stage: "S1", 
  country: "Italy",
  per_page: 50 
});

// Search hotels
const searchResults = await hotelCrmApi.searchHotels("Grand", { 
  country: "Italy" 
});

// Get all hotels in a stage (handles pagination)
const allS1Hotels = await hotelCrmApi.getAllHotelsInStage("S1");
console.log(`Total S1 hotels: ${allS1Hotels.length}`);
```

### Using the Service in TypeScript

```typescript
import { hotelCrmApi } from './api/src/services/hotelCrmApi';

// Get statistics
const stats = await hotelCrmApi.getStats();

// Get hotels with type safety
const hotels = await hotelCrmApi.getHotels({ 
  page: 1, 
  per_page: 50,
  stage: "S1"
});
```

## 📋 Available Methods

### `getHotels(params)`
Fetch hotels with optional filters.

**Parameters:**
- `page` (number, default: 1) - Page number
- `per_page` (number, default: 50) - Items per page
- `stage` (string, optional) - Filter by stage (e.g., "S1", "S2")
- `country` (string, optional) - Filter by country
- `city` (string, optional) - Filter by city
- `search` (string, optional) - Search term

**Returns:** Object with `hotels` array and `pagination` object

### `getStats()`
Get overall statistics from the CRM.

**Returns:** Object with statistics data

### `getAllHotelsInStage(stage)`
Get all hotels in a specific stage (automatically handles pagination).

**Parameters:**
- `stage` (string) - Stage to filter by

**Returns:** Array of all hotels in the stage

### `searchHotels(searchTerm, filters)`
Search hotels by name or location.

**Parameters:**
- `searchTerm` (string) - Search term
- `filters` (object, optional) - Additional filters

**Returns:** Object with search results

## 🔧 API Credentials

The API credentials are configured in the service files:

```javascript
const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";
```

**⚠️ Security Note:** For production, consider moving these to environment variables:

```javascript
const API_BASE = process.env.HOTEL_CRM_API_BASE || "https://web-production-b200.up.railway.app";
const API_KEY = process.env.HOTEL_CRM_API_KEY || "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";
```

## 🧪 Testing

Run the test scripts to verify the connection:

```bash
# Basic connection test
node api/test-hotel-crm-connection.js

# Service usage test
node api/test-hotel-crm-service.js
```

## 📊 Example Response

### Statistics Response
```json
{
  "statistics": {
    "total": 5389,
    "with_email": 3562,
    "funnel_metrics": {
      "s1": 192,
      "s2": 0,
      "s3": 0,
      ...
    }
  }
}
```

### Hotels Response
```json
{
  "hotels": [
    {
      "id": 1,
      "hotel_name": "Example Hotel",
      "city": "Paris",
      "country": "France",
      "stage": "S1",
      "email": "info@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 100,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🆘 Troubleshooting

### Error: "Authentication required"
- Verify the API key is correct
- Check that the `X-API-Key` header is being sent

### Error: Connection timeout
- Check internet connection
- Verify the API base URL is correct
- Check if the Railway app is running

### Error: 404 Not Found
- Verify the endpoint URL is correct
- Check API base URL

## 📞 Need More Help?

See `CONNECT_EXTERNAL_APP.md` for more detailed examples and integration guides.

