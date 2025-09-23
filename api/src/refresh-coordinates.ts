import { DatabaseService } from './database';
import { SupabaseService } from './supabase';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface HotelCoordinateUpdate {
  id: string;
  name: string;
  city: string;
  country: string;
  oldCoords: { lat: number; lng: number };
  newCoords: { lat: number; lng: number };
  source: 'google_places' | 'amadeus_validated' | 'fallback';
}

class CoordinateRefreshService {
  private databaseService: DatabaseService;
  private supabaseService: SupabaseService;
  private googlePlacesApiKey: string;

  constructor() {
    this.databaseService = new DatabaseService();
    this.supabaseService = new SupabaseService();
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBh4W1feHK_zB7uiIx0VIkllOpy8ClnSk8';
  }

  /**
   * Refresh coordinates for all hotels in the database
   */
  async refreshAllHotelCoordinates(): Promise<void> {
    console.log('🔄 Starting coordinate refresh for all hotels...');
    
    try {
      // Get all hotels from database
      const { hotels } = await this.databaseService.getHotels({ limit: 1000 });
      console.log(`📍 Found ${hotels.length} hotels to process`);

      const updates: HotelCoordinateUpdate[] = [];
      let processed = 0;

      for (const hotel of hotels) {
        processed++;
        console.log(`\n[${processed}/${hotels.length}] Processing: ${hotel.name} (${hotel.city})`);

        if (!hotel.coords) {
          console.log('❌ No coordinates found, skipping');
          continue;
        }

        // Get accurate coordinates
        const newCoords = await this.getAccurateCoordinates(hotel.name, hotel.city, hotel.country);
        
        // Check if coordinates changed significantly (more than ~100m)
        const distance = this.calculateDistance(
          hotel.coords.lat, hotel.coords.lng,
          newCoords.lat, newCoords.lng
        );

        if (distance > 0.1) { // More than 100m difference
          updates.push({
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            oldCoords: hotel.coords,
            newCoords: newCoords,
            source: 'google_places'
          });

          console.log(`🔄 Coordinate update needed:`);
          console.log(`   Old: ${hotel.coords.lat}, ${hotel.coords.lng}`);
          console.log(`   New: ${newCoords.lat}, ${newCoords.lng}`);
          console.log(`   Distance: ${distance.toFixed(2)}km`);
        } else {
          console.log(`✅ Coordinates are accurate (${distance.toFixed(3)}km difference)`);
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Apply updates
      if (updates.length > 0) {
        console.log(`\n📝 Applying ${updates.length} coordinate updates...`);
        await this.applyCoordinateUpdates(updates);
        console.log('✅ All coordinate updates applied successfully!');
      } else {
        console.log('\n✅ All hotel coordinates are already accurate!');
      }

      // Generate report
      this.generateReport(updates);

    } catch (error) {
      console.error('❌ Error refreshing coordinates:', error);
      throw error;
    }
  }

  /**
   * Get accurate coordinates using Google Places API
   */
  private async getAccurateCoordinates(hotelName: string, city: string, country: string): Promise<{ lat: number; lng: number }> {
    try {
      // Search for the hotel using Google Places Text Search
      const searchQuery = `${hotelName} hotel ${city} ${country}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.googlePlacesApiKey}`;
      
      const response = await axios.get(searchUrl);
      
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        
        // Validate the result is actually a hotel/lodging
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
      
      // Fallback: search for city coordinates
      const citySearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(city + ' ' + country)}&key=${this.googlePlacesApiKey}`;
      const cityResponse = await axios.get(citySearchUrl);
      
      if (cityResponse.data.results && cityResponse.data.results.length > 0) {
        const cityPlace = cityResponse.data.results[0];
        if (cityPlace.geometry && cityPlace.geometry.location) {
          console.warn(`⚠️ Using city center coordinates for ${hotelName}`);
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

  /**
   * Apply coordinate updates to the database
   */
  private async applyCoordinateUpdates(updates: HotelCoordinateUpdate[]): Promise<void> {
    for (const update of updates) {
      try {
        await this.supabaseService.updateHotelCoordinates(update.id, update.newCoords);
        console.log(`✅ Updated coordinates for ${update.name}`);
      } catch (error) {
        console.error(`❌ Failed to update ${update.name}:`, error);
      }
    }
  }

  /**
   * Generate a report of coordinate updates
   */
  private generateReport(updates: HotelCoordinateUpdate[]): void {
    console.log('\n📊 COORDINATE REFRESH REPORT');
    console.log('================================');
    console.log(`Total hotels processed: ${updates.length}`);
    console.log(`Coordinates updated: ${updates.length}`);
    
    if (updates.length > 0) {
      console.log('\nUpdated Hotels:');
      updates.forEach((update, index) => {
        console.log(`${index + 1}. ${update.name} (${update.city})`);
        console.log(`   ${update.oldCoords.lat}, ${update.oldCoords.lng} → ${update.newCoords.lat}, ${update.newCoords.lng}`);
      });
    }
    
    console.log('\n✅ Coordinate refresh completed successfully!');
  }
}

// Run the coordinate refresh if this script is executed directly
if (require.main === module) {
  const refreshService = new CoordinateRefreshService();
  refreshService.refreshAllHotelCoordinates()
    .then(() => {
      console.log('🎉 Coordinate refresh completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Coordinate refresh failed:', error);
      process.exit(1);
    });
}

export { CoordinateRefreshService }; 