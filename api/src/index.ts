import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { AmadeusClient } from './amadeus';
import DatabaseService from './database';
import { GooglePlacesClient } from './google-places';
import { SupabaseService } from './supabase';
import { HotelCard, PersonalizationData } from './types';
import { glintzCurate, RawHotel } from './curation';
import { SupabaseHotel } from './supabase';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Amadeus client
let amadeusClient: AmadeusClient;
try {
  amadeusClient = new AmadeusClient();
} catch (error) {
  console.error('Failed to initialize Amadeus client:', error);
  process.exit(1);
}

// Initialize Database service
let database: DatabaseService;
try {
  database = new DatabaseService();
  database.initializeTables().catch(console.error);
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Initialize Google Places client (optional)
let googlePlacesClient: GooglePlacesClient;
try {
  googlePlacesClient = new GooglePlacesClient();
} catch (error) {
  console.error('Failed to initialize Google Places client:', error);
}

// Initialize Supabase service
let supabaseService: SupabaseService;
try {
  supabaseService = new SupabaseService();
  console.log('✅ Supabase service initialized');
} catch (error) {
  console.error('Failed to initialize Supabase service:', error);
}

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for seeding endpoint
const seedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 seed requests per hour
  message: {
    error: 'Seeding rate limit exceeded. Please try again later.'
  }
});

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        status: 'error',
        message: 'Supabase service not available'
      });
    }

    const hotelCount = await supabaseService.getHotelCount();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      seeded: hotelCount > 0,
      hotelCount: hotelCount,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Supabase connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Seed hotels from Amadeus API
