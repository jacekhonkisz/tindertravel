const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { HotelDatabaseExpander } = require('./src/expand-hotel-database.js');

const app = express();
const port = process.env.PORT || 3001;

// Initialize expanded database
const hotelExpander = new HotelDatabaseExpander();
hotelExpander.addMoreHotels(); // Add more hotels with priority photos

// Middleware
app.use(cors());
app.use(express.json());

// GET /api/hotels - Get hotels with priority photos
app.get('/api/hotels', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      countryAffinity,
      amenityAffinity,
      seenHotels 
    } = req.query;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    console.log(`🏨 Fetching hotels: limit=${limitNum}, offset=${offsetNum}`);

    // Get hotels from expanded database
    const result = await hotelExpander.getAllHotels({
      limit: limitNum,
      offset: offsetNum,
      personalization: {
        countryAffinity: countryAffinity ? JSON.parse(countryAffinity) : {},
        amenityAffinity: amenityAffinity ? JSON.parse(amenityAffinity) : {},
        seenHotels: new Set(seenHotels ? JSON.parse(seenHotels) : [])
      }
    });

    console.log(`✅ Returning ${result.hotels.length} hotels with priority photos`);

    res.json({
      hotels: result.hotels,
      total: result.total,
      hasMore: result.hasMore,
      offset: result.offset,
      limit: result.limit,
      source: result.source,
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)',
      generalViewsFirst: true
    });

  } catch (error) {
    console.error('❌ Error fetching hotels:', error.message);
    res.status(500).json({
      error: 'Failed to fetch hotels',
      message: error.message,
      source: 'hotelbeds-expanded'
    });
  }
});

// GET /api/hotels/:id - Get specific hotel details
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Fetching hotel details: ${id}`);

    const hotel = await hotelExpander.getHotelDetails(id);

    console.log(`✅ Returning hotel details: ${hotel.name}`);

    res.json(hotel);

  } catch (error) {
    console.error(`❌ Error fetching hotel ${req.params.id}:`, error.message);
    res.status(404).json({
      error: 'Hotel not found',
      message: error.message,
      source: 'hotelbeds-expanded'
    });
  }
});

// POST /api/hotels/seed - Seed hotels
app.post('/api/hotels/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding hotels from expanded database...');

    const result = await hotelExpander.getAllHotels({ limit: 50, offset: 0 });

    console.log(`✅ Seeded ${result.hotels.length} hotels`);

    res.json({
      success: true,
      count: result.hotels.length,
      message: `Successfully seeded ${result.hotels.length} hotels with priority photos`,
      source: result.source,
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)',
      generalViewsFirst: true
    });

  } catch (error) {
    console.error('❌ Error seeding hotels:', error.message);
    res.status(500).json({
      error: 'Failed to seed hotels',
      message: error.message,
      source: 'hotelbeds-expanded'
    });
  }
});

// GET /api/hotels/status - Get API status
app.get('/api/hotels/status', async (req, res) => {
  try {
    const status = hotelExpander.getStatus();
    
    res.json({
      ...status,
      endpoint: '/api/hotels',
      priorityPhotos: true,
      generalViewsFirst: true,
      ready: true
    });

  } catch (error) {
    console.error('❌ Error getting status:', error.message);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    source: 'hotelbeds-expanded',
    priorityPhotos: true,
    photoQuality: 'XXL (2048px)',
    generalViewsFirst: true,
    totalHotels: hotelExpander.getStatus().totalHotels
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const status = hotelExpander.getStatus();
  res.json({
    message: 'Hotelbeds Expanded API Server',
    version: '1.0.0',
    features: [
      'Priority Photos (General Views First)',
      'XXL Quality (2048px)',
      'Expanded Hotel Database',
      'No API Limits'
    ],
    stats: {
      totalHotels: status.totalHotels,
      originalHotels: status.fallbackHotels,
      expandedHotels: status.expandedHotels
    },
    endpoints: {
      hotels: '/api/hotels',
      status: '/api/hotels/status',
      seed: 'POST /api/hotels/seed',
      health: '/health'
    }
  });
});

// Start server
app.listen(port, () => {
  const status = hotelExpander.getStatus();
  console.log('🏨 HOTELBEDS EXPANDED API SERVER');
  console.log('=' .repeat(60));
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/api/hotels`);
  console.log(`🔍 Status: http://localhost:${port}/api/hotels/status`);
  console.log(`🌱 Seed: POST http://localhost:${port}/api/hotels/seed`);
  console.log(`❤️ Health: http://localhost:${port}/health`);
  console.log('=' .repeat(60));
  console.log('✅ READY TO SERVE HOTELS WITH PRIORITY PHOTOS!');
  console.log('🔥 General views will be displayed FIRST');
  console.log('📸 XXL quality (2048px) for maximum resolution');
  console.log('🏨 Total Hotels:', status.totalHotels);
  console.log('📊 Original Hotels:', status.fallbackHotels);
  console.log('➕ Expanded Hotels:', status.expandedHotels);
  console.log('🎯 NO API LIMITS - All hotels available!');
  console.log('=' .repeat(60));
});

module.exports = app;
