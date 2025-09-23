import { AmadeusClient } from './amadeus';
import { GooglePlacesClient, GooglePlacesHotel } from './google-places';
import { DatabaseService } from './database';
import { HotelCard } from './types';

interface DiscoveryStrategy {
  name: string;
  description: string;
  searchTerms: string[];
}

interface EnhancedLocation {
  name: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  discoveredBy: string;
  uniqueness: 'exotic' | 'unique' | 'beautiful' | 'popular' | 'stunning' | 'hidden';
}

export class EnhancedGlobalHotelDiscovery {
  private amadeusClient: AmadeusClient;
  private googlePlacesClient: GooglePlacesClient;
  private databaseService: DatabaseService;
  
  // Multiple discovery strategies
  private discoveryStrategies: DiscoveryStrategy[] = [
    {
      name: 'Luxury Hotel Brands',
      description: 'Search for world-renowned luxury hotel brands',
      searchTerms: [
        'Four Seasons hotel', 'Ritz Carlton hotel', 'St Regis hotel', 'Park Hyatt hotel',
        'Aman resort', 'Belmond hotel', 'Rosewood hotel', 'Mandarin Oriental hotel',
        'Shangri-La hotel', 'Conrad hotel', 'W Hotel', 'Le Meridien hotel',
        'Luxury Collection hotel', 'Autograph Collection hotel', 'Design Hotels',
        'Small Luxury Hotels', 'Relais Chateaux hotel', 'Leading Hotels World'
      ]
    },
    {
      name: 'Unique Property Types',
      description: 'Search for unique and exotic accommodations',
      searchTerms: [
        'overwater villa resort', 'treehouse hotel', 'cave hotel', 'ice hotel',
        'desert camp luxury', 'safari lodge', 'castle hotel', 'monastery hotel',
        'lighthouse hotel', 'boutique hotel unique', 'cliff hotel', 'volcano hotel',
        'glass igloo hotel', 'floating hotel', 'underwater hotel'
      ]
    },
    {
      name: 'Exotic Destinations',
      description: 'Target exotic and remote destinations',
      searchTerms: [
        'Bhutan luxury hotel', 'Madagascar resort', 'Faroe Islands hotel',
        'Easter Island hotel', 'Azores luxury resort', 'Lofoten Islands hotel',
        'Svalbard hotel', 'Greenland hotel', 'Papua New Guinea resort',
        'Solomon Islands hotel', 'Vanuatu resort', 'Socotra Island hotel',
        'Kamchatka hotel', 'Mongolia luxury camp', 'Tibet hotel'
      ]
    },
    {
      name: 'Hidden Gems',
      description: 'Lesser-known but stunning destinations',
      searchTerms: [
        'Salar de Uyuni hotel', 'Zhangye Danxia hotel', 'Marble Caves Chile hotel',
        'Antelope Canyon hotel', 'Glowworm Caves hotel', 'Pink Lake hotel',
        'Kawah Ijen hotel', 'Dallol Ethiopia hotel', 'Raja Ampat resort',
        'Chocolate Hills Bohol hotel', 'Door to Hell hotel', 'Spotted Lake hotel'
      ]
    },
    {
      name: 'UNESCO & Natural Wonders',
      description: 'Hotels near UNESCO sites and natural wonders',
      searchTerms: [
        'Machu Picchu hotel', 'Angkor Wat luxury hotel', 'Petra resort Jordan',
        'Taj Mahal hotel Agra', 'Great Wall hotel China', 'Galapagos cruise hotel',
        'Amazon lodge luxury', 'Victoria Falls hotel', 'Iguazu Falls resort',
        'Northern Lights hotel', 'Aurora Borealis lodge', 'Yellowstone lodge',
        'Yosemite hotel', 'Grand Canyon lodge', 'Serengeti safari lodge'
      ]
    },
    {
      name: 'Island Paradises',
      description: 'Exotic islands and remote archipelagos',
      searchTerms: [
        'Maldives resort', 'Seychelles hotel', 'Bora Bora resort', 'Fiji resort',
        'Cook Islands hotel', 'Palau resort', 'Marshall Islands hotel',
        'Kiribati hotel', 'Tuvalu hotel', 'Nauru hotel', 'Niue resort',
        'Tristan da Cunha hotel', 'St Helena hotel', 'Ascension Island hotel'
      ]
    }
  ];

