// Luxury Island & Boutique Resort Fetcher
// Focuses on exotic islands, luxury coastal resorts, and unique boutique properties

import dotenv from 'dotenv';
import { AmadeusClient } from './amadeus';
import { SupabaseService } from './supabase';
import { GooglePlacesClient } from './google-places';

dotenv.config();

interface LuxuryDestination {
  name: string;
  code: string;
  country: string;
  region: string;
  type: 'island' | 'coastal' | 'mountain' | 'desert' | 'vineyard' | 'safari';
  expectedHotels: number;
  luxuryLevel: 'ultra-luxury' | 'luxury' | 'boutique';
}

export class LuxuryIslandFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;

  // Exotic and luxury destinations worldwide
  private LUXURY_DESTINATIONS: LuxuryDestination[] = [
    // MEDITERRANEAN ISLANDS & COASTAL LUXURY
    { name: 'Santorini', code: 'JTR', country: 'Greece', region: 'Cyclades', type: 'island', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    { name: 'Mykonos', code: 'JMK', country: 'Greece', region: 'Cyclades', type: 'island', expectedHotels: 20, luxuryLevel: 'ultra-luxury' },
    { name: 'Crete', code: 'HER', country: 'Greece', region: 'Crete', type: 'island', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Rhodes', code: 'RHO', country: 'Greece', region: 'Dodecanese', type: 'island', expectedHotels: 18, luxuryLevel: 'luxury' },
    { name: 'Corfu', code: 'CFU', country: 'Greece', region: 'Ionian', type: 'island', expectedHotels: 15, luxuryLevel: 'luxury' },
    { name: 'Zakynthos', code: 'ZTH', country: 'Greece', region: 'Ionian', type: 'island', expectedHotels: 12, luxuryLevel: 'boutique' },
    
    { name: 'Ibiza', code: 'IBZ', country: 'Spain', region: 'Balearic Islands', type: 'island', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    { name: 'Mallorca', code: 'PMI', country: 'Spain', region: 'Balearic Islands', type: 'island', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Menorca', code: 'MAH', country: 'Spain', region: 'Balearic Islands', type: 'island', expectedHotels: 15, luxuryLevel: 'boutique' },
    { name: 'Formentera', code: 'IBZ', country: 'Spain', region: 'Balearic Islands', type: 'island', expectedHotels: 8, luxuryLevel: 'ultra-luxury' },
    
    { name: 'Capri', code: 'NAP', country: 'Italy', region: 'Campania', type: 'island', expectedHotels: 20, luxuryLevel: 'ultra-luxury' },
    { name: 'Ischia', code: 'NAP', country: 'Italy', region: 'Campania', type: 'island', expectedHotels: 15, luxuryLevel: 'luxury' },
    { name: 'Sicily', code: 'CTA', country: 'Italy', region: 'Sicily', type: 'island', expectedHotels: 35, luxuryLevel: 'luxury' },
    { name: 'Sardinia', code: 'CAG', country: 'Italy', region: 'Sardinia', type: 'island', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Elba', code: 'EBA', country: 'Italy', region: 'Tuscany', type: 'island', expectedHotels: 12, luxuryLevel: 'boutique' },
    
    { name: 'Corsica', code: 'AJA', country: 'France', region: 'Corsica', type: 'island', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'French Riviera', code: 'NCE', country: 'France', region: 'Côte d\'Azur', type: 'coastal', expectedHotels: 40, luxuryLevel: 'ultra-luxury' },
    { name: 'Monaco', code: 'NCE', country: 'Monaco', region: 'Monaco', type: 'coastal', expectedHotels: 15, luxuryLevel: 'ultra-luxury' },
    { name: 'Saint-Tropez', code: 'NCE', country: 'France', region: 'Provence', type: 'coastal', expectedHotels: 18, luxuryLevel: 'ultra-luxury' },
    { name: 'Cannes', code: 'NCE', country: 'France', region: 'Côte d\'Azur', type: 'coastal', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    
    { name: 'Cyprus', code: 'LCA', country: 'Cyprus', region: 'Cyprus', type: 'island', expectedHotels: 25, luxuryLevel: 'luxury' },
    { name: 'Malta', code: 'MLA', country: 'Malta', region: 'Malta', type: 'island', expectedHotels: 18, luxuryLevel: 'luxury' },
    
    // ATLANTIC & NORTH AFRICAN ISLANDS
    { name: 'Madeira', code: 'FNC', country: 'Portugal', region: 'Madeira', type: 'island', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'Azores', code: 'PDL', country: 'Portugal', region: 'Azores', type: 'island', expectedHotels: 15, luxuryLevel: 'boutique' },
    { name: 'Canary Islands', code: 'LPA', country: 'Spain', region: 'Canary Islands', type: 'island', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Tenerife', code: 'TFS', country: 'Spain', region: 'Canary Islands', type: 'island', expectedHotels: 25, luxuryLevel: 'luxury' },
    
    // CARIBBEAN LUXURY
    { name: 'Barbados', code: 'BGI', country: 'Barbados', region: 'Caribbean', type: 'island', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    { name: 'St. Lucia', code: 'UVF', country: 'Saint Lucia', region: 'Caribbean', type: 'island', expectedHotels: 20, luxuryLevel: 'ultra-luxury' },
    { name: 'Antigua', code: 'ANU', country: 'Antigua and Barbuda', region: 'Caribbean', type: 'island', expectedHotels: 18, luxuryLevel: 'luxury' },
    { name: 'Turks and Caicos', code: 'PLS', country: 'Turks and Caicos', region: 'Caribbean', type: 'island', expectedHotels: 15, luxuryLevel: 'ultra-luxury' },
    { name: 'Bahamas', code: 'NAS', country: 'Bahamas', region: 'Caribbean', type: 'island', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'Jamaica', code: 'KIN', country: 'Jamaica', region: 'Caribbean', type: 'island', expectedHotels: 25, luxuryLevel: 'luxury' },
    { name: 'Aruba', code: 'AUA', country: 'Aruba', region: 'Caribbean', type: 'island', expectedHotels: 15, luxuryLevel: 'luxury' },
    
    // INDIAN OCEAN LUXURY
    { name: 'Maldives', code: 'MLE', country: 'Maldives', region: 'Indian Ocean', type: 'island', expectedHotels: 40, luxuryLevel: 'ultra-luxury' },
    { name: 'Seychelles', code: 'SEZ', country: 'Seychelles', region: 'Indian Ocean', type: 'island', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    { name: 'Mauritius', code: 'MRU', country: 'Mauritius', region: 'Indian Ocean', type: 'island', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Zanzibar', code: 'ZNZ', country: 'Tanzania', region: 'Indian Ocean', type: 'island', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'Reunion', code: 'RUN', country: 'France', region: 'Indian Ocean', type: 'island', expectedHotels: 12, luxuryLevel: 'boutique' },
    
    // SOUTHEAST ASIAN ISLANDS
    { name: 'Bali', code: 'DPS', country: 'Indonesia', region: 'Indonesia', type: 'island', expectedHotels: 50, luxuryLevel: 'luxury' },
    { name: 'Lombok', code: 'LOP', country: 'Indonesia', region: 'Indonesia', type: 'island', expectedHotels: 20, luxuryLevel: 'boutique' },
    { name: 'Phuket', code: 'HKT', country: 'Thailand', region: 'Thailand', type: 'island', expectedHotels: 40, luxuryLevel: 'luxury' },
    { name: 'Koh Samui', code: 'USM', country: 'Thailand', region: 'Thailand', type: 'island', expectedHotels: 25, luxuryLevel: 'luxury' },
    { name: 'Langkawi', code: 'LGK', country: 'Malaysia', region: 'Malaysia', type: 'island', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'Boracay', code: 'MPH', country: 'Philippines', region: 'Philippines', type: 'island', expectedHotels: 18, luxuryLevel: 'boutique' },
    { name: 'Palawan', code: 'PPS', country: 'Philippines', region: 'Philippines', type: 'island', expectedHotels: 15, luxuryLevel: 'boutique' },
    
    // PACIFIC LUXURY
    { name: 'Tahiti', code: 'PPT', country: 'French Polynesia', region: 'Pacific', type: 'island', expectedHotels: 20, luxuryLevel: 'ultra-luxury' },
    { name: 'Bora Bora', code: 'BOB', country: 'French Polynesia', region: 'Pacific', type: 'island', expectedHotels: 15, luxuryLevel: 'ultra-luxury' },
    { name: 'Fiji', code: 'NAN', country: 'Fiji', region: 'Pacific', type: 'island', expectedHotels: 25, luxuryLevel: 'luxury' },
    { name: 'Cook Islands', code: 'RAR', country: 'Cook Islands', region: 'Pacific', type: 'island', expectedHotels: 10, luxuryLevel: 'boutique' },
    
    // UNIQUE MOUNTAIN & DESERT LUXURY
    { name: 'Swiss Alps', code: 'ZUR', country: 'Switzerland', region: 'Alps', type: 'mountain', expectedHotels: 25, luxuryLevel: 'ultra-luxury' },
    { name: 'Austrian Alps', code: 'INN', country: 'Austria', region: 'Alps', type: 'mountain', expectedHotels: 20, luxuryLevel: 'luxury' },
    { name: 'French Alps', code: 'GVA', country: 'France', region: 'Alps', type: 'mountain', expectedHotels: 18, luxuryLevel: 'luxury' },
    { name: 'Dolomites', code: 'BZO', country: 'Italy', region: 'Alps', type: 'mountain', expectedHotels: 15, luxuryLevel: 'boutique' },
    
    { name: 'Sahara Morocco', code: 'RAK', country: 'Morocco', region: 'Sahara', type: 'desert', expectedHotels: 12, luxuryLevel: 'ultra-luxury' },
    { name: 'Wadi Rum', code: 'AMM', country: 'Jordan', region: 'Desert', type: 'desert', expectedHotels: 8, luxuryLevel: 'ultra-luxury' },
    { name: 'Atacama', code: 'CJC', country: 'Chile', region: 'Atacama', type: 'desert', expectedHotels: 6, luxuryLevel: 'ultra-luxury' },
    
    // WINE & VINEYARD LUXURY
    { name: 'Tuscany', code: 'FLR', country: 'Italy', region: 'Tuscany', type: 'vineyard', expectedHotels: 30, luxuryLevel: 'luxury' },
    { name: 'Bordeaux', code: 'BOD', country: 'France', region: 'Bordeaux', type: 'vineyard', expectedHotels: 15, luxuryLevel: 'luxury' },
    { name: 'Douro Valley', code: 'OPO', country: 'Portugal', region: 'Douro', type: 'vineyard', expectedHotels: 12, luxuryLevel: 'boutique' },
    { name: 'Napa Valley', code: 'SFO', country: 'United States', region: 'California', type: 'vineyard', expectedHotels: 20, luxuryLevel: 'ultra-luxury' },
    
    // SAFARI & WILDLIFE LUXURY
    { name: 'Serengeti', code: 'ARK', country: 'Tanzania', region: 'Serengeti', type: 'safari', expectedHotels: 10, luxuryLevel: 'ultra-luxury' },
    { name: 'Masai Mara', code: 'NBO', country: 'Kenya', region: 'Masai Mara', type: 'safari', expectedHotels: 8, luxuryLevel: 'ultra-luxury' },
    { name: 'Kruger', code: 'HDS', country: 'South Africa', region: 'Kruger', type: 'safari', expectedHotels: 12, luxuryLevel: 'ultra-luxury' },
    { name: 'Okavango Delta', code: 'MUB', country: 'Botswana', region: 'Okavango', type: 'safari', expectedHotels: 6, luxuryLevel: 'ultra-luxury' }
  ];

  // Luxury amenities that indicate premium properties
  private LUXURY_AMENITIES = [
    'spa', 'wellness', 'infinity pool', 'private beach', 'butler service', 'concierge',
    'michelin', 'fine dining', 'wine cellar', 'helicopter', 'yacht', 'private villa',
    'overwater', 'beachfront', 'oceanfront', 'mountain view', 'vineyard', 'golf course',
    'private island', 'adults only', 'all inclusive', 'resort', 'retreat', 'sanctuary'
  ];

  // Luxury keywords in hotel names
  private LUXURY_KEYWORDS = [
    'resort', 'spa', 'palace', 'grand', 'luxury', 'premium', 'exclusive', 'private',
    'villa', 'manor', 'château', 'castle', 'royal', 'imperial', 'ritz', 'four seasons',
    'mandarin oriental', 'st regis', 'waldorf', 'bulgari', 'armani', 'aman', 'rosewood',
    'peninsula', 'shangri-la', 'intercontinental', 'hyatt', 'marriott', 'hilton',
    'boutique', 'collection', 'preferred', 'relais', 'chateaux', 'leading hotels',
    'small luxury', 'design hotels', 'member', 'retreat', 'sanctuary', 'hideaway'
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Fetch luxury island resorts and boutique properties
   */
  async fetchLuxuryIslandHotels(): Promise<void> {
    console.log('🏝️  LUXURY ISLAND & BOUTIQUE RESORT FETCHER');
    console.log('===========================================');
    console.log('Focus: Exotic islands, luxury coastal resorts, boutique properties');
    console.log('Criteria: Premium amenities, unique locations, luxury keywords');
    console.log('Quality: Ultra-luxury > Luxury > Boutique tiers');
    console.log('');

    // Get existing hotels to avoid duplicates
    const existingHotels = await this.supabaseService.getHotels(2000, 0);
    const existingIds = new Set(existingHotels.map(h => h.id));
    
    console.log(`📊 Starting with ${existingHotels.length} existing hotels`);
    console.log(`🎯 Target: Add 500+ luxury island & boutique hotels`);
    console.log('');

    let totalNewHotels = 0;
    let totalProcessed = 0;
    let totalLuxuryFound = 0;
    const startTime = Date.now();

    // Sort destinations by luxury level (ultra-luxury first)
    const sortedDestinations = this.LUXURY_DESTINATIONS.sort((a, b) => {
      const luxuryOrder = { 'ultra-luxury': 3, 'luxury': 2, 'boutique': 1 };
      return luxuryOrder[b.luxuryLevel] - luxuryOrder[a.luxuryLevel];
    });

    for (const destination of sortedDestinations) {
      if (totalNewHotels >= 500) {
        console.log('🎉 Target of 500+ luxury hotels reached!');
        break;
      }

      console.log(`\n🏝️  Processing ${destination.name}, ${destination.country}`);
      console.log(`   Type: ${destination.type} | Level: ${destination.luxuryLevel} | Region: ${destination.region}`);
      console.log(`   Expected: ~${destination.expectedHotels} luxury properties`);

      try {
        const result = await this.fetchDestinationLuxuryHotels(
          destination,
          existingIds,
          Math.min(destination.expectedHotels, 500 - totalNewHotels)
        );

        totalNewHotels += result.added;
        totalProcessed += result.processed;
        totalLuxuryFound += result.luxuryFound;
        
        console.log(`   ✅ Added ${result.added}/${result.processed} hotels from ${destination.name}`);
        console.log(`   🏆 ${result.luxuryFound} luxury properties identified`);
        console.log(`   📊 Progress: ${totalNewHotels}/500+ luxury hotels (${((totalNewHotels/500)*100).toFixed(1)}%)`);

        // Rate limiting between destinations
        if (totalNewHotels < 500) {
          console.log('   ⏱️  Rate limiting: 12 second pause...');
          await this.sleep(12000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${destination.name}:`, (error as Error).message);
        await this.sleep(5000);
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60;

    console.log('\n🏝️  LUXURY ISLAND FETCHING COMPLETE!');
    console.log('===================================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Properties processed: ${totalProcessed}`);
    console.log(`🏆 Luxury properties found: ${totalLuxuryFound}`);
    console.log(`✅ Luxury hotels added: ${totalNewHotels}`);
    console.log(`🎯 Final database: ${existingHotels.length + totalNewHotels} total hotels`);
    console.log(`🏝️  Luxury success rate: ${totalProcessed > 0 ? ((totalLuxuryFound / totalProcessed) * 100).toFixed(1) : 0}%`);
  }

  /**
   * Fetch luxury hotels from a specific destination
   */
  private async fetchDestinationLuxuryHotels(
    destination: LuxuryDestination,
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<{ added: number; processed: number; luxuryFound: number }> {
    
    try {
      // Get hotel list from Amadeus
      console.log(`   🔍 Searching luxury properties in ${destination.code}...`);
      
      const hotelListResponse = await this.amadeusClient['client'].get('/v1/reference-data/locations/hotels/by-city', {
        params: {
          cityCode: destination.code,
          radius: destination.type === 'island' ? 50 : 30, // Larger radius for islands
          radiusUnit: 'KM'
        }
      });

      const hotelList = hotelListResponse.data.data || [];
      console.log(`   📍 Found ${hotelList.length} properties in Amadeus`);

      if (hotelList.length === 0) {
        return { added: 0, processed: 0, luxuryFound: 0 };
      }

      const luxuryHotels = [];
      let processedCount = 0;
      let luxuryFoundCount = 0;
      const maxToProcess = Math.min(hotelList.length, maxHotels * 3);

      // Process each hotel with luxury filtering
      for (const hotel of hotelList.slice(0, maxToProcess)) {
        try {
          processedCount++;
          
          // Skip if already exists
          if (existingIds.has(hotel.hotelId)) {
            continue;
          }

          // Luxury Filter 1: Hotel name analysis
          if (!this.isLuxuryHotelName(hotel.name)) {
            continue;
          }

          luxuryFoundCount++;

          // Get Google Places photos (luxury properties should have great photos)
          console.log(`   📸 Getting photos for ${hotel.name}...`);
          const googlePhotos = await this.googlePlacesClient.getSpecificHotelPhotos(
            hotel.name,
            destination.name,
            12 // Get more photos for luxury properties
          );

          // Luxury Filter 2: Photo quality requirement
          const minPhotos = destination.luxuryLevel === 'ultra-luxury' ? 8 : 
                           destination.luxuryLevel === 'luxury' ? 6 : 4;
          
          if (!googlePhotos || googlePhotos.length < minPhotos) {
            console.log(`   ❌ ${hotel.name}: Only ${googlePhotos?.length || 0}/${minPhotos}+ photos`);
            continue;
          }

          console.log(`   ✅ ${hotel.name}: Found ${googlePhotos.length} luxury photos`);

          // Create luxury hotel card
          const hotelCard = {
            id: hotel.hotelId,
            name: this.cleanHotelName(hotel.name),
            city: destination.name,
            country: destination.country,
            coords: {
              lat: hotel.geoCode?.latitude || 0,
              lng: hotel.geoCode?.longitude || 0
            },
            price: { amount: '0', currency: 'EUR' },
            description: this.generateLuxuryDescription(hotel.name, destination),
            amenity_tags: this.generateLuxuryAmenities(hotel.name, destination),
            photos: googlePhotos,
            hero_photo: googlePhotos[0],
            booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + destination.name)}`,
            rating: this.generateLuxuryRating(hotel.name, destination.luxuryLevel),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          luxuryHotels.push(hotelCard);
          
          // Rate limiting for Google Places
          await this.sleep(800);

        } catch (error) {
          console.log(`   ⚠️  Error processing ${hotel.name}: ${(error as Error).message}`);
          
          if ((error as Error).message.includes('429')) {
            console.log('   ⏱️  Rate limit hit, pausing 20 seconds...');
            await this.sleep(20000);
          }
        }

        if (luxuryHotels.length >= maxHotels) {
          break;
        }

        // Progress update
        if (processedCount % 20 === 0) {
          console.log(`   📊 Processed ${processedCount}/${maxToProcess}, found ${luxuryHotels.length} luxury properties`);
        }
      }

      console.log(`   🏆 ${luxuryHotels.length} luxury properties ready for database (${processedCount} processed)`);

      if (luxuryHotels.length > 0) {
        // Store luxury hotels in database
        await this.supabaseService.insertHotels(luxuryHotels);
        
        // Update existing IDs set
        luxuryHotels.forEach(hotel => existingIds.add(hotel.id));
        
        console.log(`   💾 Stored ${luxuryHotels.length} luxury hotels in database`);
      }

      return { 
        added: luxuryHotels.length, 
        processed: processedCount, 
        luxuryFound: luxuryFoundCount
      };

    } catch (error) {
      console.error(`   ❌ Failed to fetch luxury hotels from ${destination.code}:`, error);
      return { added: 0, processed: 0, luxuryFound: 0 };
    }
  }

  /**
   * Check if hotel name indicates luxury property
   */
  private isLuxuryHotelName(name: string): boolean {
    const lowerName = name.toLowerCase();
    
    // Must contain at least one luxury keyword
    const hasLuxuryKeyword = this.LUXURY_KEYWORDS.some(keyword => 
      lowerName.includes(keyword.toLowerCase())
    );
    
    // Exclude budget chains even if they have luxury keywords
    const budgetChains = [
      'ibis', 'best western', 'holiday inn express', 'comfort inn', 'days inn',
      'motel', 'hostel', 'budget', 'economy', 'express', 'inn', 'lodge'
    ];
    
    const isBudgetChain = budgetChains.some(chain => lowerName.includes(chain));
    
    return hasLuxuryKeyword && !isBudgetChain;
  }

  /**
   * Clean and format hotel name
   */
  private cleanHotelName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&'-]/g, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate luxury description based on destination
   */
  private generateLuxuryDescription(name: string, destination: LuxuryDestination): string {
    const templates = {
      'ultra-luxury': {
        island: `Exclusive ultra-luxury resort on the pristine ${destination.name} island, offering unparalleled sophistication and world-class amenities.`,
        coastal: `Ultra-luxury coastal retreat in ${destination.name}, featuring breathtaking ocean views and exceptional personalized service.`,
        mountain: `Ultra-luxury mountain resort in ${destination.name}, combining alpine elegance with modern luxury amenities.`,
        desert: `Ultra-luxury desert sanctuary in ${destination.name}, offering an extraordinary escape in stunning natural surroundings.`,
        vineyard: `Ultra-luxury vineyard estate in ${destination.name}, where world-class wines meet exceptional hospitality.`,
        safari: `Ultra-luxury safari lodge in ${destination.name}, providing exclusive wildlife experiences with uncompromising comfort.`
      },
      luxury: {
        island: `Luxury island resort in ${destination.name}, featuring elegant accommodations and premium amenities in paradise.`,
        coastal: `Luxury coastal hotel in ${destination.name}, offering sophisticated comfort with stunning sea views.`,
        mountain: `Luxury mountain retreat in ${destination.name}, combining natural beauty with refined hospitality.`,
        desert: `Luxury desert resort in ${destination.name}, providing exceptional comfort in a unique landscape.`,
        vineyard: `Luxury vineyard hotel in ${destination.name}, surrounded by rolling hills and world-renowned wineries.`,
        safari: `Luxury safari camp in ${destination.name}, offering authentic wildlife experiences with modern comforts.`
      },
      boutique: {
        island: `Boutique island hotel in ${destination.name}, offering intimate luxury and personalized service.`,
        coastal: `Boutique coastal property in ${destination.name}, featuring unique design and exceptional attention to detail.`,
        mountain: `Boutique mountain hotel in ${destination.name}, combining local charm with modern amenities.`,
        desert: `Boutique desert lodge in ${destination.name}, providing an intimate escape in spectacular surroundings.`,
        vineyard: `Boutique vineyard retreat in ${destination.name}, offering wine-focused experiences and elegant accommodations.`,
        safari: `Boutique safari lodge in ${destination.name}, providing intimate wildlife encounters and personalized service.`
      }
    };

    return templates[destination.luxuryLevel][destination.type];
  }

  /**
   * Generate luxury amenities based on destination type
   */
  private generateLuxuryAmenities(name: string, destination: LuxuryDestination): string[] {
    const baseAmenities = ['WiFi', 'Concierge Service', '24-Hour Room Service'];
    
    const typeAmenities = {
      island: ['Private Beach', 'Infinity Pool', 'Water Sports', 'Spa & Wellness', 'Fine Dining', 'Beach Bar'],
      coastal: ['Ocean View', 'Spa & Wellness', 'Fine Dining', 'Pool', 'Beach Access', 'Terrace'],
      mountain: ['Mountain View', 'Spa & Wellness', 'Hiking Trails', 'Fireplace', 'Ski Access', 'Alpine Restaurant'],
      desert: ['Desert View', 'Spa & Wellness', 'Stargazing', 'Desert Tours', 'Infinity Pool', 'Outdoor Dining'],
      vineyard: ['Wine Tasting', 'Vineyard Tours', 'Fine Dining', 'Spa & Wellness', 'Terrace', 'Wine Cellar'],
      safari: ['Game Drives', 'Wildlife Viewing', 'Bush Dining', 'Spa Treatments', 'Photography Tours', 'Cultural Experiences']
    };

    const luxuryAmenities = {
      'ultra-luxury': ['Butler Service', 'Private Villa', 'Helicopter Transfer', 'Michelin Dining', 'Personal Chef'],
      'luxury': ['Premium Spa', 'Golf Course', 'Yacht Charter', 'Private Pool', 'Gourmet Restaurant'],
      'boutique': ['Boutique Spa', 'Local Experiences', 'Artisan Dining', 'Unique Design', 'Personalized Service']
    };

    const selected = [
      ...baseAmenities,
      ...typeAmenities[destination.type].slice(0, 4),
      ...luxuryAmenities[destination.luxuryLevel].slice(0, 3)
    ];

    return selected.slice(0, 10); // Limit to 10 amenities
  }

  /**
   * Generate realistic luxury rating
   */
  private generateLuxuryRating(name: string, luxuryLevel: string): number {
    const ranges = {
      'ultra-luxury': { min: 4.7, max: 5.0 },
      'luxury': { min: 4.4, max: 4.8 },
      'boutique': { min: 4.2, max: 4.6 }
    };

    const range = ranges[luxuryLevel as keyof typeof ranges];
    return Math.round((Math.random() * (range.max - range.min) + range.min) * 10) / 10;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const fetcher = new LuxuryIslandFetcher();
  
  fetcher.fetchLuxuryIslandHotels()
    .then(() => {
      console.log('\n🏝️  Luxury island hotel fetching completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Luxury island hotel fetching failed:', error);
      process.exit(1);
    });
} 