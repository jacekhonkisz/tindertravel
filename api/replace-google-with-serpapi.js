const axios = require('axios');

class SerpApiPhotoReplacer {
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

  async replaceAllPhotos() {
    console.log('🔄 Starting SerpApi photo replacement...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to process`);
      console.log(`💰 You have 250 free searches available`);
      
      this.stats.total = hotels.length;
      
      // Process hotels in batches
      const batchSize = 5;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        for (const hotel of batch) {
          await this.processHotel(hotel);
          await this.sleep(2000); // Rate limiting
        }
        
        await this.sleep(3000); // Rate limiting between batches
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Replacement failed:', error.message);
    }
  }

  async processHotel(hotel) {
    try {
      console.log(`\n🔍 Processing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel already has photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      console.log(`   Current photos: ${hasPhotos ? hotel.photos.length : 0}`);
      
      // Try to get photos from SerpApi
      const serpApiPhotos = await this.getSerpApiPhotos(hotel);
      
      if (serpApiPhotos.length > 0) {
        console.log(`   ✅ Found ${serpApiPhotos.length} SerpApi photos`);
        
        // Replace photos in database
        const success = await this.updateHotelPhotos(hotel.id, serpApiPhotos);
        
        if (success) {
          this.stats.replaced++;
          this.stats.photosAdded += serpApiPhotos.length;
          console.log(`   ✅ Replaced photos successfully`);
        } else {
          this.stats.failed++;
          console.log(`   ❌ Failed to update database`);
        }
      } else {
        this.stats.skipped++;
        console.log(`   ⏭️ No SerpApi photos found - keeping existing photos`);
      }
      
    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Error processing hotel: ${error.message}`);
    }
  }

  async getSerpApiPhotos(hotel) {
    try {
      // Get future dates for check-in/check-out
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

      // Process photos to match your database format
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

  async updateHotelPhotos(hotelId, newPhotos) {
    try {
      const response = await axios.put(`${this.apiBaseUrl}/api/hotels/${hotelId}`, {
        photos: newPhotos
      });
      
      return response.status === 200;
    } catch (error) {
      console.log(`     ⚠️ Database update error: ${error.message}`);
      return false;
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  generateSummary() {
    console.log('\n📊 REPLACEMENT SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Hotels Processed: ${this.stats.total}`);
    console.log(`Photos Replaced: ${this.stats.replaced}`);
    console.log(`Hotels Skipped: ${this.stats.skipped}`);
    console.log(`Hotels Failed: ${this.stats.failed}`);
    console.log(`Total Photos Added: ${this.stats.photosAdded}`);
    console.log(`Success Rate: ${Math.round(this.stats.replaced / this.stats.total * 100)}%`);
    
    console.log('\n💰 API USAGE:');
    console.log(`SerpApi Calls Used: ${this.stats.total}/250`);
    console.log(`Remaining Calls: ${250 - this.stats.total}`);
    console.log(`Cost: $${(this.stats.total * 0.01).toFixed(2)}`);
    
    console.log('\n🎯 RESULTS:');
    if (this.stats.replaced > 0) {
      console.log(`✅ Successfully replaced photos for ${this.stats.replaced} hotels`);
      console.log(`📸 Added ${this.stats.photosAdded} high-quality photos`);
      console.log(`🏨 ${this.stats.skipped} hotels kept their existing photos`);
    } else {
      console.log('⚠️ No photos were replaced');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the replacement
async function runReplacement() {
  const replacer = new SerpApiPhotoReplacer();
  await replacer.replaceAllPhotos();
}

runReplacement();
