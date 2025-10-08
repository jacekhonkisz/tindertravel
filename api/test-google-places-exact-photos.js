require('dotenv').config();
const axios = require('axios');

class GooglePlacesExactPhotoService {
  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_PLACES_API_KEY';
    this.googlePlacesBaseUrl = 'https://maps.googleapis.com/maps/api/place';
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      exactPhotos: 0
    };
  }

  async findExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    try {
      // Step 1: Search for the hotel using Google Places Text Search
      console.log('  🔍 Searching for hotel in Google Places...');
      const placeId = await this.searchHotel(hotelName, city, country);
      
      if (!placeId) {
        console.log('  ❌ Hotel not found in Google Places');
        this.stats.failed++;
        return [];
      }
      
      console.log(`  ✅ Found hotel: ${placeId}`);
      
      // Step 2: Get photos for the specific hotel
      console.log('  📸 Getting photos for exact hotel...');
      const photos = await this.getHotelPhotos(placeId, count);
      
      if (photos.length > 0) {
        this.stats.successful++;
        this.stats.exactPhotos += photos.length;
        console.log(`  ✅ SUCCESS: Found ${photos.length} EXACT photos for ${hotelName}`);
      } else {
        this.stats.failed++;
        console.log(`  ❌ FAILED: No photos found for ${hotelName}`);
      }
      
      return photos;
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      this.stats.failed++;
      return [];
    }
  }

  async searchHotel(hotelName, city, country) {
    try {
      const query = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const url = `${this.googlePlacesBaseUrl}/textsearch/json?query=${query}&key=${this.googlePlacesApiKey}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const hotel = response.data.results[0];
        console.log(`    Found: ${hotel.name} (${hotel.formatted_address})`);
        return hotel.place_id;
      } else {
        console.log(`    No results found for: ${hotelName}`);
        return null;
      }
    } catch (error) {
      throw new Error(`Hotel search failed: ${error.message}`);
    }
  }

  async getHotelPhotos(placeId, count = 5) {
    try {
      const url = `${this.googlePlacesBaseUrl}/details/json?place_id=${placeId}&fields=photos&key=${this.googlePlacesApiKey}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === 'OK' && response.data.result.photos) {
        const photos = response.data.result.photos.slice(0, count).map((photo, index) => ({
          url: `${this.googlePlacesBaseUrl}/photo?maxwidth=1920&photoreference=${photo.photo_reference}&key=${this.googlePlacesApiKey}`,
          width: 1920,
          height: 1080,
          description: `Exact hotel photo ${index + 1}`,
          source: 'google_places',
          photographer: 'Google Places',
          photographerUrl: 'https://maps.google.com',
          isExact: true // Photos from Google Places are exact hotel photos
        }));
        
        return photos;
      } else {
        console.log('    No photos available for this hotel');
        return [];
      }
    } catch (error) {
      throw new Error(`Photo retrieval failed: ${error.message}`);
    }
  }

  async testWithRealHotels() {
    console.log('🧪 Testing Google Places EXACT Hotel Photos...\n');
    
    const testHotels = [
      { name: 'Long Bay Beach Club', city: 'Turks and Caicos', country: 'Turks and Caicos Islands' },
      { name: 'Hotel das Cataratas', city: 'Iguazu Falls', country: 'Argentina' },
      { name: 'Villa Spalletti Trivelli', city: 'Rome', country: 'Italy' },
      { name: 'La Valise Tulum', city: 'Tulum', country: 'Mexico' },
      { name: 'Borgo Pignano', city: 'Tuscany', country: 'Italy' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.findExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`  📸 Sample photos:`);
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo.url}`);
          console.log(`       Exact: ${photo.isExact ? 'YES' : 'NO'}`);
        });
      }
      
      // Add delay between requests
      await this.sleep(1000);
    }
    
    this.printStats();
  }

  printStats() {
    console.log('\n📊 GOOGLE PLACES EXACT PHOTO STATISTICS:');
    console.log(`Total hotels tested: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Exact photos found: ${this.stats.exactPhotos}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(1);
      console.log(`Success rate: ${successRate}%`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Check if API key is available
if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY') {
  const service = new GooglePlacesExactPhotoService();
  service.testWithRealHotels().catch(console.error);
} else {
  console.log('❌ Google Places API key not configured');
  console.log('🔑 To test EXACT hotel photos:');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Enable Places API');
  console.log('3. Create API key');
  console.log('4. Add to .env: GOOGLE_PLACES_API_KEY=your_key_here');
  console.log('5. Run: node test-google-places-exact-photos.js');
  console.log('\n💡 This will give you EXACT photos of your specific hotels!');
}