app.post('/api/seed', seedLimiter, async (req, res) => {
  try {
    console.log('Starting luxury hotel seeding process...');
    
    // Clear existing hotels first
    console.log('Clearing existing hotels...');
    if (supabaseService) {
      await supabaseService.clearHotels();
      console.log('✅ Cleared existing hotels');
    }
    
    const hotels = await amadeusClient.seedHotelsFromCities();
    
    // Store hotels in Supabase
    await database.storeHotels(hotels);
    
    console.log(`Successfully seeded ${hotels.length} luxury hotels to Supabase`);
    res.json({
      success: true,
      message: `Seeded ${hotels.length} luxury hotels to database`,
      count: hotels.length
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({
      error: 'Failed to seed hotels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all hotels (for development)
app.delete('/api/hotels', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available',
        message: 'Database service not initialized'
      });
    }

    await supabaseService.clearHotels();
    console.log('✅ Cleared all hotels from database');
    
    res.json({
      success: true,
      message: 'All hotels cleared from database'
    });
  } catch (error) {
    console.error('Failed to clear hotels:', error);
    res.status(500).json({
      error: 'Failed to clear hotels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get hotels with BOTH ad-worthy criteria AND Google Photos validation
app.get('/api/hotels/validated-ad-worthy', async (req, res) => {
  try {
    if (!supabaseService || !googlePlacesClient) {
      return res.status(503).json({
        error: 'Required services not available',
        message: 'Database or Google Places service not initialized'
      });
    }

    const { 
      limit = 50, 
      offset = 0,
      maxPrice = 3000,
      minPhotos = 3
    } = req.query;

    console.log('🔍 Starting dual validation: Amadeus criteria + Google Photos...');

    // Get all hotels from database
    const allHotels = await supabaseService.getHotels(100, 0);
    console.log(`📊 Found ${allHotels.length} total hotels in database`);

    // Step 1: Filter for boutique and unique criteria
    const boutiqueAmenities = [
      // Boutique & Unique Features
      'boutique-hotel', 'design-hotel', 'historic-building', 'castle-hotel',
      'villa-hotel', 'manor-house', 'heritage-building', 'art-hotel',
      'cave-hotel', 'treehouse', 'historic-palace', 'converted-monastery',
      
      // Luxury Amenities
      'infinity-pool', 'rooftop-pool', 'private-pool', 'spa-sanctuary',
      'michelin-dining', 'wine-cellar', 'private-chef', 'butler-service',
      'private-beach', 'beach-club', 'yacht-access', 'golf-course',
      
      // Unique Locations & Views
      'clifftop-location', 'overwater-villa', 'private-island', 'vineyard-hotel',
      'mountain-retreat', 'desert-camp', 'safari-lodge', 'lakefront',
      'ocean-view', 'mountain-view', 'sunset-views', 'panoramic-views',
      
      // Cultural & Experiential
      'cultural-immersion', 'local-experiences', 'cooking-classes',
      'wine-tasting', 'eco-lodge', 'wellness-retreat', 'adults-only'
    ];

    const adWorthyHotels = allHotels.filter((hotel: SupabaseHotel) => {
      // Check for boutique amenities
      const hasBoutiqueAmenity = hotel.amenity_tags.some(tag => 
        boutiqueAmenities.some(amenity => tag.toLowerCase().includes(amenity.toLowerCase()))
      );
      
      // Check rating (4.2+ for boutique quality, but allow unrated unique properties)
      const goodRating = !hotel.rating || hotel.rating >= 4.2;
      
      // Check price
      const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
      const reasonablePrice = hotelPrice <= parseInt(maxPrice as string);
      
      return hasBoutiqueAmenity && goodRating && reasonablePrice;
    });

    console.log(`✅ ${adWorthyHotels.length} hotels passed Amadeus ad-worthy criteria`);

    // Step 2: Validate Google Photos availability
    const validatedHotels = [];
    const validationResults = {
      totalTested: adWorthyHotels.length,
      withPhotos: 0,
      withoutPhotos: 0,
      photoValidationErrors: 0,
      averagePhotosPerHotel: 0,
      totalPhotosFound: 0
    };

    for (const hotel of adWorthyHotels) {
      try {
        console.log(`📸 Checking photos for ${hotel.name} in ${hotel.city}...`);
        
        // Try to get Google Photos for this hotel
        const googlePhotos = await googlePlacesClient.getSpecificHotelPhotos(
          hotel.name, 
          hotel.city, 
          8 // Try to get up to 8 photos
        );

        if (googlePhotos && googlePhotos.length >= parseInt(minPhotos as string)) {
          validatedHotels.push({
            ...hotel,
            googlePhotosCount: googlePhotos.length,
            googlePhotos: googlePhotos.slice(0, 6), // Include first 6 photos
            validationStatus: 'success'
          } as any);
          
          validationResults.withPhotos++;
          validationResults.totalPhotosFound += googlePhotos.length;
          
          console.log(`✅ ${hotel.name}: Found ${googlePhotos.length} photos`);
        } else {
          console.log(`❌ ${hotel.name}: Only ${googlePhotos?.length || 0} photos (minimum ${minPhotos} required)`);
          validationResults.withoutPhotos++;
        }
        
        // Small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`🚨 Photo validation error for ${hotel.name}:`, error);
        validationResults.photoValidationErrors++;
      }
    }

    // Calculate statistics
    validationResults.averagePhotosPerHotel = validationResults.withPhotos > 0 ? 
      Math.round(validationResults.totalPhotosFound / validationResults.withPhotos) : 0;
    
    const successRate = validationResults.totalTested > 0 ? 
      Math.round((validationResults.withPhotos / validationResults.totalTested) * 100) : 0;

    // Sort by photo count and rating
    const sortedHotels = validatedHotels.sort((a: any, b: any) => {
      // First by photo count (more photos = better)
      if (a.googlePhotosCount !== b.googlePhotosCount) {
        return b.googlePhotosCount - a.googlePhotosCount;
      }
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });

    const finalHotels = sortedHotels.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

    // Group by continent for analysis
    const continentAnalysis: { [key: string]: number } = {};
    validatedHotels.forEach((hotel: any) => {
      const continent = getContinent(hotel.country);
      continentAnalysis[continent] = (continentAnalysis[continent] || 0) + 1;
    });

    res.json({
      validatedHotels: finalHotels,
      totalValidated: validatedHotels.length,
      hasMore: sortedHotels.length > parseInt(offset as string) + parseInt(limit as string),
      
      validation: {
        ...validationResults,
        successRate
      },
      
      analysis: {
        continentDistribution: continentAnalysis,
        criteria: {
          amadeusCriteria: 'Boutique amenities + 4.2+ rating + reasonable price',
          googlePhotosCriteria: `Minimum ${minPhotos} accessible photos`,
          maxPrice: `€${maxPrice}`,
          boutiqueAmenities
        }
      },
      
      summary: {
        message: `Found ${validatedHotels.length} hotels that meet BOTH Amadeus ad-worthy criteria AND have ${minPhotos}+ Google Photos`,
        dualValidationSuccess: `${validationResults.withPhotos}/${validationResults.totalTested} hotels (${successRate}%) passed both criteria`,
        averagePhotosPerValidatedHotel: validationResults.averagePhotosPerHotel
      }
    });

  } catch (error) {
    console.error('Failed to validate ad-worthy hotels with photos:', error);
    res.status(500).json({
      error: 'Failed to validate hotels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to determine continent
function getContinent(country: string): string {
  const continentMap: { [key: string]: string } = {
    'Greece': 'Europe', 'Italy': 'Europe', 'Croatia': 'Europe', 'Portugal': 'Europe', 'Spain': 'Europe',
    'Indonesia': 'Asia', 'Thailand': 'Asia', 'Philippines': 'Asia',
    'United States': 'Americas', 'Chile': 'Americas', 'Brazil': 'Americas',
    'South Africa': 'Africa', 'Tanzania': 'Africa', 'Seychelles': 'Africa',
    'UAE': 'Middle East', 'Jordan': 'Middle East',
    'Australia': 'Oceania', 'French Polynesia': 'Oceania'
  };
  return continentMap[country] || 'Other';
}

// Test global ad-worthy hotel coverage
app.get('/api/test/global-coverage', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available'
      });
    }

    // Get all hotels from database
    const allHotels = await supabaseService.getHotels(1000, 0); // Get up to 1000 hotels
    
    // Expanded global destinations to ensure thousands of boutique hotels worldwide
    const globalDestinations = {
      europe: [
        // Mediterranean
        'santorini', 'mykonos', 'crete', 'rhodes', 'paros', 'naxos', 'amalfi', 'positano', 'capri', 'cinque terre',
        'ibiza', 'mallorca', 'menorca', 'formentera', 'costa brava', 'marbella', 'seville', 'granada',
        
        // Italy
        'florence', 'rome', 'venice', 'milan', 'naples', 'bologna', 'verona', 'siena', 'pisa', 'genoa',
        'lake como', 'tuscany', 'umbria', 'piedmont', 'emilia romagna',
        
        // France
        'paris', 'nice', 'cannes', 'monaco', 'saint tropez', 'provence', 'bordeaux', 'lyon', 'marseille',
        'normandy', 'brittany', 'loire valley', 'burgundy', 'champagne',
        
        // Balkans & Eastern Europe
        'dubrovnik', 'split', 'hvar', 'zagreb', 'ljubljana', 'bled', 'budapest', 'prague', 'vienna',
        'salzburg', 'hallstatt', 'bratislava', 'krakow', 'warsaw', 'bucharest',
        
        // Iberia
        'barcelona', 'madrid', 'bilbao', 'san sebastian', 'valencia', 'lisbon', 'porto', 'sintra', 'madeira',
        
        // Northern Europe
        'amsterdam', 'bruges', 'ghent', 'copenhagen', 'stockholm', 'oslo', 'helsinki', 'reykjavik',
        'edinburgh', 'glasgow', 'dublin', 'cork', 'galway',
        
        // Germany & Switzerland
        'berlin', 'munich', 'hamburg', 'cologne', 'zurich', 'geneva', 'lucerne', 'interlaken', 'zermatt'
      ],
      
      asia: [
        // Southeast Asia
        'bali', 'lombok', 'java', 'phuket', 'koh samui', 'krabi', 'chiang mai', 'bangkok', 'pattaya',
        'langkawi', 'penang', 'kuala lumpur', 'singapore', 'boracay', 'palawan', 'cebu', 'bohol',
        'ho chi minh', 'hanoi', 'hoi an', 'da nang', 'siem reap', 'phnom penh', 'vientiane', 'luang prabang',
        
        // Maldives & Indian Ocean
        'maldives', 'sri lanka', 'colombo', 'kandy', 'galle', 'mauritius', 'seychelles', 'reunion',
        
        // East Asia
        'tokyo', 'kyoto', 'osaka', 'hiroshima', 'nara', 'nikko', 'hakone', 'okinawa',
        'seoul', 'busan', 'jeju', 'beijing', 'shanghai', 'guilin', 'chengdu', 'xian',
        'hong kong', 'macau', 'taipei', 'kaohsiung',
        
        // South Asia
        'mumbai', 'delhi', 'goa', 'kerala', 'rajasthan', 'agra', 'jaipur', 'udaipur', 'jodhpur',
        'kashmir', 'himachal pradesh', 'uttarakhand', 'karnataka', 'tamil nadu',
        
        // Central Asia & Middle East
        'dubai', 'abu dhabi', 'doha', 'muscat', 'kuwait', 'riyadh', 'jeddah', 'amman', 'petra',
        'istanbul', 'cappadocia', 'antalya', 'bodrum', 'izmir', 'pamukkale'
      ],
      
      americas: [
        // North America - USA
        'hawaii', 'maui', 'kauai', 'big island', 'california', 'napa', 'sonoma', 'carmel', 'monterey',
        'san francisco', 'los angeles', 'san diego', 'santa barbara', 'aspen', 'vail', 'jackson hole',
        'park city', 'telluride', 'steamboat springs', 'new york', 'miami', 'key west', 'charleston',
        'savannah', 'nashville', 'austin', 'santa fe', 'sedona', 'scottsdale', 'portland', 'seattle',
        
        // Canada
        'vancouver', 'victoria', 'whistler', 'banff', 'jasper', 'toronto', 'montreal', 'quebec city',
        'halifax', 'prince edward island', 'yukon', 'northwest territories',
        
        // Mexico & Central America
        'cancun', 'playa del carmen', 'tulum', 'cozumel', 'puerto vallarta', 'cabo san lucas',
        'oaxaca', 'san miguel de allende', 'merida', 'guadalajara', 'costa rica', 'panama',
        'belize', 'guatemala', 'nicaragua', 'honduras', 'el salvador',
        
        // Caribbean
        'barbados', 'jamaica', 'bahamas', 'turks and caicos', 'st lucia', 'st john', 'st thomas',
        'antigua', 'aruba', 'curacao', 'martinique', 'guadeloupe', 'dominican republic', 'puerto rico',
        
        // South America
        'rio de janeiro', 'sao paulo', 'salvador', 'florianopolis', 'buzios', 'paraty',
        'buenos aires', 'mendoza', 'bariloche', 'ushuaia', 'patagonia', 'torres del paine',
        'santiago', 'valparaiso', 'atacama', 'lima', 'cusco', 'machu picchu', 'arequipa',
        'bogota', 'cartagena', 'medellin', 'quito', 'galapagos', 'montevideo', 'punta del este'
      ],
      
      africa: [
        // East Africa
        'serengeti', 'ngorongoro', 'kilimanjaro', 'zanzibar', 'stone town', 'pemba', 'mafia island',
        'nairobi', 'masai mara', 'amboseli', 'samburu', 'lake nakuru', 'addis ababa', 'lalibela',
        'kigali', 'volcanoes national park', 'kampala', 'bwindi', 'queen elizabeth',
        
        // Southern Africa
        'cape town', 'stellenbosch', 'hermanus', 'garden route', 'johannesburg', 'pretoria',
        'kruger', 'sabi sands', 'madikwe', 'pilanesberg', 'drakensberg', 'durban',
        'victoria falls', 'chobe', 'okavango delta', 'kalahari', 'sossusvlei', 'swakopmund',
        'windhoek', 'etosha', 'antananarivo', 'nosy be', 'mauritius', 'seychelles',
        
        // North Africa
        'marrakech', 'fez', 'casablanca', 'rabat', 'essaouira', 'chefchaouen', 'sahara',
        'cairo', 'luxor', 'aswan', 'alexandria', 'red sea', 'sharm el sheikh', 'hurghada',
        'tunis', 'carthage', 'sidi bou said', 'algiers', 'oran', 'tripoli', 'benghazi'
      ],
      
      oceania: [
        // Australia
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'darwin', 'cairns', 'gold coast',
        'sunshine coast', 'byron bay', 'noosa', 'port douglas', 'whitsundays', 'great barrier reef',
        'uluru', 'alice springs', 'kakadu', 'blue mountains', 'hunter valley', 'barossa valley',
        'margaret river', 'broome', 'kimberley', 'tasmania', 'hobart', 'cradle mountain',
        
        // New Zealand
        'auckland', 'wellington', 'christchurch', 'queenstown', 'rotorua', 'taupo', 'napier',
        'nelson', 'marlborough', 'fiordland', 'milford sound', 'bay of islands', 'coromandel',
        'wanaka', 'franz josef', 'fox glacier', 'mount cook', 'stewart island',
        
        // Pacific Islands
        'fiji', 'suva', 'nadi', 'coral coast', 'mamanuca', 'yasawa', 'tahiti', 'bora bora',
        'moorea', 'marquesas', 'cook islands', 'rarotonga', 'aitutaki', 'samoa', 'apia',
        'tonga', 'vanuatu', 'port vila', 'new caledonia', 'noumea', 'solomon islands',
        'palau', 'micronesia', 'marshall islands', 'kiribati', 'tuvalu', 'nauru'
      ]
    };

    // Boutique and unique amenities to check
    const boutiqueAmenities = [
      // Boutique & Unique Features
      'boutique-hotel', 'design-hotel', 'historic-building', 'castle-hotel',
      'villa-hotel', 'manor-house', 'heritage-building', 'art-hotel',
      'cave-hotel', 'treehouse', 'historic-palace', 'converted-monastery',
      
      // Luxury Amenities
      'infinity-pool', 'rooftop-pool', 'private-pool', 'spa-sanctuary',
      'michelin-dining', 'wine-cellar', 'private-chef', 'butler-service',
      'private-beach', 'beach-club', 'yacht-access', 'golf-course',
      
      // Unique Locations & Views
      'clifftop-location', 'overwater-villa', 'private-island', 'vineyard-hotel',
      'mountain-retreat', 'desert-camp', 'safari-lodge', 'lakefront',
      'ocean-view', 'mountain-view', 'sunset-views', 'panoramic-views',
      
      // Cultural & Experiential
      'cultural-immersion', 'local-experiences', 'cooking-classes',
      'wine-tasting', 'eco-lodge', 'wellness-retreat', 'adults-only'
    ];

    // Analyze coverage by continent
    const continentAnalysis: { [key: string]: any } = {};
    
    Object.entries(globalDestinations).forEach(([continent, destinations]) => {
      const continentHotels = allHotels.filter(hotel => {
        const location = `${hotel.city} ${hotel.country}`.toLowerCase();
        return destinations.some(dest => location.includes(dest.toLowerCase()));
      });

      // Filter for ad-worthy hotels in this continent
      const adWorthyHotels = continentHotels.filter(hotel => {
        // Check for boutique amenities
        const hasBoutiqueAmenity = hotel.amenity_tags.some(tag => 
          boutiqueAmenities.some((amenity: string) => tag.toLowerCase().includes(amenity.toLowerCase()))
        );
        
        // Check rating (4.2+ for boutique quality)
        const goodRating = !hotel.rating || hotel.rating >= 4.2;
        
        // Check reasonable price (under $500/night equivalent)
        const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
        const reasonablePrice = hotelPrice <= 500;
        
        return hasBoutiqueAmenity && goodRating && reasonablePrice;
      });

      // Analyze amenity distribution
      const amenityCount: { [key: string]: number } = {};
      adWorthyHotels.forEach(hotel => {
        hotel.amenity_tags.forEach(tag => {
          boutiqueAmenities.forEach((amenity: string) => {
            if (tag.toLowerCase().includes(amenity.toLowerCase())) {
              amenityCount[amenity] = (amenityCount[amenity] || 0) + 1;
            }
          });
        });
      });

      continentAnalysis[continent] = {
        totalHotels: continentHotels.length,
        adWorthyHotels: adWorthyHotels.length,
        adWorthyPercentage: continentHotels.length > 0 ? 
          Math.round((adWorthyHotels.length / continentHotels.length) * 100) : 0,
        topAmenities: Object.entries(amenityCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([amenity, count]) => ({ amenity, count })),
        destinations: destinations.map(dest => {
          const destHotels = continentHotels.filter(hotel => 
            `${hotel.city} ${hotel.country}`.toLowerCase().includes(dest.toLowerCase())
          );
          const destAdWorthy = adWorthyHotels.filter(hotel => 
            `${hotel.city} ${hotel.country}`.toLowerCase().includes(dest.toLowerCase())
          );
          return {
            destination: dest,
            totalHotels: destHotels.length,
            adWorthyHotels: destAdWorthy.length,
            coverage: destHotels.length > 0 ? Math.round((destAdWorthy.length / destHotels.length) * 100) : 0
          };
        }).filter(dest => dest.totalHotels > 0)
      };
    });

    // Overall statistics
    const totalHotels = allHotels.length;
    const totalAdWorthy = Object.values(continentAnalysis).reduce((sum: number, continent: any) => 
      sum + continent.adWorthyHotels, 0
    );

    // Price range analysis
    const priceRanges = {
      budget: { min: 0, max: 150, count: 0 },
      midRange: { min: 150, max: 300, count: 0 },
      luxury: { min: 300, max: 600, count: 0 },
      ultraLuxury: { min: 600, max: 10000, count: 0 }
    };

    allHotels.forEach(hotel => {
      const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
      Object.entries(priceRanges).forEach(([range, config]) => {
        if (hotelPrice >= config.min && hotelPrice < config.max) {
          config.count++;
        }
      });
    });

    res.json({
      globalCoverage: {
        totalHotelsInDatabase: totalHotels,
        totalAdWorthyHotels: totalAdWorthy,
        globalAdWorthyPercentage: totalHotels > 0 ? Math.round((totalAdWorthy / totalHotels) * 100) : 0,
        continentBreakdown: continentAnalysis,
        priceDistribution: priceRanges,
        testCriteria: {
          boutiqueAmenities,
          minRating: 4.2,
          maxPrice: 500,
          continentsCovered: Object.keys(globalDestinations).length,
          destinationsTested: Object.values(globalDestinations).flat().length
        }
      },
      recommendations: {
        strongestContinents: Object.entries(continentAnalysis)
          .sort(([,a], [,b]) => (b as any).adWorthyHotels - (a as any).adWorthyHotels)
          .slice(0, 3)
          .map(([continent, data]) => ({ continent, adWorthyHotels: (data as any).adWorthyHotels })),
        
        bestValueDestinations: Object.values(continentAnalysis)
          .flatMap((continent: any) => continent.destinations)
          .filter((dest: any) => dest.adWorthyHotels >= 2)
          .sort((a: any, b: any) => b.coverage - a.coverage)
          .slice(0, 10),
          
        needsImprovement: Object.entries(continentAnalysis)
          .filter(([,data]) => (data as any).adWorthyPercentage < 20)
          .map(([continent, data]) => ({ 
            continent, 
            percentage: (data as any).adWorthyPercentage,
            totalHotels: (data as any).totalHotels 
          }))
      }
    });

  } catch (error) {
    console.error('Failed to analyze global coverage:', error);
    res.status(500).json({
      error: 'Failed to analyze global coverage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get ad-worthy hotels - visually stunning like travel ads
app.get('/api/hotels/ad-worthy', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available',
        message: 'Database service not initialized'
      });
    }

    const { 
      limit = 20, 
      offset = 0,
      minVisualScore = 50,
      maxPrice = 400,
      location = '',
      seenHotels 
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Get hotels from Supabase
    const supabaseHotels = await supabaseService.getHotels(limitNum * 2, offsetNum); // Get extra for filtering
    
    // Convert and filter for ad-worthy criteria
    const hotels: HotelCard[] = supabaseHotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      coords: hotel.coords,
      price: hotel.price,
      description: hotel.description,
      amenityTags: hotel.amenity_tags,
      photos: hotel.photos,
      heroPhoto: hotel.hero_photo,
      bookingUrl: hotel.booking_url,
      rating: hotel.rating
    }));

    // Filter for boutique and unique hotels based on amenities and visual appeal
    const adWorthyHotels = hotels.filter(hotel => {
      // Check for boutique and unique amenities
      const boutiqueAmenities = [
        'boutique-hotel', 'design-hotel', 'historic-building', 'castle-hotel',
        'villa-hotel', 'manor-house', 'heritage-building', 'art-hotel',
        'infinity-pool', 'rooftop-pool', 'spa-sanctuary', 'michelin-dining',
        'private-beach', 'ocean-view', 'mountain-view', 'sunset-views',
        'clifftop-location', 'overwater-villa', 'private-island', 'adults-only'
      ];
      
      const hasBoutiqueAmenity = hotel.amenityTags.some(tag => 
        boutiqueAmenities.some((amenity: string) => tag.includes(amenity))
      );
      
      // Check price if specified
      const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
      const priceOk = !maxPrice || hotelPrice <= parseInt(maxPrice as string);
      
      // Check rating (4.2+ for boutique quality)
      const ratingOk = !hotel.rating || hotel.rating >= 4.2;
      
      return hasBoutiqueAmenity && priceOk && ratingOk;
    });

    // Sort by visual appeal indicators
    const sortedHotels = adWorthyHotels.sort((a, b) => {
      // Prioritize hotels with multiple Instagram amenities
      const aInstagramCount = a.amenityTags.filter(tag => 
        ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(keyword => tag.includes(keyword))
      ).length;
      
      const bInstagramCount = b.amenityTags.filter(tag => 
        ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(keyword => tag.includes(keyword))
      ).length;
      
      if (aInstagramCount !== bInstagramCount) {
        return bInstagramCount - aInstagramCount;
      }
      
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });

    const finalHotels = sortedHotels.slice(0, limitNum);

    res.json({
      hotels: finalHotels,
      total: finalHotels.length,
      hasMore: sortedHotels.length > limitNum,
      criteria: {
        visualAppeal: 'Instagram-worthy amenities',
        maxPrice: maxPrice || 'unlimited',
        minRating: 4.0,
        focus: 'Travel ad quality hotels'
      },
      message: `Found ${finalHotels.length} ad-worthy hotels with stunning visual appeal`
    });
  } catch (error) {
    console.error('Failed to fetch ad-worthy hotels:', error);
    res.status(500).json({
      error: 'Failed to fetch ad-worthy hotels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get curated hotels using Glintz pipeline
app.get('/api/hotels/glintz', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available',
        message: 'Database service not initialized'
      });
    }

    const { 
      limit = 20, 
      offset = 0,
      cityCode
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    console.log(`🎯 Glintz curation request: limit=${limitNum}, offset=${offsetNum}, city=${cityCode}`);

    // Get raw hotel data from Amadeus
    let rawHotels: RawHotel[] = [];

    if (cityCode) {
      // Fetch from specific city
      const cityHotels = await amadeusClient.getHotelsByCity(cityCode as string, limitNum * 2);
      
      for (const hotel of cityHotels) {
        try {
          // Get hotel content (photos, amenities, description)
          const content = await amadeusClient.getHotelContent(hotel.hotel.hotelId);
          
          if (content) {
            rawHotels.push({
              hotel: {
                hotelId: hotel.hotel.hotelId,
                name: hotel.hotel.name,
                chainCode: undefined,
                rating: undefined,
                cityCode: hotel.hotel.cityCode || cityCode as string,
                latitude: hotel.hotel.latitude || 0,
                longitude: hotel.hotel.longitude || 0
              },
              content: {
                hotelId: content.hotelId,
                name: content.name,
                description: content.description ? { text: content.description.text, lang: 'en' } : undefined,
                amenities: (content.amenities || []).map(amenity => amenity.code),
                media: content.media || [],
                ratings: undefined // Not available in AmadeusHotelContent
              },
              offers: hotel.offers || []
            });
          }
        } catch (error) {
          console.error(`Failed to get content for hotel ${hotel.hotel.hotelId}:`, error);
        }
      }
         } else {
       // For now, return a message that Glintz curation requires cityCode
       return res.json({
         hotels: [],
         total: 0,
         hasMore: false,
         message: 'Glintz curation requires a cityCode parameter for live Amadeus data. Use /api/hotels for database hotels.'
       });
     }

    console.log(`📊 Processing ${rawHotels.length} raw hotels through Glintz pipeline...`);

    // Apply Glintz curation pipeline
    const curationResult = await glintzCurate(rawHotels);

    // Convert to HotelCard format for compatibility
    const hotelCards: HotelCard[] = curationResult.cards.map(card => ({
      id: card.id,
      name: card.name,
      city: card.city,
      country: card.country,
      coords: card.coords,
      price: card.price,
      description: card.description,
      amenityTags: card.tags.map(tag => tag.label),
      photos: card.photos,
      heroPhoto: card.heroPhoto,
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(card.name + ' ' + card.city)}`,
      rating: card.rating
    }));

    const hasMore = curationResult.cards.length >= limitNum;

    res.json({
      hotels: hotelCards.slice(0, limitNum),
      total: curationResult.cards.length,
      hasMore,
      curation: {
        stats: curationResult.curationStats,
        diversity: curationResult.diversityStats,
        summary: curationResult.summary
      },
      message: `Glintz curation: ${curationResult.cards.length} Instagram-worthy hotels curated from ${rawHotels.length} candidates`
    });

  } catch (error) {
    console.error('Glintz curation error:', error);
    res.status(500).json({
      error: 'Failed to curate hotels',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get hotels with personalization
app.get('/api/hotels', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available',
        message: 'Database service not initialized'
      });
    }

    // Check if database has hotels
    const hotelCount = await supabaseService.getHotelCount();
    if (hotelCount === 0) {
      return res.json({
        hotels: [],
        total: 0,
        hasMore: false,
        message: 'No hotels available. Please populate the database with real photos first.'
      });
    }

    const { 
      limit = 20, 
      offset = 0,
      countryAffinity,
      amenityAffinity,
      seenHotels 
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Get hotels from Supabase
    const supabaseHotels = await supabaseService.getHotels(limitNum, offsetNum);
    
    // Convert Supabase format to HotelCard format
    const hotels: HotelCard[] = supabaseHotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      coords: hotel.coords,
      price: hotel.price,
      description: hotel.description || '',
      amenityTags: hotel.amenity_tags || [],
      photos: hotel.photos || [], // REAL Google Places photos!
      heroPhoto: hotel.hero_photo || (hotel.photos && hotel.photos[0]) || '', // REAL Google Places hero photo!
      bookingUrl: hotel.booking_url || '',
      rating: hotel.rating
    }));

    // Parse personalization data from query params
    const personalization: PersonalizationData = {
      countryAffinity: countryAffinity ? JSON.parse(countryAffinity as string) : {},
      amenityAffinity: amenityAffinity ? JSON.parse(amenityAffinity as string) : {},
      seenHotels: new Set(seenHotels ? JSON.parse(seenHotels as string) : [])
    };

    // Apply personalization scoring
    const scoredHotels = hotels.map(hotel => ({
      ...hotel,
      score: calculatePersonalizationScore(hotel, personalization)
    }));

    // Sort by score (highest first)
    scoredHotels.sort((a, b) => b.score - a.score);
    const responseHotels = scoredHotels.map(({ score, ...hotel }) => hotel);

    res.json({
      hotels: responseHotels,
      total: hotelCount,
      hasMore: offsetNum + limitNum < hotelCount
    });
  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    res.status(500).json({
      error: 'Failed to fetch hotels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific hotel details
app.get('/api/hotels/:id', async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Supabase service not available',
        message: 'Database service not initialized'
      });
    }

    const { id } = req.params;
    const supabaseHotel = await supabaseService.getHotelById(id);
    
    if (!supabaseHotel) {
      return res.status(404).json({
        error: 'Hotel not found'
      });
    }

    // Convert Supabase format to HotelCard format
    const hotel: HotelCard = {
      id: supabaseHotel.id,
      name: supabaseHotel.name,
      city: supabaseHotel.city,
      country: supabaseHotel.country,
      coords: supabaseHotel.coords,
      price: supabaseHotel.price,
      description: supabaseHotel.description,
      amenityTags: supabaseHotel.amenity_tags,
      photos: supabaseHotel.photos, // REAL Google Places photos!
      heroPhoto: supabaseHotel.hero_photo, // REAL Google Places hero photo!
      bookingUrl: supabaseHotel.booking_url,
      rating: supabaseHotel.rating
    };

    res.json(hotel);
  } catch (error) {
    console.error('Failed to fetch hotel details:', error);
    res.status(500).json({
      error: 'Failed to fetch hotel details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get hotel photos for a city using Google Places
app.get('/api/photos/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const { limit = 6 } = req.query;

    if (!googlePlacesClient) {
      return res.status(503).json({
        error: 'Google Places service not available',
        message: 'Google Places API key not configured'
      });
    }

    console.log(`Fetching photos for ${cityName}...`);
    const photos = await googlePlacesClient.getHotelPhotos(cityName, parseInt(limit as string));

    res.json({
      city: cityName,
      photos,
      count: photos.length,
      source: 'google_places'
    });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    res.status(500).json({
      error: 'Failed to fetch photos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Instagram-quality photos for a specific hotel
app.get('/api/photos/instagram/:hotelName', async (req, res) => {
  try {
    const { hotelName } = req.params;
    const { city, limit = 6 } = req.query;

    if (!googlePlacesClient) {
      return res.status(503).json({
        error: 'Google Places service not available',
        message: 'Google Places API key not configured'
      });
    }

    if (!city) {
      return res.status(400).json({
        error: 'City parameter required',
        message: 'Please provide city name as query parameter'
      });
    }

    console.log(`Fetching Instagram-quality photos for ${hotelName} in ${city}...`);
    const photos = await googlePlacesClient.getSpecificHotelPhotos(
      hotelName, 
      city as string, 
      parseInt(limit as string)
    );

    res.json({
      hotel: hotelName,
      city,
      photos,
      count: photos.length,
      source: 'google_places_instagram_optimized',
      quality: 'instagram_ready'
    });
  } catch (error) {
    console.error('Failed to fetch Instagram-quality hotel photos:', error);
    res.status(500).json({
      error: 'Failed to fetch Instagram-quality hotel photos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get photos for a specific hotel
app.get('/api/photos/hotel/:hotelName', async (req, res) => {
  try {
    const { hotelName } = req.params;
    const { city, limit = 6 } = req.query;

    if (!googlePlacesClient) {
      return res.status(503).json({
        error: 'Google Places service not available',
        message: 'Google Places API key not configured'
      });
    }

    if (!city) {
      return res.status(400).json({
        error: 'City parameter required',
        message: 'Please provide city name as query parameter'
      });
    }

    console.log(`Fetching photos for ${hotelName} in ${city}...`);
    const photos = await googlePlacesClient.getSpecificHotelPhotos(
      hotelName, 
      city as string, 
      parseInt(limit as string)
    );

    res.json({
      hotel: hotelName,
      city,
      photos,
      count: photos.length,
      source: 'google_places'
    });
  } catch (error) {
    console.error('Failed to fetch hotel photos:', error);
    res.status(500).json({
      error: 'Failed to fetch hotel photos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update personalization data (for tracking likes/dislikes)
app.post('/api/personalization', (req, res) => {
  try {
    const { hotelId, action, country, amenityTags } = req.body;

    // In a real app, this would update user preferences in a database
    // For now, we just return success
    console.log(`Personalization update: ${action} for hotel ${hotelId} in ${country} with tags ${amenityTags?.join(', ')}`);

    res.json({
      success: true,
      message: 'Personalization updated'
    });
  } catch (error) {
    console.error('Failed to update personalization:', error);
    res.status(500).json({
      error: 'Failed to update personalization',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate personalization score for a hotel
function calculatePersonalizationScore(hotel: HotelCard, personalization: PersonalizationData): number {
  // Base score from rating (if available) or default
  const baseScore = hotel.rating ? hotel.rating / 5 : 0.7;

  // Country affinity score
  const countryScore = personalization.countryAffinity[hotel.country] || 0;

  // Amenity affinity score
  const amenityTags = hotel.amenityTags || [];
  const amenityScore = amenityTags.reduce((sum, tag) => {
    return sum + (personalization.amenityAffinity[tag] || 0);
  }, 0) / Math.max(amenityTags.length, 1);

  // Seen penalty (should be 0 since we filter out seen hotels, but keeping for completeness)
  const seenPenalty = personalization.seenHotels.has(hotel.id) ? 0.2 : 0;

  // Weighted score calculation (matching the spec)
  const score = 
    0.6 * baseScore +
    0.25 * Math.min(countryScore, 1) + // Normalize to max 1
    0.15 * Math.min(amenityScore, 1) - // Normalize to max 1
    0.2 * seenPenalty;

  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});


// Start server
app.listen(port, () => {
  console.log(`🚀 Glintz API server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🏨 Seed hotels: POST http://localhost:${port}/api/seed`);
  console.log(`🔍 Get hotels: GET http://localhost:${port}/api/hotels`);
  
  // Check if database is seeded on startup
  database.isSeeded().then(seeded => {
    if (!seeded) {
      console.log('\n⚠️  Database not seeded. Call POST /api/seed to populate with hotels.');
    }
  }).catch(() => {
    console.log('\n⚠️  Could not check database status. You may need to seed hotels.');
  });
});

export default app; 