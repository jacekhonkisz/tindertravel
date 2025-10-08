const { HotelbedsClient } = require('./hotelbeds.js');

/**
 * Hotelbeds Integration Service
 * 
 * This service integrates Hotelbeds API with your existing hotel data
 * to provide high-quality priority photos for all hotels
 */

class HotelbedsIntegration {
  constructor() {
    this.hotelbedsClient = new HotelbedsClient();
    this.hotelMapping = new Map(); // Cache for hotel name -> Hotelbeds ID mapping
  }

  /**
   * Enhance existing hotel with Hotelbeds priority photos
   */
  async enhanceHotelWithPriorityPhotos(existingHotel) {
    try {
      // Try to find matching hotel in Hotelbeds
      const hotelbedsId = await this.findHotelbedsId(existingHotel);
      
      if (hotelbedsId) {
        // Get priority photos from Hotelbeds
        const hotelbedsData = await this.hotelbedsClient.getHotelWithPriorityPhotos(hotelbedsId);
        
        // Enhance the existing hotel with priority photos
        const enhancedHotel = {
          ...existingHotel,
          // Replace photos with Hotelbeds priority photos
          photos: hotelbedsData.allPhotos,
          heroPhoto: hotelbedsData.priorityPhotos.generalViews[0] || hotelbedsData.allPhotos[0],
          
          // Add priority photo categories
          priorityPhotos: {
            generalViews: hotelbedsData.priorityPhotos.generalViews,
            pools: hotelbedsData.priorityPhotos.pools,
            rooms: hotelbedsData.priorityPhotos.rooms,
            restaurants: hotelbedsData.priorityPhotos.restaurants,
            others: hotelbedsData.priorityPhotos.others
          },
          
          // Add Hotelbeds metadata
          hotelbedsId: hotelbedsId,
          photoSource: 'hotelbeds',
          photoQuality: 'XXL (2048px)'
        };
        
        return enhancedHotel;
      } else {
        // No Hotelbeds match found, return original hotel
        console.log(`No Hotelbeds match found for: ${existingHotel.name}`);
        return existingHotel;
      }
    } catch (error) {
      console.error(`Error enhancing hotel ${existingHotel.name}:`, error.message);
      return existingHotel;
    }
  }

  /**
   * Find Hotelbeds ID for an existing hotel
   */
  async findHotelbedsId(existingHotel) {
    // Check cache first
    const cacheKey = `${existingHotel.name}-${existingHotel.city}`;
    if (this.hotelMapping.has(cacheKey)) {
      return this.hotelMapping.get(cacheKey);
    }

    try {
      // Search through Hotelbeds hotels to find a match
      const hotels = await this.hotelbedsClient.getHotels(1, 100);
      
      for (const hotel of hotels) {
        if (this.isHotelMatch(existingHotel, hotel)) {
          this.hotelMapping.set(cacheKey, hotel.code);
          return hotel.code;
        }
      }
      
      // No match found
      this.hotelMapping.set(cacheKey, null);
      return null;
    } catch (error) {
      console.error('Error finding Hotelbeds ID:', error.message);
      return null;
    }
  }

  /**
   * Check if existing hotel matches Hotelbeds hotel
   */
  isHotelMatch(existingHotel, hotelbedsHotel) {
    const existingName = existingHotel.name.toLowerCase();
    const existingCity = existingHotel.city.toLowerCase();
    
    const hotelbedsName = hotelbedsHotel.name?.content?.toLowerCase() || '';
    const hotelbedsAddress = hotelbedsHotel.address?.content?.toLowerCase() || '';
    
    // Check for name similarity
    const nameMatch = existingName.includes(hotelbedsName) || 
                     hotelbedsName.includes(existingName) ||
                     this.calculateSimilarity(existingName, hotelbedsName) > 0.7;
    
    // Check for location similarity
    const locationMatch = existingCity.includes(hotelbedsAddress) ||
                         hotelbedsAddress.includes(existingCity) ||
                         this.calculateSimilarity(existingCity, hotelbedsAddress) > 0.6;
    
    return nameMatch && locationMatch;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Enhance multiple hotels with priority photos
   */
  async enhanceHotelsWithPriorityPhotos(existingHotels) {
    console.log(`🔄 Enhancing ${existingHotels.length} hotels with Hotelbeds priority photos...`);
    
    const enhancedHotels = [];
    
    for (const hotel of existingHotels) {
      const enhanced = await this.enhanceHotelWithPriorityPhotos(hotel);
      enhancedHotels.push(enhanced);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Enhanced ${enhancedHotels.length} hotels`);
    return enhancedHotels;
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      hotelbedsConfigured: !!this.hotelbedsClient,
      cacheSize: this.hotelMapping.size,
      apiInfo: this.hotelbedsClient.getApiInfo()
    };
  }
}

module.exports = { HotelbedsIntegration };