  // Expanded global regions for systematic coverage
  private globalRegions = [
    // Europe Hidden Gems
    'Faroe Islands', 'Azores Portugal', 'Madeira Portugal', 'Lofoten Norway',
    'Svalbard Norway', 'Estonian Islands', 'Albanian Riviera', 'North Macedonia',
    'Moldova', 'Kaliningrad Russia', 'Transnistria',
    
    // Asia Exotic
    'Bhutan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Mongolia',
    'Tibet China', 'Xinjiang China', 'Sakhalin Russia', 'Kamchatka Russia',
    'Socotra Yemen', 'Ogasawara Japan', 'Jeju Island Korea', 'Ulleungdo Korea',
    
    // Africa Unexplored
    'Madagascar', 'Comoros', 'Mayotte', 'Reunion', 'Sao Tome Principe',
    'Equatorial Guinea', 'Djibouti', 'Eritrea', 'Chad', 'Central African Republic',
    
    // Americas Remote
    'Greenland', 'Nunavut Canada', 'Alaska Remote', 'Yukon Canada',
    'Easter Island Chile', 'Juan Fernandez Chile', 'Falkland Islands',
    'French Guiana', 'Suriname', 'Guyana',
    
    // Oceania Pacific
    'Vanuatu', 'New Caledonia', 'Solomon Islands', 'Papua New Guinea',
    'Kiribati', 'Tuvalu', 'Nauru', 'Marshall Islands', 'Palau',
    'Northern Mariana Islands', 'American Samoa', 'Cook Islands', 'Niue'
  ];

  constructor() {
    this.amadeusClient = new AmadeusClient();
    this.googlePlacesClient = new GooglePlacesClient();
    this.databaseService = new DatabaseService();
  }

  async discoverGlobalHotels(targetCount: number = 1000): Promise<void> {
    console.log(`🌍 Starting Enhanced Global Hotel Discovery`);
    console.log(`🎯 Target: ${targetCount} exceptional hotels worldwide`);
    console.log(`🔍 Using ${this.discoveryStrategies.length} discovery strategies`);
    console.log(`�� Covering ${this.globalRegions.length} global regions\n`);

    const discoveredHotels: HotelCard[] = [];
    const discoveredLocations: EnhancedLocation[] = [];
    
    let currentCount = 0;
    const batchSize = 25;

    // Strategy 1: Search by luxury hotel brands and unique properties
    for (const strategy of this.discoveryStrategies) {
      if (currentCount >= targetCount) break;
      
      console.log(`🔍 Executing Strategy: ${strategy.name}`);
      console.log(`📝 ${strategy.description}\n`);
      
      for (const searchTerm of strategy.searchTerms) {
        if (currentCount >= targetCount) break;
        
        try {
          console.log(`🏨 Searching for: "${searchTerm}"`);
          
          // Use Google Places to find hotels matching the search term
          const hotels = await this.searchHotelsByTerm(searchTerm);
          
          for (const hotel of hotels) {
            if (currentCount >= targetCount) break;
            
            // Process and validate each hotel
            const processedHotel = await this.processDiscoveredHotel(hotel, searchTerm);
            
            if (processedHotel) {
              discoveredHotels.push(processedHotel);
              currentCount++;
              
              // Track the location for future reference
              const location: EnhancedLocation = {
                name: processedHotel.city,
                country: processedHotel.country,
                coordinates: processedHotel.coords,
                discoveredBy: searchTerm,
                uniqueness: this.categorizeUniqueness(searchTerm)
              };
              
              if (!discoveredLocations.find(l => l.name === location.name && l.country === location.country)) {
                discoveredLocations.push(location);
              }
              
              console.log(`✅ Added: ${processedHotel.name} (${processedHotel.city}, ${processedHotel.country})`);
              console.log(`📊 Progress: ${currentCount}/${targetCount} hotels discovered\n`);
            }
            
            // Rate limiting
            await this.sleep(500);
          }
          
        } catch (error) {
          console.error(`❌ Error searching for "${searchTerm}":`, error);
        }
        
        // Batch processing - save every 25 hotels
        if (discoveredHotels.length >= batchSize) {
          await this.saveHotelBatch(discoveredHotels.splice(0, batchSize));
        }
        
        // Rate limiting between searches
        await this.sleep(1000);
      }
    }

    // Strategy 2: Systematic regional coverage for missed gems
    console.log(`\n🗺️  Phase 2: Systematic Regional Coverage`);
    
    for (const region of this.globalRegions) {
      if (currentCount >= targetCount) break;
      
      try {
        console.log(`🌍 Exploring region: ${region}`);
        
        const regionalHotels = await this.exploreRegion(region);
        
        for (const hotel of regionalHotels) {
          if (currentCount >= targetCount) break;
          
          const processedHotel = await this.processDiscoveredHotel(hotel, `Regional: ${region}`);
          
          if (processedHotel) {
            discoveredHotels.push(processedHotel);
            currentCount++;
            
            console.log(`✅ Regional find: ${processedHotel.name} (${processedHotel.city}, ${processedHotel.country})`);
            console.log(`📊 Progress: ${currentCount}/${targetCount} hotels discovered\n`);
          }
          
          await this.sleep(300);
        }
        
        // Save batch
        if (discoveredHotels.length >= batchSize) {
          await this.saveHotelBatch(discoveredHotels.splice(0, batchSize));
        }
        
      } catch (error) {
        console.error(`❌ Error exploring region "${region}":`, error);
      }
      
      await this.sleep(2000); // Longer pause between regions
    }

    // Save remaining hotels
    if (discoveredHotels.length > 0) {
      await this.saveHotelBatch(discoveredHotels);
    }

    // Final summary
    console.log(`\n🎉 Enhanced Global Hotel Discovery Complete!`);
    console.log(`📊 Total Hotels Discovered: ${currentCount}`);
    console.log(`🗺️  Unique Locations Found: ${discoveredLocations.length}`);
    console.log(`🌍 Global Coverage Achieved!`);
    
    // Show discovered location diversity
    this.showLocationDiversity(discoveredLocations);
  }

