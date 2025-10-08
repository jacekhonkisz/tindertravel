const axios = require('axios');

class WorkingPhotoTester {
  constructor() {
    this.rapidApiKey = '8d627aa74fmsh2825b3c356bcdbap15b110jsn13c0c522393c';
    
    // Test hotels
    this.testHotels = [
      { name: 'The Ritz-Carlton New York', city: 'New York' },
      { name: 'Four Seasons Hotel London', city: 'London' },
      { name: 'Mandarin Oriental Tokyo', city: 'Tokyo' },
      { name: 'Burj Al Arab', city: 'Dubai' },
      { name: 'Hotel Plaza Athénée', city: 'Paris' }
    ];
  }

  async testPhotos() {
    console.log('🔍 TESTING HOTEL PHOTOS WITH RAPIDAPI');
    console.log('='.repeat(50));
    
    for (let i = 0; i < this.testHotels.length; i++) {
      const hotel = this.testHotels[i];
      console.log(`\n🏨 [${i + 1}/5] Testing: ${hotel.name}`);
      
      await this.testHotel(hotel);
      await this.sleep(1000);
    }
  }

  async testHotel(hotel) {
    try {
      // Try Google Places API via RapidAPI
      const response = await axios.get('https://google-places-api.p.rapidapi.com/textsearch/json', {
        params: {
          query: `${hotel.name} ${hotel.city}`,
          type: 'lodging'
        },
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'google-places-api.p.rapidapi.com'
        }
      });

      console.log(`  ✅ Found ${response.data.results?.length || 0} results`);
      
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        console.log(`  📍 Place: ${place.name}`);
        console.log(`  ⭐ Rating: ${place.rating || 'N/A'}`);
        console.log(`  📸 Photos: ${place.photos?.length || 0}`);
        
        if (place.photos && place.photos.length > 0) {
          console.log(`  🔗 Sample photo URLs:`);
          place.photos.slice(0, 3).forEach((photo, index) => {
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1920&photoreference=${photo.photo_reference}&key=YOUR_GOOGLE_API_KEY`;
            console.log(`     ${index + 1}. ${photoUrl}`);
          });
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run test
const tester = new WorkingPhotoTester();
tester.testPhotos().catch(console.error);
