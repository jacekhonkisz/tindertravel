const { HotelbedsWithFallback } = require('./hotelbeds-with-fallback.js');

/**
 * Expand Hotel Database
 * 
 * This service allows you to add more hotels to your database
 * with priority photos (general views displayed first)
 */

class HotelDatabaseExpander {
  constructor() {
    this.hotelbedsAPI = new HotelbedsWithFallback();
    this.expandedHotels = [];
  }

  /**
   * Add more hotels with priority photos
   */
  addMoreHotels() {
    const additionalHotels = [
      {
        id: 'expanded-1',
        name: 'Hotel Riu Palace Tenerife',
        city: 'Adeje',
        country: 'Spain',
        rating: 5,
        description: 'Luxury beachfront resort with stunning ocean views',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg'
          ],
          restaurants: [
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg'
          ],
          others: []
        },
        source: 'hotelbeds-expanded',
        photoQuality: 'XXL (2048px)',
        price: { min: 500, max: 800, currency: 'USD' },
        coords: null
      },
      {
        id: 'expanded-2',
        name: 'Melia Barcelona Sky',
        city: 'Barcelona',
        country: 'Spain',
        rating: 4,
        description: 'Modern city hotel with panoramic city views',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_l_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg'
          ],
          pools: [],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg'
          ],
          restaurants: [
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'
          ],
          others: [
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_l_001.jpg'
          ]
        },
        source: 'hotelbeds-expanded',
        photoQuality: 'XXL (2048px)',
        price: { min: 300, max: 500, currency: 'USD' },
        coords: null
      },
      {
        id: 'expanded-3',
        name: 'Iberostar Selection Playa de Palma',
        city: 'Palma',
        country: 'Spain',
        rating: 4,
        description: 'Beachfront resort with all-inclusive luxury',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_002.jpg'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg'
          ],
          restaurants: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg'
          ],
          others: []
        },
        source: 'hotelbeds-expanded',
        photoQuality: 'XXL (2048px)',
        price: { min: 400, max: 700, currency: 'USD' },
        coords: null
      },
      {
        id: 'expanded-4',
        name: 'Hotel Arts Barcelona',
        city: 'Barcelona',
        country: 'Spain',
        rating: 5,
        description: 'Luxury beachfront hotel with Michelin-starred dining',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_l_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg'
          ],
          pools: [],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg'
          ],
          restaurants: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg'
          ],
          others: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_l_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg'
          ]
        },
        source: 'hotelbeds-expanded',
        photoQuality: 'XXL (2048px)',
        price: { min: 600, max: 1000, currency: 'USD' },
        coords: null
      },
      {
        id: 'expanded-5',
        name: 'Gran Hotel Bahia del Duque',
        city: 'Costa Adeje',
        country: 'Spain',
        rating: 5,
        description: 'Exclusive beachfront resort with luxury amenities',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_spa_001.jpg'
        ],
        heroPhoto: 'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg'
          ],
          rooms: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg'
          ],
          restaurants: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg'
          ],
          others: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_spa_001.jpg'
          ]
        },
        source: 'hotelbeds-expanded',
        photoQuality: 'XXL (2048px)',
        price: { min: 700, max: 1200, currency: 'USD' },
        coords: null
      }
    ];

    this.expandedHotels = additionalHotels;
    return additionalHotels;
  }

  /**
   * Get all hotels (original + expanded)
   */
  async getAllHotels(params = {}) {
    const { limit = 20, offset = 0 } = params;
    
    // Get original hotels
    const originalResult = await this.hotelbedsAPI.getHotels({ limit: 10, offset: 0 });
    
    // Add expanded hotels
    const allHotels = [...originalResult.hotels, ...this.expandedHotels];
    
    // Apply pagination
    const paginatedHotels = allHotels.slice(offset, offset + limit);
    
    return {
      hotels: paginatedHotels,
      hasMore: offset + limit < allHotels.length,
      total: allHotels.length,
      offset,
      limit,
      source: 'hotelbeds-expanded',
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)',
      generalViewsFirst: true
    };
  }

  /**
   * Get hotel details
   */
  async getHotelDetails(hotelId) {
    // Check expanded hotels first
    const expandedHotel = this.expandedHotels.find(h => h.id === hotelId);
    if (expandedHotel) {
      return expandedHotel;
    }
    
    // Fall back to original API
    return await this.hotelbedsAPI.getHotelDetails(hotelId);
  }

  /**
   * Get status
   */
  getStatus() {
    const originalStatus = this.hotelbedsAPI.getStatus();
    return {
      ...originalStatus,
      source: 'hotelbeds-expanded',
      expandedHotels: this.expandedHotels.length,
      totalHotels: originalStatus.fallbackHotels + this.expandedHotels.length,
      priorityPhotos: true,
      photoQuality: 'XXL (2048px)',
      generalViewsFirst: true
    };
  }
}

module.exports = { HotelDatabaseExpander };
