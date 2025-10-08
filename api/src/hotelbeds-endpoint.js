const express = require('express');
const { HotelbedsPrimaryAPI } = require('./hotelbeds-primary-api.js');

/**
 * Hotelbeds Hotels Endpoint
 * 
 * This endpoint provides hotels from Hotelbeds as the primary source
 * with priority photos (general views displayed first)
 */

function createHotelbedsEndpoint() {
  const router = express.Router();
  const hotelbedsAPI = new HotelbedsPrimaryAPI();

  // GET /api/hotels - Get hotels with priority photos
  router.get('/', async (req, res) => {
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

      // Get hotels from Hotelbeds with priority photos
      const result = await hotelbedsAPI.getHotels({
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
        source: 'hotelbeds',
        priorityPhotos: true,
        photoQuality: 'XXL (2048px)'
      });

    } catch (error) {
      console.error('❌ Error fetching hotels:', error.message);
      res.status(500).json({
        error: 'Failed to fetch hotels',
        message: error.message,
        source: 'hotelbeds'
      });
    }
  });

  // GET /api/hotels/:id - Get specific hotel details
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Fetching hotel details: ${id}`);

      const hotel = await hotelbedsAPI.getHotelDetails(id);

      console.log(`✅ Returning hotel details: ${hotel.name}`);

      res.json(hotel);

    } catch (error) {
      console.error(`❌ Error fetching hotel ${req.params.id}:`, error.message);
      res.status(404).json({
        error: 'Hotel not found',
        message: error.message,
        source: 'hotelbeds'
      });
    }
  });

  // POST /api/hotels/seed - Seed hotels from Hotelbeds
  router.post('/seed', async (req, res) => {
    try {
      console.log('🌱 Seeding hotels from Hotelbeds...');

      const result = await hotelbedsAPI.seedHotels();

      console.log(`✅ Seeded ${result.count} hotels`);

      res.json({
        success: true,
        count: result.count,
        message: result.message,
        source: 'hotelbeds',
        priorityPhotos: true,
        photoQuality: 'XXL (2048px)'
      });

    } catch (error) {
      console.error('❌ Error seeding hotels:', error.message);
      res.status(500).json({
        error: 'Failed to seed hotels',
        message: error.message,
        source: 'hotelbeds'
      });
    }
  });

  // GET /api/hotels/status - Get API status
  router.get('/status', async (req, res) => {
    try {
      const status = hotelbedsAPI.getStatus();
      
      res.json({
        ...status,
        endpoint: '/api/hotels',
        priorityPhotos: true,
        generalViewsFirst: true
      });

    } catch (error) {
      console.error('❌ Error getting status:', error.message);
      res.status(500).json({
        error: 'Failed to get status',
        message: error.message
      });
    }
  });

  return router;
}

module.exports = { createHotelbedsEndpoint };
