const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class SerpApiTagger {
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
      tagged: 0,
      skipped: 0,
      failed: 0
    };
  }

  async tagSerpApiHotels() {
    console.log('🏷️ Tagging hotels that have SerpApi photos...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to check`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.checkAndTagHotel(hotel);
        await this.sleep(1000); // Rate limiting
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Tagging failed:', error.message);
    }
  }

  async checkAndTagHotel(hotel) {
    try {
      console.log(`\n🔍 Checking ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel already has SerpApi tag
      const hasSerpApiTag = hotel.tags && hotel.tags.includes('serpapi_photos');
      
      if (hasSerpApiTag) {
        this.stats.skipped++;
        console.log(`   ⏭️ Already tagged with SerpApi photos`);
        return;
      }
      
      // Check if SerpApi has photos for this hotel
      const hasSerpApiPhotos = await this.checkSerpApiPhotos(hotel);
      
      if (hasSerpApiPhotos) {
        // Tag the hotel
        const success = await this.tagHotel(hotel.id, 'serpapi_photos');
        
        if (success) {
          this.stats.tagged++;
          console.log(`   ✅ Tagged as having SerpApi photos`);
        } else {
          this.stats.failed++;
          console.log(`   ❌ Failed to tag hotel`);
        }
      } else {
        this.stats.skipped++;
        console.log(`   ⏭️ No SerpApi photos available - not tagged`);
      }
      
    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Error checking hotel: ${error.message}`);
    }
  }

  async checkSerpApiPhotos(hotel) {
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
        timeout: 10000
      });

      const hotels = response.data.properties || [];
      if (hotels.length === 0) {
        return false;
      }

      const foundHotel = hotels[0];
      const photos = foundHotel.images || [];
      
      return photos.length > 0;
      
    } catch (error) {
      console.log(`     ⚠️ SerpApi error: ${error.message}`);
      return false;
    }
  }

  async tagHotel(hotelId, tag) {
    try {
      // Add tag to hotel
      const { error } = await this.supabase
        .from('hotels')
        .update({ 
          tags: [tag],
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
    console.log('\n📊 TAGGING SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Hotels Checked: ${this.stats.total}`);
    console.log(`Hotels Tagged: ${this.stats.tagged}`);
    console.log(`Hotels Skipped: ${this.stats.skipped}`);
    console.log(`Hotels Failed: ${this.stats.failed}`);
    
    console.log('\n🏷️ TAGS ADDED:');
    console.log(`✅ ${this.stats.tagged} hotels tagged with 'serpapi_photos'`);
    console.log(`⏭️ ${this.stats.skipped} hotels not tagged (no SerpApi photos)`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Hotels with "serpapi_photos" tag have SerpApi photos available');
    console.log('2. You can avoid touching these hotels in future photo updates');
    console.log('3. Use the tag to identify which hotels to skip');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the tagging
async function runTagging() {
  const tagger = new SerpApiTagger();
  await tagger.tagSerpApiHotels();
}

runTagging();
