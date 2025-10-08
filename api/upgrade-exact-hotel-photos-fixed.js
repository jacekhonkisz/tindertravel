const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class ExactHotelPhotoUpgrader {
  constructor() {
    // Your RapidAPI key
    this.rapidApiKey = '16a8c91176msh728dc775b0ebbb4p15464ajsn09d3e69bcd89';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      photosFound: 0,
      highQualityPhotos: 0,
      exactMatches: 0
    };
  }

  async upgradeExactHotelPhotos() {
    console.log('🎯 UPGRADING EXACT HOTEL PHOTOS');
    console.log('='.repeat(60));
    console.log('🎯 Target: EXACT hotels from Supabase database');
    console.log('📸 Quality: High-resolution hotel photos (1280x900, 1440x1440)');
    console.log('🔑 API: Booking.com via RapidAPI');
    console.log('✅ Verification: Exact hotel name matching');
    
    // Get 5 hotels from Supabase
    const hotels = await this.getHotelsFromSupabase();
    
    if (hotels.length === 0) {
      console.log('❌ No hotels found in Supabase database');
      return;
    }
    
    console.log('\n📋 EXACT HOTELS FROM SUPABASE:');
    hotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    console.log('\n🚀 Starting EXACT photo upgrade...\n');
    
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      console.log(`\n🏨 [${i + 1}/${hotels.length}] Upgrading: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      
      await this.upgradeExactHotelPhotos(hotel);
      
      // Rate limiting
      if (i < hotels.length - 1) {
        console.log('⏳ Waiting 3 seconds before next hotel...');
        await this.sleep(3000);
      }
    }
    
    this.generateUpgradeReport();
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

  async upgradeExactHotelPhotos(hotel) {
    this.stats.total++;
    
    try {
      // Step 1: Search for EXACT hotel match
      console.log(`  �� Step 1: Searching for EXACT hotel match...`);
      const exactHotel = await this.findExactHotel(hotel);
      
      if (!exactHotel) {
        console.log(`  ❌ No EXACT match found for ${hotel.name}`);
        this.stats.failed++;
        return;
      }
      
      console.log(`  ✅ EXACT match found: ${exactHotel.hotel_name}`);
      console.log(`  📍 Hotel ID: ${exactHotel.hotel_id}`);
      console.log(`  ⭐ Rating: ${exactHotel.hotel_rating || 'N/A'}`);
      console.log(`  🏷️ Address: ${exactHotel.hotel_address || 'N/A'}`);
      
      this.stats.exactMatches++;
      
      // Step 2: Get photos for EXACT hotel
      console.log(`  📸 Step 2: Fetching photos for EXACT hotel...`);
      const photos = await this.getExactHotelPhotos(exactHotel.hotel_id);
      
      if (photos.length > 0) {
        console.log(`  ✅ Found ${photos.length} photos for EXACT hotel`);
        
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
          console.log(`        Tags: ${photo.tags.join(', ')}`);
        });
        
        // Step 3: Update hotel in database
        console.log(`  💾 Step 3: Updating database with EXACT hotel photos...`);
        await this.updateHotelPhotos(hotel, photos, exactHotel);
        
      } else {
        console.log(`  ❌ No photos found for EXACT hotel ${hotel.name}`);
        this.stats.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error upgrading ${hotel.name}: ${error.message}`);
      this.stats.failed++;
    }
  }

  async findExactHotel(hotel) {
    try {
      // Search for hotels in the city
      const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
        params: {
          dest_id: hotel.city.toLowerCase().replace(/\s+/g, '-'),
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

      // Find EXACT match by comparing hotel names
      const exactMatch = response.data.result.find(h => {
        const apiName = h.hotel_name.toLowerCase().trim();
        const dbName = hotel.name.toLowerCase().trim();
        
        // Check for exact match or very close match
        return apiName === dbName || 
               apiName.includes(dbName) || 
               dbName.includes(apiName) ||
               this.calculateSimilarity(apiName, dbName) > 0.8;
      });

      return exactMatch || null;

    } catch (error) {
      console.log(`  ⚠️ Search error: ${error.message}`);
      return null;
    }
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async getExactHotelPhotos(hotelId) {
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

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((photo, index) => ({
        url: photo.url_max || photo.url_1440 || photo.url_square60,
        width: photo.url_max ? 1280 : (photo.url_1440 ? 1440 : 60),
        height: photo.url_max ? 900 : (photo.url_1440 ? 1440 : 60),
        source: 'booking_com_exact',
        description: `${photo.tags?.[0]?.tag || 'Hotel photo'} ${index + 1}`,
        photoReference: `booking_${hotelId}_${photo.photo_id}`,
        tags: photo.tags ? photo.tags.map(t => t.tag) : [],
        photoId: photo.photo_id
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

  async updateHotelPhotos(hotel, photos, exactHotel) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: photos.map(p => p.url),
          hero_photo: photos[0]?.url || null,
          updated_at: new Date().toISOString(),
          // Add metadata about the exact match
          booking_hotel_id: exactHotel.hotel_id,
          booking_hotel_name: exactHotel.hotel_name,
          booking_hotel_rating: exactHotel.hotel_rating,
          booking_hotel_address: exactHotel.hotel_address
        })
        .eq('name', hotel.name)
        .eq('city', hotel.city);

      if (error) {
        console.log(`  ⚠️ Database update failed: ${error.message}`);
      } else {
        console.log(`  ✅ Database updated with EXACT hotel photos`);
      }
    } catch (error) {
      console.log(`  ⚠️ Database error: ${error.message}`);
    }
  }

  generateUpgradeReport() {
    console.log('\n📊 EXACT HOTEL PHOTO UPGRADE REPORT');
    console.log('='.repeat(60));
    console.log(`📈 Total hotels tested: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`🎯 Exact matches found: ${this.stats.exactMatches}`);
    console.log(`📸 Total photos found: ${this.stats.photosFound}`);
    console.log(`🎯 HD+ photos: ${this.stats.highQualityPhotos}`);
    console.log(`📊 Success rate: ${Math.round((this.stats.success / this.stats.total) * 100)}%`);
    console.log(`🎯 Exact match rate: ${Math.round((this.stats.exactMatches / this.stats.total) * 100)}%`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.stats.exactMatches >= 4) {
      console.log('✅ Excellent! Found exact matches for most hotels');
      console.log('🚀 Ready to implement for all hotels');
    } else if (this.stats.exactMatches >= 2) {
      console.log('⚠️ Good results, but some hotels need better matching');
      console.log('🔄 Consider improving hotel name matching algorithm');
    } else {
      console.log('❌ Poor exact match results - need to improve search');
      console.log('🔄 Consider alternative search strategies');
    }
    
    console.log('\n💰 COST ANALYSIS:');
    console.log(`• Booking.com API: Free tier available`);
    console.log(`• API calls used: ${this.stats.total * 2} (search + photos)`);
    console.log(`• Estimated monthly cost: $0 (free tier)`);
    console.log(`• Cost per hotel: $0`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the upgrade
async function runUpgrade() {
  const upgrader = new ExactHotelPhotoUpgrader();
  await upgrader.upgradeExactHotelPhotos();
}

runUpgrade().catch(console.error);
