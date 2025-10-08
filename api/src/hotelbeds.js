const axios = require('axios');
const crypto = require('crypto');

class HotelbedsClient {
  constructor(apiKey = null, secret = null) {
    // Use provided credentials or fall back to environment variables
    this.apiKey = apiKey || process.env.HOTELBEDS_API_KEY;
    this.secret = secret || process.env.HOTELBEDS_SECRET;
    this.baseUrl = process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com';
    this.photoBaseUrl = process.env.HOTELBEDS_PHOTO_BASE_URL || 'https://photos.hotelbeds.com/giata/xxl/';
    
    if (!this.apiKey || !this.secret) {
      throw new Error('Hotelbeds API credentials not found. Please set HOTELBEDS_API_KEY and HOTELBEDS_SECRET in your .env file');
    }
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate authentication signature for Hotelbeds API
   */
  generateSignature() {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash('sha256')
      .update(this.apiKey + this.secret + timestamp)
      .digest('hex');
    
    return { signature, timestamp };
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const { signature } = this.generateSignature();
    return {
      'Api-key': this.apiKey,
      'X-Signature': signature
    };
  }

  /**
   * Sort images by priority (General views first, then by visual order)
   */
  sortImagesByPriority(images) {
    return images.sort((a, b) => {
      // General views first
      if (a.type?.code === 'GEN' && b.type?.code !== 'GEN') return -1;
      if (b.type?.code === 'GEN' && a.type?.code !== 'GEN') return 1;
      
      // Then by visual order
      return (a.visualOrder || 0) - (b.visualOrder || 0);
    });
  }

  /**
   * Generate XXL quality image URL (2048px)
   */
  generateXXLImageUrl(path) {
    return `${this.photoBaseUrl}${path}`;
  }

  /**
   * Organize photos by priority categories
   */
  organizePhotosByPriority(images) {
    const organized = {
      generalViews: [],
      pools: [],
      rooms: [],
      restaurants: [],
      others: []
    };

    images.forEach(img => {
      const xxlUrl = this.generateXXLImageUrl(img.path);
      const typeCode = img.type?.code;

      switch (typeCode) {
        case 'GEN':
          organized.generalViews.push(xxlUrl);
          break;
        case 'PIS':
          organized.pools.push(xxlUrl);
          break;
        case 'HAB':
          organized.rooms.push(xxlUrl);
          break;
        case 'RES':
          organized.restaurants.push(xxlUrl);
          break;
        default:
          organized.others.push(xxlUrl);
          break;
      }
    });

    return organized;
  }

  /**
   * Get hotel with priority photos (General views displayed first)
   */
  async getHotelWithPriorityPhotos(hotelId) {
    try {
      const headers = this.getAuthHeaders();
      const response = await this.api.get(`/hotel-content-api/1.0/hotels/${hotelId}`, { headers });
      
      // Extract hotel data from nested response
      const hotel = response.data.hotel || response.data;
      
      // Sort images by priority
      const sortedImages = this.sortImagesByPriority(hotel.images || []);
      
      // Organize photos by priority categories
      const priorityPhotos = this.organizePhotosByPriority(sortedImages);
      
      // Generate all XXL URLs
      const allPhotos = sortedImages.map(img => this.generateXXLImageUrl(img.path));

      return {
        hotel,
        priorityPhotos,
        allPhotos
      };
    } catch (error) {
      throw new Error(`Failed to fetch hotel ${hotelId}: ${error.message}`);
    }
  }

  /**
   * Get multiple hotels with priority photos
   */
  async getHotelsWithPriorityPhotos(hotelIds) {
    const promises = hotelIds.map(id => this.getHotelWithPriorityPhotos(id));
    return Promise.all(promises);
  }

  /**
   * Get hotels list with pagination
   */
  async getHotels(from = 1, to = 100) {
    try {
      const headers = this.getAuthHeaders();
      const response = await this.api.get(`/hotel-content-api/1.0/hotels?from=${from}&to=${to}`, { headers });
      
      return response.data.hotels || [];
    } catch (error) {
      throw new Error(`Failed to fetch hotels: ${error.message}`);
    }
  }

  /**
   * Test image URL accessibility
   */
  async testImageAccess(imageUrl) {
    try {
      const response = await axios.head(imageUrl, { timeout: 5000 });
      return {
        accessible: true,
        status: response.status,
        size: parseInt(response.headers['content-length'] || '0')
      };
    } catch (error) {
      return {
        accessible: false,
        status: error.response?.status
      };
    }
  }

  /**
   * Get API status and credentials info
   */
  getApiInfo() {
    return {
      baseUrl: this.baseUrl,
      photoBaseUrl: this.photoBaseUrl,
      hasCredentials: !!(this.apiKey && this.secret),
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'Not set'
    };
  }
}

module.exports = { HotelbedsClient };
