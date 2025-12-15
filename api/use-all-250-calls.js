const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class FullQuotaProcessor {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      totalProcessed: 0,
      alreadyUpdated: 0,
      newlyUpdated: 0,
      skipped: 0,
      failed: 0,
      photosAdded: 0,
      apiCallsUsed: 0,
      maxApiCalls: 250,
      startingApiCalls: 54, // Already used
      cycles: 0
    };
  }

  async useAll250Calls() {
    console.log('🚀 Using ALL 250 API calls by cycling through hotels...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    console.log(`📊 Starting with ${this.stats.startingApiCalls}/250 API calls used`);
    console.log(`🎯 Target: Use all 250 API calls (${250 - this.stats.startingApiCalls} remaining)`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to cycle through`);
      
      // Continue cycling through hotels until we reach 250 API calls
      let hotelIndex = 0;
      
      while (this.stats.apiCallsUsed < (250 - this.stats.startingApiCalls)) {
        this.stats.cycles++;
        console.log(`\n🔄 Starting cycle ${this.stats.cycles}`);
        
        for (let i = 0; i < hotels.length && this.stats.apiCallsUsed < (250 - this.stats.startingApiCalls); i++) {
          const hotel = hotels[i];
          
          console.log(`\n🔍 Processing ${hotel.name} (Cycle ${this.stats.cycles}, Hotel ${i + 1}/${hotels.length})...`);
          
          // Check if hotel already has SerpApi photos (8 photos = SerpApi, 10 = original)
          const hasSerpApiPhotos = hotel.photos && hotel.photos.length === 8;
          
          if (hasSerpApiPhotos) {
            this.stats.alreadyUpdated++;
            console.log(`   ⏭️ Already updated with SerpApi photos (${hotel.photos.length} photos)`);
            continue;
          }
          
          console.log(`   Current photos: ${hotel.photos?.length || 0} (needs SerpApi update)`);
          
          // Make 1 API call to get SerpApi photos
          const serpApiPhotos = await this.getSerpApiPhotos(hotel);
          this.stats.apiCallsUsed++;
          this.stats.totalProcessed++;
          
          if (serpApiPhotos.length > 0) {
            console.log(`   ✅ Found ${serpApiPhotos.length} SerpApi photos`);
            console.log(`   Resolution: ${serpApiPhotos[0]?.width}x${serpApiPhotos[0]?.height}`);
            
            // Instantly replace photos in Supabase
            const success = await this.updateHotelPhotos(hotel.id, serpApiPhotos);
            
            if (success) {
              this.stats.newlyUpdated++;
              this.stats.photosAdded += serpApiPhotos.length;
              console.log(`   ✅ Photos replaced instantly!`);
            } else {
              this.stats.failed++;
              console.log(`   ❌ Failed to update photos`);
            }
          } else {
            this.stats.skipped++;
            console.log(`   ⏭️ No SerpApi photos found - keeping existing photos`);
          }
          
          // Rate limiting
          await this.sleep(2000);
          
          // Show progress every 10 API calls
          if (this.stats.apiCallsUsed % 10 === 0) {
            const totalUsed = this.stats.startingApiCalls + this.stats.apiCallsUsed;
            const remaining = 250 - totalUsed;
            console.log(`\n📈 Progress: ${totalUsed}/250 API calls used, ${remaining} remaining`);
          }
        }
        
        // Rate limiting between cycles
        await this.sleep(5000);
      }
      
      this.generateFinalSummary();
      
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
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

  generateFinalSummary() {
    const totalApiCallsUsed = this.stats.startingApiCalls + this.stats.apiCallsUsed;
    
    console.log('\n🎉 FINAL 250 API CALLS SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Hotels Processed: ${this.stats.totalProcessed}`);
    console.log(`Cycles Completed: ${this.stats.cycles}`);
    console.log(`Already Updated: ${this.stats.alreadyUpdated}`);
    console.log(`Newly Updated: ${this.stats.newlyUpdated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total Photos Added: ${this.stats.photosAdded}`);
    
    console.log('\n💰 API USAGE:');
    console.log(`API Calls Used This Run: ${this.stats.apiCallsUsed}`);
    console.log(`Total API Calls Used: ${totalApiCallsUsed}/250`);
    console.log(`Remaining API Calls: ${250 - totalApiCallsUsed}`);
    console.log(`Cost This Run: $${(this.stats.apiCallsUsed * 0.01).toFixed(2)}`);
    console.log(`Total Cost: $${(totalApiCallsUsed * 0.01).toFixed(2)}`);
    
    console.log('\n🎯 FINAL RESULTS:');
    if (this.stats.newlyUpdated > 0) {
      console.log(`✅ Successfully updated ${this.stats.newlyUpdated} more hotels`);
      console.log(`📸 Added ${this.stats.photosAdded} more high-quality photos`);
    }
    
    console.log('\n🚀 SYSTEM STATUS:');
    console.log(`Total Hotels with SerpApi Photos: ${this.stats.alreadyUpdated + this.stats.newlyUpdated}`);
    console.log(`Total Hotels with Original Photos: ${this.stats.skipped}`);
    console.log(`Overall Success Rate: ${Math.round((this.stats.alreadyUpdated + this.stats.newlyUpdated) / (this.stats.alreadyUpdated + this.stats.newlyUpdated + this.stats.skipped) * 100)}%`);
    
    if (totalApiCallsUsed >= 250) {
      console.log('\n🎊 MISSION ACCOMPLISHED!');
      console.log('✅ Used all 250 API calls successfully!');
      console.log('🏨 Maximum photo coverage achieved!');
    } else {
      console.log('\n⏸️ PROCESSING COMPLETE');
      console.log(`✅ Processed all available hotels with ${250 - totalApiCallsUsed} API calls remaining`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the full quota processing
async function runFullQuotaProcessing() {
  const processor = new FullQuotaProcessor();
  await processor.useAll250Calls();
}

runFullQuotaProcessing();
