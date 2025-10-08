const { HotelbedsClient } = require('./hotelbeds.js');

/**
 * Hotelbeds API with Fallback
 * 
 * This service provides hotels from Hotelbeds with graceful fallback
 * when rate limits are exceeded
 */

class HotelbedsWithFallback {
  constructor() {
    this.hotelbedsClient = new HotelbedsClient();
    this.fallbackHotels = this.createFallbackHotels();
    this.rateLimitExceeded = false;
    this.lastError = null;
  }

  /**
   * Create fallback hotels with priority photos
   */
  createFallbackHotels() {
    return [
      {
        id: 'fallback-1',
        name: 'Ohtels Villa Dorada',
        city: 'Cambrils',
        country: 'Spain',
        rating: 4,
        description: 'Beautiful beachfront hotel with stunning views',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_006.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_007.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_ro_059.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_005.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_006.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_a_007.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_p_001.jpg'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000001/000001a_hb_ro_059.jpg'
          ],
          restaurants: [],
          others: []
        },
        source: 'hotelbeds-fallback',
        photoQuality: 'XXL (2048px)',
        price: { min: 400, max: 600, currency: 'USD' },
        coords: null
      },
      {
        id: 'fallback-2',
        name: 'htop Calella Palace',
        city: 'Calella',
        country: 'Spain',
        rating: 4,
        description: 'Luxury palace hotel with premium amenities',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_088_20250822_085430.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_p_039.jpg?20250107082529',
          'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_w_083.jpg?20240618122406'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_087_20250822_085429.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_a_088_20250822_085430.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_p_039.jpg?20250107082529'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000002/000002a_hb_w_083.jpg?20240618122406'
          ],
          restaurants: [],
          others: []
        },
        source: 'hotelbeds-fallback',
        photoQuality: 'XXL (2048px)',
        price: { min: 450, max: 650, currency: 'USD' },
        coords: null
      },
      {
        id: 'fallback-3',
        name: 'HG Lomo Blanco',
        city: 'Fuerteventura',
        country: 'Spain',
        rating: 4,
        description: 'Modern hotel with stunning ocean views',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_029.JPG',
          'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_030.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_ro_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_028.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_029.JPG',
            'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_a_030.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_p_001.jpg'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000005/000005a_hb_ro_001.jpg'
          ],
          restaurants: [],
          others: []
        },
        source: 'hotelbeds-fallback',
        photoQuality: 'XXL (2048px)',
        price: { min: 350, max: 500, currency: 'USD' },
        coords: null
      }
    ];
  }

  /**
   * Get hotels with fallback
   */
  async getHotels(params = {}) {
    const { limit = 20, offset = 0 } = params;
    
    try {
      // Try Hotelbeds API first
      if (!this.rateLimitExceeded) {
        console.log('🔄 Trying Hotelbeds API...');
        
        const hotelIds = [];
        for (let i = offset + 1; i <= offset + limit; i++) {
          hotelIds.push(i);
        }
        
        const hotelsData = await this.hotelbedsClient.getHotelsWithPriorityPhotos(hotelIds);
        const hotels = hotelsData
          .filter(data => data.hotel.name?.content)
          .map(data => this.convertToAppFormat(data))
          .slice(0, limit);
        
        console.log(`✅ Got ${hotels.length} hotels from Hotelbeds API`);
        return {
          hotels,
          hasMore: hotels.length === limit,
          total: hotels.length,
          offset,
          limit,
          source: 'hotelbeds-live'
        };
      }
      
    } catch (error) {
      console.log('⚠️ Hotelbeds API failed:', error.message);
      
      if (error.message.includes('Quota exceeded') || error.message.includes('403')) {
        this.rateLimitExceeded = true;
        this.lastError = error.message;
        console.log('🔄 Rate limit exceeded, using fallback hotels...');
      }
    }
    
    // Use fallback hotels
    console.log('🔄 Using fallback hotels with priority photos...');
    
    const fallbackHotels = this.fallbackHotels.slice(offset, offset + limit);
    
    return {
      hotels: fallbackHotels,
      hasMore: offset + limit < this.fallbackHotels.length,
      total: this.fallbackHotels.length,
      offset,
      limit,
      source: 'hotelbeds-fallback',
      fallbackReason: this.lastError || 'API unavailable'
    };
  }

  /**
   * Convert Hotelbeds data to app format
   */
  convertToAppFormat(hotelbedsData) {
    const hotel = hotelbedsData.hotel;
    const priorityPhotos = hotelbedsData.priorityPhotos;
    
    return {
      id: hotel.code.toString(),
      name: hotel.name?.content || 'Unknown Hotel',
      city: this.extractCity(hotel.address?.content || ''),
      country: this.extractCountry(hotel.address?.content || ''),
      photos: hotelbedsData.allPhotos,
      heroPhoto: priorityPhotos.generalViews[0] || hotelbedsData.allPhotos[0],
      priorityPhotos: {
        generalViews: priorityPhotos.generalViews,
        pools: priorityPhotos.pools,
        rooms: priorityPhotos.rooms,
        restaurants: priorityPhotos.restaurants,
        others: priorityPhotos.others
      },
      rating: this.parseRating(hotel.S2C),
      description: hotel.description?.content || '',
      address: hotel.address?.content || '',
      source: 'hotelbeds',
      photoQuality: 'XXL (2048px)',
      lastUpdate: hotel.lastUpdate,
      coords: null,
      price: this.generatePriceRange(hotel.S2C)
    };
  }

  /**
   * Extract city from address
   */
  extractCity(address) {
    if (!address) return 'Unknown City';
    const parts = address.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim() : 'Unknown City';
  }

  /**
   * Extract country from address
   */
  extractCountry(address) {
    if (!address) return 'Unknown Country';
    const parts = address.split(',');
    return parts.length >= 1 ? parts[parts.length - 1].trim() : 'Unknown Country';
  }

  /**
   * Parse rating from S2C format
   */
  parseRating(s2c) {
    if (!s2c) return 0;
    const match = s2c.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Generate price range based on rating
   */
  generatePriceRange(rating) {
    const basePrice = 100;
    const ratingMultiplier = this.parseRating(rating) || 3;
    const minPrice = basePrice * ratingMultiplier;
    const maxPrice = minPrice * 1.5;
    
    return {
      min: minPrice,
      max: maxPrice,
      currency: 'USD'
    };
  }

  /**
   * Get specific hotel details
   */
  async getHotelDetails(hotelId) {
    try {
      if (!this.rateLimitExceeded) {
        const hotelData = await this.hotelbedsClient.getHotelWithPriorityPhotos(parseInt(hotelId));
        return this.convertToAppFormat(hotelData);
      }
    } catch (error) {
      console.log('⚠️ Hotelbeds API failed for hotel details:', error.message);
    }
    
    // Use fallback
    const fallbackHotel = this.fallbackHotels.find(h => h.id === hotelId);
    if (fallbackHotel) {
      return fallbackHotel;
    }
    
    throw new Error(`Hotel ${hotelId} not found`);
  }

  /**
   * Get API status
   */
  getStatus() {
    return {
      source: 'hotelbeds-with-fallback',
      configured: true,
      rateLimitExceeded: this.rateLimitExceeded,
      lastError: this.lastError,
      fallbackHotels: this.fallbackHotels.length,
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)',
      generalViewsFirst: true
    };
  }
}

module.exports = { HotelbedsWithFallback };
