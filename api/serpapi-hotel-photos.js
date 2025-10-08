const axios = require('axios');

class SerpApiHotelPhotoService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY || 'YOUR_SERPAPI_KEY';
    this.baseUrl = 'https://serpapi.com/search';
  }

  /**
   * Get real hotel photos from Google Hotels via SerpApi
   */
  async getRealHotelPhotos(hotelName, city, country, count = 8) {
    try {
      console.log(`🏨 Getting REAL photos for ${hotelName} (${city}, ${country})...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_hotels',
          q: `${hotelName} ${city} ${country}`,
          api_key: this.serpApiKey,
          gl: 'us', // Country
          hl: 'en'  // Language
        },
        timeout: 10000
      });

      const hotels = response.data.properties || [];
      if (hotels.length === 0) {
        console.log(`  ❌ No hotels found for ${hotelName}`);
        return [];
      }

      const hotel = hotels[0];
      const photos = hotel.images || [];
      
      if (photos.length === 0) {
        console.log(`  ❌ No photos found for ${hotel.name}`);
        return [];
      }

      const processedPhotos = photos.slice(0, count).map((photo, index) => ({
        url: photo.url,
        width: photo.width || 1920,
        height: photo.height || 1080,
        source: 'google_hotels',
        description: `${hotelName} real photo ${index + 1}`,
        hotelName: hotel.name,
        rating: hotel.overall_rating,
        price: hotel.price
      }));

      console.log(`  ✅ Found ${processedPhotos.length} REAL photos for ${hotel.name}`);
      
      return processedPhotos;
    } catch (error) {
      console.error(`❌ SerpApi error for ${hotelName}:`, error.message);
      return [];
    }
  }

  /**
   * Test the service with sample hotels
   */
  async testService() {
    console.log('🧪 Testing SerpApi Hotel Photo Service...');
    
    const testHotels = [
      { name: 'Hotel Ritz', city: 'Paris', country: 'France' },
      { name: 'Marriott', city: 'New York', country: 'USA' },
      { name: 'Hilton', city: 'London', country: 'UK' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n📸 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.getRealHotelPhotos(hotel.name, hotel.city, hotel.country, 3);
      
      if (photos.length > 0) {
        console.log(`  ✅ Found ${photos.length} photos:`);
        photos.forEach((photo, index) => {
          console.log(`    ${index + 1}. ${photo.width}x${photo.height} - ${photo.hotelName}`);
          console.log(`       ${photo.url}`);
        });
      } else {
        console.log(`  ❌ No photos found`);
      }
      
      // Rate limiting between hotels
      await this.sleep(2000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the service
module.exports = { SerpApiHotelPhotoService };

// Test the service if run directly
if (require.main === module) {
  const service = new SerpApiHotelPhotoService();
  service.testService().catch(console.error);
}
