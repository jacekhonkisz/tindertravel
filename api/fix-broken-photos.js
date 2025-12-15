const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class BrokenPhotosFixer {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async fixBrokenPhotos() {
    console.log('🔧 FIXING BROKEN SERPAPI PHOTOS');
    console.log('='.repeat(50));
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      // Find hotels with broken JSON photos
      const brokenHotels = hotels.filter(hotel => 
        hotel.photos && 
        hotel.photos.length > 0 && 
        typeof hotel.photos[0] === 'string' && 
        hotel.photos[0].startsWith('{')
      );
      
      console.log(`📊 Found ${brokenHotels.length} hotels with broken JSON photos`);
      
      if (brokenHotels.length === 0) {
        console.log('✅ No broken photos found!');
        return;
      }
      
      // Show what we have (broken)
      console.log('\n❌ CURRENT BROKEN FORMAT:');
      console.log(brokenHotels[0].photos[0]);
      
      // Fix each broken hotel
      for (const hotel of brokenHotels) {
        await this.fixHotelPhotos(hotel);
        await this.sleep(2000); // Rate limiting
      }
      
      console.log('\n✅ All broken photos fixed!');
      
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
    }
  }

  async fixHotelPhotos(hotel) {
    try {
      console.log(`\n🔧 Fixing ${hotel.name}...`);
      
      // Get fresh SerpApi photos with proper URLs
      const serpApiPhotos = await this.getSerpApiPhotosWithUrls(hotel);
      
      if (serpApiPhotos.length > 0) {
        console.log(`   ✅ Found ${serpApiPhotos.length} photos with URLs`);
        
        // Show the correct format
        console.log(`   📸 Correct format: ${serpApiPhotos[0].url.substring(0, 80)}...`);
        
        // Update hotel with proper URLs
        const success = await this.updateHotelPhotos(hotel.id, serpApiPhotos);
        
        if (success) {
          console.log(`   ✅ Photos fixed successfully`);
        } else {
          console.log(`   ❌ Failed to update photos`);
        }
      } else {
        console.log(`   ⚠️ No SerpApi photos found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error fixing hotel: ${error.message}`);
    }
  }

  async getSerpApiPhotosWithUrls(hotel) {
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

      // Extract ACTUAL URLs (not just metadata)
      return photos.slice(0, 8).map((photo, index) => ({
        url: photo.url, // THIS IS THE ACTUAL IMAGE URL
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the fix
async function runFix() {
  const fixer = new BrokenPhotosFixer();
  await fixer.fixBrokenPhotos();
}

runFix();
