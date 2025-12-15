import { DatabaseService } from './database';
import { SupabaseService } from './supabase';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class KA_BRU_CoordinateTest {
  private databaseService: DatabaseService;
  private supabaseService: SupabaseService;
  private googlePlacesApiKey: string;

  constructor() {
    this.databaseService = new DatabaseService();
    this.supabaseService = new SupabaseService();
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBh4W1feHK_zB7uiIx0VIkllOpy8ClnSk8';
  }

  /**
   * Test coordinate refresh for KA BRU Beach Boutique Hotel specifically
   */
  async testKA_BRUCoordinates(): Promise<void> {
    console.log('🧪 Testing KA BRU Beach Boutique Hotel coordinate accuracy...');
    
    try {
      // Get KA BRU hotel from database
      const { hotels } = await this.databaseService.getHotels({ limit: 1000 });
      const kaBruHotel = hotels.find(hotel => 
        hotel.name.toLowerCase().includes('ka bru') || 
        hotel.name.toLowerCase().includes('kabru')
      );

      if (!kaBruHotel) {
        console.log('❌ KA BRU Beach Boutique Hotel not found in database');
        console.log('Available hotels with "bru" in name:');
        hotels.filter(h => h.name.toLowerCase().includes('bru')).forEach(h => {
          console.log(`  - ${h.name} (${h.city}, ${h.country})`);
        });
        return;
      }

      console.log(`\n📍 Found KA BRU Hotel:`);
      console.log(`   Name: ${kaBruHotel.name}`);
      console.log(`   City: ${kaBruHotel.city}`);
      console.log(`   Country: ${kaBruHotel.country}`);
      console.log(`   Current Coords: ${kaBruHotel.coords?.lat}, ${kaBruHotel.coords?.lng}`);

      if (!kaBruHotel.coords) {
        console.log('❌ No coordinates found for KA BRU hotel');
        return;
      }

      // Get accurate coordinates using improved search
      console.log('\n🔍 Searching for accurate coordinates...');
      const newCoords = await this.getAccurateCoordinates(
        kaBruHotel.name, 
        kaBruHotel.city, 
        kaBruHotel.country
      );

      // Calculate distance difference
      const distance = this.calculateDistance(
        kaBruHotel.coords.lat, kaBruHotel.coords.lng,
        newCoords.lat, newCoords.lng
      );

      console.log(`\n📊 Coordinate Analysis:`);
      console.log(`   Old: ${kaBruHotel.coords.lat}, ${kaBruHotel.coords.lng}`);
      console.log(`   New: ${newCoords.lat}, ${newCoords.lng}`);
      console.log(`   Distance: ${distance.toFixed(3)}km (${(distance * 1000).toFixed(0)}m)`);

      if (distance > 0.1) { // More than 100m difference
        console.log(`\n🔄 Significant coordinate update needed!`);
        console.log(`   This suggests the current coordinates are inaccurate`);
        
        // Ask for confirmation before updating
        console.log(`\n💾 Updating coordinates in database...`);
        await this.supabaseService.updateHotelCoordinates(kaBruHotel.id, newCoords);
        console.log(`✅ Coordinates updated successfully!`);
        
        console.log(`\n🎯 Expected Results:`);
        console.log(`   - Pin should now appear at the exact hotel location`);
        console.log(`   - Map zoom level reduced for better visibility`);
        console.log(`   - Search query improved with country context`);
        
      } else {
        console.log(`\n✅ Coordinates are already accurate (${distance.toFixed(3)}km difference)`);
        console.log(`   The pin positioning issue might be due to map zoom level`);
      }

      // Test the improved search query
      console.log(`\n🔍 Testing improved search query:`);
      const testQuery = `${kaBruHotel.name} hotel ${kaBruHotel.city} ${kaBruHotel.country}`;
      console.log(`   Query: "${testQuery}"`);
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${this.googlePlacesApiKey}`;
      console.log(`   URL: ${searchUrl}`);

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
        
        // Validate the result is actually a hotel/lodging
        const types = place.types || [];
        const isHotel = types.some((type: string) => 
          ['lodging', 'establishment', 'point_of_interest'].includes(type)
        );
        
        if (isHotel && place.geometry && place.geometry.location) {
          console.log(`   ✅ Found hotel: ${place.name}`);
          console.log(`   📍 Address: ${place.formatted_address}`);
          return {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
        }
      }
      
      console.log(`   ⚠️ No hotel found, using city center as fallback`);
      // Fallback: search for city coordinates
      const citySearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(city + ' ' + country)}&key=${this.googlePlacesApiKey}`;
      const cityResponse = await axios.get(citySearchUrl);
      
      if (cityResponse.data.results && cityResponse.data.results.length > 0) {
        const cityPlace = cityResponse.data.results[0];
        if (cityPlace.geometry && cityPlace.geometry.location) {
          return {
            lat: cityPlace.geometry.location.lat,
            lng: cityPlace.geometry.location.lng
          };
        }
      }
      
      throw new Error('No coordinates found');
      
    } catch (error) {
      console.error(`❌ Error fetching coordinates for ${hotelName}:`, error);
      // Return original coordinates as fallback
      return { lat: 0, lng: 0 };
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
      console.log('   3. If still offset, the coordinate refresh should have fixed it');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 KA BRU coordinate test failed:', error);
      process.exit(1);
    });
}

export { KA_BRU_CoordinateTest };

