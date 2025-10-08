const axios = require('axios');

class SerpApiPhotoReplacerTest {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    this.stats = {
      total: 0,
      replaced: 0,
      skipped: 0,
      failed: 0,
      photosAdded: 0
    };
  }

  async testReplacement() {
    console.log('🧪 Testing SerpApi photo replacement with 3 hotels...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get first 3 hotels for testing
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=3`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Testing with ${hotels.length} hotels`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.processHotel(hotel);
        await this.sleep(3000); // Rate limiting
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async processHotel(hotel) {
    try {
      console.log(`\n🔍 Testing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Show current photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      console.log(`   Current photos: ${hasPhotos ? hotel.photos.length : 0}`);
      if (hasPhotos) {
        console.log(`   Current source: ${hotel.photos[0]?.source || 'unknown'}`);
        console.log(`   Current resolution: ${hotel.photos[0]?.width}x${hotel.photos[0]?.height}`);
      }
      
      // Try to get photos from SerpApi
      const serpApiPhotos = await this.getSerpApiPhotos(hotel);
      
      if (serpApiPhotos.length > 0) {
        console.log(`   ✅ Found ${serpApiPhotos.length} SerpApi photos`);
        console.log(`   New resolution: ${serpApiPhotos[0]?.width}x${serpApiPhotos[0]?.height}`);
        console.log(`   New source: ${serpApiPhotos[0]?.source}`);
        
        // Show what would be replaced (but don't actually replace in test)
        console.log(`   🔄 Would replace ${hasPhotos ? hotel.photos.length : 0} photos with ${serpApiPhotos.length} photos`);
        
        this.stats.replaced++;
        this.stats.photosAdded += serpApiPhotos.length;
        console.log(`   ✅ Test successful - ready for replacement`);
      } else {
        this.stats.skipped++;
        console.log(`   ⏭️ No SerpApi photos found - would keep existing photos`);
      }
      
    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Error processing hotel: ${error.message}`);
    }
  }

  async getSerpApiPhotos(hotel) {
    try {
      const checkInDate = this.getFutureDate(7);
      const checkOutDate = this.getFutureDate(10);
      
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
        return [];
      }

      const foundHotel = hotels[0];
      const photos = foundHotel.images || [];
      
      if (photos.length === 0) {
        return [];
      }

      return photos.slice(0, 8).map((photo, index) => ({
        url: photo.url,
        width: photo.width || 1920,
        height: photo.height || 1080,
        source: 'serpapi_google_hotels',
        description: `${hotel.name} real photo ${index + 1}`,
        photoReference: photo.photo_reference || `serpapi_${hotel.id}_${index}`
      }));
      
    } catch (error) {
      console.log(`     ⚠️ SerpApi error: ${error.message}`);
      return [];
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  generateSummary() {
    console.log('\n📊 TEST SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Hotels Tested: ${this.stats.total}`);
    console.log(`Would Replace: ${this.stats.replaced}`);
    console.log(`Would Skip: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Photos Found: ${this.stats.photosAdded}`);
    
    if (this.stats.replaced > 0) {
      console.log('\n✅ Test successful! Ready to run full replacement.');
    } else {
      console.log('\n⚠️ No photos found. Check API key or hotel names.');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new SerpApiPhotoReplacerTest();
  await tester.testReplacement();
}

runTest();
