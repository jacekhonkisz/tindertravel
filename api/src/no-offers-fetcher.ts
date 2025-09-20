// No-Offers Hotel Fetcher - Works without requiring pricing offers
// Designed to work with Amadeus test API limitations

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

export class NoOffersHotelFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;

  // Focus on major cities with good hotel availability
  private PREMIUM_CITIES: CityTarget[] = [
    { name: 'Paris', code: 'PAR', country: 'France', expectedHotels: 50 },
    { name: 'London', code: 'LON', country: 'UK', expectedHotels: 50 },
    { name: 'Rome', code: 'ROM', country: 'Italy', expectedHotels: 40 },
    { name: 'Barcelona', code: 'BCN', country: 'Spain', expectedHotels: 40 },
    { name: 'Amsterdam', code: 'AMS', country: 'Netherlands', expectedHotels: 30 },
    { name: 'Prague', code: 'PRG', country: 'Czech Republic', expectedHotels: 30 },
    { name: 'Vienna', code: 'VIE', country: 'Austria', expectedHotels: 25 },
    { name: 'Berlin', code: 'BER', country: 'Germany', expectedHotels: 35 },
    { name: 'Munich', code: 'MUC', country: 'Germany', expectedHotels: 25 },
    { name: 'Zurich', code: 'ZUR', country: 'Switzerland', expectedHotels: 20 },
    { name: 'Milan', code: 'MIL', country: 'Italy', expectedHotels: 30 },
    { name: 'Florence', code: 'FLR', country: 'Italy', expectedHotels: 25 },
    { name: 'Venice', code: 'VCE', country: 'Italy', expectedHotels: 20 },
    { name: 'Madrid', code: 'MAD', country: 'Spain', expectedHotels: 35 },
    { name: 'Lisbon', code: 'LIS', country: 'Portugal', expectedHotels: 25 },
    { name: 'Dublin', code: 'DUB', country: 'Ireland', expectedHotels: 20 },
    { name: 'Edinburgh', code: 'EDI', country: 'Scotland', expectedHotels: 15 },
    { name: 'Copenhagen', code: 'CPH', country: 'Denmark', expectedHotels: 20 },
    { name: 'Stockholm', code: 'STO', country: 'Sweden', expectedHotels: 20 },
    { name: 'Oslo', code: 'OSL', country: 'Norway', expectedHotels: 15 },
    { name: 'Helsinki', code: 'HEL', country: 'Finland', expectedHotels: 15 },
    { name: 'Budapest', code: 'BUD', country: 'Hungary', expectedHotels: 25 },
    { name: 'Warsaw', code: 'WAW', country: 'Poland', expectedHotels: 20 },
    { name: 'Krakow', code: 'KRK', country: 'Poland', expectedHotels: 15 },
    { name: 'Brussels', code: 'BRU', country: 'Belgium', expectedHotels: 20 },
    { name: 'Athens', code: 'ATH', country: 'Greece', expectedHotels: 25 },
    { name: 'Istanbul', code: 'IST', country: 'Turkey', expectedHotels: 40 },
    { name: 'Tokyo', code: 'TYO', country: 'Japan', expectedHotels: 60 },
    { name: 'Kyoto', code: 'KIX', country: 'Japan', expectedHotels: 30 },
    { name: 'Bangkok', code: 'BKK', country: 'Thailand', expectedHotels: 50 },
    { name: 'Singapore', code: 'SIN', country: 'Singapore', expectedHotels: 30 },
    { name: 'Hong Kong', code: 'HKG', country: 'Hong Kong', expectedHotels: 35 },
    { name: 'Seoul', code: 'SEL', country: 'South Korea', expectedHotels: 40 },
    { name: 'New York', code: 'NYC', country: 'United States', expectedHotels: 80 },
    { name: 'Los Angeles', code: 'LAX', country: 'United States', expectedHotels: 60 },
    { name: 'San Francisco', code: 'SFO', country: 'United States', expectedHotels: 40 },
    { name: 'Miami', code: 'MIA', country: 'United States', expectedHotels: 35 },
    { name: 'Las Vegas', code: 'LAS', country: 'United States', expectedHotels: 30 },
    { name: 'Chicago', code: 'CHI', country: 'United States', expectedHotels: 35 },
    { name: 'Toronto', code: 'YYZ', country: 'Canada', expectedHotels: 30 },
    { name: 'Vancouver', code: 'YVR', country: 'Canada', expectedHotels: 25 },
    { name: 'Sydney', code: 'SYD', country: 'Australia', expectedHotels: 35 },
    { name: 'Melbourne', code: 'MEL', country: 'Australia', expectedHotels: 30 },
    { name: 'Dubai', code: 'DXB', country: 'UAE', expectedHotels: 40 },
    { name: 'Mumbai', code: 'BOM', country: 'India', expectedHotels: 35 },
    { name: 'Delhi', code: 'DEL', country: 'India', expectedHotels: 40 },
    { name: 'Cape Town', code: 'CPT', country: 'South Africa', expectedHotels: 25 },
    { name: 'Rio de Janeiro', code: 'RIO', country: 'Brazil', expectedHotels: 30 },
    { name: 'Buenos Aires', code: 'BUE', country: 'Argentina', expectedHotels: 25 },
    { name: 'Mexico City', code: 'MEX', country: 'Mexico', expectedHotels: 30 }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Fetch hotels without requiring offers - focus on content and photos
   */
  async fetchHotelsWithoutOffers(): Promise<void> {
    console.log('🎯 NO-OFFERS HOTEL FETCHING - TARGET: 1,500 HOTELS');
    console.log('==================================================');
    console.log('Strategy: Fetch hotel content without requiring pricing offers');
    console.log('Quality: Focus on hotels with 4+ high-resolution photos');
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
    const startTime = Date.now();

    for (const city of this.PREMIUM_CITIES) {
      if (totalNewHotels >= targetRemaining) {
        console.log('🎉 Target of 1,500 hotels reached!');
        break;
      }

      console.log(`\n🏙️  Processing ${city.name}, ${city.country} (${city.code})`);
      console.log(`   Expected: ~${city.expectedHotels} boutique hotels`);

      try {
        const cityHotels = await this.fetchCityHotelsWithoutOffers(
          city.code, 
          city.name, 
          city.country, 
          existingIds,
          Math.min(city.expectedHotels, targetRemaining - totalNewHotels)
        );

        totalNewHotels += cityHotels;
        console.log(`   ✅ Added ${cityHotels} hotels from ${city.name}`);
        console.log(`   📊 Progress: ${totalNewHotels}/${targetRemaining} hotels (${((totalNewHotels/targetRemaining)*100).toFixed(1)}%)`);

        // Rate limiting: Wait between cities
        if (totalNewHotels < targetRemaining) {
          console.log('   ⏱️  Rate limiting: 30 second pause...');
          await this.sleep(30000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${city.name}:`, (error as Error).message);
        await this.sleep(10000); // 10 seconds for errors
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // minutes

    console.log('\n🎉 NO-OFFERS FETCHING COMPLETE!');
    console.log('===============================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Hotels added: ${totalNewHotels}`);
    console.log(`🎯 Progress: ${((existingHotels.length + totalNewHotels) / 1500 * 100).toFixed(1)}%`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - existingHotels.length - totalNewHotels)} hotels needed`);
  }

  /**
   * Fetch hotels from a city without requiring offers
   */
  private async fetchCityHotelsWithoutOffers(
    cityCode: string, 
    cityName: string, 
    country: string, 
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<number> {
    
    try {
             // Get hotel list from Amadeus (this doesn't require offers)
       console.log(`   🔍 Searching for hotels in ${cityCode}...`);
               const amadeusCityHotels = await this.amadeusClient.getHotelsByCity(cityCode, maxHotels * 2);
       console.log(`   📍 Found ${amadeusCityHotels.length} hotels in ${cityCode}`);

       if (amadeusCityHotels.length === 0) {
         return 0;
       }

       const rawHotels: RawHotel[] = [];
       let processedCount = 0;

       // Process hotels and get content (without requiring offers)
       for (const hotelOffer of amadeusCityHotels.slice(0, maxHotels * 2)) {
                 try {
           // Get hotel content (photos, amenities, description)
           const content = await this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId);
           
           if (content && content.media && content.media.length >= 3) {
             rawHotels.push({
               hotel: {
                 hotelId: hotelOffer.hotel.hotelId,
                 name: hotelOffer.hotel.name,
                 chainCode: undefined,
                 rating: undefined,
                 cityCode: cityCode,
                 latitude: hotelOffer.hotel.latitude || 0,
                 longitude: hotelOffer.hotel.longitude || 0
               },
               content: {
                 hotelId: content.hotelId,
                 name: content.name,
                 description: content.description ? { text: content.description.text, lang: 'en' } : undefined,
                 amenities: (content.amenities || []).map(amenity => amenity.code),
                 media: content.media || [],
                 ratings: undefined
               },
               offers: [] // No offers required!
             });
           }

           processedCount++;
           
           // Rate limiting between hotel content requests
           if (processedCount % 5 === 0) {
             await this.sleep(1000); // 1 second every 5 hotels
           }

         } catch (error) {
           console.log(`   ⚠️  Skipped hotel ${hotelOffer.hotel.hotelId}: ${(error as Error).message}`);
          
          if ((error as Error).message.includes('429')) {
            console.log('   ⏱️  Rate limit hit, pausing 30 seconds...');
            await this.sleep(30000);
          }
        }

        if (rawHotels.length >= maxHotels) {
          break;
        }
      }

      console.log(`   📸 ${rawHotels.length} hotels have sufficient photos`);

      if (rawHotels.length === 0) {
        return 0;
      }

      // Apply Glintz curation
      console.log(`   🎯 Applying Glintz curation...`);
      const curationResult = await glintzCurate(rawHotels);
      console.log(`   ✅ ${curationResult.cards.length} hotels passed curation`);

      // Filter out existing hotels
      const newHotels = curationResult.cards.filter(hotel => !existingIds.has(hotel.id));
      console.log(`   🆕 ${newHotels.length} new hotels (${curationResult.cards.length - newHotels.length} duplicates filtered)`);

             if (newHotels.length > 0) {
         // Convert to Supabase format and store
         const supabaseHotels = newHotels.map(hotel => ({
           id: hotel.id,
           name: hotel.name,
           city: hotel.city,
           country: hotel.country,
           coords: hotel.coords,
           price: hotel.price,
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
         newHotels.forEach(hotel => existingIds.add(hotel.id));
       }

      return newHotels.length;

    } catch (error) {
      console.error(`   ❌ Failed to fetch hotels from ${cityCode}:`, error);
      return 0;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const fetcher = new NoOffersHotelFetcher();
  
  fetcher.fetchHotelsWithoutOffers()
    .then(() => {
      console.log('\n🎉 No-offers hotel fetching completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ No-offers hotel fetching failed:', error);
      process.exit(1);
    });
} 