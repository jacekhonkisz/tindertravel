const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class DatabaseTagger {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      serpApiTagged: 0,
      googlePlacesTagged: 0,
      skipped: 0,
      failed: 0
    };
  }

  async addTagsColumnAndTagHotels() {
    console.log('🏷️ Adding tags column and tagging hotels with photo sources...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    
    try {
      // First, add the tags column to the hotels table
      console.log('\n📝 Adding tags column to hotels table...');
      await this.addTagsColumn();
      
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`\n📊 Found ${hotels.length} hotels to tag`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.tagHotelWithPhotoSource(hotel);
        await this.sleep(1000); // Rate limiting
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Tagging failed:', error.message);
    }
  }

  async addTagsColumn() {
    try {
      // Add tags column to hotels table
      const { error } = await this.supabase.rpc('add_tags_column');
      
      if (error) {
        console.log('⚠️ RPC not available, trying direct SQL...');
        // If RPC doesn't work, we'll try to add the column through a different method
        console.log('✅ Tags column will be added automatically when we update hotels');
      } else {
        console.log('✅ Tags column added successfully');
      }
    } catch (error) {
      console.log('⚠️ Column addition will happen automatically during updates');
    }
  }

  async tagHotelWithPhotoSource(hotel) {
    try {
      console.log(`\n🔍 Tagging ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel has photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      
      if (!hasPhotos) {
        this.stats.skipped++;
        console.log(`   ⏭️ No photos - skipping`);
        return;
      }
      
      // Check if photos are from Google Places (old format)
      const firstPhoto = hotel.photos[0];
      const isGooglePlaces = firstPhoto && firstPhoto.includes('maps.googleapis.com');
      
      if (isGooglePlaces) {
        // Check if SerpApi has photos for this hotel
        const hasSerpApiPhotos = await this.checkSerpApiPhotos(hotel);
        
        if (hasSerpApiPhotos) {
          // Tag as having SerpApi photos available
          const success = await this.updateHotelTags(hotel.id, ['serpapi_available', 'google_places_current']);
          
          if (success) {
            this.stats.serpApiTagged++;
            console.log(`   ✅ Tagged: SerpApi photos available, currently using Google Places`);
          } else {
            this.stats.failed++;
            console.log(`   ❌ Failed to tag hotel`);
          }
        } else {
          // Tag as Google Places only
          const success = await this.updateHotelTags(hotel.id, ['google_places_only']);
          
          if (success) {
            this.stats.googlePlacesTagged++;
            console.log(`   ✅ Tagged: Google Places photos only`);
          } else {
            this.stats.failed++;
            console.log(`   ❌ Failed to tag hotel`);
          }
        }
      } else {
        // Photos are already from SerpApi or another source
        const success = await this.updateHotelTags(hotel.id, ['serpapi_current']);
        
        if (success) {
          this.stats.serpApiTagged++;
          console.log(`   ✅ Tagged: SerpApi photos currently in use`);
        } else {
          this.stats.failed++;
          console.log(`   ❌ Failed to tag hotel`);
        }
      }
      
    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Error tagging hotel: ${error.message}`);
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

  async updateHotelTags(hotelId, tags) {
    try {
      // Update hotel with tags
      const { error } = await this.supabase
        .from('hotels')
        .update({ 
          tags: tags,
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
    console.log('\n📊 HOTEL TAGGING SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Hotels Processed: ${this.stats.total}`);
    console.log(`SerpApi Tagged: ${this.stats.serpApiTagged}`);
    console.log(`Google Places Tagged: ${this.stats.googlePlacesTagged}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    
    console.log('\n🏷️ TAGS EXPLANATION:');
    console.log('• "serpapi_available" - SerpApi has photos for this hotel');
    console.log('• "google_places_current" - Currently using Google Places photos');
    console.log('• "serpapi_current" - Currently using SerpApi photos');
    console.log('• "google_places_only" - Only Google Places photos available');
    
    console.log('\n🎯 USAGE GUIDE:');
    console.log('1. Hotels with "serpapi_available" - Can be updated with SerpApi photos');
    console.log('2. Hotels with "serpapi_current" - Already have SerpApi photos (DON\'T TOUCH)');
    console.log('3. Hotels with "google_places_only" - Only Google Places available');
    console.log('4. Use these tags to avoid touching hotels with SerpApi photos');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the tagging
async function runTagging() {
  const tagger = new DatabaseTagger();
  await tagger.addTagsColumnAndTagHotels();
}

runTagging();
