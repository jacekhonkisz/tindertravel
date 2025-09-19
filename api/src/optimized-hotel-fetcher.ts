// Optimized Hotel Fetcher - Get 1,500 Quality Hotels from Sandbox
// Designed to work within Amadeus sandbox rate limits

import { AmadeusClient } from './amadeus';
import { SupabaseService } from './supabase';
import { GooglePlacesClient } from './google-places';
import { glintzCurate, RawHotel } from './curation';
import { PhotoValidator, ValidatedPhoto } from './photo-validator';

interface FetchProgress {
  totalProcessed: number;
  totalAdded: number;
  citiesCompleted: number;
  photosValidated: number;
  currentCity: string;
  estimatedRemaining: number;
}

export class OptimizedHotelFetcher {
  private amadeusClient: AmadeusClient;
  private supabaseService: SupabaseService;
  private googlePlacesClient: GooglePlacesClient;
  private progress: FetchProgress;

  // Major cities with high boutique hotel density
  private readonly PREMIUM_CITIES = [
    { code: 'LON', name: 'London', country: 'UK', expectedHotels: 150 },
    { code: 'NYC', name: 'New York', country: 'USA', expectedHotels: 120 },
    { code: 'PAR', name: 'Paris', country: 'France', expectedHotels: 100 },
    { code: 'ROM', name: 'Rome', country: 'Italy', expectedHotels: 80 },
    { code: 'TYO', name: 'Tokyo', country: 'Japan', expectedHotels: 70 },
    { code: 'BCN', name: 'Barcelona', country: 'Spain', expectedHotels: 60 },
    { code: 'AMS', name: 'Amsterdam', country: 'Netherlands', expectedHotels: 50 },
    { code: 'BER', name: 'Berlin', country: 'Germany', expectedHotels: 50 },
    { code: 'MIL', name: 'Milan', country: 'Italy', expectedHotels: 45 },
    { code: 'MAD', name: 'Madrid', country: 'Spain', expectedHotels: 45 },
    { code: 'VIE', name: 'Vienna', country: 'Austria', expectedHotels: 40 },
    { code: 'PRG', name: 'Prague', country: 'Czech Republic', expectedHotels: 40 },
    { code: 'LIS', name: 'Lisbon', country: 'Portugal', expectedHotels: 35 },
    { code: 'ZUR', name: 'Zurich', country: 'Switzerland', expectedHotels: 35 },
    { code: 'CPH', name: 'Copenhagen', country: 'Denmark', expectedHotels: 30 },
    { code: 'STO', name: 'Stockholm', country: 'Sweden', expectedHotels: 30 },
    { code: 'DUB', name: 'Dublin', country: 'Ireland', expectedHotels: 25 },
    { code: 'BRU', name: 'Brussels', country: 'Belgium', expectedHotels: 25 },
    { code: 'OSL', name: 'Oslo', country: 'Norway', expectedHotels: 25 },
    { code: 'HEL', name: 'Helsinki', country: 'Finland', expectedHotels: 20 }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.supabaseService = new SupabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
    this.progress = {
      totalProcessed: 0,
      totalAdded: 0,
      citiesCompleted: 0,
      photosValidated: 0,
      currentCity: '',
      estimatedRemaining: 1500
    };
  }

