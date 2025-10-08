require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class AmadeusPhotoChecker {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.amadeusClientId = process.env.AMADEUS_CLIENT_ID;
    this.amadeusClientSecret = process.env.AMADEUS_CLIENT_SECRET;
    this.amadeusBaseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
    
    if (!this.amadeusClientId || !this.amadeusClientSecret) {
      console.warn('⚠️ Amadeus credentials not configured properly');
    }
  }

  async checkAmadeusConnection() {
    console.log('🔍 Testing Amadeus API connection...');
    
    if (!this.amadeusClientId || this.amadeusClientId === 'your_amadeus_client_id') {
      console.log('❌ Amadeus credentials not configured');
      console.log('   Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your .env file');
      return false;
    }

    try {
      // Get access token
      const tokenResponse = await axios.post(`${this.amadeusBaseUrl}/v1/security/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.amadeusClientId,
        client_secret: this.amadeusClientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (tokenResponse.data.access_token) {
        console.log('✅ Amadeus API connection successful');
        return true;
      }
    } catch (error) {
      console.log('❌ Amadeus API connection failed:', error.response?.data?.error_description || error.message);
      return false;
    }
  }

  async checkDatabasePhotos() {
    console.log('\n📊 Checking photos in your database...');
    
    try {
      // Get all hotels from database
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, photos, tags')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`\n📋 Found ${hotels.length} hotels in database`);

      // Analyze photos
      let hotelsWithPhotos = 0;
      let hotelsWithAmadeusPhotos = 0;
      let hotelsWithGenericPhotos = 0;
      let hotelsWithNoPhotos = 0;
      let totalPhotos = 0;

      const photoAnalysis = {
        amadeus: 0,
        unsplash: 0,
        google_places: 0,
        booking_com: 0,
        tripadvisor: 0,
        other: 0
      };

      for (const hotel of hotels) {
        if (hotel.photos && hotel.photos.length > 0) {
          hotelsWithPhotos++;
          totalPhotos += hotel.photos.length;
          
          // Check photo sources
          const hasAmadeusPhotos = hotel.photos.some(url => 
            url.includes('amadeus') || url.includes('test.api.amadeus')
          );
          const hasGenericPhotos = hotel.photos.some(url => 
            url.includes('unsplash') || url.includes('pexels') || url.includes('pixabay')
          );
          
          if (hasAmadeusPhotos) {
            hotelsWithAmadeusPhotos++;
          }
          if (hasGenericPhotos) {
            hotelsWithGenericPhotos++;
          }

          // Count photo sources
          hotel.photos.forEach(url => {
            if (url.includes('amadeus')) photoAnalysis.amadeus++;
            else if (url.includes('unsplash')) photoAnalysis.unsplash++;
            else if (url.includes('google')) photoAnalysis.google_places++;
            else if (url.includes('booking')) photoAnalysis.booking_com++;
            else if (url.includes('tripadvisor')) photoAnalysis.tripadvisor++;
            else photoAnalysis.other++;
          });
        } else {
          hotelsWithNoPhotos++;
        }
      }

      // Display results
      console.log('\n📸 Photo Analysis:');
      console.log(`   Hotels with photos: ${hotelsWithPhotos}/${hotels.length} (${((hotelsWithPhotos/hotels.length)*100).toFixed(1)}%)`);
      console.log(`   Hotels with Amadeus photos: ${hotelsWithAmadeusPhotos}/${hotels.length} (${((hotelsWithAmadeusPhotos/hotels.length)*100).toFixed(1)}%)`);
      console.log(`   Hotels with generic photos: ${hotelsWithGenericPhotos}/${hotels.length} (${((hotelsWithGenericPhotos/hotels.length)*100).toFixed(1)}%)`);
      console.log(`   Hotels with no photos: ${hotelsWithNoPhotos}/${hotels.length} (${((hotelsWithNoPhotos/hotels.length)*100).toFixed(1)}%)`);
      console.log(`   Total photos: ${totalPhotos}`);

      console.log('\n🔍 Photo Sources:');
      Object.entries(photoAnalysis).forEach(([source, count]) => {
        if (count > 0) {
          console.log(`   ${source}: ${count} photos`);
        }
      });

      // Show sample hotels with Amadeus photos
      if (hotelsWithAmadeusPhotos > 0) {
        console.log('\n🏨 Sample hotels with Amadeus photos:');
        const amadeusHotels = hotels.filter(hotel => 
          hotel.photos && hotel.photos.some(url => url.includes('amadeus'))
        ).slice(0, 5);
        
        amadeusHotels.forEach((hotel, index) => {
          console.log(`   ${index + 1}. ${hotel.name} (${hotel.city})`);
          console.log(`      Photos: ${hotel.photos.length}`);
          console.log(`      Sample URL: ${hotel.photos[0]}`);
        });
      }

      return {
        totalHotels: hotels.length,
        hotelsWithPhotos,
        hotelsWithAmadeusPhotos,
        hotelsWithGenericPhotos,
        hotelsWithNoPhotos,
        totalPhotos,
        photoAnalysis
      };

    } catch (error) {
      console.error('❌ Error checking database photos:', error);
      return null;
    }
  }

  async testAmadeusPhotoAPI() {
    console.log('\n🧪 Testing Amadeus Photo API...');
    
    if (!this.amadeusClientId || this.amadeusClientId === 'your_amadeus_client_id') {
      console.log('❌ Cannot test - Amadeus credentials not configured');
      return;
    }

    try {
      // Get access token
      const tokenResponse = await axios.post(`${this.amadeusBaseUrl}/v1/security/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.amadeusClientId,
        client_secret: this.amadeusClientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Test hotel search
      const searchResponse = await axios.get(`${this.amadeusBaseUrl}/v1/reference-data/locations/hotels/by-city`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          cityCode: 'PAR', // Paris
          radius: 50,
          radiusUnit: 'KM'
        }
      });

      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        const hotelId = searchResponse.data.data[0].hotelId;
        console.log(`✅ Found hotel: ${searchResponse.data.data[0].name} (ID: ${hotelId})`);

        // Test hotel content (which includes photos)
        const contentResponse = await axios.get(`${this.amadeusBaseUrl}/v1/reference-data/locations/hotels/${hotelId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (contentResponse.data.data) {
          const media = contentResponse.data.data.media || [];
          console.log(`📸 Hotel has ${media.length} photos available`);
          
          if (media.length > 0) {
            console.log('   Sample photo URLs:');
            media.slice(0, 3).forEach((photo, index) => {
              console.log(`   ${index + 1}. ${photo.uri}`);
            });
          }
        }
      }

    } catch (error) {
      console.log('❌ Amadeus API test failed:', error.response?.data?.error_description || error.message);
    }
  }

  async runFullCheck() {
    console.log('🔍 AMADEUS PHOTO ANALYSIS\n');
    console.log('='.repeat(50));

    // Check Amadeus connection
    const amadeusConnected = await this.checkAmadeusConnection();

    // Check database photos
    const photoStats = await this.checkDatabasePhotos();

    // Test Amadeus Photo API if connected
    if (amadeusConnected) {
      await this.testAmadeusPhotoAPI();
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY:');
    
    if (photoStats) {
      console.log(`   Total hotels: ${photoStats.totalHotels}`);
      console.log(`   Hotels with photos: ${photoStats.hotelsWithPhotos} (${((photoStats.hotelsWithPhotos/photoStats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`   Hotels with Amadeus photos: ${photoStats.hotelsWithAmadeusPhotos} (${((photoStats.hotelsWithAmadeusPhotos/photoStats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`   Total photos: ${photoStats.totalPhotos}`);
    }

    if (!amadeusConnected) {
      console.log('\n⚠️  To use Amadeus photos:');
      console.log('   1. Get Amadeus API credentials from https://developers.amadeus.com/');
      console.log('   2. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your .env file');
      console.log('   3. Run this script again');
    }
  }
}

// Run the check
const checker = new AmadeusPhotoChecker();
checker.runFullCheck().catch(console.error);
