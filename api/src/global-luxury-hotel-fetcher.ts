import { AmadeusClient } from './amadeus';
import { GooglePlacesClient } from './google-places';
import { DatabaseService } from './database';
import { HotelCard } from './types';

interface GlobalLocation {
  name: string;
  cityCode?: string;
  country: string;
  countryCode: string;
  continent: string;
  type: 'city' | 'island' | 'coastal' | 'mountain' | 'lake' | 'desert' | 'cultural';
  coordinates: {
    lat: number;
    lng: number;
  };
  searchTerms: string[];
}

interface FetchProgress {
  totalLocations: number;
  processedLocations: number;
  totalHotelsFound: number;
  totalHotelsWithPhotos: number;
  totalHotelsStored: number;
  failedLocations: string[];
  currentLocation?: string;
  startTime: Date;
}

interface QualityMetrics {
  minPhotos: number;
  minRating: number;
  requiredAmenities: string[];
  luxuryKeywords: string[];
  boutiqueKeywords: string[];
}

export class GlobalLuxuryHotelFetcher {
  private amadeusClient: AmadeusClient;
  private googlePlacesClient: GooglePlacesClient;
  private databaseService: DatabaseService;
  private progress: FetchProgress;
  private qualityMetrics: QualityMetrics;

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.googlePlacesClient = new GooglePlacesClient();
    this.databaseService = new DatabaseService();
    
    this.progress = {
      totalLocations: 0,
      processedLocations: 0,
      totalHotelsFound: 0,
      totalHotelsWithPhotos: 0,
      totalHotelsStored: 0,
      failedLocations: [],
      startTime: new Date()
    };