  /**
   * Fetch 1,500 quality hotels with intelligent rate limiting
   */
  async fetch1500QualityHotels(): Promise<void> {
    console.log('🎯 OPTIMIZED HOTEL FETCHING - TARGET: 1,500 HOTELS');
    console.log('================================================');
    console.log('Strategy: Focus on premium cities with rate limiting');
    console.log('Quality: 4+ high-resolution photos per hotel');
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

      this.progress.currentCity = `${city.name}, ${city.country}`;
      console.log(`\n🏙️  Processing ${city.name}, ${city.country} (${city.code})`);
      console.log(`   Expected: ~${city.expectedHotels} boutique hotels`);

      try {
        // Fetch hotels with rate limiting
        const cityHotels = await this.fetchCityHotelsOptimized(
          city.code, 
          city.name, 
          city.country, 
          existingIds,
          Math.min(city.expectedHotels, targetRemaining - totalNewHotels)
        );

        totalNewHotels += cityHotels;
        this.progress.totalAdded += cityHotels;
        this.progress.citiesCompleted++;

        console.log(`   ✅ Added ${cityHotels} hotels from ${city.name}`);
        console.log(`   📊 Progress: ${totalNewHotels}/${targetRemaining} hotels (${((totalNewHotels/targetRemaining)*100).toFixed(1)}%)`);

        // Rate limiting: Wait between cities to respect API limits
        if (this.progress.citiesCompleted < this.PREMIUM_CITIES.length) {
          console.log('   ⏱️  Rate limiting: 60 second pause...');
          await this.sleep(60000); // 1 minute between cities
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${city.name}:`, (error as Error).message);
        
        if ((error as Error).message.includes('429')) {
          console.log('   ⚠️  Rate limit hit, extending pause to 5 minutes...');
          await this.sleep(300000); // 5 minutes for rate limit recovery
        } else {
          await this.sleep(30000); // 30 seconds for other errors
        }
      }
    }

    // Final statistics
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // minutes

    console.log('\n🎉 OPTIMIZED FETCHING COMPLETE!');
    console.log('==============================');
    console.log(`📊 Final Results:`);
    console.log(`   • New hotels added: ${totalNewHotels}`);
    console.log(`   • Total hotels in database: ${existingHotels.length + totalNewHotels}`);
    console.log(`   • Cities processed: ${this.progress.citiesCompleted}`);
    console.log(`   • Photos validated: ${this.progress.photosValidated}`);
    console.log(`   • Processing time: ${duration.toFixed(1)} minutes`);
    console.log(`   • Success rate: ${((totalNewHotels / this.progress.totalProcessed) * 100).toFixed(1)}%`);

    if (existingHotels.length + totalNewHotels >= 1500) {
      console.log('\n🏆 MISSION ACCOMPLISHED!');
      console.log('You now have 1,500+ boutique hotels with high-quality photos!');
    } else {
      console.log(`\n📈 Progress made: ${((existingHotels.length + totalNewHotels) / 1500 * 100).toFixed(1)}% of target achieved`);
    }
  }

  /**
   * Fetch hotels from a specific city with optimization
   */
  private async fetchCityHotelsOptimized(
    cityCode: string, 
    cityName: string, 
    country: string, 
    existingIds: Set<string>,
    maxHotels: number
  ): Promise<number> {
    
    // Fetch raw hotels from Amadeus
    console.log(`   🔍 Searching Amadeus for hotels...`);
    const amadeusCityHotels = await this.amadeusClient.getHotelsByCity(cityCode, maxHotels * 3); // Get more to filter
    console.log(`   📊 Found ${amadeusCityHotels.length} raw hotels`);

    if (amadeusCityHotels.length === 0) {
      return 0;
    }

    this.progress.totalProcessed += amadeusCityHotels.length;

    // Convert to RawHotel format and get content
    const rawHotels: RawHotel[] = [];
    let processedCount = 0;

    for (const hotelOffer of amadeusCityHotels.slice(0, maxHotels * 2)) {
      try {
        // Get hotel content with rate limiting
        const content = await this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId);
        
        if (content && content.media && content.media.length >= 3) {
          rawHotels.push({
            hotel: {
              hotelId: hotelOffer.hotel.hotelId,
              name: hotelOffer.hotel.name,
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
            offers: hotelOffer.offers || []
          });
        }

        processedCount++;
        
        // Rate limiting between hotel content requests
        if (processedCount % 5 === 0) {
          await this.sleep(2000); // 2 seconds every 5 hotels
        }

      } catch (error) {
        console.log(`   ⚠️  Skipped hotel ${hotelOffer.hotel.hotelId}: ${(error as Error).message}`);
        
        if ((error as Error).message.includes('429')) {
          console.log('   ⏱️  Rate limit hit, pausing 30 seconds...');
          await this.sleep(30000);
        }
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
    console.log(`   🆕 ${newHotels.length} new hotels after deduplication`);

    if (newHotels.length === 0) {
      return 0;
    }

    // Fetch and validate real photos from Google Places
    console.log(`   📸 Fetching Google Places photos...`);
    const hotelsWithValidPhotos = await this.fetchAndValidatePhotos(newHotels, cityName, country);
    console.log(`   📊 ${hotelsWithValidPhotos.length} hotels have 4+ quality photos`);

    if (hotelsWithValidPhotos.length === 0) {
      return 0;
    }

    // Save to database
    const hotelData = hotelsWithValidPhotos.map(card => ({
      id: card.id,
      name: card.name,
      city: card.city,
      country: card.country,
      coords: card.coords,
      price: card.price,
      description: card.description,
      amenity_tags: card.tags.map((tag: any) => tag.label),
      photos: card.photos,
      hero_photo: card.heroPhoto,
      booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(card.name + ' ' + card.city)}`,
      rating: card.rating || 4.5
    }));

    await this.supabaseService.insertHotels(hotelData);
    
    // Update existing IDs set
    hotelsWithValidPhotos.forEach(hotel => existingIds.add(hotel.id));
    
    this.progress.photosValidated += hotelsWithValidPhotos.reduce((sum, hotel) => sum + hotel.photos.length, 0);

    return hotelsWithValidPhotos.length;
  }

  /**
   * Fetch and validate photos from Google Places
   */
  private async fetchAndValidatePhotos(hotels: any[], city: string, country: string): Promise<any[]> {
    const hotelsWithValidPhotos: any[] = [];
    
    for (const hotel of hotels) {
      try {
        // Search for the hotel on Google Places
        const searchQuery = `${hotel.name} hotel ${city} ${country}`;
        const googleHotels = await this.googlePlacesClient.searchHotels(searchQuery, 1);
        
        if (googleHotels.length === 0) continue;
        
        const googleHotel = googleHotels[0];
        if (!googleHotel.photos || googleHotel.photos.length === 0) continue;
        
        // Extract and optimize photo URLs
        const photoUrls = googleHotel.photos.map((photo: any) => 
          PhotoValidator.optimizePhotoUrl(photo.url, 1920, 1080)
        );
        
        // Validate photo quality
        const validatedPhotos = await PhotoValidator.validatePhotos(photoUrls);
        
        // Check if we have enough high-quality photos (minimum 4)
        if (!PhotoValidator.hasEnoughQualityPhotos(validatedPhotos, 4)) {
          continue;
        }
        
        // Update hotel with validated photos
        const updatedHotel = {
          ...hotel,
          photos: validatedPhotos.map((photo: ValidatedPhoto) => photo.url),
          heroPhoto: validatedPhotos[0].url
        };
        
        hotelsWithValidPhotos.push(updatedHotel);
        
        // Rate limiting for Google Places
        await this.sleep(1000);
        
      } catch (error) {
        // Skip hotels with photo issues
        continue;
      }
    }
    
    return hotelsWithValidPhotos;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current progress
   */
  getProgress(): FetchProgress {
    return { ...this.progress };
  }
}

// CLI execution
if (require.main === module) {
  const fetcher = new OptimizedHotelFetcher();
  
  fetcher.fetch1500QualityHotels()
    .then(() => {
      console.log('\n🎉 Successfully completed hotel fetching!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Hotel fetching failed:', error);
      process.exit(1);
    });
}

// OptimizedHotelFetcher already exported above 