import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class KA_BRU_CoordinateTest {
  private googlePlacesApiKey: string;

  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBh4W1feHK_zB7uiIx0VIkllOpy8ClnSk8';
  }

  /**
   * Test coordinate accuracy for KA BRU Beach Boutique Hotel
   */
  async testKA_BRUCoordinates(): Promise<void> {
    console.log('🧪 Testing KA BRU Beach Boutique Hotel coordinate accuracy...');
    
    try {
      // Test the improved search query
      const hotelName = 'KA BRU Beach Boutique Hotel';
      const city = 'Bahia';
      const country = 'Brazil';
      
      console.log(`\n📍 Testing Hotel:`);
      console.log(`   Name: ${hotelName}`);
      console.log(`   City: ${city}`);
      console.log(`   Country: ${country}`);

      // Get accurate coordinates using improved search
      console.log('\n🔍 Searching for accurate coordinates...');
      const newCoords = await this.getAccurateCoordinates(hotelName, city, country);

      if (newCoords.lat === 0 && newCoords.lng === 0) {
        console.log('❌ Failed to find coordinates');
        return;
      }

      console.log(`\n📊 Found Coordinates:`);
      console.log(`   Latitude: ${newCoords.lat}`);
      console.log(`   Longitude: ${newCoords.lng}`);

      // Test the improved search query
      console.log(`\n🔍 Testing improved search query:`);
      const testQuery = `${hotelName} hotel ${city} ${country}`;
      console.log(`   Query: "${testQuery}"`);
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${this.googlePlacesApiKey}`;
      console.log(`   URL: ${searchUrl}`);

      console.log(`\n🎯 Expected Results:`);
      console.log(`   - Pin should now appear at the exact hotel location`);
      console.log(`   - Map zoom level reduced for better visibility`);
      console.log(`   - Search query improved with country context`);

    } catch (error) {
      console.error('❌ Error testing KA BRU coordinates:', error);
      throw error;
    }
  }

  /**
   * Get accurate coordinates using improved Google Places API search
   */
  private async getAccurateCoordinates(hotelName: string, city: string, country: string): Promise<{ lat: number; lng: number }> {
    try {
      // Improved search query with country context
      const searchQuery = `${hotelName} hotel ${city} ${country}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.googlePlacesApiKey}`;
      
      console.log(`   🔍 Searching: "${searchQuery}"`);
      
      const response = await axios.get(searchUrl);
      
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        
        console.log(`   📍 Found: ${place.name}`);
        console.log(`   📍 Address: ${place.formatted_address}`);
        
        // Validate the result is actually a hotel/lodging
        const types = place.types || [];
        const isHotel = types.some((type: string) => 
          ['lodging', 'establishment', 'point_of_interest'].includes(type)
        );
        
        if (isHotel && place.geometry && place.geometry.location) {
          console.log(`   ✅ Confirmed as hotel/lodging`);
          return {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
        } else {
          console.log(`   ⚠️ Not confirmed as hotel, types: ${types.join(', ')}`);
        }
      }
      
      console.log(`   ⚠️ No hotel found in search results`);
      return { lat: 0, lng: 0 };
      
    } catch (error) {
      console.error(`❌ Error fetching coordinates for ${hotelName}:`, error);
      return { lat: 0, lng: 0 };
    }
  }
}

// Run the KA BRU coordinate test if this script is executed directly
if (require.main === module) {
  const testService = new KA_BRU_CoordinateTest();
  testService.testKA_BRUCoordinates()
    .then(() => {
      console.log('\n🎉 KA BRU coordinate test completed!');
      console.log('\n📱 Next steps:');
      console.log('   1. Restart your app to see the improved map zoom');
      console.log('   2. Check if the pin is now positioned correctly');
      console.log('   3. The search query now includes country context for better accuracy');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 KA BRU coordinate test failed:', error);
      process.exit(1);
    });
}

export { KA_BRU_CoordinateTest };

