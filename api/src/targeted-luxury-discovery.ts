import { AmadeusClient } from './amadeus';
import { GooglePlacesClient, GooglePlacesHotel } from './google-places';
import { DatabaseService } from './database';
import { HotelCard } from './types';

interface TargetDestination {
  name: string;
  country: string;
  cityCode?: string;
  type: 'urban' | 'alpine' | 'caribbean' | 'cultural' | 'desert' | 'coastal' | 'safari';
  priority: 'critical' | 'high' | 'medium';
  targetHotels: number;
  currentHotels: number;
  luxuryKeywords: string[];
  searchTerms: string[];
}

interface DiscoveryProgress {
  totalTargets: number;
  processedTargets: number;
  totalHotelsFound: number;
  totalHotelsWithPhotos: number;
  totalHotelsStored: number;
  currentDestination: string;
  startTime: string;
  failedDestinations: string[];
}

export class TargetedLuxuryDiscovery {
  private amadeusClient: AmadeusClient;
  private googlePlacesClient: GooglePlacesClient;
  private databaseService: DatabaseService;
  private progress: DiscoveryProgress;

  // Comprehensive list of target destinations based on our analysis
  private targetDestinations: TargetDestination[] = [
    // CRITICAL URBAN LUXURY GAPS
    {
      name: 'New York City',
      country: 'United States',
      cityCode: 'NYC',
      type: 'urban',
      priority: 'critical',
      targetHotels: 20,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'manhattan', 'plaza', 'ritz', 'st regis'],
      searchTerms: ['luxury hotel Manhattan', 'boutique hotel NYC', 'five star hotel New York', 'premium hotel Manhattan', 'exclusive hotel NYC']
    },
    {
      name: 'London',
      country: 'United Kingdom',
      cityCode: 'LON',
      type: 'urban',
      priority: 'critical',
      targetHotels: 20,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'mayfair', 'knightsbridge', 'covent garden'],
      searchTerms: ['luxury hotel London', 'boutique hotel Mayfair', 'five star hotel London', 'premium hotel Knightsbridge', 'exclusive hotel Covent Garden']
    },
    {
      name: 'Paris',
      country: 'France',
      cityCode: 'PAR',
      type: 'urban',
      priority: 'critical',
      targetHotels: 20,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'champs elysees', 'saint germain', 'marais'],
      searchTerms: ['luxury hotel Paris', 'boutique hotel Saint Germain', 'five star hotel Champs Elysees', 'premium hotel Marais', 'exclusive hotel Paris']
    },
    {
      name: 'Singapore',
      country: 'Singapore',
      cityCode: 'SIN',
      type: 'urban',
      priority: 'critical',
      targetHotels: 15,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'marina bay', 'orchard road', 'sentosa'],
      searchTerms: ['luxury hotel Singapore', 'boutique hotel Marina Bay', 'five star hotel Singapore', 'premium hotel Orchard Road', 'exclusive hotel Sentosa']
    },
    {
      name: 'Hong Kong',
      country: 'Hong Kong',
      cityCode: 'HKG',
      type: 'urban',
      priority: 'critical',
      targetHotels: 15,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'central', 'tsim sha tsui', 'admiralty'],
      searchTerms: ['luxury hotel Hong Kong', 'boutique hotel Central', 'five star hotel Hong Kong', 'premium hotel Tsim Sha Tsui', 'exclusive hotel Admiralty']
    },

    // ALPINE LUXURY GAPS
    {
      name: 'St. Moritz',
      country: 'Switzerland',
      cityCode: 'SMV',
      type: 'alpine',
      priority: 'critical',
      targetHotels: 15,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'ski', 'alpine', 'mountain', 'resort'],
      searchTerms: ['luxury hotel St Moritz', 'boutique ski resort St Moritz', 'five star alpine hotel St Moritz', 'premium mountain resort St Moritz']
    },
    {
      name: 'Courchevel',
      country: 'France',
      type: 'alpine',
      priority: 'critical',
      targetHotels: 12,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'ski', 'alpine', 'chalet', 'resort'],
      searchTerms: ['luxury hotel Courchevel', 'boutique ski resort Courchevel', 'five star chalet Courchevel', 'premium alpine resort Courchevel']
    },
    {
      name: 'Zermatt',
      country: 'Switzerland',
      type: 'alpine',
      priority: 'critical',
      targetHotels: 12,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'ski', 'alpine', 'matterhorn', 'resort'],
      searchTerms: ['luxury hotel Zermatt', 'boutique ski resort Zermatt', 'five star alpine hotel Zermatt', 'premium Matterhorn resort Zermatt']
    },

    // CARIBBEAN LUXURY GAPS
    {
      name: 'St. Barts',
      country: 'Saint Barthélemy',
      type: 'caribbean',
      priority: 'critical',
      targetHotels: 15,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'beach', 'resort', 'villa', 'caribbean'],
      searchTerms: ['luxury hotel St Barts', 'boutique resort St Barts', 'five star villa St Barts', 'premium beach resort St Barts', 'exclusive Caribbean St Barts']
    },
    {
      name: 'Barbados',
      country: 'Barbados',
      cityCode: 'BGI',
      type: 'caribbean',
      priority: 'critical',
      targetHotels: 12,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'beach', 'resort', 'plantation', 'caribbean'],
      searchTerms: ['luxury hotel Barbados', 'boutique resort Barbados', 'five star beach resort Barbados', 'premium plantation hotel Barbados']
    },
    {
      name: 'Turks and Caicos',
      country: 'Turks and Caicos Islands',
      type: 'caribbean',
      priority: 'critical',
      targetHotels: 10,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'beach', 'resort', 'villa', 'caribbean'],
      searchTerms: ['luxury hotel Turks Caicos', 'boutique resort Turks Caicos', 'five star beach resort Turks Caicos', 'premium villa Turks Caicos']
    },

    // CULTURAL HERITAGE GAPS
    {
      name: 'Machu Picchu',
      country: 'Peru',
      cityCode: 'CUZ',
      type: 'cultural',
      priority: 'critical',
      targetHotels: 10,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'sanctuary', 'lodge', 'inca', 'heritage'],
      searchTerms: ['luxury hotel Machu Picchu', 'boutique lodge Machu Picchu', 'five star sanctuary Machu Picchu', 'premium Inca hotel Machu Picchu']
    },
    {
      name: 'Petra',
      country: 'Jordan',
      type: 'cultural',
      priority: 'critical',
      targetHotels: 8,
      currentHotels: 0,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'desert', 'heritage', 'ancient', 'camp'],
      searchTerms: ['luxury hotel Petra Jordan', 'boutique desert camp Petra', 'five star heritage hotel Petra', 'premium ancient city hotel Petra']
    },

    // UNDER-REPRESENTED DESTINATIONS
    {
      name: 'Rome',
      country: 'Italy',
      cityCode: 'ROM',
      type: 'urban',
      priority: 'high',
      targetHotels: 15,
      currentHotels: 3,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'historic', 'palazzo', 'villa'],
      searchTerms: ['luxury hotel Rome', 'boutique palazzo Rome', 'five star historic hotel Rome', 'premium villa Rome', 'exclusive hotel Rome']
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      cityCode: 'TYO',
      type: 'urban',
      priority: 'high',
      targetHotels: 15,
      currentHotels: 1,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'ryokan', 'modern', 'traditional'],
      searchTerms: ['luxury hotel Tokyo', 'boutique ryokan Tokyo', 'five star hotel Tokyo', 'premium modern hotel Tokyo', 'exclusive traditional hotel Tokyo']
    },
    {
      name: 'Dubai',
      country: 'UAE',
      cityCode: 'DXB',
      type: 'urban',
      priority: 'high',
      targetHotels: 15,
      currentHotels: 1,
      luxuryKeywords: ['luxury', 'boutique', 'five star', 'premium', 'exclusive', 'burj', 'palm', 'marina', 'desert'],
      searchTerms: ['luxury hotel Dubai', 'boutique hotel Dubai Marina', 'five star hotel Burj Dubai', 'premium Palm Jumeirah hotel', 'exclusive desert resort Dubai']
    }
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.googlePlacesClient = new GooglePlacesClient();
    this.databaseService = new DatabaseService();
    this.progress = {
      totalTargets: 0,
      processedTargets: 0,
      totalHotelsFound: 0,
      totalHotelsWithPhotos: 0,
      totalHotelsStored: 0,
      currentDestination: '',
      startTime: new Date().toISOString(),
      failedDestinations: []
    };
  }

  async discoverTargetedLuxuryHotels(): Promise<DiscoveryProgress> {
    console.log('🎯 Starting Targeted Luxury Hotel Discovery');
    console.log(`📍 Targeting ${this.targetDestinations.length} under-represented destinations`);
    console.log('🏨 Focus: Beautiful, luxurious, boutique properties only\n');

    this.progress.totalTargets = this.targetDestinations.length;

    // Sort by priority: critical first, then high, then medium
    const sortedDestinations = this.targetDestinations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const destination of sortedDestinations) {
      await this.processTargetDestination(destination);
      this.progress.processedTargets++;
      
      // Progress update
      this.logProgress();
      
      // Rate limiting between destinations
      await this.sleep(3000);
    }

    console.log('\n🎉 Targeted Luxury Discovery Complete!');
    this.logFinalResults();
    
    return this.progress;
  }

  private async processTargetDestination(destination: TargetDestination): Promise<void> {
    this.progress.currentDestination = `${destination.name}, ${destination.country}`;
    console.log(`\n�� Processing: ${this.progress.currentDestination}`);
    console.log(`🎯 Priority: ${destination.priority.toUpperCase()}`);
    console.log(`📊 Target: ${destination.targetHotels} hotels (currently: ${destination.currentHotels})`);
    console.log(`��️  Type: ${destination.type}`);

    try {
      let allHotels: any[] = [];

      // Strategy 1: Try Amadeus first if we have a city code
      if (destination.cityCode) {
        console.log(`🔍 Searching Amadeus for ${destination.cityCode}...`);
        const amadeusHotels = await this.fetchAmadeusHotels(destination);
        allHotels.push(...amadeusHotels);
        console.log(`📍 Amadeus found: ${amadeusHotels.length} hotels`);
      }

      // Strategy 2: Google Places search with luxury-focused terms
      console.log(`🔍 Searching Google Places...`);
      const googleHotels = await this.fetchGooglePlacesHotels(destination);
      allHotels.push(...googleHotels);
      console.log(`📍 Google Places found: ${googleHotels.length} hotels`);

      if (allHotels.length === 0) {
        console.log(`❌ No hotels found for ${destination.name}`);
        this.progress.failedDestinations.push(destination.name);
        return;
      }

      this.progress.totalHotelsFound += allHotels.length;

      // Remove duplicates
      const uniqueHotels = this.removeDuplicateHotels(allHotels);
      console.log(`🔄 After deduplication: ${uniqueHotels.length} unique hotels`);

      // Apply strict luxury filtering
      const luxuryHotels = this.filterLuxuryHotels(uniqueHotels, destination);
      console.log(`✨ Luxury filtered: ${luxuryHotels.length} luxury/boutique hotels`);

      // Validate photos (minimum 4 high-quality photos)
      const hotelsWithPhotos = await this.validatePhotos(luxuryHotels, destination);
      this.progress.totalHotelsWithPhotos += hotelsWithPhotos.length;
      console.log(`📸 Photo validated: ${hotelsWithPhotos.length} hotels with 4+ quality photos`);

      if (hotelsWithPhotos.length > 0) {
        // Convert to HotelCard format
        const hotelCards = this.convertToHotelCards(hotelsWithPhotos, destination);
        
        // Filter out existing hotels
        const existingResult = await this.databaseService.getHotels({ limit: 10000 });
        const existingIds = new Set(existingResult.hotels.map((h: any) => h.id));
        const newHotels = hotelCards.filter(hotel => !existingIds.has(hotel.id));
        
        if (newHotels.length > 0) {
          await this.databaseService.storeHotels(newHotels);
          this.progress.totalHotelsStored += newHotels.length;
          console.log(`💾 Stored: ${newHotels.length} new luxury hotels`);
          
          if (existingIds.size > 0) {
            console.log(`🔄 Skipped: ${hotelCards.length - newHotels.length} existing hotels`);
          }
        } else {
          console.log(`🔄 All ${hotelCards.length} hotels already exist in database`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${destination.name}:`, error);
      this.progress.failedDestinations.push(destination.name);
    }
  }

  private async fetchAmadeusHotels(destination: TargetDestination): Promise<any[]> {
    if (!destination.cityCode) return [];

    try {
      const amadeusCityHotels = await this.amadeusClient.getHotelsByCity(destination.cityCode, 50);
      const hotels: any[] = [];

      for (const hotelOffer of amadeusCityHotels) {
        try {
          const content = await this.amadeusClient.getHotelContent(hotelOffer.hotel.hotelId);
          
          if (content) {
            hotels.push({
              id: `amadeus_${hotelOffer.hotel.hotelId}`,
              name: hotelOffer.hotel.name || content.name,
              description: content.description?.text || '',
              amenities: (content.amenities || []).map(a => a.code),
              coordinates: {
                lat: hotelOffer.hotel.latitude || 0,
                lng: hotelOffer.hotel.longitude || 0
              },
              rating: 0, // Will be updated from Google Places if available
              photos: (content.media || []).map(m => m.uri).filter(Boolean),
              offers: hotelOffer.offers || [],
              hasLivePricing: (hotelOffer.offers && hotelOffer.offers.length > 0),
              source: 'amadeus'
            });
          }
        } catch (error) {
          console.error(`Failed to get content for hotel ${hotelOffer.hotel.hotelId}:`, error);
        }
      }

      return hotels;
    } catch (error) {
      console.error(`Amadeus search failed for ${destination.cityCode}:`, error);
      return [];
    }
  }

  private async fetchGooglePlacesHotels(destination: TargetDestination): Promise<any[]> {
    const hotels: any[] = [];

    for (const searchTerm of destination.searchTerms) {
      try {
        console.log(`   �� "${searchTerm}"`);
        const googleHotels = await this.googlePlacesClient.searchHotels(searchTerm, 15);

        for (const hotel of googleHotels) {
          // Get detailed information
          const details = await this.googlePlacesClient.getHotelDetails(hotel.id);
          
          if (details && details.photos && details.photos.length >= 4) {
            hotels.push({
              id: `google_${hotel.id}`,
              name: hotel.name,
              description: '',
              amenities: [],
              coordinates: {
                lat: details.location.lat,
                lng: details.location.lng
              },
              rating: details.rating || 0,
              photos: details.photos.map(p => p.url),
              address: details.address,
              priceLevel: details.priceLevel,
              source: 'google_places'
            });
          }

          // Rate limiting
          await this.sleep(200);
        }

        // Rate limiting between search terms
        await this.sleep(1000);
      } catch (error) {
        console.error(`Google Places search failed for "${searchTerm}":`, error);
      }
    }

    return hotels;
  }

  private filterLuxuryHotels(hotels: any[], destination: TargetDestination): any[] {
    return hotels.filter(hotel => {
      // Check rating (minimum 4.0 for luxury)
      if (hotel.rating && hotel.rating < 4.0) {
        return false;
      }

      // Check for luxury keywords in name or description
      const text = `${hotel.name} ${hotel.description}`.toLowerCase();
      const hasLuxuryKeywords = destination.luxuryKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );

      // Check price level for Google Places hotels (should be high-end)
      if (hotel.source === 'google_places' && hotel.priceLevel && hotel.priceLevel < 3) {
        return false;
      }

      // Must have luxury keywords or be from a premium source
      return hasLuxuryKeywords || hotel.source === 'amadeus';
    });
  }

  private async validatePhotos(hotels: any[], destination: TargetDestination): Promise<any[]> {
    const validatedHotels: any[] = [];

    for (const hotel of hotels) {
      try {
        // Check if we have at least 4 photos
        if (!hotel.photos || hotel.photos.length < 4) {
          console.log(`   ❌ ${hotel.name}: Only ${hotel.photos?.length || 0} photos (need 4+)`);
          continue;
        }

        // For Google Places photos, check quality
        if (hotel.source === 'google_places') {
          let qualityPhotos = 0;
          for (const photoUrl of hotel.photos.slice(0, 10)) { // Check max 10 photos
            if (this.isHighQualityPhoto(photoUrl)) {
              qualityPhotos++;
            }
          }
          
          if (qualityPhotos < 4) {
            console.log(`   ❌ ${hotel.name}: Only ${qualityPhotos} quality photos (need 4+)`);
            continue;
          }
        }

        // Set hero photo
        hotel.heroPhoto = hotel.photos[0];
        
        validatedHotels.push(hotel);
        console.log(`   ✅ ${hotel.name}: ${hotel.photos.length} quality photos`);

        // Rate limiting
        await this.sleep(100);
      } catch (error) {
        console.error(`Error validating photos for ${hotel.name}:`, error);
      }
    }

    return validatedHotels;
  }

  private isHighQualityPhoto(photoUrl: string): boolean {
    // Check if photo URL indicates high resolution (1200x800 minimum)
    const match = photoUrl.match(/maxwidth=(\d+).*maxheight=(\d+)/);
    if (match && match[1] && match[2]) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      return width >= 1200 && height >= 800;
    }
    return true; // Assume quality if we can't determine
  }

  private convertToHotelCards(hotels: any[], destination: TargetDestination): HotelCard[] {
    return hotels.map(hotel => {
      const price = this.extractPrice(hotel);
      const hotelCard: any = {
        id: hotel.id,
        name: hotel.name,
        city: destination.name,
        country: destination.country,
        coords: {
          lat: hotel.coordinates.lat,
          lng: hotel.coordinates.lng
        },
        description: hotel.description || `Luxury ${destination.type} hotel in ${destination.name}, ${destination.country}`,
        amenityTags: this.extractAmenityTags(hotel, destination),
        photos: hotel.photos,
        heroPhoto: hotel.heroPhoto,
        rating: hotel.rating
      };

      // Only add price if it exists
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
    return undefined;
  }

  private generateBookingUrl(hotel: any): string | undefined {
    if (hotel.offers && hotel.offers.length > 0 && hotel.offers[0].self) {
      return hotel.offers[0].self;
    }
    return undefined;
  }

  private extractAmenityTags(hotel: any, destination: TargetDestination): string[] {
    const tags: string[] = [];
    
    // Add destination type tag
    const typeMap = {
      urban: 'Urban Luxury',
      alpine: 'Alpine Resort',
      caribbean: 'Caribbean Paradise',
      cultural: 'Cultural Heritage',
      desert: 'Desert Luxury',
      coastal: 'Coastal Luxury',
      safari: 'Safari Lodge'
    };
    tags.push(typeMap[destination.type]);

    // Add source tag
    tags.push(hotel.source === 'amadeus' ? 'Live Pricing' : 'Curated');
    
    // Add luxury indicators
    if (hotel.rating >= 4.5) tags.push('Highly Rated');
    if (hotel.priceLevel >= 4) tags.push('Ultra Luxury');
    
    // Add amenity-based tags
    if (hotel.amenities) {
      const amenityMap: { [key: string]: string } = {
        'SPA': 'Spa',
        'POOL': 'Pool',
        'FITNESS': 'Fitness Center',
        'RESTAURANT': 'Restaurant',
        'BAR': 'Bar',
        'CONCIERGE': 'Concierge'
      };

      hotel.amenities.forEach((amenity: string) => {
        const tag = amenityMap[amenity];
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

  private removeDuplicateHotels(hotels: any[]): any[] {
    const seen = new Set<string>();
    return hotels.filter(hotel => {
      const key = `${hotel.name.toLowerCase()}_${hotel.coordinates.lat}_${hotel.coordinates.lng}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private logProgress(): void {
    console.log(`\n📊 Progress Update:`);
    console.log(`   Destinations: ${this.progress.processedTargets}/${this.progress.totalTargets}`);
    console.log(`   Hotels Found: ${this.progress.totalHotelsFound}`);
    console.log(`   With Photos: ${this.progress.totalHotelsWithPhotos}`);
    console.log(`   Stored: ${this.progress.totalHotelsStored}`);
    console.log(`   Current: ${this.progress.currentDestination}`);
  }

  private logFinalResults(): void {
    console.log(`\n🎉 Targeted Luxury Discovery Complete!`);
    console.log(`📈 Final Statistics:`);
    console.log(`   Total Destinations Processed: ${this.progress.processedTargets}`);
    console.log(`   Total Hotels Found: ${this.progress.totalHotelsFound}`);
    console.log(`   Hotels with Quality Photos: ${this.progress.totalHotelsWithPhotos}`);
    console.log(`   Hotels Stored in Database: ${this.progress.totalHotelsStored}`);
    console.log(`   Failed Destinations: ${this.progress.failedDestinations.length}`);
    
    if (this.progress.failedDestinations.length > 0) {
      console.log(`   Failed: ${this.progress.failedDestinations.join(', ')}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
