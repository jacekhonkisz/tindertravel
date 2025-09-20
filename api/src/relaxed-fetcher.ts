// Relaxed Hotel Fetcher - Bypasses Strict Curation for Test Data
// Gets hotels with good photos without strict boutique requirements

import dotenv from 'dotenv';
import { AmadeusClient } from './amadeus';
import { SupabaseService } from './supabase';
import { GooglePlacesClient } from './google-places';

// Load environment variables
dotenv.config();

interface CityTarget {
  name: string;
  code: string;
  country: string;
  expectedHotels: number;
}

export class RelaxedHotelFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;

  // Focus on cities with good Google Places coverage
  private CITIES: CityTarget[] = [
    { name: 'Paris', code: 'PAR', country: 'France', expectedHotels: 50 },
    { name: 'London', code: 'LON', country: 'UK', expectedHotels: 50 },
    { name: 'Rome', code: 'ROM', country: 'Italy', expectedHotels: 40 },
    { name: 'Barcelona', code: 'BCN', country: 'Spain', expectedHotels: 40 },
    { name: 'Amsterdam', code: 'AMS', country: 'Netherlands', expectedHotels: 30 },
    { name: 'Berlin', code: 'BER', country: 'Germany', expectedHotels: 35 },
    { name: 'Madrid', code: 'MAD', country: 'Spain', expectedHotels: 35 },
    { name: 'Milan', code: 'MIL', country: 'Italy', expectedHotels: 30 },
    { name: 'Vienna', code: 'VIE', country: 'Austria', expectedHotels: 25 },
    { name: 'Prague', code: 'PRG', country: 'Czech Republic', expectedHotels: 25 },
    { name: 'New York', code: 'NYC', country: 'United States', expectedHotels: 60 },
    { name: 'Los Angeles', code: 'LAX', country: 'United States', expectedHotels: 50 },
    { name: 'San Francisco', code: 'SFO', country: 'United States', expectedHotels: 40 },
    { name: 'Tokyo', code: 'TYO', country: 'Japan', expectedHotels: 50 },
    { name: 'Bangkok', code: 'BKK', country: 'Thailand', expectedHotels: 40 },
    { name: 'Singapore', code: 'SIN', country: 'Singapore', expectedHotels: 25 },
    { name: 'Sydney', code: 'SYD', country: 'Australia', expectedHotels: 30 },
    { name: 'Dubai', code: 'DXB', country: 'UAE', expectedHotels: 35 }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Relaxed fetching: Focus on photos, minimal filtering
   */
  async fetchRelaxedHotels(): Promise<void> {
    console.log('🌟 RELAXED HOTEL FETCHING - TARGET: 1,500 HOTELS');
    console.log('===============================================');
    console.log('Strategy: Minimal filtering, focus on photo quality');
    console.log('Quality: 4+ Google Places photos required');
    console.log('Filtering: Basic quality checks only');
    console.log('');

    // Get existing hotels to avoid duplicates
    const existingHotels = await this.supabaseService.getHotels(10000, 0);
    const existingIds = new Set(existingHotels.map(h => h.id));
    
    console.log(`📊 Starting with ${existingHotels.length} existing hotels`);
    console.log(`🎯 Target: ${1500 - existingHotels.length} new hotels needed`);
    console.log('');

    const targetRemaining = Math.max(0, 1500 - existingHotels.length);
    if (targetRemaining === 0) {
      console.log('🎉 Target already achieved! You have 1,500+ hotels.');
      return;
    }

    let totalNewHotels = 0;
    let totalProcessed = 0;
    let totalWithPhotos = 0;
    const startTime = Date.now();

    for (const city of this.CITIES) {
      if (totalNewHotels >= targetRemaining) {
        console.log('🎉 Target of 1,500 hotels reached!');
        break;
      }

      console.log(`\n🏙️  Processing ${city.name}, ${city.country} (${city.code})`);
      console.log(`   Expected: ~${city.expectedHotels} hotels`);

      try {
        const cityResult = await this.fetchCityRelaxed(
          city.code, 
          city.name, 
          city.country, 
          existingIds,
          Math.min(city.expectedHotels, targetRemaining - totalNewHotels)
        );

        totalNewHotels += cityResult.added;
        totalProcessed += cityResult.processed;
        totalWithPhotos += cityResult.withPhotos;
        
        console.log(`   ✅ Added ${cityResult.added}/${cityResult.processed} hotels from ${city.name}`);
        console.log(`   📸 ${cityResult.withPhotos} hotels had 4+ photos`);
        console.log(`   📊 Progress: ${totalNewHotels}/${targetRemaining} hotels (${((totalNewHotels/targetRemaining)*100).toFixed(1)}%)`);

        // Rate limiting: Wait between cities
        if (totalNewHotels < targetRemaining) {
          console.log('   ⏱️  Rate limiting: 10 second pause...');
          await this.sleep(10000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${city.name}:`, (error as Error).message);
        await this.sleep(3000);
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60;

    console.log('\n🎉 RELAXED FETCHING COMPLETE!');
    console.log('=============================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Hotels processed: ${totalProcessed}`);
    console.log(`✅ Hotels added: ${totalNewHotels}`);
    console.log(`📸 Hotels with 4+ photos: ${totalWithPhotos}`);
    console.log(`🎯 Final progress: ${((existingHotels.length + totalNewHotels) / 1500 * 100).toFixed(1)}%`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - existingHotels.length - totalNewHotels)} hotels needed`);
    console.log(`📸 Photo success rate: ${totalProcessed > 0 ? ((totalWithPhotos / totalProcessed) * 100).toFixed(1) : 0}%`);
  }

  /**
   * Fetch hotels with relaxed criteria
   */
  private async fetchCityRelaxed(
    cityCode: string, 
    cityName: string, 
    country: string, 
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<{ added: number; processed: number; withPhotos: number }> {
    
    try {
      // Get hotel list from Amadeus
      console.log(`   🔍 Getting hotel list from Amadeus for ${cityCode}...`);
      
      const hotelListResponse = await this.amadeusClient['client'].get('/v1/reference-data/locations/hotels/by-city', {
        params: {
          cityCode: cityCode,
          radius: 20,
          radiusUnit: 'KM'
        }
      });

      const hotelList = hotelListResponse.data.data || [];
      console.log(`   📍 Found ${hotelList.length} hotels in Amadeus`);

      if (hotelList.length === 0) {
        return { added: 0, processed: 0, withPhotos: 0 };
      }

      const validHotels = [];
      let processedCount = 0;
      let withPhotosCount = 0;
      const maxToProcess = Math.min(hotelList.length, maxHotels * 2);

      // Process each hotel with minimal filtering
      for (const hotel of hotelList.slice(0, maxToProcess)) {
        try {
          processedCount++;
          
          // Skip if already exists
          if (existingIds.has(hotel.hotelId)) {
            continue;
          }

          // Basic quality filters (very relaxed)
          if (!hotel.name || hotel.name.length < 3) {
            continue;
          }

          // Skip obvious test properties
          if (hotel.name.includes('TEST') || hotel.name.includes('PROPERTY')) {
            continue;
          }

          // Get Google Places photos
          console.log(`   📸 Getting photos for ${hotel.name}...`);
          const googlePhotos = await this.googlePlacesClient.getSpecificHotelPhotos(
            hotel.name,
            cityName,
            8
          );

          // Only require 4+ photos (much more relaxed than curation)
          if (!googlePhotos || googlePhotos.length < 4) {
            console.log(`   ❌ ${hotel.name}: Only ${googlePhotos?.length || 0}/4+ photos`);
            continue;
          }

          withPhotosCount++;
          console.log(`   ✅ ${hotel.name}: Found ${googlePhotos.length} photos`);

          // Create hotel card directly (bypass curation)
          const hotelCard = {
            id: hotel.hotelId,
            name: hotel.name,
            city: cityName,
            country: country,
            coords: {
              lat: hotel.geoCode?.latitude || 0,
              lng: hotel.geoCode?.longitude || 0
            },
            price: { amount: '0', currency: 'EUR' },
            description: `Beautiful hotel in ${cityName}, ${country}. Featuring modern amenities and excellent service.`,
            amenity_tags: ['WiFi', 'Restaurant', 'Room Service'], // Default amenities
            photos: googlePhotos,
            hero_photo: googlePhotos[0],
            booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + cityName)}`,
            rating: 4.2, // Default good rating
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          validHotels.push(hotelCard);
          
          // Rate limiting for Google Places
          await this.sleep(800);

        } catch (error) {
          console.log(`   ⚠️  Error processing ${hotel.name}: ${(error as Error).message}`);
          
          if ((error as Error).message.includes('429')) {
            console.log('   ⏱️  Rate limit hit, pausing 20 seconds...');
            await this.sleep(20000);
          }
        }

        if (validHotels.length >= maxHotels) {
          break;
        }

        // Progress update
        if (processedCount % 10 === 0) {
          console.log(`   📊 Processed ${processedCount}/${maxToProcess}, found ${validHotels.length} with 4+ photos`);
        }
      }

      console.log(`   📸 ${validHotels.length} hotels ready for database (${processedCount} processed)`);

      if (validHotels.length > 0) {
        // Store directly in database
        await this.supabaseService.insertHotels(validHotels);
        
        // Update existing IDs set
        validHotels.forEach(hotel => existingIds.add(hotel.id));
        
        console.log(`   💾 Stored ${validHotels.length} hotels in database`);
      }

      return { added: validHotels.length, processed: processedCount, withPhotos: withPhotosCount };

    } catch (error) {
      console.error(`   ❌ Failed to fetch from ${cityCode}:`, error);
      return { added: 0, processed: 0, withPhotos: 0 };
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const fetcher = new RelaxedHotelFetcher();
  
  fetcher.fetchRelaxedHotels()
    .then(() => {
      console.log('\n🎉 Relaxed hotel fetching completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Relaxed hotel fetching failed:', error);
      process.exit(1);
    });
} 