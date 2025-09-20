// Smart Hotel Fetcher - Amadeus for Data + Google Places for Photos
// Gets basic hotel info from Amadeus, then enhances with Google Places photos

import dotenv from 'dotenv';
import { AmadeusClient } from './amadeus';
import { SupabaseService } from './supabase';
import { GooglePlacesClient } from './google-places';
import { glintzCurate } from './curation';
import { RawHotel } from './curation/filter';
import { HotelCard } from './types';

// Load environment variables
dotenv.config();

interface CityTarget {
  name: string;
  code: string;
  country: string;
  expectedHotels: number;
}

export class SmartHotelFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;

  // Focus on major cities with good Google Places coverage
  private PREMIUM_CITIES: CityTarget[] = [
    // Europe - Best Google Places coverage
    { name: 'Paris', code: 'PAR', country: 'France', expectedHotels: 40 },
    { name: 'London', code: 'LON', country: 'UK', expectedHotels: 40 },
    { name: 'Rome', code: 'ROM', country: 'Italy', expectedHotels: 35 },
    { name: 'Barcelona', code: 'BCN', country: 'Spain', expectedHotels: 35 },
    { name: 'Amsterdam', code: 'AMS', country: 'Netherlands', expectedHotels: 25 },
    { name: 'Prague', code: 'PRG', country: 'Czech Republic', expectedHotels: 25 },
    { name: 'Vienna', code: 'VIE', country: 'Austria', expectedHotels: 20 },
    { name: 'Berlin', code: 'BER', country: 'Germany', expectedHotels: 30 },
    { name: 'Munich', code: 'MUC', country: 'Germany', expectedHotels: 20 },
    { name: 'Milan', code: 'MIL', country: 'Italy', expectedHotels: 25 },
    { name: 'Florence', code: 'FLR', country: 'Italy', expectedHotels: 20 },
    { name: 'Venice', code: 'VCE', country: 'Italy', expectedHotels: 15 },
    { name: 'Madrid', code: 'MAD', country: 'Spain', expectedHotels: 30 },
    { name: 'Lisbon', code: 'LIS', country: 'Portugal', expectedHotels: 20 },
    { name: 'Dublin', code: 'DUB', country: 'Ireland', expectedHotels: 15 },
    { name: 'Copenhagen', code: 'CPH', country: 'Denmark', expectedHotels: 15 },
    { name: 'Stockholm', code: 'STO', country: 'Sweden', expectedHotels: 15 },
    { name: 'Budapest', code: 'BUD', country: 'Hungary', expectedHotels: 20 },
    { name: 'Athens', code: 'ATH', country: 'Greece', expectedHotels: 20 },
    { name: 'Istanbul', code: 'IST', country: 'Turkey', expectedHotels: 30 },
    
    // Americas - Major cities
    { name: 'New York', code: 'NYC', country: 'United States', expectedHotels: 50 },
    { name: 'Los Angeles', code: 'LAX', country: 'United States', expectedHotels: 40 },
    { name: 'San Francisco', code: 'SFO', country: 'United States', expectedHotels: 30 },
    { name: 'Miami', code: 'MIA', country: 'United States', expectedHotels: 25 },
    { name: 'Chicago', code: 'CHI', country: 'United States', expectedHotels: 25 },
    { name: 'Toronto', code: 'YYZ', country: 'Canada', expectedHotels: 20 },
    { name: 'Vancouver', code: 'YVR', country: 'Canada', expectedHotels: 15 },
    
    // Asia - Major tourist destinations
    { name: 'Tokyo', code: 'TYO', country: 'Japan', expectedHotels: 40 },
    { name: 'Bangkok', code: 'BKK', country: 'Thailand', expectedHotels: 35 },
    { name: 'Singapore', code: 'SIN', country: 'Singapore', expectedHotels: 20 },
    { name: 'Hong Kong', code: 'HKG', country: 'Hong Kong', expectedHotels: 25 },
    { name: 'Seoul', code: 'SEL', country: 'South Korea', expectedHotels: 25 },
    { name: 'Dubai', code: 'DXB', country: 'UAE', expectedHotels: 30 },
    
    // Oceania
    { name: 'Sydney', code: 'SYD', country: 'Australia', expectedHotels: 25 },
    { name: 'Melbourne', code: 'MEL', country: 'Australia', expectedHotels: 20 }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Smart fetching: Amadeus for basic data + Google Places for photos
   */
  async fetchSmartHotels(): Promise<void> {
    console.log('🧠 SMART HOTEL FETCHING - TARGET: 1,500 HOTELS');
    console.log('===============================================');
    console.log('Strategy: Amadeus for basic data + Google Places for photos');
    console.log('Quality: 4-10 high-resolution photos from Google Places');
    console.log('Data: Hotel info, amenities, location from Amadeus');
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

    for (const city of this.PREMIUM_CITIES) {
      if (totalNewHotels >= targetRemaining) {
        console.log('🎉 Target of 1,500 hotels reached!');
        break;
      }

      console.log(`\n🏙️  Processing ${city.name}, ${city.country} (${city.code})`);
      console.log(`   Expected: ~${city.expectedHotels} boutique hotels`);

      try {
        const cityResult = await this.fetchCitySmartly(
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
        console.log(`   📸 ${cityResult.withPhotos} hotels had 4+ Google Places photos`);
        console.log(`   📊 Progress: ${totalNewHotels}/${targetRemaining} hotels (${((totalNewHotels/targetRemaining)*100).toFixed(1)}%)`);

        // Rate limiting: Wait between cities
        if (totalNewHotels < targetRemaining) {
          console.log('   ⏱️  Rate limiting: 15 second pause...');
          await this.sleep(15000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${city.name}:`, (error as Error).message);
        await this.sleep(5000); // 5 seconds for errors
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // minutes

    console.log('\n🎉 SMART FETCHING COMPLETE!');
    console.log('===========================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Hotels processed: ${totalProcessed}`);
    console.log(`✅ Hotels added: ${totalNewHotels}`);
    console.log(`📸 Hotels with 4+ photos: ${totalWithPhotos}`);
    console.log(`🎯 Final progress: ${((existingHotels.length + totalNewHotels) / 1500 * 100).toFixed(1)}%`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - existingHotels.length - totalNewHotels)} hotels needed`);
    console.log(`📸 Photo success rate: ${totalProcessed > 0 ? ((totalWithPhotos / totalProcessed) * 100).toFixed(1) : 0}%`);
  }

  /**
   * Fetch hotels smartly: basic data from Amadeus + photos from Google Places
   */
  private async fetchCitySmartly(
    cityCode: string, 
    cityName: string, 
    country: string, 
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<{ added: number; processed: number; withPhotos: number }> {
    
    try {
      // Step 1: Get basic hotel list from Amadeus (no content requirements)
      console.log(`   🔍 Getting hotel list from Amadeus for ${cityCode}...`);
      
      const hotelListResponse = await this.amadeusClient['client'].get('/v1/reference-data/locations/hotels/by-city', {
        params: {
          cityCode: cityCode,
          radius: 25,
          radiusUnit: 'KM'
        }
      });

      const hotelList = hotelListResponse.data.data || [];
      console.log(`   📍 Found ${hotelList.length} hotels in Amadeus`);

      if (hotelList.length === 0) {
        return { added: 0, processed: 0, withPhotos: 0 };
      }

      const processedHotels = [];
      let processedCount = 0;
      let withPhotosCount = 0;
      const maxToProcess = Math.min(hotelList.length, maxHotels * 2); // Process more to find quality ones

      // Step 2: Process each hotel - get basic info + Google Places photos
      for (const hotel of hotelList.slice(0, maxToProcess)) {
        try {
          processedCount++;
          
          // Get basic hotel content from Amadeus (optional - don't require photos)
          let content = null;
          let amenities: string[] = [];
          let description = '';
          
          try {
            content = await this.amadeusClient.getHotelContent(hotel.hotelId);
            if (content) {
              amenities = (content.amenities || []).map(amenity => amenity.code);
              description = content.description?.text || '';
            }
          } catch (error) {
            // Content is optional - continue without it
            console.log(`   ⚠️  No content for ${hotel.name} - using basic data`);
          }

          // Step 3: Get high-quality photos from Google Places
          console.log(`   📸 Getting Google Places photos for ${hotel.name}...`);
          const googlePhotos = await this.googlePlacesClient.getSpecificHotelPhotos(
            hotel.name,
            cityName,
            10 // Try to get up to 10 photos
          );

          // Only proceed if we have 4+ quality photos
          if (!googlePhotos || googlePhotos.length < 4) {
            console.log(`   ❌ ${hotel.name}: Only ${googlePhotos?.length || 0}/4+ photos found`);
            continue;
          }

          withPhotosCount++;
          console.log(`   ✅ ${hotel.name}: Found ${googlePhotos.length} high-quality photos`);

          // Step 4: Create RawHotel for curation
          const rawHotel: RawHotel = {
            hotel: {
              hotelId: hotel.hotelId,
              name: hotel.name,
              chainCode: undefined,
              rating: undefined,
              cityCode: cityCode,
              latitude: hotel.geoCode?.latitude || 0,
              longitude: hotel.geoCode?.longitude || 0
            },
            content: {
              hotelId: hotel.hotelId,
              name: hotel.name,
              description: description ? { text: description, lang: 'en' } : undefined,
              amenities: amenities,
              media: googlePhotos.map(url => ({ uri: url, category: 'EXTERIOR' })), // Use Google Photos
              ratings: undefined
            },
            offers: [] // No offers needed
          };

          processedHotels.push(rawHotel);
          
          // Rate limiting for Google Places
          await this.sleep(1000); // 1 second between Google Places requests

        } catch (error) {
          console.log(`   ⚠️  Error processing ${hotel.name}: ${(error as Error).message}`);
          
          if ((error as Error).message.includes('429')) {
            console.log('   ⏱️  Rate limit hit, pausing 30 seconds...');
            await this.sleep(30000);
          }
        }

        if (processedHotels.length >= maxHotels) {
          break;
        }

        // Progress update every 5 hotels
        if (processedCount % 5 === 0) {
          console.log(`   📊 Processed ${processedCount}/${maxToProcess}, found ${processedHotels.length} with 4+ photos`);
        }
      }

      console.log(`   📸 ${processedHotels.length} hotels have 4+ Google Places photos (${processedCount} processed)`);

      if (processedHotels.length === 0) {
        return { added: 0, processed: processedCount, withPhotos: withPhotosCount };
      }

      // Step 5: Apply Glintz curation
      console.log(`   🎯 Applying Glintz curation to ${processedHotels.length} hotels...`);
      const curationResult = await glintzCurate(processedHotels);
      console.log(`   ✅ ${curationResult.cards.length} hotels passed curation`);

      // Step 6: Filter out existing hotels
      const newHotels = curationResult.cards.filter(hotel => !existingIds.has(hotel.id));
      console.log(`   🆕 ${newHotels.length} new hotels (${curationResult.cards.length - newHotels.length} duplicates filtered)`);

      if (newHotels.length > 0) {
        // Step 7: Store in database
        const supabaseHotels = newHotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          coords: hotel.coords,
          price: { amount: '0', currency: 'EUR' }, // No pricing data
          description: hotel.description || `Beautiful boutique hotel in ${hotel.city}, ${hotel.country}`,
          amenity_tags: hotel.tags?.map((tag: any) => tag.label) || [],
          photos: hotel.photos, // High-quality Google Places photos
          hero_photo: hotel.heroPhoto, // Best Google Places photo
          booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
          rating: hotel.rating || 4.5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        await this.supabaseService.insertHotels(supabaseHotels);
        
        // Update existing IDs set
        newHotels.forEach(hotel => existingIds.add(hotel.id));
        
        console.log(`   💾 Stored ${newHotels.length} hotels in database`);
      }

      return { added: newHotels.length, processed: processedCount, withPhotos: withPhotosCount };

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
  const fetcher = new SmartHotelFetcher();
  
  fetcher.fetchSmartHotels()
    .then(() => {
      console.log('\n🎉 Smart hotel fetching completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Smart hotel fetching failed:', error);
      process.exit(1);
    });
} 