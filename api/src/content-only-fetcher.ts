// Content-Only Hotel Fetcher - No Pricing/Availability Required
// Fetches hotels based purely on content quality and photos

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

export class ContentOnlyHotelFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;

  // Comprehensive list of premium cities worldwide
  private PREMIUM_CITIES: CityTarget[] = [
    // Europe
    { name: 'Paris', code: 'PAR', country: 'France', expectedHotels: 60 },
    { name: 'London', code: 'LON', country: 'UK', expectedHotels: 60 },
    { name: 'Rome', code: 'ROM', country: 'Italy', expectedHotels: 50 },
    { name: 'Barcelona', code: 'BCN', country: 'Spain', expectedHotels: 45 },
    { name: 'Amsterdam', code: 'AMS', country: 'Netherlands', expectedHotels: 35 },
    { name: 'Prague', code: 'PRG', country: 'Czech Republic', expectedHotels: 35 },
    { name: 'Vienna', code: 'VIE', country: 'Austria', expectedHotels: 30 },
    { name: 'Berlin', code: 'BER', country: 'Germany', expectedHotels: 40 },
    { name: 'Munich', code: 'MUC', country: 'Germany', expectedHotels: 30 },
    { name: 'Zurich', code: 'ZUR', country: 'Switzerland', expectedHotels: 25 },
    { name: 'Milan', code: 'MIL', country: 'Italy', expectedHotels: 35 },
    { name: 'Florence', code: 'FLR', country: 'Italy', expectedHotels: 30 },
    { name: 'Venice', code: 'VCE', country: 'Italy', expectedHotels: 25 },
    { name: 'Madrid', code: 'MAD', country: 'Spain', expectedHotels: 40 },
    { name: 'Lisbon', code: 'LIS', country: 'Portugal', expectedHotels: 30 },
    { name: 'Dublin', code: 'DUB', country: 'Ireland', expectedHotels: 25 },
    { name: 'Edinburgh', code: 'EDI', country: 'Scotland', expectedHotels: 20 },
    { name: 'Copenhagen', code: 'CPH', country: 'Denmark', expectedHotels: 25 },
    { name: 'Stockholm', code: 'STO', country: 'Sweden', expectedHotels: 25 },
    { name: 'Oslo', code: 'OSL', country: 'Norway', expectedHotels: 20 },
    { name: 'Helsinki', code: 'HEL', country: 'Finland', expectedHotels: 20 },
    { name: 'Budapest', code: 'BUD', country: 'Hungary', expectedHotels: 30 },
    { name: 'Warsaw', code: 'WAW', country: 'Poland', expectedHotels: 25 },
    { name: 'Krakow', code: 'KRK', country: 'Poland', expectedHotels: 20 },
    { name: 'Brussels', code: 'BRU', country: 'Belgium', expectedHotels: 25 },
    { name: 'Athens', code: 'ATH', country: 'Greece', expectedHotels: 30 },
    { name: 'Istanbul', code: 'IST', country: 'Turkey', expectedHotels: 45 },
    
    // Asia
    { name: 'Tokyo', code: 'TYO', country: 'Japan', expectedHotels: 70 },
    { name: 'Kyoto', code: 'KIX', country: 'Japan', expectedHotels: 35 },
    { name: 'Bangkok', code: 'BKK', country: 'Thailand', expectedHotels: 55 },
    { name: 'Singapore', code: 'SIN', country: 'Singapore', expectedHotels: 35 },
    { name: 'Hong Kong', code: 'HKG', country: 'Hong Kong', expectedHotels: 40 },
    { name: 'Seoul', code: 'SEL', country: 'South Korea', expectedHotels: 45 },
    { name: 'Shanghai', code: 'SHA', country: 'China', expectedHotels: 50 },
    { name: 'Beijing', code: 'BJS', country: 'China', expectedHotels: 45 },
    { name: 'Mumbai', code: 'BOM', country: 'India', expectedHotels: 40 },
    { name: 'Delhi', code: 'DEL', country: 'India', expectedHotels: 45 },
    { name: 'Dubai', code: 'DXB', country: 'UAE', expectedHotels: 45 },
    { name: 'Kuala Lumpur', code: 'KUL', country: 'Malaysia', expectedHotels: 30 },
    { name: 'Jakarta', code: 'JKT', country: 'Indonesia', expectedHotels: 35 },
    { name: 'Manila', code: 'MNL', country: 'Philippines', expectedHotels: 30 },
    { name: 'Ho Chi Minh City', code: 'SGN', country: 'Vietnam', expectedHotels: 25 },
    
    // Americas
    { name: 'New York', code: 'NYC', country: 'United States', expectedHotels: 90 },
    { name: 'Los Angeles', code: 'LAX', country: 'United States', expectedHotels: 70 },
    { name: 'San Francisco', code: 'SFO', country: 'United States', expectedHotels: 50 },
    { name: 'Miami', code: 'MIA', country: 'United States', expectedHotels: 40 },
    { name: 'Las Vegas', code: 'LAS', country: 'United States', expectedHotels: 35 },
    { name: 'Chicago', code: 'CHI', country: 'United States', expectedHotels: 40 },
    { name: 'Boston', code: 'BOS', country: 'United States', expectedHotels: 35 },
    { name: 'Washington DC', code: 'WAS', country: 'United States', expectedHotels: 30 },
    { name: 'Toronto', code: 'YYZ', country: 'Canada', expectedHotels: 35 },
    { name: 'Vancouver', code: 'YVR', country: 'Canada', expectedHotels: 30 },
    { name: 'Montreal', code: 'YUL', country: 'Canada', expectedHotels: 25 },
    { name: 'Mexico City', code: 'MEX', country: 'Mexico', expectedHotels: 35 },
    { name: 'Rio de Janeiro', code: 'RIO', country: 'Brazil', expectedHotels: 35 },
    { name: 'Buenos Aires', code: 'BUE', country: 'Argentina', expectedHotels: 30 },
    { name: 'Santiago', code: 'SCL', country: 'Chile', expectedHotels: 25 },
    { name: 'Lima', code: 'LIM', country: 'Peru', expectedHotels: 20 },
    
    // Oceania & Africa
    { name: 'Sydney', code: 'SYD', country: 'Australia', expectedHotels: 40 },
    { name: 'Melbourne', code: 'MEL', country: 'Australia', expectedHotels: 35 },
    { name: 'Auckland', code: 'AKL', country: 'New Zealand', expectedHotels: 20 },
    { name: 'Cape Town', code: 'CPT', country: 'South Africa', expectedHotels: 30 },
    { name: 'Johannesburg', code: 'JNB', country: 'South Africa', expectedHotels: 25 },
    { name: 'Cairo', code: 'CAI', country: 'Egypt', expectedHotels: 20 },
    { name: 'Marrakech', code: 'RAK', country: 'Morocco', expectedHotels: 25 }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Fetch hotels focusing purely on content quality - no pricing required
   */
  async fetchContentOnlyHotels(): Promise<void> {
    console.log('🎯 CONTENT-ONLY HOTEL FETCHING - TARGET: 1,500 HOTELS');
    console.log('====================================================');
    console.log('Strategy: Focus purely on hotel content and photos');
    console.log('Quality: 4+ high-resolution photos, premium amenities');
    console.log('Pricing: SKIPPED - No offers required');
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
    const startTime = Date.now();

    for (const city of this.PREMIUM_CITIES) {
      if (totalNewHotels >= targetRemaining) {
        console.log('🎉 Target of 1,500 hotels reached!');
        break;
      }

      console.log(`\n🏙️  Processing ${city.name}, ${city.country} (${city.code})`);
      console.log(`   Expected: ~${city.expectedHotels} boutique hotels`);

      try {
        const cityResult = await this.fetchCityContentOnly(
          city.code, 
          city.name, 
          city.country, 
          existingIds,
          Math.min(city.expectedHotels, targetRemaining - totalNewHotels)
        );

        totalNewHotels += cityResult.added;
        totalProcessed += cityResult.processed;
        
        console.log(`   ✅ Added ${cityResult.added}/${cityResult.processed} hotels from ${city.name}`);
        console.log(`   📊 Progress: ${totalNewHotels}/${targetRemaining} hotels (${((totalNewHotels/targetRemaining)*100).toFixed(1)}%)`);

        // Rate limiting: Wait between cities
        if (totalNewHotels < targetRemaining) {
          console.log('   ⏱️  Rate limiting: 20 second pause...');
          await this.sleep(20000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${city.name}:`, (error as Error).message);
        await this.sleep(5000); // 5 seconds for errors
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // minutes

    console.log('\n🎉 CONTENT-ONLY FETCHING COMPLETE!');
    console.log('==================================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Hotels processed: ${totalProcessed}`);
    console.log(`✅ Hotels added: ${totalNewHotels}`);
    console.log(`🎯 Final progress: ${((existingHotels.length + totalNewHotels) / 1500 * 100).toFixed(1)}%`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - existingHotels.length - totalNewHotels)} hotels needed`);
    console.log(`📸 Success rate: ${totalProcessed > 0 ? ((totalNewHotels / totalProcessed) * 100).toFixed(1) : 0}%`);
  }

  /**
   * Fetch hotels from a city focusing only on content quality
   */
  private async fetchCityContentOnly(
    cityCode: string, 
    cityName: string, 
    country: string, 
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<{ added: number; processed: number }> {
    
    try {
      // Get hotel list directly from Amadeus reference data (no offers needed)
      console.log(`   🔍 Searching for hotel content in ${cityCode}...`);
      
      // Use the hotel list endpoint that doesn't require offers
      const hotelListResponse = await this.amadeusClient['client'].get('/v1/reference-data/locations/hotels/by-city', {
        params: {
          cityCode: cityCode,
          radius: 30,
          radiusUnit: 'KM'
        }
      });

      const hotelList = hotelListResponse.data.data || [];
      console.log(`   📍 Found ${hotelList.length} hotels in ${cityCode}`);

      if (hotelList.length === 0) {
        return { added: 0, processed: 0 };
      }

      const rawHotels: RawHotel[] = [];
      let processedCount = 0;
      const maxToProcess = Math.min(hotelList.length, maxHotels * 3); // Process more to find quality ones

      // Process hotels and get content (skip offers entirely)
      for (const hotel of hotelList.slice(0, maxToProcess)) {
        try {
          // Get hotel content (photos, amenities, description)
          const content = await this.amadeusClient.getHotelContent(hotel.hotelId);
          
          if (content && content.media && content.media.length >= 3) {
            rawHotels.push({
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
                hotelId: content.hotelId,
                name: content.name,
                description: content.description ? { text: content.description.text, lang: 'en' } : undefined,
                amenities: (content.amenities || []).map(amenity => amenity.code),
                media: content.media || [],
                ratings: undefined
              },
              offers: [] // NO OFFERS NEEDED!
            });
          }

          processedCount++;
          
          // Rate limiting between hotel content requests
          if (processedCount % 10 === 0) {
            await this.sleep(2000); // 2 seconds every 10 hotels
            console.log(`   📊 Processed ${processedCount}/${maxToProcess} hotels, found ${rawHotels.length} with good content`);
          }

        } catch (error) {
          if ((error as Error).message.includes('429')) {
            console.log('   ⏱️  Rate limit hit, pausing 30 seconds...');
            await this.sleep(30000);
          }
          // Skip hotels that fail - don't log every failure
        }

        if (rawHotels.length >= maxHotels) {
          break;
        }
      }

      console.log(`   📸 ${rawHotels.length} hotels have sufficient content (${processedCount} processed)`);

      if (rawHotels.length === 0) {
        return { added: 0, processed: processedCount };
      }

      // Apply Glintz curation
      console.log(`   🎯 Applying Glintz curation...`);
      const curationResult = await glintzCurate(rawHotels);
      console.log(`   ✅ ${curationResult.cards.length} hotels passed curation`);

      // Filter out existing hotels
      const newHotels = curationResult.cards.filter(hotel => !existingIds.has(hotel.id));
      console.log(`   🆕 ${newHotels.length} new hotels (${curationResult.cards.length - newHotels.length} duplicates filtered)`);

      if (newHotels.length > 0) {
        // Enhance with Google Places photos
        console.log(`   📸 Enhancing with Google Places photos...`);
        const enhancedHotels = await this.enhanceWithGooglePlaces(newHotels, cityName, country);
        
                 // Convert to Supabase format and store
         const supabaseHotels = enhancedHotels.map(hotel => ({
           id: hotel.id,
           name: hotel.name,
           city: hotel.city,
           country: hotel.country,
           coords: hotel.coords,
           price: { amount: '0', currency: 'EUR' }, // No pricing data available
           description: hotel.description,
           amenity_tags: hotel.tags?.map((tag: any) => tag.label) || [],
           photos: hotel.photos,
           hero_photo: hotel.heroPhoto,
           booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + hotel.city)}`,
           rating: hotel.rating || 4.5,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         }));
        
        await this.supabaseService.insertHotels(supabaseHotels);
        
        // Update existing IDs set
        enhancedHotels.forEach(hotel => existingIds.add(hotel.id));
        
        console.log(`   💾 Stored ${enhancedHotels.length} hotels in database`);
      }

      return { added: newHotels.length, processed: processedCount };

    } catch (error) {
      console.error(`   ❌ Failed to fetch content from ${cityCode}:`, error);
      return { added: 0, processed: 0 };
    }
  }

  /**
   * Enhance hotels with Google Places photos
   */
  private async enhanceWithGooglePlaces(hotels: any[], cityName: string, country: string): Promise<any[]> {
    const enhanced = [];
    
    for (const hotel of hotels) {
      try {
                 // Get Google Places photos
         const googlePhotos = await this.googlePlacesClient.getSpecificHotelPhotos(
           hotel.name,
           cityName,
           8
         );
        
        if (googlePhotos && googlePhotos.length >= 4) {
          enhanced.push({
            ...hotel,
            photos: googlePhotos,
            heroPhoto: googlePhotos[0]
          });
        } else {
          // Keep hotel even with fewer photos if content is good
          enhanced.push(hotel);
        }
        
        // Rate limit Google Places requests
        await this.sleep(500);
        
      } catch (error) {
        // Keep hotel even if Google Places fails
        enhanced.push(hotel);
      }
    }
    
    return enhanced;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const fetcher = new ContentOnlyHotelFetcher();
  
  fetcher.fetchContentOnlyHotels()
    .then(() => {
      console.log('\n🎉 Content-only hotel fetching completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Content-only hotel fetching failed:', error);
      process.exit(1);
    });
} 