    this.qualityMetrics = {
      minPhotos: 4,
      minRating: 4.0,
      requiredAmenities: [],
      luxuryKeywords: [
        'luxury', 'resort', 'spa', 'boutique', 'villa', 'palace', 'manor',
        'château', 'castle', 'heritage', 'historic', 'premium', 'exclusive',
        'private', 'collection', 'design', 'lifestyle', 'retreat', 'sanctuary'
      ],
      boutiqueKeywords: [
        'boutique', 'design', 'art', 'contemporary', 'unique', 'intimate',
        'charming', 'authentic', 'local', 'cultural', 'artisan', 'craft'
      ]
    };
  }

  /**
   * Main method to fetch luxury hotels globally
   */
  async fetchGlobalLuxuryHotels(options: {
    targetCount?: number;
    continents?: string[];
    skipExisting?: boolean;
    batchSize?: number;
  } = {}): Promise<FetchProgress> {
    const {
      targetCount = 1000,
      continents = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'],
      skipExisting = true,
      batchSize = 50
    } = options;

    console.log('🌍 Starting Global Luxury Hotel Discovery');
    console.log(`Target: ${targetCount} hotels across ${continents.join(', ')}`);

    // Get all discovery locations
    const locations = this.getGlobalDiscoveryLocations(continents);
    this.progress.totalLocations = locations.length;

    console.log(`📍 Discovered ${locations.length} potential locations`);

    // Process locations in batches
    for (let i = 0; i < locations.length && this.progress.totalHotelsStored < targetCount; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      await this.processBatch(batch, skipExisting);
      
      // Progress update
      this.logProgress();
      
      // Rate limiting between batches
      await this.sleep(2000);
    }

    console.log('🎉 Global hotel discovery completed!');
    this.logFinalResults();
    
    return this.progress;
  }

  /**
   * Process a batch of locations
   */
  private async processBatch(locations: GlobalLocation[], skipExisting: boolean): Promise<void> {
    const promises = locations.map(location => this.processLocation(location, skipExisting));
    await Promise.allSettled(promises);
  }

  /**
   * Process a single location to find luxury hotels
   */
  private async processLocation(location: GlobalLocation, skipExisting: boolean): Promise<void> {
    this.progress.currentLocation = `${location.name}, ${location.country}`;
    console.log(`🔍 Processing: ${this.progress.currentLocation}`);

    try {
      let hotels: any[] = [];

      // Try Amadeus first if we have a city code
      if (location.cityCode) {
        hotels = await this.fetchAmadeusHotels(location);
      }

      // If no results from Amadeus or no city code, try Google Places
      if (hotels.length === 0) {
        hotels = await this.fetchGooglePlacesHotels(location);
      }

      if (hotels.length === 0) {
        console.log(`❌ No hotels found for ${location.name}`);
        this.progress.failedLocations.push(location.name);
        return;
      }

      this.progress.totalHotelsFound += hotels.length;

      // Filter for luxury/boutique properties
      const luxuryHotels = this.filterLuxuryHotels(hotels, location);
      console.log(`✨ Found ${luxuryHotels.length}/${hotels.length} luxury hotels in ${location.name}`);

      // Validate and enhance with Google Places photos
      const hotelsWithPhotos = await this.validateAndEnhancePhotos(luxuryHotels, location);
      this.progress.totalHotelsWithPhotos += hotelsWithPhotos.length;

              if (hotelsWithPhotos.length > 0) {
          // Convert to HotelCard format and store
          const hotelCards = this.convertToHotelCards(hotelsWithPhotos, location);
          
          // Remove duplicates within the batch
          const uniqueHotelCards = this.removeDuplicates(hotelCards);
          
          if (uniqueHotelCards.length > 0) {
            // If skipExisting is true, filter out hotels that already exist in database
            let hotelsToStore = uniqueHotelCards;
            
            if (skipExisting) {
              const existingResult = await this.databaseService.getHotels({ limit: 10000 });
              const existingIds = new Set(existingResult.hotels.map((h: any) => h.id));
              hotelsToStore = uniqueHotelCards.filter(hotel => !existingIds.has(hotel.id));
              
              if (hotelsToStore.length < uniqueHotelCards.length) {
                console.log(`🔄 Skipped ${uniqueHotelCards.length - hotelsToStore.length} existing hotels from ${location.name}`);
              }
            }
            
            if (hotelsToStore.length > 0) {
              await this.databaseService.storeHotels(hotelsToStore);
              this.progress.totalHotelsStored += hotelsToStore.length;
              console.log(`💾 Stored ${hotelsToStore.length} hotels from ${location.name}`);
            }
          }
        }

    } catch (error) {
      console.error(`❌ Error processing ${location.name}:`, error);
      this.progress.failedLocations.push(location.name);
    } finally {
      this.progress.processedLocations++;
    }
  }

  /**
   * Fetch hotels using Amadeus API
   */
  private async fetchAmadeusHotels(location: GlobalLocation): Promise<any[]> {
    if (!location.cityCode) return [];

    try {
      const amadeusCityHotels = await this.amadeusClient.getHotelsByCity(location.cityCode, 50);
      const hotels: any[] = [];

      for (const hotelOffer of amadeusCityHotels) {
        try {
          const content = await this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId);
          
          if (content) {
            // Include hotel even without offers/pricing
            hotels.push({
              id: hotelOffer.hotel.hotelId,
              name: hotelOffer.hotel.name || content.name,
              description: content.description?.text || '',
              amenities: (content.amenities || []).map(a => a.code),
              coordinates: {
                lat: hotelOffer.hotel.latitude || 0,
                lng: hotelOffer.hotel.longitude || 0
              },
              rating: 0, // Will be updated from Google Places
              photos: (content.media || []).map(m => m.uri).filter(Boolean),
              offers: hotelOffer.offers || [], // Empty array if no offers
              hasLivePricing: (hotelOffer.offers && hotelOffer.offers.length > 0),
              source: 'amadeus'
            });
          }
        } catch (error) {
          console.error(`Failed to get content for hotel ${hotelOffer.hotel.hotelId}:`, error);
        }
      }

      console.log(`📍 Found ${hotels.length} hotels in ${location.cityCode} (${hotels.filter(h => h.hasLivePricing).length} with live pricing)`);
      return hotels;
    } catch (error) {
      console.error(`Amadeus search failed for ${location.cityCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch hotels using Google Places API
   */
  private async fetchGooglePlacesHotels(location: GlobalLocation): Promise<any[]> {
    const hotels: any[] = [];

    for (const searchTerm of location.searchTerms) {
      try {
        const query = `${searchTerm} ${location.name} ${location.country}`;
        const googleHotels = await this.googlePlacesClient.searchHotels(query, 10);

        for (const hotel of googleHotels) {
          // Get detailed information
          const details = await this.googlePlacesClient.getHotelDetails(hotel.id);
          
          if (details && details.photos && details.photos.length >= this.qualityMetrics.minPhotos) {
            hotels.push({
              id: hotel.id,
              name: hotel.name,
              description: '',
              amenities: [],
              coordinates: {
                lat: details.location.lat,
                lng: details.location.lng
              },
              rating: details.rating || 0, // Google Places rating
              photos: details.photos.map(p => p.url),
              address: details.address,
              priceLevel: details.priceLevel,
              source: 'google_places'
            });
          }

          // Rate limiting
          await this.sleep(100);
        }

        // Rate limiting between search terms
        await this.sleep(500);
      } catch (error) {
        console.error(`Google Places search failed for ${searchTerm}:`, error);
      }
    }

    return hotels;
  }

  /**
   * Filter hotels for luxury/boutique properties
   */
  private filterLuxuryHotels(hotels: any[], location: GlobalLocation): any[] {
    return hotels.filter(hotel => {
      // Check rating
      if (hotel.rating && hotel.rating < this.qualityMetrics.minRating) {
        return false;
      }

      // Check for luxury/boutique keywords in name or description
      const text = `${hotel.name} ${hotel.description}`.toLowerCase();
      const hasLuxuryKeywords = this.qualityMetrics.luxuryKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      const hasBoutiqueKeywords = this.qualityMetrics.boutiqueKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );

      // Check for premium amenities
      const premiumAmenities = ['spa', 'pool', 'fitness', 'restaurant', 'bar', 'concierge'];
      const hasPremiumAmenities = hotel.amenities && 
        premiumAmenities.some(amenity => 
          hotel.amenities.some((a: string) => a.toLowerCase().includes(amenity))
        );

      // Check price level (for Google Places)
      const isPremiumPriced = !hotel.priceLevel || hotel.priceLevel >= 3;

      return hasLuxuryKeywords || hasBoutiqueKeywords || hasPremiumAmenities || isPremiumPriced;
    });
  }

  /**
   * Validate and enhance hotels with high-quality photos
   */
  private async validateAndEnhancePhotos(hotels: any[], location: GlobalLocation): Promise<any[]> {
    const validatedHotels: any[] = [];

    for (const hotel of hotels) {
      try {
        let photos = hotel.photos || [];

        // If we don't have enough photos, try to get more from Google Places
        if (photos.length < this.qualityMetrics.minPhotos) {
          const searchQuery = `${hotel.name} hotel ${location.name} ${location.country}`;
          const googleHotels = await this.googlePlacesClient.searchHotels(searchQuery, 1);
          
          if (googleHotels.length > 0) {
            const details = await this.googlePlacesClient.getHotelDetails(googleHotels[0].id);
            if (details && details.photos) {
              photos = details.photos.map(p => p.url);
              // Update rating from Google Places
              if (details.rating) {
                hotel.rating = details.rating;
              }
            }
          }
        }

        // Validate photo quality and count
        if (photos.length >= this.qualityMetrics.minPhotos) {
          validatedHotels.push({
            ...hotel,
            photos: photos.slice(0, 10), // Max 10 photos
            heroPhoto: photos[0]
          });
        } else {
          console.log(`❌ ${hotel.name}: Only ${photos.length}/${this.qualityMetrics.minPhotos} photos`);
        }

        // Rate limiting
        await this.sleep(200);
      } catch (error) {
        console.error(`Error validating photos for ${hotel.name}:`, error);
      }
    }

    return validatedHotels;
  }

  /**
   * Convert hotels to HotelCard format
   */
  private convertToHotelCards(hotels: any[], location: GlobalLocation): HotelCard[] {
    return hotels.map(hotel => {
      const price = this.extractPrice(hotel);
      const hotelCard: any = {
        id: hotel.id,
        name: hotel.name,
        city: location.name,
        country: location.country,
        coords: {
          lat: hotel.coordinates.lat,
          lng: hotel.coordinates.lng
        },
        description: hotel.description || `Luxury hotel in ${location.name}, ${location.country}`,
        amenityTags: this.extractAmenityTags(hotel),
        photos: hotel.photos,
        heroPhoto: hotel.heroPhoto,

        rating: hotel.rating
      };

      // Only add price if it exists (don't show mock data)
      if (price) {
        hotelCard.price = price;
      }

      // Only add booking URL if it exists
      const bookingUrl = this.generateBookingUrl(hotel);
      if (bookingUrl) {
        hotelCard.bookingUrl = bookingUrl;
      }

      return hotelCard as HotelCard;
    });
  }

  /**
   * Extract price information
   */
  private extractPrice(hotel: any): { amount: string; currency: string } | undefined {
    if (hotel.offers && hotel.offers.length > 0) {
      const offer = hotel.offers[0];
      if (offer.price?.total) {
        return {
          amount: offer.price.total,
          currency: offer.price.currency || 'USD'
        };
      }
    }
    // Return undefined if no pricing available - don't show mock data
    return undefined;
  }

  /**
   * Extract amenity tags
   */
  private extractAmenityTags(hotel: any): string[] {
    const tags: string[] = [];
    
    if (hotel.amenities) {
      // Map Amadeus amenity codes to readable tags
      const amenityMap: { [key: string]: string } = {
        'SPA': 'Spa',
        'POOL': 'Pool',
        'FITNESS': 'Fitness Center',
        'RESTAURANT': 'Restaurant',
        'BAR': 'Bar',
        'WIFI': 'WiFi',
        'PARKING': 'Parking',
        'CONCIERGE': 'Concierge',
        'ROOM_SERVICE': 'Room Service',
        'BUSINESS_CENTER': 'Business Center'
      };

      hotel.amenities.forEach((amenity: string) => {
        const tag = amenityMap[amenity] || amenity;
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }

    // Add location-based tags
    tags.push(hotel.source === 'amadeus' ? 'Live Pricing' : 'Curated');
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

  /**
   * Generate booking URL
   */
  private generateBookingUrl(hotel: any): string | undefined {
    if (hotel.offers && hotel.offers.length > 0 && hotel.offers[0].self) {
      // Use Amadeus booking URL if available
      return hotel.offers[0].self;
    }
    // Don't provide fallback URLs - only show if we have real booking data
    return undefined;
  }

  /**
   * Get comprehensive list of global discovery locations
   */
  private getGlobalDiscoveryLocations(continents: string[]): GlobalLocation[] {
    const allLocations: GlobalLocation[] = [
      // Europe - Luxury destinations
      { name: 'Santorini', cityCode: 'JTR', country: 'Greece', countryCode: 'GR', continent: 'Europe', type: 'island', coordinates: { lat: 36.3932, lng: 25.4615 }, searchTerms: ['luxury resort', 'boutique hotel', 'villa'] },
      { name: 'Mykonos', cityCode: 'JMK', country: 'Greece', countryCode: 'GR', continent: 'Europe', type: 'island', coordinates: { lat: 37.4467, lng: 25.3289 }, searchTerms: ['luxury resort', 'boutique hotel', 'beach resort'] },
      { name: 'Crete', cityCode: 'CHQ', country: 'Greece', countryCode: 'GR', continent: 'Europe', type: 'island', coordinates: { lat: 35.2401, lng: 24.8093 }, searchTerms: ['luxury resort', 'boutique hotel', 'spa resort'] },
      { name: 'Amalfi Coast', country: 'Italy', countryCode: 'IT', continent: 'Europe', type: 'coastal', coordinates: { lat: 40.6340, lng: 14.6026 }, searchTerms: ['luxury hotel', 'boutique hotel', 'coastal resort'] },
      { name: 'Tuscany', cityCode: 'FLR', country: 'Italy', countryCode: 'IT', continent: 'Europe', type: 'cultural', coordinates: { lat: 43.7711, lng: 11.2486 }, searchTerms: ['luxury villa', 'boutique hotel', 'wine resort'] },
      { name: 'French Riviera', cityCode: 'NCE', country: 'France', countryCode: 'FR', continent: 'Europe', type: 'coastal', coordinates: { lat: 43.7102, lng: 7.2620 }, searchTerms: ['luxury hotel', 'palace hotel', 'resort'] },
      { name: 'Swiss Alps', cityCode: 'ZUR', country: 'Switzerland', countryCode: 'CH', continent: 'Europe', type: 'mountain', coordinates: { lat: 46.8182, lng: 8.2275 }, searchTerms: ['luxury chalet', 'mountain resort', 'spa hotel'] },
      { name: 'Ibiza', cityCode: 'IBZ', country: 'Spain', countryCode: 'ES', continent: 'Europe', type: 'island', coordinates: { lat: 38.9067, lng: 1.4206 }, searchTerms: ['luxury resort', 'boutique hotel', 'beach club'] },
      { name: 'Mallorca', cityCode: 'PMI', country: 'Spain', countryCode: 'ES', continent: 'Europe', type: 'island', coordinates: { lat: 39.6953, lng: 2.7367 }, searchTerms: ['luxury resort', 'boutique hotel', 'finca'] },
      { name: 'Iceland', cityCode: 'KEF', country: 'Iceland', countryCode: 'IS', continent: 'Europe', type: 'cultural', coordinates: { lat: 64.9631, lng: -19.0208 }, searchTerms: ['luxury lodge', 'boutique hotel', 'spa resort'] },

      // Asia - Luxury destinations
      { name: 'Bali', cityCode: 'DPS', country: 'Indonesia', countryCode: 'ID', continent: 'Asia', type: 'island', coordinates: { lat: -8.4095, lng: 115.1889 }, searchTerms: ['luxury resort', 'villa', 'spa resort'] },
      { name: 'Maldives', cityCode: 'MLE', country: 'Maldives', countryCode: 'MV', continent: 'Asia', type: 'island', coordinates: { lat: 3.2028, lng: 73.2207 }, searchTerms: ['luxury resort', 'overwater villa', 'private island'] },
      { name: 'Phuket', cityCode: 'HKT', country: 'Thailand', countryCode: 'TH', continent: 'Asia', type: 'island', coordinates: { lat: 7.8804, lng: 98.3923 }, searchTerms: ['luxury resort', 'beach resort', 'spa resort'] },
      { name: 'Kyoto', cityCode: 'KIX', country: 'Japan', countryCode: 'JP', continent: 'Asia', type: 'cultural', coordinates: { lat: 35.0116, lng: 135.7681 }, searchTerms: ['luxury ryokan', 'boutique hotel', 'traditional inn'] },
      { name: 'Bhutan', cityCode: 'PBH', country: 'Bhutan', countryCode: 'BT', continent: 'Asia', type: 'mountain', coordinates: { lat: 27.5142, lng: 90.4336 }, searchTerms: ['luxury lodge', 'boutique hotel', 'mountain resort'] },
      { name: 'Langkawi', cityCode: 'LGK', country: 'Malaysia', countryCode: 'MY', continent: 'Asia', type: 'island', coordinates: { lat: 6.3500, lng: 99.8000 }, searchTerms: ['luxury resort', 'rainforest lodge', 'spa resort'] },
      { name: 'Jeju Island', country: 'South Korea', countryCode: 'KR', continent: 'Asia', type: 'island', coordinates: { lat: 33.4996, lng: 126.5312 }, searchTerms: ['luxury resort', 'boutique hotel', 'spa resort'] },
      { name: 'Goa', cityCode: 'GOI', country: 'India', countryCode: 'IN', continent: 'Asia', type: 'coastal', coordinates: { lat: 15.2993, lng: 74.1240 }, searchTerms: ['luxury resort', 'beach resort', 'heritage hotel'] },
      { name: 'Rajasthan', cityCode: 'JAI', country: 'India', countryCode: 'IN', continent: 'Asia', type: 'cultural', coordinates: { lat: 26.9124, lng: 75.7873 }, searchTerms: ['palace hotel', 'heritage hotel', 'luxury resort'] },
      { name: 'Siem Reap', cityCode: 'REP', country: 'Cambodia', countryCode: 'KH', continent: 'Asia', type: 'cultural', coordinates: { lat: 13.3671, lng: 103.8448 }, searchTerms: ['luxury resort', 'boutique hotel', 'spa resort'] },

      // North America - Luxury destinations
      { name: 'Napa Valley', country: 'United States', countryCode: 'US', continent: 'North America', type: 'cultural', coordinates: { lat: 38.2975, lng: -122.2869 }, searchTerms: ['luxury resort', 'wine resort', 'boutique hotel'] },
      { name: 'Big Sur', country: 'United States', countryCode: 'US', continent: 'North America', type: 'coastal', coordinates: { lat: 36.2704, lng: -121.8081 }, searchTerms: ['luxury lodge', 'coastal resort', 'spa resort'] },
      { name: 'Aspen', cityCode: 'ASE', country: 'United States', countryCode: 'US', continent: 'North America', type: 'mountain', coordinates: { lat: 39.1911, lng: -106.8175 }, searchTerms: ['luxury resort', 'mountain lodge', 'ski resort'] },
      { name: 'Martha\'s Vineyard', country: 'United States', countryCode: 'US', continent: 'North America', type: 'island', coordinates: { lat: 41.3811, lng: -70.6178 }, searchTerms: ['luxury inn', 'boutique hotel', 'coastal resort'] },
      { name: 'Banff', cityCode: 'YYC', country: 'Canada', countryCode: 'CA', continent: 'North America', type: 'mountain', coordinates: { lat: 51.4968, lng: -115.9281 }, searchTerms: ['luxury lodge', 'mountain resort', 'spa resort'] },
      { name: 'Tulum', country: 'Mexico', countryCode: 'MX', continent: 'North America', type: 'coastal', coordinates: { lat: 20.2114, lng: -87.4654 }, searchTerms: ['luxury resort', 'eco resort', 'boutique hotel'] },
      { name: 'Los Cabos', cityCode: 'SJD', country: 'Mexico', countryCode: 'MX', continent: 'North America', type: 'coastal', coordinates: { lat: 22.8905, lng: -109.9167 }, searchTerms: ['luxury resort', 'beach resort', 'spa resort'] },

      // South America - Luxury destinations
      { name: 'Patagonia', country: 'Chile', countryCode: 'CL', continent: 'South America', type: 'mountain', coordinates: { lat: -50.9423, lng: -73.4068 }, searchTerms: ['luxury lodge', 'eco lodge', 'adventure resort'] },
      { name: 'Atacama Desert', country: 'Chile', countryCode: 'CL', continent: 'South America', type: 'desert', coordinates: { lat: -24.5000, lng: -69.2500 }, searchTerms: ['luxury lodge', 'desert resort', 'stargazing resort'] },
      { name: 'Fernando de Noronha', country: 'Brazil', countryCode: 'BR', continent: 'South America', type: 'island', coordinates: { lat: -3.8536, lng: -32.4297 }, searchTerms: ['luxury resort', 'eco resort', 'boutique hotel'] },
      { name: 'Iguazu Falls', country: 'Argentina', countryCode: 'AR', continent: 'South America', type: 'cultural', coordinates: { lat: -25.6953, lng: -54.4367 }, searchTerms: ['luxury lodge', 'rainforest resort', 'eco resort'] },
      { name: 'Galápagos Islands', country: 'Ecuador', countryCode: 'EC', continent: 'South America', type: 'island', coordinates: { lat: -0.9538, lng: -89.7436 }, searchTerms: ['luxury lodge', 'eco resort', 'expedition cruise'] },

      // Africa - Luxury destinations
      { name: 'Serengeti', country: 'Tanzania', countryCode: 'TZ', continent: 'Africa', type: 'cultural', coordinates: { lat: -2.3333, lng: 34.8333 }, searchTerms: ['luxury safari lodge', 'tented camp', 'safari resort'] },
      { name: 'Masai Mara', country: 'Kenya', countryCode: 'KE', continent: 'Africa', type: 'cultural', coordinates: { lat: -1.4061, lng: 35.0122 }, searchTerms: ['luxury safari lodge', 'tented camp', 'safari resort'] },
      { name: 'Cape Town', cityCode: 'CPT', country: 'South Africa', countryCode: 'ZA', continent: 'Africa', type: 'coastal', coordinates: { lat: -33.9249, lng: 18.4241 }, searchTerms: ['luxury hotel', 'boutique hotel', 'wine resort'] },
      { name: 'Zanzibar', cityCode: 'ZNZ', country: 'Tanzania', countryCode: 'TZ', continent: 'Africa', type: 'island', coordinates: { lat: -6.1659, lng: 39.2026 }, searchTerms: ['luxury resort', 'beach resort', 'boutique hotel'] },
      { name: 'Marrakech', cityCode: 'RAK', country: 'Morocco', countryCode: 'MA', continent: 'Africa', type: 'cultural', coordinates: { lat: 31.6295, lng: -7.9811 }, searchTerms: ['luxury riad', 'palace hotel', 'boutique hotel'] },
      { name: 'Seychelles', cityCode: 'SEZ', country: 'Seychelles', countryCode: 'SC', continent: 'Africa', type: 'island', coordinates: { lat: -4.6796, lng: 55.4920 }, searchTerms: ['luxury resort', 'private island', 'spa resort'] },

      // Oceania - Luxury destinations
      { name: 'Bora Bora', cityCode: 'BOB', country: 'French Polynesia', countryCode: 'PF', continent: 'Oceania', type: 'island', coordinates: { lat: -16.5004, lng: -151.7415 }, searchTerms: ['luxury resort', 'overwater bungalow', 'private island'] },
      { name: 'Fiji', cityCode: 'NAN', country: 'Fiji', countryCode: 'FJ', continent: 'Oceania', type: 'island', coordinates: { lat: -17.7134, lng: 178.0650 }, searchTerms: ['luxury resort', 'private island', 'spa resort'] },
      { name: 'Great Barrier Reef', country: 'Australia', countryCode: 'AU', continent: 'Oceania', type: 'coastal', coordinates: { lat: -18.2871, lng: 147.6992 }, searchTerms: ['luxury resort', 'reef resort', 'eco resort'] },
      { name: 'Queenstown', cityCode: 'ZQN', country: 'New Zealand', countryCode: 'NZ', continent: 'Oceania', type: 'mountain', coordinates: { lat: -45.0312, lng: 168.6626 }, searchTerms: ['luxury lodge', 'boutique hotel', 'adventure resort'] },
      { name: 'Lord Howe Island', country: 'Australia', countryCode: 'AU', continent: 'Oceania', type: 'island', coordinates: { lat: -31.5554, lng: 159.0804 }, searchTerms: ['luxury lodge', 'eco resort', 'boutique hotel'] }
    ];

    // Filter by requested continents
    return allLocations.filter(location => continents.includes(location.continent));
  }

  /**
   * Remove duplicate hotels by ID
   */
  private removeDuplicates(hotels: HotelCard[]): HotelCard[] {
    const seen = new Set<string>();
    return hotels.filter(hotel => {
      if (seen.has(hotel.id)) {
        return false;
      }
      seen.add(hotel.id);
      return true;
    });
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logProgress(): void {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const rate = this.progress.processedLocations / (elapsed / 1000 / 60); // locations per minute
    
    console.log(`
📊 Progress Update:
   Locations: ${this.progress.processedLocations}/${this.progress.totalLocations}
   Hotels Found: ${this.progress.totalHotelsFound}
   With Photos: ${this.progress.totalHotelsWithPhotos}
   Stored: ${this.progress.totalHotelsStored}
   Rate: ${rate.toFixed(1)} locations/min
   Current: ${this.progress.currentLocation || 'N/A'}
    `);
  }

  private logFinalResults(): void {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    console.log(`
🎉 Global Hotel Discovery Complete!
   
📈 Final Statistics:
   Total Locations Processed: ${this.progress.processedLocations}
   Total Hotels Found: ${this.progress.totalHotelsFound}
   Hotels with Quality Photos: ${this.progress.totalHotelsWithPhotos}
   Hotels Stored in Database: ${this.progress.totalHotelsStored}
   
⏱️  Performance:
   Total Time: ${(elapsed / 1000 / 60).toFixed(1)} minutes
   Success Rate: ${((this.progress.processedLocations - this.progress.failedLocations.length) / this.progress.processedLocations * 100).toFixed(1)}%
   
❌ Failed Locations: ${this.progress.failedLocations.length}
   ${this.progress.failedLocations.join(', ')}
    `);
  }

  /**
   * Get current progress
   */
  getProgress(): FetchProgress {
    return { ...this.progress };
  }
} 