const { HotelbedsClient } = require('./hotelbeds.js');

/**
 * Hotelbeds Primary API Service
 * 
 * This service provides hotels from Hotelbeds as the primary source
 * with priority photos (general views displayed first)
 */

class HotelbedsPrimaryAPI {
  constructor() {
    this.hotelbedsClient = new HotelbedsClient();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get hotels with priority photos (primary source)
   */
  async getHotels(params = {}) {
    const { limit = 20, offset = 0, personalization } = params;
    
    try {
      console.log(`🔄 Fetching ${limit} hotels from Hotelbeds (offset: ${offset})`);
      
      // Calculate which hotel IDs to fetch
      const startId = offset + 1;
      const endId = offset + limit;
      const hotelIds = [];
      
      for (let i = startId; i <= endId; i++) {
        hotelIds.push(i);
      }
      
      // Fetch hotels with priority photos
      const hotelsData = await this.hotelbedsClient.getHotelsWithPriorityPhotos(hotelIds);
      
      // Convert to app format
      const hotels = hotelsData
        .filter(data => data.hotel.name?.content) // Only hotels with names
        .map(data => this.convertToAppFormat(data))
        .slice(0, limit); // Ensure we don't exceed limit
      
      console.log(`✅ Fetched ${hotels.length} hotels with priority photos`);
      
      return {
        hotels,
        hasMore: hotels.length === limit, // Assume more if we got full limit
        total: hotels.length,
        offset,
        limit
      };
      
    } catch (error) {
      console.error('❌ Error fetching hotels:', error.message);
      throw new Error(`Failed to fetch hotels: ${error.message}`);
    }
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
      
      // Priority photos - general views first
      photos: hotelbedsData.allPhotos,
      heroPhoto: priorityPhotos.generalViews[0] || hotelbedsData.allPhotos[0],
      
      // Priority photo categories
      priorityPhotos: {
        generalViews: priorityPhotos.generalViews,
        pools: priorityPhotos.pools,
        rooms: priorityPhotos.rooms,
        restaurants: priorityPhotos.restaurants,
        others: priorityPhotos.others
      },
      
      // Hotel details
      rating: this.parseRating(hotel.S2C),
      description: hotel.description?.content || '',
      address: hotel.address?.content || '',
      
      // Metadata
      source: 'hotelbeds',
      photoQuality: 'XXL (2048px)',
      lastUpdate: hotel.lastUpdate,
      
      // Coordinates (if available)
      coords: this.extractCoordinates(hotel),
      
      // Price (placeholder - would need booking API)
      price: this.generatePriceRange(hotel.S2C)
    };
  }

  /**
   * Extract city from address
   */
  extractCity(address) {
    if (!address) return 'Unknown City';
    
    // Try to extract city from address
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    
    return 'Unknown City';
  }

  /**
   * Extract country from address
   */
  extractCountry(address) {
    if (!address) return 'Unknown Country';
    
    // Try to extract country from address
    const parts = address.split(',');
    if (parts.length >= 1) {
      return parts[parts.length - 1].trim();
    }
    
    return 'Unknown Country';
  }

  /**
   * Parse rating from S2C format
   */
  parseRating(s2c) {
    if (!s2c) return 0;
    
    // Extract number from rating like "4*"
    const match = s2c.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Extract coordinates if available
   */
  extractCoordinates(hotel) {
    // Hotelbeds might have coordinates in facilities or other fields
    // For now, return null - would need to check actual API response
    return null;
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
      const hotelData = await this.hotelbedsClient.getHotelWithPriorityPhotos(parseInt(hotelId));
      return this.convertToAppFormat(hotelData);
    } catch (error) {
      console.error(`❌ Error fetching hotel ${hotelId}:`, error.message);
      throw new Error(`Failed to fetch hotel details: ${error.message}`);
    }
  }

  /**
   * Seed hotels (for compatibility with existing app)
   */
  async seedHotels() {
    try {
      console.log('🌱 Seeding hotels from Hotelbeds...');
      
      // Fetch initial batch of hotels
      const result = await this.getHotels({ limit: 50, offset: 0 });
      
      console.log(`✅ Seeded ${result.hotels.length} hotels with priority photos`);
      
      return {
        count: result.hotels.length,
        message: `Successfully seeded ${result.hotels.length} hotels from Hotelbeds with priority photos`
      };
    } catch (error) {
      console.error('❌ Error seeding hotels:', error.message);
      throw new Error(`Failed to seed hotels: ${error.message}`);
    }
  }

  /**
   * Get API status
   */
  getStatus() {
    const apiInfo = this.hotelbedsClient.getApiInfo();
    return {
      source: 'hotelbeds',
      configured: apiInfo.hasCredentials,
      baseUrl: apiInfo.baseUrl,
      photoBaseUrl: apiInfo.photoBaseUrl,
      cacheSize: this.cache.size,
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)'
    };
  }
}

module.exports = { HotelbedsPrimaryAPI };
