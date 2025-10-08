const express = require('express');
const { HotelbedsWithFallback } = require('./hotelbeds-with-fallback.js');

/**
 * Hotelbeds Primary Endpoint
 * 
 * This endpoint provides hotels from Hotelbeds as the primary source
 * with priority photos (general views displayed first) and graceful fallback
 */

function createHotelbedsPrimaryEndpoint() {
  const router = express.Router();
  const hotelbedsAPI = new HotelbedsWithFallback();

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
        source: result.source,
        priorityPhotos: true,
        photoQuality: 'XXL (2048px)',
        generalViewsFirst: true,
        fallbackReason: result.fallbackReason
      });

    } catch (error) {
      console.error('❌ Error fetching hotels:', error.message);
      res.status(500).json({
        error: 'Failed to fetch hotels',
        message: error.message,
        source: 'hotelbeds-primary'
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
        source: 'hotelbeds-primary'
      });
    }
  });

  // POST /api/hotels/seed - Seed hotels from Hotelbeds
  router.post('/seed', async (req, res) => {
    try {
      console.log('🌱 Seeding hotels from Hotelbeds...');

      // Get hotels to seed
      const result = await hotelbedsAPI.getHotels({ limit: 50, offset: 0 });

      console.log(`✅ Seeded ${result.hotels.length} hotels`);

      res.json({
        success: true,
        count: result.hotels.length,
        message: `Successfully seeded ${result.hotels.length} hotels from Hotelbeds with priority photos`,
        source: result.source,
        priorityPhotos: true,
        photoQuality: 'XXL (2048px)',
        generalViewsFirst: true,
        fallbackReason: result.fallbackReason
      });

    } catch (error) {
      console.error('❌ Error seeding hotels:', error.message);
      res.status(500).json({
        error: 'Failed to seed hotels',
        message: error.message,
        source: 'hotelbeds-primary'
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

  return router;
}

module.exports = { createHotelbedsPrimaryEndpoint };
