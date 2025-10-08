const axios = require('axios');

class SerpApiFixedTester {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
  }

  async testWithRealHotels() {
    console.log('🏨 Testing SerpApi with FIXED parameters...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get hotels from your API
      const response = await axios.get('http://localhost:3001/api/hotels?limit=10');
      const hotels = response.data.hotels;
      
      console.log(`📊 Testing ${hotels.length} hotels (limited to save API calls)`);
      
      let successCount = 0;
      let totalPhotos = 0;
      
      for (const hotel of hotels) {
        try {
          const result = await this.testHotel(hotel);
          
          if (result.success) {
            successCount++;
            totalPhotos += result.photoCount;
            console.log(`✅ ${hotel.name}: ${result.photoCount} photos found`);
            console.log(`   Resolution: ${result.photos[0]?.width}x${result.photos[0]?.height}`);
            console.log(`   Sample URL: ${result.photos[0]?.url?.substring(0, 80)}...`);
          } else {
            console.log(`❌ ${hotel.name}: ${result.reason}`);
          }
        } catch (error) {
          console.log(`❌ ${hotel.name}: ${error.message}`);
        }
        
        // Rate limiting between hotels
        await this.sleep(2000);
      }
      
      // Generate summary
      console.log('\n📊 RESULTS SUMMARY:');
      console.log(`Hotels Tested: ${hotels.length}`);
      console.log(`Successful: ${successCount}`);
      console.log(`Success Rate: ${Math.round(successCount / hotels.length * 100)}%`);
      console.log(`Total Photos: ${totalPhotos}`);
      console.log(`Average Photos per Hotel: ${(totalPhotos / successCount).toFixed(1)}`);
      console.log(`API Calls Used: ${hotels.length}/250`);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async testHotel(hotel) {
    try {
      console.log(`\n🔍 Testing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Get future dates for check-in/check-out
      const checkInDate = this.getFutureDate(7); // 7 days from now
      const checkOutDate = this.getFutureDate(10); // 10 days from now
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_hotels',
          q: `${hotel.name} ${hotel.city} ${hotel.country}`,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          api_key: this.serpApiKey,
          gl: 'us',
          hl: 'en'
        },
        timeout: 15000
      });

      const hotels = response.data.properties || [];
      if (hotels.length === 0) {
        return {
          hotelName: hotel.name,
          success: false,
          reason: 'No hotels found in search results',
          photoCount: 0,
          photos: []
        };
      }

      const foundHotel = hotels[0];
      const photos = foundHotel.images || [];
      
      if (photos.length === 0) {
        return {
          hotelName: hotel.name,
          success: false,
          reason: 'No photos found for this hotel',
          photoCount: 0,
          photos: []
        };
      }

      const processedPhotos = photos.slice(0, 8).map((photo, index) => ({
        url: photo.url,
        width: photo.width || 1920,
        height: photo.height || 1080,
        source: 'google_hotels',
        description: `${hotel.name} real photo ${index + 1}`
      }));

      return {
        hotelName: hotel.name,
        city: hotel.city,
        country: hotel.country,
        success: true,
        photoCount: processedPhotos.length,
        photos: processedPhotos,
        foundHotelName: foundHotel.name,
        rating: foundHotel.overall_rating,
        price: foundHotel.price
      };
      
    } catch (error) {
      return {
        hotelName: hotel.name,
        success: false,
        reason: error.message,
        photoCount: 0,
        photos: []
      };
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new SerpApiFixedTester();
  await tester.testWithRealHotels();
}

runTest();