  private async searchHotelsByTerm(searchTerm: string): Promise<GooglePlacesHotel[]> {
    try {
      // Use Google Places to search for hotels matching the term
      const results = await this.googlePlacesClient.searchHotels(searchTerm, 15);
      return results || [];
    } catch (error) {
      console.error(`Failed to search hotels for term "${searchTerm}":`, error);
      return [];
    }
  }

  private async exploreRegion(region: string): Promise<GooglePlacesHotel[]> {
    try {
      // Search for luxury hotels in the specific region
      const searchTerms = [
        `luxury hotel ${region}`,
        `resort ${region}`,
        `boutique hotel ${region}`
      ];
      
      const allResults: GooglePlacesHotel[] = [];
      
      for (const term of searchTerms) {
        const results = await this.searchHotelsByTerm(term);
        allResults.push(...results);
        await this.sleep(500);
      }
      
      // Remove duplicates
      return this.removeDuplicateHotels(allResults);
      
    } catch (error) {
      console.error(`Failed to explore region "${region}":`, error);
      return [];
    }
  }

  private async processDiscoveredHotel(hotel: GooglePlacesHotel, discoveryMethod: string): Promise<HotelCard | null> {
    try {
      // Get detailed hotel information (hotel already has basic info from search)
      const details = await this.googlePlacesClient.getHotelDetails(hotel.id);
      
      if (!details) return null;
      
      // Validate photo quality (minimum 4 high-quality photos)
      if (!details.photos || details.photos.length < 4) {
        console.log(`❌ Insufficient photos for ${hotel.name}`);
        return null;
      }
      
      // Check if it's truly luxury/unique
      if (!this.isLuxuryOrUnique(details)) {
        console.log(`❌ Not luxury/unique enough: ${hotel.name}`);
        return null;
      }
      
      // Convert to HotelCard format
      const hotelCard: HotelCard = {
        id: `enhanced_${hotel.id}`,
        name: details.name,
        city: this.extractCity(details.address),
        country: this.extractCountry(details.address),
        coords: details.location ? {
          lat: details.location.lat,
          lng: details.location.lng
        } : undefined,
        description: `Exceptional ${this.categorizeUniqueness(discoveryMethod)} property discovered through ${discoveryMethod}`,
        amenityTags: this.extractAmenityTags(details),
        photos: details.photos.map(photo => photo.url),
        heroPhoto: details.photos[0]?.url,
        rating: details.rating
      };
      
      return hotelCard;
      
    } catch (error) {
      console.error(`Failed to process hotel:`, error);
      return null;
    }
  }

