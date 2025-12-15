import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class KA_BRU_CoordinateUpdater {
  private googlePlacesApiKey: string;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyB7zSml4J0qcISSIZUpsSigli1J9Ifx7wU';
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  }

  /**
   * Update KA BRU Beach Boutique Hotel coordinates in the database
   */
  async updateKA_BRUCoordinates(): Promise<void> {
    console.log('🔄 Updating KA BRU Beach Boutique Hotel coordinates...');
    
    try {
      // First, find the hotel in the database
      const hotel = await this.findKA_BRUHotel();
      if (!hotel) {
        console.log('❌ KA BRU hotel not found in database');
        return;
      }

      console.log(`\n📍 Found Hotel:`);
      console.log(`   ID: ${hotel.id}`);
      console.log(`   Name: ${hotel.name}`);
      console.log(`   Current Coords: ${hotel.coords?.lat}, ${hotel.coords?.lng}`);

      // Get accurate coordinates
      const newCoords = await this.getAccurateCoordinates(
        hotel.name, 
        hotel.city, 
        hotel.country
      );

      if (newCoords.lat === 0 && newCoords.lng === 0) {
        console.log('❌ Failed to get accurate coordinates');
        return;
      }

      console.log(`\n📊 New Coordinates:`);
      console.log(`   Latitude: ${newCoords.lat}`);
      console.log(`   Longitude: ${newCoords.lng}`);

      // Calculate distance if we have old coordinates
      if (hotel.coords) {
        const distance = this.calculateDistance(
          hotel.coords.lat, hotel.coords.lng,
          newCoords.lat, newCoords.lng
        );
        console.log(`   Distance from old: ${distance.toFixed(3)}km (${(distance * 1000).toFixed(0)}m)`);
      }

      // Update the coordinates in Supabase
      console.log(`\n💾 Updating coordinates in database...`);
      await this.updateHotelCoordinates(hotel.id, newCoords);
      
      console.log(`✅ Coordinates updated successfully!`);
      console.log(`\n🎯 The pin should now appear at the exact hotel location`);

    } catch (error) {
      console.error('❌ Error updating KA BRU coordinates:', error);
      throw error;
    }
  }

  /**
   * Find KA BRU hotel in the database
   */
  private async findKA_BRUHotel(): Promise<any> {
    try {
      const response = await axios.get(`${this.supabaseUrl}/rest/v1/hotels`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          select: 'id,name,city,country,coords',
          or: `name.ilike.%ka bru%,name.ilike.%kabru%`
        }
      });

      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding KA BRU hotel:', error);
      return null;
    }
  }

  /**
   * Update hotel coordinates in Supabase
   */
  private async updateHotelCoordinates(hotelId: string, coords: { lat: number; lng: number }): Promise<void> {
    try {
      const response = await axios.patch(
        `${this.supabaseUrl}/rest/v1/hotels?id=eq.${hotelId}`,
        { coords },
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        }
      );

      if (response.status === 204) {
        console.log('✅ Database update successful');
      } else {
        console.log('⚠️ Unexpected response:', response.status);
      }
    } catch (error) {
      console.error('Error updating coordinates:', error);
      throw error;
    }
  }

  /**
   * Get accurate coordinates using Google Places API
   */
  private async getAccurateCoordinates(hotelName: string, city: string, country: string): Promise<{ lat: number; lng: number }> {
    try {
      const searchQuery = `${hotelName} hotel ${city} ${country}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.googlePlacesApiKey}`;
      
      const response = await axios.get(searchUrl);
      
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        
        const types = place.types || [];
        const isHotel = types.some((type: string) => 
          ['lodging', 'establishment', 'point_of_interest'].includes(type)
        );
        
        if (isHotel && place.geometry && place.geometry.location) {
          return {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
        }
      }
      
      return { lat: 0, lng: 0 };
      
    } catch (error) {
      console.error(`Error fetching coordinates:`, error);
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

// Run the coordinate update if this script is executed directly
if (require.main === module) {
  const updater = new KA_BRU_CoordinateUpdater();
  updater.updateKA_BRUCoordinates()
    .then(() => {
      console.log('\n🎉 KA BRU coordinate update completed!');
      console.log('\n📱 Next steps:');
      console.log('   1. Restart your app');
      console.log('   2. Check the KA BRU hotel map');
      console.log('   3. The pin should now be positioned exactly at the hotel');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 KA BRU coordinate update failed:', error);
      process.exit(1);
    });
}

export { KA_BRU_CoordinateUpdater };

