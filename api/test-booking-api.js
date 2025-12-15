const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class BookingApiTester {
  constructor() {
    // Your RapidAPI key
    this.rapidApiKey = '16a8c91176msh728dc775b0ebbb4p15464ajsn09d3e69bcd89';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      photosFound: 0,
      highQualityPhotos: 0
    };
  }

  async testBookingApi() {
    console.log('🔍 TESTING BOOKING.COM RAPIDAPI');
    console.log('='.repeat(50));
    console.log('🎯 Target: 5 hotels from Supabase database');
    console.log('📸 Quality: High-resolution hotel photos');
    console.log('🔑 API: Booking.com via RapidAPI');
    
    // First, get 5 hotels from Supabase
    const hotels = await this.getHotelsFromSupabase();
    
    if (hotels.length === 0) {
      console.log('❌ No hotels found in Supabase database');
      return;
    }
    
    console.log('\n📋 TEST HOTELS FROM SUPABASE:');
    hotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    console.log('\n🚀 Starting photo fetch tests...\n');
    
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      console.log(`\n🏨 [${i + 1}/${hotels.length}] Testing: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      
      await this.testHotelPhotos(hotel);
      
      // Rate limiting
      if (i < hotels.length - 1) {
        console.log('⏳ Waiting 2 seconds before next hotel...');
        await this.sleep(2000);
      }
    }
    
    this.generateTestReport();
  }

  async getHotelsFromSupabase() {
    try {
      const { data, error } = await this.supabase
        .from('hotels')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching hotels:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
      return [];
    }
  }

  async testHotelPhotos(hotel) {
    this.stats.total++;
    
    try {
      // First, search for the hotel to get hotel_id
      console.log(`  🔍 Searching for hotel ID...`);
      const hotelId = await this.searchHotelId(hotel);
      
      if (!hotelId) {
        console.log(`  ❌ No hotel ID found for ${hotel.name}`);
        this.stats.failed++;
        return;
      }
      
      console.log(`  ✅ Found hotel ID: ${hotelId}`);
      
      // Now get photos using the hotel ID
      console.log(`  📸 Fetching photos...`);
      const photos = await this.getHotelPhotos(hotelId);
      
      if (photos.length > 0) {
        console.log(`  ✅ Found ${photos.length} photos`);
        
        // Analyze photo quality
        const qualityAnalysis = this.analyzePhotoQuality(photos);
        console.log(`  📊 Quality analysis:`);
        console.log(`     • HD+ photos: ${qualityAnalysis.hdPlus}`);
        console.log(`     • 4K photos: ${qualityAnalysis.fourK}`);
        console.log(`     • Average resolution: ${qualityAnalysis.avgResolution}`);
        
        this.stats.success++;
        this.stats.photosFound += photos.length;
        this.stats.highQualityPhotos += qualityAnalysis.hdPlus;
        
        // Show sample photo URLs
        console.log(`  🔗 Sample photo URLs:`);
        photos.slice(0, 3).forEach((photo, index) => {
          console.log(`     ${index + 1}. ${photo.url} (${photo.width}x${photo.height})`);
        });
        
        // Update hotel in database
        await this.updateHotelPhotos(hotel, photos);
        
      } else {
        console.log(`  ❌ No photos found for ${hotel.name}`);
        this.stats.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${hotel.name}: ${error.message}`);
      this.stats.failed++;
    }
  }

  async searchHotelId(hotel) {
    try {
      const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
        params: {
          dest_id: hotel.city.toLowerCase().replace(' ', '-'),
          checkin_date: '2024-02-01',
          checkout_date: '2024-02-02',
          adults_number: 2,
          room_number: 1
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      });

      if (!response.data.result || response.data.result.length === 0) {
        return null;
      }

      // Find matching hotel
      const matchingHotel = response.data.result.find(h => 
        h.hotel_name.toLowerCase().includes(hotel.name.toLowerCase()) ||
        hotel.name.toLowerCase().includes(h.hotel_name.toLowerCase())
      );

      return matchingHotel ? matchingHotel.hotel_id : null;

    } catch (error) {
      console.log(`  ⚠️ Search error: ${error.message}`);
      return null;
    }
  }

  async getHotelPhotos(hotelId) {
    try {
      const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/photos', {
        params: {
          hotel_id: hotelId,
          locale: 'en-gb'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      });

      if (!response.data.result) {
        return [];
      }

      return response.data.result.map((photo, index) => ({
        url: photo.url_max || photo.url_original || photo.url,
        width: photo.width || 1920,
        height: photo.height || 1080,
        source: 'booking_com',
        description: `${photo.caption || 'Hotel photo'} ${index + 1}`,
        photoReference: `booking_${hotelId}_${index}`
      }));

    } catch (error) {
      throw new Error(`Booking.com API: ${error.message}`);
    }
  }

  analyzePhotoQuality(photos) {
    let hdPlus = 0;
    let fourK = 0;
    let totalPixels = 0;

    photos.forEach(photo => {
      const pixels = photo.width * photo.height;
      totalPixels += pixels;
      
      if (pixels >= 1920 * 1080) hdPlus++;
      if (pixels >= 3840 * 2160) fourK++;
    });

    const avgPixels = totalPixels / photos.length;
    const avgResolution = Math.round(Math.sqrt(avgPixels));

    return {
      hdPlus,
      fourK,
      avgResolution: `${avgResolution}x${Math.round(avgResolution * 0.5625)}` // 16:9 aspect ratio
    };
  }

  async updateHotelPhotos(hotel, photos) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: photos.map(p => p.url),
          hero_photo: photos[0]?.url || null,
          updated_at: new Date().toISOString()
        })
        .eq('name', hotel.name)
        .eq('city', hotel.city);

      if (error) {
        console.log(`  ⚠️ Database update failed: ${error.message}`);
      } else {
        console.log(`  ✅ Database updated successfully`);
      }
    } catch (error) {
      console.log(`  ⚠️ Database error: ${error.message}`);
    }
  }

  generateTestReport() {
    console.log('\n📊 BOOKING.COM API TEST REPORT');
    console.log('='.repeat(50));
    console.log(`📈 Total hotels tested: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📸 Total photos found: ${this.stats.photosFound}`);
    console.log(`🎯 HD+ photos: ${this.stats.highQualityPhotos}`);
    console.log(`📊 Success rate: ${Math.round((this.stats.success / this.stats.total) * 100)}%`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.stats.success >= 4) {
      console.log('✅ Excellent! Booking.com API is working well');
      console.log('🚀 Ready to implement for all hotels');
    } else if (this.stats.success >= 2) {
      console.log('⚠️ Good results, but some hotels need alternative sources');
      console.log('🔄 Consider fallback to other photo services');
    } else {
      console.log('❌ Poor results - need to check API configuration');
      console.log('🔄 Consider alternative photo sources');
    }
    
    console.log('\n💰 COST ANALYSIS:');
    console.log(`• Booking.com API: Free tier available`);
    console.log(`• Estimated monthly cost: $0 (free tier)`);
    console.log(`• Cost per hotel: $0`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new BookingApiTester();
  await tester.testBookingApi();
}

runTest().catch(console.error);