  private isLuxuryOrUnique(details: GooglePlacesHotel): boolean {
    // Check rating
    if (details.rating && details.rating < 4.0) return false;
    
    // Check price level (should be high-end)
    if (details.priceLevel && details.priceLevel < 3) return false;
    
    // Check for luxury indicators in name
    const luxuryKeywords = [
      'luxury', 'resort', 'spa', 'boutique', 'palace', 'manor', 'villa',
      'retreat', 'lodge', 'collection', 'heritage', 'premium', 'exclusive',
      'private', 'royal', 'grand', 'deluxe', 'suite', 'penthouse', 'ritz',
      'four seasons', 'mandarin', 'shangri', 'conrad', 'hyatt', 'marriott'
    ];
    
    const nameAndAddress = `${details.name} ${details.address}`.toLowerCase();
    
    return luxuryKeywords.some(keyword => nameAndAddress.includes(keyword));
  }

  private categorizeUniqueness(discoveryMethod: string): 'exotic' | 'unique' | 'beautiful' | 'popular' | 'stunning' | 'hidden' {
    const method = discoveryMethod.toLowerCase();
    
    if (method.includes('exotic') || method.includes('remote') || method.includes('bhutan') || method.includes('madagascar')) return 'exotic';
    if (method.includes('unique') || method.includes('cave') || method.includes('tree') || method.includes('ice')) return 'unique';
    if (method.includes('beautiful') || method.includes('scenic') || method.includes('unesco')) return 'beautiful';
    if (method.includes('popular') || method.includes('famous') || method.includes('four seasons') || method.includes('ritz')) return 'popular';
    if (method.includes('stunning') || method.includes('spectacular') || method.includes('northern lights')) return 'stunning';
    return 'hidden';
  }

  private extractCity(address: string): string {
    // Simple city extraction from formatted address
    const parts = address.split(',');
    return parts[0]?.trim() || 'Unknown City';
  }

  private extractCountry(address: string): string {
    // Simple country extraction from formatted address
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'Unknown Country';
  }

  private extractAmenityTags(details: GooglePlacesHotel): string[] {
    const tags: string[] = [];
    
    // Add basic luxury tags
    tags.push('Luxury', 'Premium');
    
    if (details.rating && details.rating >= 4.5) tags.push('Highly Rated');
    if (details.priceLevel && details.priceLevel >= 4) tags.push('Ultra Luxury');
    
    // Add tags based on name
    const name = details.name.toLowerCase();
    if (name.includes('spa')) tags.push('Spa');
    if (name.includes('resort')) tags.push('Resort');
    if (name.includes('boutique')) tags.push('Boutique');
    if (name.includes('beach')) tags.push('Beach');
    if (name.includes('mountain')) tags.push('Mountain');
    
    return tags;
  }

  private removeDuplicateHotels(hotels: GooglePlacesHotel[]): GooglePlacesHotel[] {
    const seen = new Set<string>();
    return hotels.filter(hotel => {
      const key = `${hotel.name}_${hotel.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async saveHotelBatch(hotels: HotelCard[]): Promise<void> {
    try {
      await this.databaseService.storeHotels(hotels);
      console.log(`💾 Saved batch of ${hotels.length} hotels to database`);
    } catch (error) {
      console.error(`❌ Failed to save hotel batch:`, error);
    }
  }

  private showLocationDiversity(locations: EnhancedLocation[]): void {
    console.log(`\n🗺️  LOCATION DIVERSITY REPORT:`);
    
    const byUniqueness = locations.reduce((acc, loc) => {
      acc[loc.uniqueness] = (acc[loc.uniqueness] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(byUniqueness).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} locations`);
    });
    
    console.log(`\n🌍 Sample Discovered Locations:`);
    locations.slice(0, 20).forEach(loc => {
      console.log(`   • ${loc.name}, ${loc.country} (${loc.uniqueness}) - via ${loc.discoveredBy}`);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
