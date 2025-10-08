const axios = require('axios');

class HotelPhotoTester {
  constructor() {
    this.hotellookToken = '29e012534d2df34490bcb64c40b70f8d';
    this.hotellookMarker = '673946';
    this.hotellookBaseUrl = 'https://yasen.hotellook.com';
    
    console.log('🔧 Hotel Photo Tester Initialized');
    console.log(`📍 Hotellook Token: ${this.hotellookToken.substring(0, 10)}...`);
    console.log(`📍 Hotellook Marker: ${this.hotellookMarker}`);
  }

  async testHotellookAPI() {
    console.log('\n🏨 Testing Hotellook Hotel Photos API...');
    
    try {
      // Test with a popular destination
      const params = {
        token: this.hotellookToken,
        marker: this.hotellookMarker,
        city: 'Rome',
        limit: 10
      };

      const response = await axios.get(`${this.hotellookBaseUrl}/hotels`, {
        params: params,
        timeout: 15000
      });

      console.log('✅ Hotellook API successful!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Found ${response.data.length || 0} hotels`);
      
      if (response.data && response.data.length > 0) {
        console.log('\n📋 Sample Hotel Data:');
        const sampleHotel = response.data[0];
        console.log(`🏨 Hotel: ${sampleHotel.name}`);
        console.log(`📍 Location: ${sampleHotel.city}, ${sampleHotel.country}`);
        console.log(`⭐ Rating: ${sampleHotel.stars}`);
        console.log(`💰 Price: ${sampleHotel.price}`);
        
        if (sampleHotel.photos && sampleHotel.photos.length > 0) {
          console.log(`📸 Photos: ${sampleHotel.photos.length} available`);
          console.log(`📸 Sample photo: ${sampleHotel.photos[0]}`);
        } else {
          console.log('📸 No photos in this response');
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Hotellook API failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      return null;
    }
  }

  async testGooglePlacesAPI() {
    console.log('\n🗺️ Testing Google Places API (if available)...');
    
    // Check if Google API key is available
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!googleApiKey) {
      console.log('⚠️ No Google Places API key found in .env');
      console.log('💡 To use Google Places for hotel photos:');
      console.log('   1. Get API key from Google Cloud Console');
      console.log('   2. Add GOOGLE_PLACES_API_KEY to .env');
      console.log('   3. Enable Places API in Google Cloud Console');
      return null;
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

      console.log('✅ Google Places API successful!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Found ${response.data.results?.length || 0} places`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Google Places API failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      return null;
    }
  }

  async testExistingPhotoServices() {
    console.log('\n🔍 Testing existing photo services in project...');
    
    try {
      // Test the free photo service
      const FreePhotoService = require('./free-photo-service.js');
      const photoService = new FreePhotoService();
      
      console.log('📸 Testing free photo service...');
      const photos = await photoService.getHotelPhotos('Hotel de Russie', 'Rome', 'Italy', 5);
      
      console.log('✅ Free photo service working!');
      console.log(`📸 Found ${photos.length} photos`);
      
      if (photos.length > 0) {
        console.log('📋 Sample photo sources:');
        photos.slice(0, 3).forEach((photo, index) => {
          console.log(`   ${index + 1}. ${photo.source} - ${photo.width}x${photo.height}`);
        });
      }
      
      return photos;
    } catch (error) {
      console.error('❌ Free photo service failed:');
      console.error(`📄 Error:`, error.message);
      return null;
    }
  }

  async runAllTests() {
    console.log('🚀 Testing All Available Hotel Photo Services\n');
    
    // Test Hotellook API
    const hotellookResult = await this.testHotellookAPI();
    
    // Test Google Places API
    const googleResult = await this.testGooglePlacesAPI();
    
    // Test existing photo services
    const freePhotoResult = await this.testExistingPhotoServices();
    
    console.log('\n📊 SUMMARY:');
    console.log(`🏨 Hotellook API: ${hotellookResult ? '✅ Working' : '❌ Failed'}`);
    console.log(`🗺️ Google Places API: ${googleResult ? '✅ Working' : '❌ Not configured'}`);
    console.log(`📸 Free Photo Service: ${freePhotoResult ? '✅ Working' : '❌ Failed'}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (hotellookResult) {
      console.log('🎯 Use Hotellook API for real hotel photos');
    }
    if (freePhotoResult) {
      console.log('🎯 Use Free Photo Service as backup/fallback');
    }
    if (!googleResult) {
      console.log('🎯 Consider adding Google Places API for more hotel photos');
    }
  }
}

// Run the tests
const tester = new HotelPhotoTester();
tester.runAllTests().catch(console.error);
