const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

const seedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Seeding rate limit exceeded. Please try again later.' }
});

app.use(express.json());

// In-memory storage for now (will add Supabase later)
let hotelDatabase = [];
let isSeeded = false;
let accessToken = null;
let tokenExpiry = null;

// Amadeus API functions
async function getAmadeusToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const baseUrl = process.env.AMADEUS_BASE_URL;

  try {
    const response = await axios.post(`${baseUrl}/v1/security/oauth2/token`, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
    return accessToken;
  } catch (error) {
    console.error('Failed to get Amadeus token:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
}

async function getHotelsByCity(cityCode) {
  const token = await getAmadeusToken();
  const baseUrl = process.env.AMADEUS_BASE_URL;

  try {
    const response = await axios.get(`${baseUrl}/v1/reference-data/locations/hotels/by-city`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: {
        cityCode,
        radius: 20,
        radiusUnit: 'KM',
        hotelSource: 'ALL'
      }
    });

    return response.data.data || [];
  } catch (error) {
    console.error(`Failed to fetch hotels for ${cityCode}:`, error.response?.data || error.message);
    return [];
  }
}

function transformHotelData(hotel, city) {
  const photos = [
    `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&sig=${hotel.hotelId}`,
    `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center&sig=${hotel.hotelId}2`,
    `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center&sig=${hotel.hotelId}3`
  ];

  return {
    id: hotel.hotelId,
    name: hotel.name,
    city: city.name,
    country: city.country,
    coords: hotel.geoCode ? {
      lat: hotel.geoCode.latitude,
      lng: hotel.geoCode.longitude
    } : city.coords,
    price: {
      amount: (Math.random() * 200 + 50).toFixed(0),
      currency: 'EUR'
    },
    description: `Beautiful hotel in ${city.name}, ${city.country}. ${hotel.name} offers comfortable accommodation with modern amenities.`,
    amenityTags: ['wifi', 'restaurant', 'bar', 'parking'].slice(0, Math.floor(Math.random() * 4) + 1),
    photos,
    heroPhoto: photos[0],
    bookingUrl: `https://booking.example.com/hotel/${hotel.hotelId}`,
    rating: Math.random() * 2 + 3 // 3-5 stars
  };
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    seeded: isSeeded,
    hotelCount: hotelDatabase.length
  });
});

app.post('/api/seed', seedLimiter, async (req, res) => {
  try {
    console.log('🌱 Starting hotel seeding process...');
    
    const cities = [
      { name: 'Rome', cityCode: 'ROM', country: 'Italy', coords: { lat: 41.9028, lng: 12.4964 } },
      { name: 'Lisbon', cityCode: 'LIS', country: 'Portugal', coords: { lat: 38.7223, lng: -9.1393 } },
      { name: 'Barcelona', cityCode: 'BCN', country: 'Spain', coords: { lat: 41.3851, lng: 2.1734 } }
    ];

    let allHotels = [];

    for (const city of cities) {
      console.log(`Fetching hotels for ${city.name}...`);
      const hotels = await getHotelsByCity(city.cityCode);
      
      const transformedHotels = hotels.slice(0, 20).map(hotel => 
        transformHotelData(hotel, city)
      );
      
      allHotels = allHotels.concat(transformedHotels);
      console.log(`✅ Added ${transformedHotels.length} hotels from ${city.name}`);
      
      // Delay between cities
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    hotelDatabase = allHotels;
    isSeeded = true;

    console.log(`🎉 Successfully seeded ${allHotels.length} hotels`);
    res.json({
      success: true,
      message: `Seeded ${allHotels.length} hotels`,
      count: allHotels.length
    });

  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({
      error: 'Failed to seed hotels',
      message: error.message
    });
  }
});

app.get('/api/hotels', (req, res) => {
  try {
    if (!isSeeded || hotelDatabase.length === 0) {
      return res.json({
        hotels: [],
        message: 'No hotels available. Please seed the database first by calling POST /api/seed'
      });
    }

    const { limit = 20, offset = 0 } = req.query;
    const startIndex = parseInt(offset);
    const limitNum = parseInt(limit);
    
    const paginatedHotels = hotelDatabase.slice(startIndex, startIndex + limitNum);

    res.json({
      hotels: paginatedHotels,
      total: hotelDatabase.length,
      hasMore: startIndex + limitNum < hotelDatabase.length
    });

  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    res.status(500).json({
      error: 'Failed to fetch hotels',
      message: error.message
    });
  }
});

app.get('/api/hotels/:id', (req, res) => {
  try {
    const { id } = req.params;
    const hotel = hotelDatabase.find(h => h.id === id);
    
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Failed to fetch hotel details:', error);
    res.status(500).json({
      error: 'Failed to fetch hotel details',
      message: error.message
    });
  }
});

app.post('/api/personalization', (req, res) => {
  try {
    const { hotelId, action, country, amenityTags } = req.body;
    console.log(`Personalization: ${action} for hotel ${hotelId} in ${country}`);
    res.json({ success: true, message: 'Personalization updated' });
  } catch (error) {
    console.error('Failed to update personalization:', error);
    res.status(500).json({
      error: 'Failed to update personalization',
      message: error.message
    });
  }
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Glintz API server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🏨 Seed hotels: POST http://localhost:${port}/api/seed`);
  console.log(`🔍 Get hotels: GET http://localhost:${port}/api/hotels`);
  
  if (!isSeeded) {
    console.log('\n⚠️  Database not seeded. Call POST /api/seed to populate with hotels.');
  }
}); 