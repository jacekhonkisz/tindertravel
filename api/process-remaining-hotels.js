const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class RemainingHotelsProcessor {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      alreadyUpdated: 0,
      newlyUpdated: 0,
      skipped: 0,
      failed: 0,
      photosAdded: 0,
      apiCallsUsed: 0
    };
  }

  async processRemainingHotels() {
    console.log('🎯 Processing REMAINING hotels efficiently...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`�� Found ${hotels.length} total hotels`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.processHotelEfficiently(hotel);
        await this.sleep(2000); // Rate limiting
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
    }
  }

  async processHotelEfficiently(hotel) {
    try {
      console.log(`\n🔍 Processing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel already has SerpApi photos (8 photos = SerpApi, 10 = original)
      const hasSerpApiPhotos = hotel.photos && hotel.photos.length === 8;
      
      if (hasSerpApiPhotos) {
        this.stats.alreadyUpdated++;
        console.log(`   ⏭️ Already updated with SerpApi photos (${hotel.photos.length} photos)`);
        return;
      }
      
      console.log(`   Current photos: ${hotel.photos?.length || 0} (needs SerpApi update)`);
      
      // Make 1 API call to get SerpApi photos
      const serpApiPhotos = await this.getSerpApiPhotos(hotel);
      this.stats.apiCallsUsed++;
      
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
    console.log('\n📊 REMAINING HOTELS PROCESSING SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Hotels: ${this.stats.total}`);
    console.log(`Already Updated: ${this.stats.alreadyUpdated}`);
    console.log(`Newly Updated: ${this.stats.newlyUpdated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total Photos Added: ${this.stats.photosAdded}`);
    
    console.log('\n💰 API USAGE:');
    console.log(`API Calls Used This Run: ${this.stats.apiCallsUsed}`);
    console.log(`Total API Calls Used: ${20 + this.stats.apiCallsUsed}/250`);
    console.log(`Remaining API Calls: ${250 - (20 + this.stats.apiCallsUsed)}`);
    console.log(`Cost This Run: $${(this.stats.apiCallsUsed * 0.01).toFixed(2)}`);
    console.log(`Total Cost: $${((20 + this.stats.apiCallsUsed) * 0.01).toFixed(2)}`);
    
    console.log('\n🎯 RESULTS:');
    if (this.stats.newlyUpdated > 0) {
      console.log(`✅ Successfully updated ${this.stats.newlyUpdated} more hotels`);
      console.log(`📸 Added ${this.stats.photosAdded} more high-quality photos`);
      console.log(`🏨 ${this.stats.alreadyUpdated} hotels already had SerpApi photos`);
      console.log(`⏭️ ${this.stats.skipped} hotels kept existing photos`);
    } else {
      console.log('✅ All hotels already processed!');
    }
    
    console.log('\n🚀 SYSTEM STATUS:');
    console.log(`Total Hotels with SerpApi Photos: ${this.stats.alreadyUpdated + this.stats.newlyUpdated}`);
    console.log(`Total Hotels with Original Photos: ${this.stats.skipped}`);
    console.log(`Overall Success Rate: ${Math.round((this.stats.alreadyUpdated + this.stats.newlyUpdated) / this.stats.total * 100)}%`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the processing
async function runRemainingHotelsProcessing() {
  const processor = new RemainingHotelsProcessor();
  await processor.processRemainingHotels();
}

runRemainingHotelsProcessing();
