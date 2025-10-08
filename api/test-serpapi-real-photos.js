const axios = require('axios');

class SerpApiTester {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.results = [];
  }

  async testWithRealHotels() {
    console.log('🏨 Testing SerpApi with REAL hotels from your database...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get hotels from your API
      const response = await axios.get('http://localhost:3001/api/hotels?limit=100');
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to test`);
      console.log(`💰 You have 250 free searches, testing ${hotels.length} hotels`);
      
      let successCount = 0;
      let totalPhotos = 0;
      let totalCost = 0;
      
      // Test hotels in batches to respect rate limits
      const batchSize = 5;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`\n🔄 Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        for (const hotel of batch) {
          try {
            const result = await this.testHotel(hotel);
            this.results.push(result);
            
            if (result.success) {
              successCount++;
              totalPhotos += result.photoCount;
              totalCost += 0.01; // SerpApi cost per search
              console.log(`✅ ${hotel.name}: ${result.photoCount} photos found`);
            } else {
              console.log(`❌ ${hotel.name}: ${result.reason}`);
            }
          } catch (error) {
            console.log(`❌ ${hotel.name}: ${error.message}`);
            this.results.push({
              hotelName: hotel.name,
              success: false,
              reason: error.message,
              photoCount: 0
            });
          }
          
          // Rate limiting between hotels
          await this.sleep(1000);
        }
        
        // Rate limiting between batches
        await this.sleep(2000);
      }
      
      // Generate summary
      this.generateSummary(successCount, totalPhotos, totalCost, hotels.length);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async testHotel(hotel) {
    try {
      console.log(`  🔍 Testing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_hotels',
          q: `${hotel.name} ${hotel.city} ${hotel.country}`,
          api_key: this.serpApiKey,
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
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

  generateSummary(successCount, totalPhotos, totalCost, totalHotels) {
    console.log('\n📊 SERPAPI TEST RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total Hotels Tested: ${totalHotels}`);
    console.log(`Successful Searches: ${successCount}`);
    console.log(`Failed Searches: ${totalHotels - successCount}`);
    console.log(`Success Rate: ${Math.round(successCount / totalHotels * 100)}%`);
    console.log(`Total Photos Found: ${totalPhotos}`);
    console.log(`Average Photos per Hotel: ${(totalPhotos / successCount).toFixed(1)}`);
    console.log(`Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`Remaining Searches: ${250 - totalHotels}`);
    
    console.log('\n📸 PHOTO QUALITY ANALYSIS:');
    const successfulResults = this.results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const avgWidth = successfulResults.reduce((sum, r) => sum + (r.photos[0]?.width || 0), 0) / successfulResults.length;
      const avgHeight = successfulResults.reduce((sum, r) => sum + (r.photos[0]?.height || 0), 0) / successfulResults.length;
      console.log(`Average Resolution: ${Math.round(avgWidth)}x${Math.round(avgHeight)}`);
      
      const highResCount = successfulResults.filter(r => r.photos[0]?.width >= 1920).length;
      console.log(`High Resolution Photos (>1920px): ${highResCount}/${successfulResults.length} (${Math.round(highResCount/successfulResults.length*100)}%)`);
    }
    
    console.log('\n🏆 TOP PERFORMING HOTELS:');
    successfulResults
      .sort((a, b) => b.photoCount - a.photoCount)
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.hotelName}: ${result.photoCount} photos (${result.city}, ${result.country})`);
      });
    
    console.log('\n❌ FAILED HOTELS:');
    const failedResults = this.results.filter(r => !r.success);
    failedResults.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.hotelName}: ${result.reason}`);
    });
    
    console.log('\n💰 COST COMPARISON:');
    const googlePlacesCost = totalHotels * 0.007;
    const savings = googlePlacesCost - totalCost;
    console.log(`Google Places Cost: $${googlePlacesCost.toFixed(2)}`);
    console.log(`SerpApi Cost: $${totalCost.toFixed(2)}`);
    console.log(`Savings: $${savings.toFixed(2)} (${Math.round(savings/googlePlacesCost*100)}%)`);
    
    console.log('\n🎯 RECOMMENDATION:');
    if (successCount / totalHotels >= 0.8) {
      console.log('✅ EXCELLENT: SerpApi works great for your hotels!');
      console.log('   Consider upgrading to paid plan for production use.');
    } else if (successCount / totalHotels >= 0.6) {
      console.log('✅ GOOD: SerpApi works well for most hotels.');
      console.log('   Consider using hybrid approach for better coverage.');
    } else {
      console.log('⚠️ MODERATE: SerpApi has limited coverage for your hotels.');
      console.log('   Consider using alternative solutions.');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new SerpApiTester();
  await tester.testWithRealHotels();
}

runTest();
