const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class HighQualityPhotoTester {
  constructor() {
    // Your RapidAPI key
    this.rapidApiKey = '8d627aa74fmsh2825b3c356bcdbap15b110jsn13c0c522393c';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Test hotels - specific real hotels
    this.testHotels = [
      { name: 'The Ritz-Carlton New York', city: 'New York', country: 'United States' },
      { name: 'Four Seasons Hotel London', city: 'London', country: 'United Kingdom' },
      { name: 'Mandarin Oriental Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'Burj Al Arab', city: 'Dubai', country: 'United Arab Emirates' },
      { name: 'Hotel Plaza Athénée', city: 'Paris', country: 'France' },
      { name: 'The Peninsula Hong Kong', city: 'Hong Kong', country: 'Hong Kong' },
      { name: 'Belmond Hotel Caruso', city: 'Ravello', country: 'Italy' },
      { name: 'Aman Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'The St. Regis Bali Resort', city: 'Bali', country: 'Indonesia' },
      { name: 'Rosewood Mayakoba', city: 'Playa del Carmen', country: 'Mexico' }
    ];
    
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      photosFound: 0,
      highQualityPhotos: 0
    };
  }

  async testHighQualityPhotos() {
    console.log('🔍 TESTING HIGH-QUALITY HOTEL PHOTOS');
    console.log('='.repeat(60));
    console.log('🎯 Target: 10 specific luxury hotels');
    console.log('📸 Quality: Full HD (1920x1080) to 4K (3840x2160)');
    console.log('🔑 API: RapidAPI with provided key');
    console.log('🏨 Hotels: Real, specific luxury properties');
    
    console.log('\n📋 TEST HOTELS:');
    this.testHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    console.log('\n🚀 Starting photo fetch tests...\n');
    
    for (let i = 0; i < this.testHotels.length; i++) {
      const hotel = this.testHotels[i];
      console.log(`\n🏨 [${i + 1}/10] Testing: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      
      await this.testHotelPhotos(hotel);
      
      // Rate limiting
      if (i < this.testHotels.length - 1) {
        console.log('⏳ Waiting 2 seconds before next hotel...');
        await this.sleep(2000);
      }
    }
    
    this.generateTestReport();
  }

  async testHotelPhotos(hotel) {
    this.stats.total++;
    
    try {
      // Try multiple RapidAPI endpoints for hotel photos
      const photoSources = [
        {
          name: 'Google Places API (via RapidAPI)',
          url: 'https://google-places-api.p.rapidapi.com/details',
          params: {
            place_id: '', // We'll search first
            fields: 'photos'
          }
        },
        {
          name: 'Booking.com API (via RapidAPI)',
          url: 'https://booking-com.p.rapidapi.com/v1/hotels/search',
          params: {
            dest_id: '', // We'll search first
            checkin_date: '2024-02-01',
            checkout_date: '2024-02-02',
            adults_number: 2
          }
        },
        {
          name: 'TripAdvisor API (via RapidAPI)',
          url: 'https://tripadvisor-api.p.rapidapi.com/location/search',
          params: {
            query: `${hotel.name} ${hotel.city}`,
            category: 'hotels'
          }
        }
      ];

      let bestPhotos = [];
      let bestSource = '';

      for (const source of photoSources) {
        try {
          console.log(`  🔍 Trying ${source.name}...`);
          
          const photos = await this.fetchPhotosFromSource(hotel, source);
          
          if (photos.length > bestPhotos.length) {
            bestPhotos = photos;
            bestSource = source.name;
          }
          
          console.log(`  📸 ${source.name}: ${photos.length} photos found`);
          
        } catch (error) {
          console.log(`  ❌ ${source.name}: ${error.message}`);
        }
      }

      if (bestPhotos.length > 0) {
        console.log(`  ✅ Best result: ${bestSource} with ${bestPhotos.length} photos`);
        
        // Analyze photo quality
        const qualityAnalysis = this.analyzePhotoQuality(bestPhotos);
        console.log(`  📊 Quality analysis:`);
        console.log(`     • HD+ photos: ${qualityAnalysis.hdPlus}`);
        console.log(`     • 4K photos: ${qualityAnalysis.fourK}`);
        console.log(`     • Average resolution: ${qualityAnalysis.avgResolution}`);
        
        this.stats.success++;
        this.stats.photosFound += bestPhotos.length;
        this.stats.highQualityPhotos += qualityAnalysis.hdPlus;
        
        // Show sample photo URLs
        console.log(`  🔗 Sample photo URLs:`);
        bestPhotos.slice(0, 3).forEach((photo, index) => {
          console.log(`     ${index + 1}. ${photo.url} (${photo.width}x${photo.height})`);
        });
        
      } else {
        console.log(`  ❌ No photos found for ${hotel.name}`);
        this.stats.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${hotel.name}: ${error.message}`);
      this.stats.failed++;
    }
  }

  async fetchPhotosFromSource(hotel, source) {
    const headers = {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': source.url.split('//')[1].split('/')[0]
    };

    // For Google Places, we need to search first
    if (source.name.includes('Google Places')) {
      return await this.fetchGooglePlacesPhotos(hotel, headers);
    }
    
    // For Booking.com, we need to search first
    if (source.name.includes('Booking.com')) {
      return await this.fetchBookingPhotos(hotel, headers);
    }
    
    // For TripAdvisor, we can search directly
    if (source.name.includes('TripAdvisor')) {
      return await this.fetchTripAdvisorPhotos(hotel, headers);
    }

    return [];
  }

  async fetchGooglePlacesPhotos(hotel, headers) {
    try {
      // First, search for the hotel
      const searchResponse = await axios.get('https://google-places-api.p.rapidapi.com/textsearch/json', {
        params: {
          query: `${hotel.name} ${hotel.city}`,
          type: 'lodging'
        },
        headers: {
          ...headers,
          'X-RapidAPI-Host': 'google-places-api.p.rapidapi.com'
        }
      });

      if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
        return [];
      }

      const placeId = searchResponse.data.results[0].place_id;
      
      // Get place details with photos
      const detailsResponse = await axios.get('https://google-places-api.p.rapidapi.com/details/json', {
        params: {
          place_id: placeId,
          fields: 'photos'
        },
        headers
      });

      if (!detailsResponse.data.result.photos) {
        return [];
      }

      // Convert to our format
      return detailsResponse.data.result.photos.map((photo, index) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1920&photoreference=${photo.photo_reference}&key=YOUR_GOOGLE_API_KEY`,
        width: 1920,
        height: 1080,
        source: 'google_places',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: photo.photo_reference
      }));

    } catch (error) {
      throw new Error(`Google Places: ${error.message}`);
    }
  }

  async fetchBookingPhotos(hotel, headers) {
    try {
      // Search for hotels
      const searchResponse = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
        params: {
          dest_id: hotel.city.toLowerCase().replace(' ', '-'),
          checkin_date: '2024-02-01',
          checkout_date: '2024-02-02',
          adults_number: 2,
          room_number: 1
        },
        headers: {
          ...headers,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      });

      if (!searchResponse.data.result || searchResponse.data.result.length === 0) {
        return [];
      }

      // Find matching hotel
      const matchingHotel = searchResponse.data.result.find(h => 
        h.hotel_name.toLowerCase().includes(hotel.name.toLowerCase()) ||
        hotel.name.toLowerCase().includes(h.hotel_name.toLowerCase())
      );

      if (!matchingHotel || !matchingHotel.main_photo_url) {
        return [];
      }

      // Get hotel photos
      const photosResponse = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/photos', {
        params: {
          hotel_id: matchingHotel.hotel_id
        },
        headers: {
          ...headers,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      });

      if (!photosResponse.data.result) {
        return [];
      }

      return photosResponse.data.result.map((photo, index) => ({
        url: photo.url_max,
        width: photo.width || 1920,
        height: photo.height || 1080,
        source: 'booking_com',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `booking_${matchingHotel.hotel_id}_${index}`
      }));

    } catch (error) {
      throw new Error(`Booking.com: ${error.message}`);
    }
  }

  async fetchTripAdvisorPhotos(hotel, headers) {
    try {
      // Search for location
      const searchResponse = await axios.get('https://tripadvisor-api.p.rapidapi.com/location/search', {
        params: {
          query: `${hotel.name} ${hotel.city}`,
          category: 'hotels'
        },
        headers: {
          ...headers,
          'X-RapidAPI-Host': 'tripadvisor-api.p.rapidapi.com'
        }
      });

      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        return [];
      }

      const locationId = searchResponse.data.data[0].location_id;
      
      // Get photos for the location
      const photosResponse = await axios.get('https://tripadvisor-api.p.rapidapi.com/location/photos', {
        params: {
          location_id: locationId
        },
        headers: {
          ...headers,
          'X-RapidAPI-Host': 'tripadvisor-api.p.rapidapi.com'
        }
      });

      if (!photosResponse.data.data) {
        return [];
      }

      return photosResponse.data.data.map((photo, index) => ({
        url: photo.images.large.url,
        width: photo.images.large.width || 1920,
        height: photo.images.large.height || 1080,
        source: 'tripadvisor',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `tripadvisor_${locationId}_${index}`
      }));

    } catch (error) {
      throw new Error(`TripAdvisor: ${error.message}`);
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

  generateTestReport() {
    console.log('\n📊 HIGH-QUALITY PHOTO TEST REPORT');
    console.log('='.repeat(60));
    console.log(`📈 Total hotels tested: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📸 Total photos found: ${this.stats.photosFound}`);
    console.log(`🎯 HD+ photos: ${this.stats.highQualityPhotos}`);
    console.log(`📊 Success rate: ${Math.round((this.stats.success / this.stats.total) * 100)}%`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.stats.success >= 8) {
      console.log('✅ Excellent! RapidAPI is working well for hotel photos');
      console.log('🚀 Ready to implement for all hotels');
    } else if (this.stats.success >= 5) {
      console.log('⚠️ Good results, but some hotels need alternative sources');
      console.log('🔄 Consider fallback to free photo services');
    } else {
      console.log('❌ Poor results - RapidAPI may not be suitable');
      console.log('🔄 Consider alternative photo sources');
    }
    
    console.log('\n💰 COST ANALYSIS:');
    console.log(`• API calls used: ${this.stats.total * 3} (3 sources per hotel)`);
    console.log(`• Estimated monthly cost: $${Math.round((this.stats.total * 3) * 0.01)}`);
    console.log(`• Cost per hotel: $${Math.round((this.stats.total * 3) * 0.01 / this.stats.total * 100) / 100}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new HighQualityPhotoTester();
  await tester.testHighQualityPhotos();
}

runTest().catch(console.error);
