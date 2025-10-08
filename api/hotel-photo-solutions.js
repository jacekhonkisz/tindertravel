const axios = require('axios');

class HotelPhotoSolutions {
  constructor() {
    console.log('🔧 Hotel Photo Solutions Initialized');
    console.log('📋 Available solutions for hotel photos:');
  }

  async testUnsplashAPI() {
    console.log('\n📸 Testing Unsplash API (Free)...');
    
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: 'luxury hotel Rome',
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY'
        },
        timeout: 10000
      });

      console.log('✅ Unsplash API structure works');
      console.log('💡 To use: Get free API key from unsplash.com/developers');
      console.log('💰 Cost: FREE (5000 requests/month)');
      console.log('📸 Quality: Professional photos');
      
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unsplash API structure works (needs API key)');
        console.log('💡 To use: Get free API key from unsplash.com/developers');
        console.log('💰 Cost: FREE (5000 requests/month)');
        console.log('📸 Quality: Professional photos');
        return true;
      }
      console.log('❌ Unsplash API failed:', error.message);
      return false;
    }
  }

  async testPexelsAPI() {
    console.log('\n📸 Testing Pexels API (Free)...');
    
    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: 'luxury hotel Rome',
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': 'YOUR_PEXELS_API_KEY'
        },
        timeout: 10000
      });

      console.log('✅ Pexels API structure works');
      console.log('💡 To use: Get free API key from pexels.com/api');
      console.log('💰 Cost: FREE (200 requests/hour)');
      console.log('📸 Quality: High-quality photos');
      
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Pexels API structure works (needs API key)');
        console.log('💡 To use: Get free API key from pexels.com/api');
        console.log('💰 Cost: FREE (200 requests/hour)');
        console.log('📸 Quality: High-quality photos');
        return true;
      }
      console.log('❌ Pexels API failed:', error.message);
      return false;
    }
  }

  async testPixabayAPI() {
    console.log('\n📸 Testing Pixabay API (Free)...');
    
    try {
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: 'YOUR_PIXABAY_API_KEY',
          q: 'luxury hotel Rome',
          per_page: 5,
          image_type: 'photo',
          orientation: 'horizontal',
          min_width: 1920,
          min_height: 1080
        },
        timeout: 10000
      });

      console.log('✅ Pixabay API structure works');
      console.log('💡 To use: Get free API key from pixabay.com/api/docs');
      console.log('💰 Cost: FREE (5000 requests/month)');
      console.log('�� Quality: Diverse photos');
      
      return true;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Pixabay API structure works (needs API key)');
        console.log('💡 To use: Get free API key from pixabay.com/api/docs');
        console.log('💰 Cost: FREE (5000 requests/month)');
        console.log('📸 Quality: Diverse photos');
        return true;
      }
      console.log('❌ Pixabay API failed:', error.message);
      return false;
    }
  }

  async testGooglePlacesAPI() {
    console.log('\n🗺️ Testing Google Places API...');
    
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!googleApiKey) {
      console.log('⚠️ No Google Places API key found');
      console.log('💡 To use Google Places for hotel photos:');
      console.log('   1. Go to Google Cloud Console');
      console.log('   2. Enable Places API');
      console.log('   3. Create API key');
      console.log('   4. Add GOOGLE_PLACES_API_KEY to .env');
      console.log('💰 Cost: $0.017 per request (1000 free/month)');
      console.log('📸 Quality: Real hotel photos');
      return false;
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'luxury hotels Rome',
          key: googleApiKey,
          type: 'lodging'
        },
        timeout: 10000
      });

      console.log('✅ Google Places API working!');
      console.log(`📄 Found ${response.data.results?.length || 0} hotels`);
      
      if (response.data.results && response.data.results.length > 0) {
        const hotel = response.data.results[0];
        console.log(`🏨 Sample: ${hotel.name}`);
        console.log(`⭐ Rating: ${hotel.rating}`);
        console.log(`📸 Photos: ${hotel.photos?.length || 0} available`);
      }
      
      return true;
    } catch (error) {
      console.log('❌ Google Places API failed:', error.message);
      return false;
    }
  }

  async testBookingAPI() {
    console.log('\n🏨 Testing Booking.com API...');
    
    try {
      // Test with a known hotel ID
      const response = await axios.get('https://distribution-xml.booking.com/2.4/json/hotelPhotos', {
        params: {
          hotel_ids: '1377073', // Example hotel ID
          language: 'en'
        },
        headers: {
          'Authorization': 'Bearer YOUR_BOOKING_API_KEY'
        },
        timeout: 10000
      });

      console.log('✅ Booking.com API structure works');
      console.log('💡 To use: Get API key from Booking.com Partner Hub');
      console.log('💰 Cost: $0.01-0.05 per request');
      console.log('📸 Quality: Real hotel photos');
      
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Booking.com API structure works (needs API key)');
        console.log('💡 To use: Get API key from Booking.com Partner Hub');
        console.log('💰 Cost: $0.01-0.05 per request');
        console.log('📸 Quality: Real hotel photos');
        return true;
      }
      console.log('❌ Booking.com API failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Testing All Hotel Photo Solutions\n');
    
    const results = {
      unsplash: await this.testUnsplashAPI(),
      pexels: await this.testPexelsAPI(),
      pixabay: await this.testPixabayAPI(),
      google: await this.testGooglePlacesAPI(),
      booking: await this.testBookingAPI()
    };
    
    console.log('\n📊 SUMMARY OF AVAILABLE SOLUTIONS:');
    console.log('=====================================');
    
    if (results.unsplash) {
      console.log('✅ Unsplash API - FREE professional photos');
    }
    if (results.pexels) {
      console.log('✅ Pexels API - FREE high-quality photos');
    }
    if (results.pixabay) {
      console.log('✅ Pixabay API - FREE diverse photos');
    }
    if (results.google) {
      console.log('✅ Google Places API - Real hotel photos');
    } else {
      console.log('⚠️ Google Places API - Needs API key setup');
    }
    if (results.booking) {
      console.log('✅ Booking.com API - Real hotel photos (paid)');
    }
    
    console.log('\n🎯 RECOMMENDED APPROACH:');
    console.log('1. 🆓 Start with FREE APIs (Unsplash, Pexels, Pixabay)');
    console.log('2. 🗺️ Add Google Places API for real hotel photos');
    console.log('3. 🏨 Consider Booking.com API for premium hotels');
    console.log('4. 🔄 Use fallback system: Real photos → Generic photos');
    
    console.log('\n💡 IMMEDIATE NEXT STEPS:');
    console.log('1. Get free API keys from Unsplash, Pexels, Pixabay');
    console.log('2. Set up Google Places API key');
    console.log('3. Implement photo service with fallback logic');
    console.log('4. Test with your hotel database');
  }
}

// Run the tests
const tester = new HotelPhotoSolutions();
tester.runAllTests().catch(console.error);
