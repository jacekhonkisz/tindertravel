const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class FixedPhotoReplacer {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Use the correct Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      replaced: 0,
      skipped: 0,
      failed: 0,
      photosAdded: 0
    };
  }

  async replacePhotos() {
    console.log('🎯 Starting FIXED SerpApi photo replacement...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Processing ${hotels.length} hotels`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.processHotel(hotel);
        await this.sleep(3000); // Rate limiting
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Replacement failed:', error.message);
    }
  }

  async processHotel(hotel) {
    try {
      console.log(`\n🔍 Processing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Show current photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      console.log(`   Current photos: ${hasPhotos ? hotel.photos.length : 0}`);
      if (hasPhotos) {
        console.log(`   Current source: ${hotel.photos[0]?.source || 'unknown'}`);
        console.log(`   Current resolution: ${hotel.photos[0]?.width}x${hotel.photos[0]?.height}`);
      }
      
      // Get photos from SerpApi
      const serpApiPhotos = await this.getSerpApiPhotos(hotel);
      
      if (serpApiPhotos.length > 0) {
        console.log(`   ✅ Found ${serpApiPhotos.length} SerpApi photos`);
        console.log(`   New resolution: ${serpApiPhotos[0]?.width}x${serpApiPhotos[0]?.height}`);
        console.log(`   New source: ${serpApiPhotos[0]?.source}`);
        
        // Update photos using Supabase
        const success = await this.updateHotelPhotos(hotel.id, serpApiPhotos);
        
        if (success) {
          this.stats.replaced++;
          this.stats.photosAdded += serpApiPhotos.length;
          console.log(`   ✅ Photos replaced successfully`);
        } else {
          this.stats.failed++;
          console.log(`   ❌ Failed to update photos`);
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

  async updateHotelPhotos(hotelId, newPhotos) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({ 
          photos: newPhotos,
          hero_photo: newPhotos[0]?.url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) {
        console.log(`     ⚠️ Supabase error: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log(`     ⚠️ Update error: ${error.message}`);
      return false;
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  generateSummary() {
    console.log('\n📊 FIXED REPLACEMENT SUMMARY:');
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
      console.log(`📸 Added ${this.stats.photosAdded} high-quality SerpApi photos`);
      console.log(`�� ${this.stats.skipped} hotels kept their existing photos`);
    } else {
      console.log('⚠️ No photos were replaced');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the replacement
async function runFixedReplacement() {
  const replacer = new FixedPhotoReplacer();
  await replacer.replacePhotos();
}

runFixedReplacement();
