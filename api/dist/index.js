"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv = __importStar(require("dotenv"));
const amadeus_1 = require("./amadeus");
const database_1 = __importDefault(require("./database"));
const google_places_1 = require("./google-places");
const supabase_1 = require("./supabase");
const curation_1 = require("./curation");
const hotel_discovery_controller_1 = require("./hotel-discovery-controller");
const photo_quality_auditor_1 = require("./photo-quality-auditor");
const photo_curation_1 = require("./photo-curation");
const network_utils_1 = require("./network-utils");
// // import { LandingPageAPI } from './landing-page-api';
const partnersApi_1 = require("./services/partnersApi");
const giataPartnersApi_1 = require("./services/giataPartnersApi");
// Load environment variables
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Initialize Amadeus client (optional - not required for OTP/auth endpoints)
let amadeusClient = null;
try {
    amadeusClient = new amadeus_1.AmadeusClient();
    console.log('✅ Amadeus client initialized');
}
catch (error) {
    console.warn('⚠️  Amadeus client not available (optional):', error instanceof Error ? error.message : error);
    console.warn('   Server will continue without Amadeus. OTP and auth endpoints will work.');
}
// Initialize Database service
let database;
try {
    database = new database_1.default();
    database.initializeTables().catch(console.error);
}
catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
}
// Initialize Google Places client (optional)
let googlePlacesClient;
try {
    googlePlacesClient = new google_places_1.GooglePlacesClient();
}
catch (error) {
    console.error('Failed to initialize Google Places client:', error);
}
// Initialize Supabase service
let supabaseService;
try {
    supabaseService = new supabase_1.SupabaseService();
    console.log('✅ Supabase service initialized');
}
catch (error) {
    console.error('Failed to initialize Supabase service:', error);
    process.exit(1);
}
// Initialize Landing Page API
// let landingPageAPI: LandingPageAPI;
let landingPageAPI = null;
// try {
//   landingPageAPI = new LandingPageAPI();
//   console.log('✅ Landing Page API initialized');
// } catch (error) {
//   console.error('Failed to initialize Landing Page API:', error);
// }
// Initialize Hotel Discovery Controller (optional - requires Amadeus)
let discoveryController = null;
try {
    discoveryController = new hotel_discovery_controller_1.HotelDiscoveryController();
    console.log('✅ Hotel Discovery Controller initialized');
}
catch (error) {
    console.warn('⚠️  Hotel Discovery Controller not available (optional):', error instanceof Error ? error.message : error);
}
// Initialize Photo Quality Auditor
const photoAuditor = new photo_quality_auditor_1.PhotoQualityAuditor();
// Initialize Giata Partners API (Second database)
let giataInitialized = false;
(async () => {
    console.log('🔄 Initializing Giata Partners API (second database)...');
    const giataInitStatus = await giataPartnersApi_1.giataPartnersApi.testConnection();
    if (giataInitStatus.success) {
        console.log('✅ Giata Partners API initialized successfully');
        console.log('   Using same CRM endpoint: https://web-production-b200.up.railway.app');
        giataInitialized = true;
    }
    else {
        console.warn('⚠️  Giata Partners API not available:', giataInitStatus.message);
    }
})();
// CORS configuration - Allow all origins for development
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development
    credentials: true
}));
// Rate limiting: 100 requests per 15 minutes per IP
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('🔍 REQUEST:', req.method, req.path, req.body);
    next();
});
// Stricter rate limiting for seeding endpoint
const seedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 seed requests per hour
    message: {
        error: 'Seeding rate limit exceeded. Please try again later.'
    }
});
// Body parsing middleware
app.use(express_1.default.json());
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
    }
    catch (error) {
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
        if (!amadeusClient) {
            return res.status(503).json({
                success: false,
                error: 'Amadeus client not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env'
            });
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Failed to clear hotels:', error);
        res.status(500).json({
            error: 'Failed to clear hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ==================== PRODUCTION AUTHENTICATION ENDPOINTS ====================
const otp_service_1 = require("./services/otp-service");
const email_service_1 = require("./services/email-service");
const auth_service_1 = require("./services/auth-service");
// Rate limiter for OTP requests (temporarily disabled for testing)
// const otpLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // Max 1000 OTP requests per 15 minutes (increased for testing)
//   keyGenerator: (req) => {
//     // Use email + IP as key for more granular rate limiting
//     const email = req.body?.email || 'unknown';
//     const ip = req.ip || req.connection.remoteAddress || 'unknown';
//     return `${email}:${ip}`;
//   },
//   message: {
//     success: false,
//     error: 'Too many OTP requests. Please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// Temporary: no rate limiting for testing
const otpLimiter = (req, res, next) => next();
/**
 * Request OTP code for email authentication
 * POST /api/auth/request-otp
 * Body: { email: string }
 */
app.post('/api/auth/request-otp', otpLimiter, async (req, res) => {
    console.log('🚨 OTP ENDPOINT CALLED');
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }
        console.log('📧 Processing OTP request for:', email);
        // Generate and store OTP
        const otpResult = await otp_service_1.otpService.createOTP(email);
        if (!otpResult.success) {
            console.error('❌ Failed to create OTP:', otpResult.error);
            // Rate limiting should return 400, not 500
            const isRateLimit = otpResult.error?.includes('Too many OTP requests');
            return res.status(isRateLimit ? 400 : 500).json({
                success: false,
                error: otpResult.error || 'Failed to create OTP',
            });
        }
        if (!otpResult.code) {
            console.error('❌ OTP code not returned from service');
            return res.status(500).json({
                success: false,
                error: 'Failed to generate OTP code',
            });
        }
        // Send OTP email
        console.log('📨 Sending OTP email to:', email);
        const emailResult = await email_service_1.emailService.sendOTPEmail(email, otpResult.code);
        if (!emailResult.success) {
            console.error('❌ Failed to send OTP email:', emailResult.error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification email. Please try again.',
            });
        }
        console.log('✅ OTP request completed successfully');
        console.log('');
        console.log('🔐 ============================================');
        console.log('🔐 ============================================');
        console.log('🔐          OTP CODE FOR TESTING');
        console.log('🔐 ============================================');
        console.log('🔐 Email:', email);
        console.log('🔐 Code: ', otpResult.code);
        console.log('🔐 ============================================');
        console.log('🔐 Use this code in the mobile app!');
        console.log('🔐 ============================================');
        console.log('🔐 ============================================');
        console.log('');
        res.json({
            success: true,
            message: 'Verification code sent to your email',
            // Always include debug code for development/testing
            debugCode: otpResult.code,
            debugMessage: 'Use this code in the app for testing'
        });
    }
    catch (error) {
        console.error('🚨 OTP ENDPOINT ERROR:', error);
        console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * Get OTP code for testing (development only)
 * GET /api/auth/debug-otp?email=test@example.com
 */
app.get('/api/auth/debug-otp', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email parameter required'
            });
        }
        // Get the most recent OTP for this email
        const { data: otpRecords, error } = await supabase_1.supabase
            .from('otp_codes')
            .select('*')
            .eq('email', email.toString().toLowerCase())
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) {
            console.error('Error fetching OTP:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch OTP'
            });
        }
        if (!otpRecords || otpRecords.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid OTP found. Please request a new code first.'
            });
        }
        const otpRecord = otpRecords[0];
        res.json({
            success: true,
            email: email,
            code: otpRecord.code,
            expiresAt: otpRecord.expires_at,
            attempts: otpRecord.attempts,
            message: 'Use this code in the app for testing'
        });
    }
    catch (error) {
        console.error('Debug OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
/**
 * Verify OTP code and authenticate user
 * POST /api/auth/verify-otp
 * Body: { email: string, code: string }
 */
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log('🔍 ============================================');
        console.log('🔍 OTP VERIFICATION received');
        console.log('🔍 Email:', email);
        console.log('🔍 Code length:', code?.length);
        console.log('🔍 Timestamp:', new Date().toISOString());
        console.log('🔍 ============================================');
        // Validate input
        if (!email || !code) {
            console.warn('⚠️  Missing email or code in request');
            return res.status(400).json({
                success: false,
                error: 'Email and code are required',
            });
        }
        // Verify OTP
        const verifyResult = await otp_service_1.otpService.verifyOTP(email, code);
        if (!verifyResult.success) {
            console.warn('⚠️  OTP verification failed:', verifyResult.error);
            return res.status(400).json({
                success: false,
                error: verifyResult.error,
                attemptsRemaining: verifyResult.attemptsRemaining,
            });
        }
        // OTP verified! Now authenticate the user
        const authResult = await auth_service_1.authService.authenticateUser(email);
        if (!authResult.success || !authResult.user || !authResult.token) {
            console.error('❌ Failed to authenticate user');
            return res.status(500).json({
                success: false,
                error: 'Authentication failed',
            });
        }
        // Send welcome email for new users (async, don't wait)
        if (authResult.user.created_at === authResult.user.last_login_at) {
            email_service_1.emailService.sendWelcomeEmail(email, authResult.user.name).catch(err => {
                console.error('Failed to send welcome email:', err);
            });
        }
        console.log('✅ ============================================');
        console.log('✅ OTP VERIFICATION completed successfully');
        console.log('✅ User ID:', authResult.user.id);
        console.log('✅ Email:', authResult.user.email);
        console.log('✅ ============================================');
        res.json({
            success: true,
            user: {
                id: authResult.user.id,
                email: authResult.user.email,
                name: authResult.user.name,
                created_at: authResult.user.created_at,
                last_login_at: authResult.user.last_login_at,
            },
            token: authResult.token,
            message: 'Authentication successful',
        });
    }
    catch (error) {
        console.error('❌ ============================================');
        console.error('❌ OTP VERIFICATION failed with error:', error);
        console.error('❌ ============================================');
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * Verify JWT token
 * GET /api/auth/verify-token
 * Headers: Authorization: Bearer <token>
 */
app.get('/api/auth/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('🔐 ============================================');
        console.log('🔐 TOKEN VERIFICATION received');
        console.log('🔐 Timestamp:', new Date().toISOString());
        console.log('🔐 ============================================');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('⚠️  No authorization header or invalid format');
            return res.status(401).json({
                valid: false,
                error: 'No token provided',
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify token
        const verifyResult = auth_service_1.authService.verifyToken(token);
        if (!verifyResult.valid || !verifyResult.payload) {
            console.warn('⚠️  Invalid token:', verifyResult.error);
            return res.status(401).json({
                valid: false,
                error: verifyResult.error,
            });
        }
        // Get user data
        const user = await auth_service_1.authService.getUserById(verifyResult.payload.userId);
        if (!user) {
            console.warn('⚠️  User not found for token');
            return res.status(401).json({
                valid: false,
                error: 'User not found',
            });
        }
        console.log('✅ ============================================');
        console.log('✅ TOKEN VERIFICATION successful');
        console.log('✅ User ID:', user.id);
        console.log('✅ ============================================');
        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error('❌ ============================================');
        console.error('❌ TOKEN VERIFICATION failed with error:', error);
        console.error('❌ ============================================');
        res.status(500).json({
            valid: false,
            error: 'Internal server error',
        });
    }
});
/**
 * Get OTP statistics (admin/monitoring endpoint)
 * GET /api/auth/otp-stats
 */
app.get('/api/auth/otp-stats', async (req, res) => {
    try {
        const stats = await otp_service_1.otpService.getOTPStats();
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Failed to get OTP stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get OTP statistics',
        });
    }
});
/**
 * Test email configuration (admin endpoint)
 * POST /api/auth/test-email
 */
app.post('/api/auth/test-email', async (req, res) => {
    try {
        const result = await email_service_1.emailService.testConfiguration();
        res.json(result);
    }
    catch (error) {
        console.error('Failed to test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get personalized hotel recommendations based on user preferences
app.post('/api/hotels/recommendations', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                error: 'Supabase service not available',
                message: 'Database service not initialized'
            });
        }
        const { userId, limit = 20, offset = 0, countryAffinity = {}, amenityAffinity = {}, seenHotels = [], likedHotels = [], superlikedHotels = [] } = req.body;
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required',
                message: 'Please provide a valid userId'
            });
        }
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        console.log(`🎯 Personalized recommendations request for user ${userId}`);
        console.log(`   Limit: ${limitNum}, Offset: ${offsetNum}`);
        console.log(`   Seen: ${seenHotels.length}, Liked: ${likedHotels.length}, Superliked: ${superlikedHotels.length}`);
        // Get hotels from Supabase
        const supabaseHotels = await supabaseService.getHotels(limitNum * 2, offsetNum); // Get extra for filtering
        // Convert Supabase format to HotelCard format
        const hotels = supabaseHotels.map(hotel => {
            // Generate a proper booking URL if none exists
            let bookingUrl = hotel.booking_url;
            if (!bookingUrl || bookingUrl.trim() === '') {
                // Generate a fallback booking.com search URL
                const searchQuery = encodeURIComponent(`${hotel.name} ${hotel.city}`);
                bookingUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
            }
            // Parse photos into clean URL strings
            const parsedPhotos = parsePhotoUrls(hotel.photos);
            const parsedHeroPhoto = hotel.hero_photo
                ? (typeof hotel.hero_photo === 'string' && hotel.hero_photo.startsWith('{')
                    ? parsePhotoUrls([hotel.hero_photo])[0]
                    : hotel.hero_photo)
                : (parsedPhotos[0] || '');
            return {
                id: hotel.id,
                name: hotel.name,
                city: hotel.city,
                country: hotel.country,
                coords: hotel.coords,
                price: hotel.price,
                description: hotel.description || '',
                amenityTags: hotel.amenity_tags || [],
                photos: parsedPhotos, // Clean URL strings with metadata!
                heroPhoto: parsedHeroPhoto, // Clean URL string with metadata!
                bookingUrl,
                rating: hotel.rating
            };
        });
        // Enhanced personalization data including likes and superlikes
        const enhancedPersonalization = {
            countryAffinity,
            amenityAffinity,
            seenHotels: new Set(seenHotels),
            likedHotels,
            superlikedHotels
        };
        // Apply enhanced personalization scoring
        const scoredHotels = hotels.map(hotel => ({
            ...hotel,
            score: calculateEnhancedPersonalizationScore(hotel, enhancedPersonalization)
        }));
        // Sort by score (highest first)
        scoredHotels.sort((a, b) => b.score - a.score);
        const responseHotels = scoredHotels.map(({ score, ...hotel }) => hotel);
        // Get total available hotels count
        const totalAvailable = await supabaseService.getHotelCount();
        // Add recommendation metadata
        const recommendationMetadata = {
            totalAvailable,
            filteredBy: {
                seenHotels: seenHotels.length,
                likedHotels: likedHotels.length,
                superlikedHotels: superlikedHotels.length
            },
            personalization: {
                topCountries: Object.entries(countryAffinity)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([country, score]) => ({ country, score })),
                topAmenities: Object.entries(amenityAffinity)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([amenity, score]) => ({ amenity, score }))
            },
            algorithm: {
                version: '2.0',
                factors: ['rating', 'country_affinity', 'amenity_affinity', 'interaction_history', 'recency_bias'],
                weights: { rating: 0.4, country: 0.25, amenity: 0.2, interactions: 0.1, recency: 0.05 }
            }
        };
        res.json({
            hotels: responseHotels,
            metadata: recommendationMetadata,
            total: responseHotels.length,
            hasMore: offsetNum + limitNum < totalAvailable
        });
    }
    catch (error) {
        console.error('Failed to get personalized recommendations:', error);
        res.status(500).json({
            error: 'Failed to get recommendations',
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
        const { limit = 50, offset = 0, maxPrice = 3000, minPhotos = 3 } = req.query;
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
        const adWorthyHotels = allHotels.filter((hotel) => {
            // Check for boutique amenities
            const hasBoutiqueAmenity = hotel.amenity_tags.some(tag => boutiqueAmenities.some(amenity => tag.toLowerCase().includes(amenity.toLowerCase())));
            // Check rating (4.2+ for boutique quality, but allow unrated unique properties)
            const goodRating = !hotel.rating || hotel.rating >= 4.2;
            // Check price
            const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
            const reasonablePrice = hotelPrice <= parseInt(maxPrice);
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
                const googlePhotos = await googlePlacesClient.getSpecificHotelPhotos(hotel.name, hotel.city, 8 // Try to get up to 8 photos
                );
                if (googlePhotos && googlePhotos.length >= parseInt(minPhotos)) {
                    validatedHotels.push({
                        ...hotel,
                        googlePhotosCount: googlePhotos.length,
                        googlePhotos: googlePhotos.slice(0, 6), // Include first 6 photos
                        validationStatus: 'success'
                    });
                    validationResults.withPhotos++;
                    validationResults.totalPhotosFound += googlePhotos.length;
                    console.log(`✅ ${hotel.name}: Found ${googlePhotos.length} photos`);
                }
                else {
                    console.log(`❌ ${hotel.name}: Only ${googlePhotos?.length || 0} photos (minimum ${minPhotos} required)`);
                    validationResults.withoutPhotos++;
                }
                // Small delay to respect API limits
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            catch (error) {
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
        const sortedHotels = validatedHotels.sort((a, b) => {
            // First by photo count (more photos = better)
            if (a.googlePhotosCount !== b.googlePhotosCount) {
                return b.googlePhotosCount - a.googlePhotosCount;
            }
            // Then by rating
            return (b.rating || 0) - (a.rating || 0);
        });
        const finalHotels = sortedHotels.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        // Group by continent for analysis
        const continentAnalysis = {};
        validatedHotels.forEach((hotel) => {
            const continent = getContinent(hotel.country);
            continentAnalysis[continent] = (continentAnalysis[continent] || 0) + 1;
        });
        res.json({
            validatedHotels: finalHotels,
            totalValidated: validatedHotels.length,
            hasMore: sortedHotels.length > parseInt(offset) + parseInt(limit),
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
    }
    catch (error) {
        console.error('Failed to validate ad-worthy hotels with photos:', error);
        res.status(500).json({
            error: 'Failed to validate hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Helper function to determine continent
function getContinent(country) {
    const continentMap = {
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
        const continentAnalysis = {};
        Object.entries(globalDestinations).forEach(([continent, destinations]) => {
            const continentHotels = allHotels.filter(hotel => {
                const location = `${hotel.city} ${hotel.country}`.toLowerCase();
                return destinations.some(dest => location.includes(dest.toLowerCase()));
            });
            // Filter for ad-worthy hotels in this continent
            const adWorthyHotels = continentHotels.filter(hotel => {
                // Check for boutique amenities
                const hasBoutiqueAmenity = hotel.amenity_tags.some(tag => boutiqueAmenities.some((amenity) => tag.toLowerCase().includes(amenity.toLowerCase())));
                // Check rating (4.2+ for boutique quality)
                const goodRating = !hotel.rating || hotel.rating >= 4.2;
                // Check reasonable price (under $500/night equivalent)
                const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
                const reasonablePrice = hotelPrice <= 500;
                return hasBoutiqueAmenity && goodRating && reasonablePrice;
            });
            // Analyze amenity distribution
            const amenityCount = {};
            adWorthyHotels.forEach(hotel => {
                hotel.amenity_tags.forEach(tag => {
                    boutiqueAmenities.forEach((amenity) => {
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
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([amenity, count]) => ({ amenity, count })),
                destinations: destinations.map(dest => {
                    const destHotels = continentHotels.filter(hotel => `${hotel.city} ${hotel.country}`.toLowerCase().includes(dest.toLowerCase()));
                    const destAdWorthy = adWorthyHotels.filter(hotel => `${hotel.city} ${hotel.country}`.toLowerCase().includes(dest.toLowerCase()));
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
        const totalAdWorthy = Object.values(continentAnalysis).reduce((sum, continent) => sum + continent.adWorthyHotels, 0);
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
                    .sort(([, a], [, b]) => b.adWorthyHotels - a.adWorthyHotels)
                    .slice(0, 3)
                    .map(([continent, data]) => ({ continent, adWorthyHotels: data.adWorthyHotels })),
                bestValueDestinations: Object.values(continentAnalysis)
                    .flatMap((continent) => continent.destinations)
                    .filter((dest) => dest.adWorthyHotels >= 2)
                    .sort((a, b) => b.coverage - a.coverage)
                    .slice(0, 10),
                needsImprovement: Object.entries(continentAnalysis)
                    .filter(([, data]) => data.adWorthyPercentage < 20)
                    .map(([continent, data]) => ({
                    continent,
                    percentage: data.adWorthyPercentage,
                    totalHotels: data.totalHotels
                }))
            }
        });
    }
    catch (error) {
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
        const { limit = 20, offset = 0, minVisualScore = 50, maxPrice = 400, location = '', seenHotels } = req.query;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        // Get hotels from Supabase
        const supabaseHotels = await supabaseService.getHotels(limitNum * 2, offsetNum); // Get extra for filtering
        // Convert and filter for ad-worthy criteria
        const hotels = supabaseHotels.map(hotel => ({
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
            const hasBoutiqueAmenity = hotel.amenityTags.some(tag => boutiqueAmenities.some((amenity) => tag.includes(amenity)));
            // Check price if specified
            const hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
            const priceOk = !maxPrice || hotelPrice <= parseInt(maxPrice);
            // Check rating (4.2+ for boutique quality)
            const ratingOk = !hotel.rating || hotel.rating >= 4.2;
            return hasBoutiqueAmenity && priceOk && ratingOk;
        });
        // Sort by visual appeal indicators
        const sortedHotels = adWorthyHotels.sort((a, b) => {
            // Prioritize hotels with multiple Instagram amenities
            const aInstagramCount = a.amenityTags.filter(tag => ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(keyword => tag.includes(keyword))).length;
            const bInstagramCount = b.amenityTags.filter(tag => ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(keyword => tag.includes(keyword))).length;
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
    }
    catch (error) {
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
        const { limit = 20, offset = 0, cityCode } = req.query;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        console.log(`🎯 Glintz curation request: limit=${limitNum}, offset=${offsetNum}, city=${cityCode}`);
        // Get raw hotel data from Amadeus
        let rawHotels = [];
        if (cityCode) {
            if (!amadeusClient) {
                return res.status(503).json({
                    success: false,
                    error: 'Amadeus client not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env'
                });
            }
            // Fetch from specific city
            const cityHotels = await amadeusClient.getHotelsByCity(cityCode, limitNum * 2);
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
                                cityCode: hotel.hotel.cityCode || cityCode,
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
                }
                catch (error) {
                    console.error(`Failed to get content for hotel ${hotel.hotel.hotelId}:`, error);
                }
            }
        }
        else {
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
        const curationResult = await (0, curation_1.glintzCurate)(rawHotels);
        // Convert to HotelCard format for compatibility
        const hotelCards = curationResult.cards.map(card => ({
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
    }
    catch (error) {
        console.error('Glintz curation error:', error);
        res.status(500).json({
            error: 'Failed to curate hotels',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Helper function to parse photo strings - now preserves source metadata
const parsePhotoUrls = (photos) => {
    if (!photos || !Array.isArray(photos)) {
        return [];
    }
    return photos.map(photo => {
        // If it's already a plain string URL (no metadata), return it
        if (typeof photo === 'string' && !photo.startsWith('{')) {
            return photo;
        }
        // If it's a JSON string with metadata, preserve it as JSON string
        if (typeof photo === 'string' && photo.startsWith('{')) {
            try {
                const parsed = JSON.parse(photo);
                // Validate it has a URL
                if (parsed.url) {
                    return photo; // Return original JSON string to preserve metadata
                }
            }
            catch (e) {
                console.warn('Failed to parse photo JSON:', photo.substring(0, 100));
                return '';
            }
        }
        // If it's an object with URL property, stringify it to preserve metadata
        if (typeof photo === 'object' && photo && photo.url) {
            return JSON.stringify(photo); // Convert object to JSON string to preserve source
        }
        return '';
    }).filter(url => url && url.length > 0); // Remove empty strings
};
// Get random R2 photos from partners for background rotation
app.get('/api/onboarding/photos', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;
        console.log(`📸 Fetching ${limit} random R2 photos for background rotation...`);
        // Import R2 photo mapping
        const { getPartnerR2Photos } = require('./services/r2PhotoMapping');
        // Fetch all active partners
        const partnersResponse = await partnersApi_1.partnersApi.listPartners({
            page: 1,
            per_page: 100, // Get all partners
            status: 'active'
        });
        // Collect all R2 photos from all partners
        const allPhotos = [];
        partnersResponse.partners.forEach((partner) => {
            const r2Photos = getPartnerR2Photos(partner.id);
            r2Photos.forEach((photoUrl) => {
                const location = partner.location_label ||
                    (partner.city && partner.country_code
                        ? `${partner.city}, ${partner.country_code}`
                        : partner.country_code || 'Unknown');
                const locationParts = location.split(',').map((s) => s.trim());
                const city = partner.city || locationParts[0] || '';
                const country = partner.country_code || locationParts[1] || location || '';
                // Optimize image URL for faster loading
                // For background images, we can use a smaller size
                // R2 doesn't support transformations, but we can note the optimization
                // In the future, we could add Cloudflare Images or similar for resizing
                const optimizedUrl = photoUrl; // Keep original for now, but ready for optimization
                allPhotos.push({
                    url: optimizedUrl,
                    width: 1920, // Optimized width for backgrounds (1080p is sufficient)
                    hotelName: partner.hotel_name,
                    city,
                    country,
                    caption: `${partner.hotel_name}, ${location}`
                });
            });
        });
        console.log(`✅ Collected ${allPhotos.length} R2 photos from ${partnersResponse.partners.length} partners`);
        if (allPhotos.length === 0) {
            return res.json({
                photos: [],
                total: 0,
                message: 'No R2 photos available'
            });
        }
        // Randomize and take up to limit
        const shuffled = allPhotos.sort(() => Math.random() - 0.5);
        const selectedPhotos = shuffled.slice(0, Math.min(limit, allPhotos.length));
        console.log(`✅ Returning ${selectedPhotos.length} random R2 photos for backgrounds`);
        res.json({
            photos: selectedPhotos,
            total: allPhotos.length,
            message: `Random selection of ${selectedPhotos.length} photos from ${allPhotos.length} available`
        });
    }
    catch (error) {
        console.error('Failed to fetch R2 photos for backgrounds:', error);
        res.status(500).json({
            error: 'Failed to fetch photos',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Legacy endpoint (kept for compatibility)
app.get('/api/onboarding/photos-legacy', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                error: 'Supabase service not available',
                message: 'Database service not initialized'
            });
        }
        const limit = parseInt(req.query.limit) || 30;
        console.log(`📸 Fetching top ${limit} best quality hotel photos for onboarding...`);
        // Fetch hotels with photos - get a large pool to select from
        const hotels = await supabaseService.getHotels(200, 0);
        const hotelsWithPhotos = hotels.filter((h) => h.photos && h.photos.length > 0);
        console.log(`✅ Fetched ${hotelsWithPhotos.length} hotels with photos`);
        // Collect all photos with metadata
        const allPhotos = [];
        hotelsWithPhotos.forEach((hotel) => {
            if (hotel.photos && Array.isArray(hotel.photos)) {
                hotel.photos.forEach((photo, index) => {
                    try {
                        let photoUrl = photo;
                        let photoWidth = 0;
                        // Parse if it's a JSON string
                        if (typeof photo === 'string' && photo.startsWith('{')) {
                            const photoObj = JSON.parse(photo);
                            photoUrl = photoObj.url || photo;
                            photoWidth = photoObj.width || 0;
                        }
                        // Extract width from Google Places URL if available
                        if (typeof photoUrl === 'string' && photoUrl.includes('maxwidth=')) {
                            const match = photoUrl.match(/maxwidth=(\d+)/);
                            if (match) {
                                photoWidth = parseInt(match[1], 10);
                            }
                        }
                        allPhotos.push({
                            url: photoUrl,
                            width: photoWidth,
                            hotelName: hotel.name,
                            city: hotel.city,
                            country: hotel.country,
                            isHero: index === 0, // First photo is usually best
                            caption: `Photo: ${hotel.name}, ${hotel.city}`,
                        });
                    }
                    catch (error) {
                        console.log('Error parsing photo:', photo);
                    }
                });
            }
        });
        console.log(`📊 Total photos collected: ${allPhotos.length}`);
        // Sort by quality:
        // 1. Higher width = better quality
        // 2. Hero photos first
        // 3. Filter out low quality photos
        const qualityPhotos = allPhotos
            .filter(photo => {
            // Only keep high quality photos (typically Google Places ultra = 2048)
            // Or at least 1200px wide
            return photo.width >= 1200 || photo.url.includes('maxwidth=2048');
        })
            .sort((a, b) => {
            // Sort by: isHero first, then by width
            if (a.isHero && !b.isHero)
                return -1;
            if (!a.isHero && b.isHero)
                return 1;
            return b.width - a.width;
        })
            .slice(0, limit); // Take top N photos
        console.log(`✅ Selected ${qualityPhotos.length} best quality photos`);
        if (qualityPhotos.length > 0) {
            const avgWidth = Math.round(qualityPhotos.reduce((sum, p) => sum + p.width, 0) / qualityPhotos.length);
            console.log(`📏 Average width: ${avgWidth}px`);
        }
        res.json({
            photos: qualityPhotos,
            total: qualityPhotos.length,
            message: `Top ${qualityPhotos.length} best quality hotel photos`,
        });
    }
    catch (error) {
        console.error('Failed to fetch onboarding photos:', error);
        res.status(500).json({
            error: 'Failed to fetch photos',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get best photos for landing page mockup
app.get('/api/landing/photos', async (req, res) => {
    try {
        if (!landingPageAPI) {
            return res.status(503).json({
                error: 'Landing Page API not available',
                message: 'Landing Page API not initialized'
            });
        }
        const limit = parseInt(req.query.limit) || 12;
        console.log(`🎨 Fetching ${limit} best photos for landing page mockup...`);
        const photos = await landingPageAPI.getLandingPagePhotos(limit);
        console.log(`✅ Returning ${photos.length} photos for landing page mockup`);
        res.json({
            photos,
            total: photos.length,
            message: `Best ${photos.length} photos for landing page showcase`,
            sources: {
                hotelbeds: photos.filter((p) => p.source === 'hotelbeds').length,
                google_places: photos.filter((p) => p.source === 'google_places').length,
                curated: photos.filter((p) => p.source === 'unsplash').length
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch landing page photos:', error);
        res.status(500).json({
            error: 'Failed to fetch landing page photos',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
        const { limit = 20, offset = 0, countryAffinity, amenityAffinity, seenHotels } = req.query;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        // Get hotels from Supabase
        const supabaseHotels = await supabaseService.getHotels(limitNum, offsetNum);
        // Convert Supabase format to HotelCard format
        const hotels = supabaseHotels.map(hotel => {
            // Generate a proper booking URL if none exists
            let bookingUrl = hotel.booking_url;
            if (!bookingUrl || bookingUrl.trim() === '') {
                // Generate a fallback booking.com search URL
                const searchQuery = encodeURIComponent(`${hotel.name} ${hotel.city}`);
                bookingUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
            }
            // Parse photos into clean URL strings
            const parsedPhotos = parsePhotoUrls(hotel.photos);
            const parsedHeroPhoto = hotel.hero_photo
                ? (typeof hotel.hero_photo === 'string' && hotel.hero_photo.startsWith('{')
                    ? parsePhotoUrls([hotel.hero_photo])[0]
                    : hotel.hero_photo)
                : (parsedPhotos[0] || '');
            return {
                id: hotel.id,
                name: hotel.name,
                city: hotel.city,
                country: hotel.country,
                coords: hotel.coords,
                price: hotel.price,
                description: hotel.description || '',
                amenityTags: hotel.amenity_tags || [],
                photos: parsedPhotos, // Clean URL strings with metadata!
                heroPhoto: parsedHeroPhoto, // Clean URL string with metadata!
                bookingUrl,
                rating: hotel.rating
            };
        });
        // Parse personalization data from query params
        const personalization = {
            countryAffinity: countryAffinity ? JSON.parse(countryAffinity) : {},
            amenityAffinity: amenityAffinity ? JSON.parse(amenityAffinity) : {},
            seenHotels: new Set(seenHotels ? JSON.parse(seenHotels) : [])
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
    }
    catch (error) {
        console.error('Failed to fetch hotels:', error);
        res.status(500).json({
            error: 'Failed to fetch hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Partners cache for super-fast responses
let partnersCache = null;
let partnersCacheTime = 0;
const PARTNERS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
// Get hotels from Partners API (with R2 photos) - OPTIMIZED
app.get('/api/hotels/partners', async (req, res) => {
    try {
        const { page = 1, per_page = 20, status = 'active', country_code, include_photos = 'true' } = req.query;
        const pageNum = parseInt(page);
        const perPageNum = parseInt(per_page);
        const includePhotos = include_photos === 'true';
        const now = Date.now();
        // Use cached partners if fresh (massive speed improvement)
        let partnersResponse;
        if (partnersCache && (now - partnersCacheTime) < PARTNERS_CACHE_DURATION) {
            console.log('⚡ Using cached partners data');
            partnersResponse = partnersCache;
        }
        else {
            console.log('🔄 Fetching fresh partners data...');
            partnersResponse = await partnersApi_1.partnersApi.listPartners({
                page: 1,
                per_page: 100, // Get all partners at once for caching
                status: 'active'
            });
            partnersCache = partnersResponse;
            partnersCacheTime = now;
            console.log(`✅ Cached ${partnersResponse.partners.length} partners`);
        }
        // Apply pagination from cache
        const startIdx = (pageNum - 1) * perPageNum;
        const paginatedPartners = {
            ...partnersResponse,
            partners: partnersResponse.partners.slice(startIdx, startIdx + perPageNum)
        };
        // Convert partners to hotel cards and fetch photos
        const hotels = [];
        // Import R2 photo mapping service (cached in memory)
        const { getPartnerR2Photos } = require('./services/r2PhotoMapping');
        // PERFORMANCE: Process partners synchronously (R2 mapping is cached, no async needed)
        // Images are now compressed (~150KB each), so we can show ALL photos!
        // No limit needed - even 50 photos = 7.5MB (totally reasonable)
        const hotelPromises = paginatedPartners.partners.map((partner) => {
            let photos = [];
            if (includePhotos) {
                // R2 photos only (no Dropbox fallback - too slow)
                const r2Photos = getPartnerR2Photos(partner.id);
                if (r2Photos.length > 0) {
                    // Show ALL photos - no limit! Images are optimized (~150KB each)
                    photos = r2Photos;
                }
            }
            // Use location_label or construct from city/country
            const location = partner.location_label ||
                (partner.city && partner.country_code
                    ? `${partner.city}, ${partner.country_code}`
                    : partner.country_code || 'Unknown');
            // Split location into city and country
            const locationParts = location.split(',').map((s) => s.trim());
            const city = partner.city || locationParts[0] || '';
            const country = partner.country_code || locationParts[1] || location || '';
            // Use website as booking URL
            const bookingUrl = partner.website ||
                `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(partner.hotel_name)}`;
            // Use tags as amenity tags
            const amenityTags = partner.tags || [];
            // Set hero photo (first photo or empty)
            const heroPhoto = photos.length > 0 ? photos[0] : '';
            return {
                id: partner.id,
                name: partner.hotel_name,
                city,
                country,
                address: location,
                coords: partner.lat && partner.lng ? {
                    lat: partner.lat,
                    lng: partner.lng
                } : undefined,
                description: partner.notes || `${partner.hotel_name} - ${location}`,
                amenityTags,
                photos,
                heroPhoto,
                bookingUrl,
                rating: undefined
            };
        });
        const hotelCards = await Promise.all(hotelPromises);
        // ADD GIATA PARTNERS (Second Database)
        try {
            console.log('🔄 Adding Giata partners to the mix...');
            const giataResponse = await giataPartnersApi_1.giataPartnersApi.listPartners({
                page: pageNum,
                per_page: Math.max(5, Math.floor(perPageNum / 3)), // Get some Giata hotels
                partner_status: 'candidate' // Include candidates since no approved yet
            });
            console.log(`✅ Found ${giataResponse.partners.length} Giata partners`);
            // Convert Giata partners to HotelCard format
            for (const partner of giataResponse.partners) {
                let photos = [];
                let heroPhoto = '';
                if (includePhotos && partner.has_selected_photos && partner.giata_id) {
                    try {
                        const photosData = await giataPartnersApi_1.giataPartnersApi.getSelectedPhotos(partner.giata_id);
                        photos = photosData.photos.map(p => p.cloudflare_public_url);
                        const heroPhotoData = photosData.photos.find(p => p.is_hero);
                        heroPhoto = heroPhotoData?.cloudflare_public_url || photos[0] || '';
                    }
                    catch (error) {
                        console.log(`No photos for Giata hotel ${partner.giata_id}`);
                    }
                }
                hotelCards.push({
                    id: `giata-${partner.giata_id}`,
                    name: partner.hotel_name,
                    city: partner.city_name || 'Unknown',
                    country: partner.country_name || 'Unknown',
                    coords: undefined,
                    price: undefined,
                    description: partner.notes_internal || `${partner.hotel_name} in ${partner.city_name || partner.country_name}`,
                    amenityTags: [],
                    photos: photos,
                    heroPhoto: heroPhoto || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920',
                    bookingUrl: partner.website || '',
                    rating: partner.rating_internal || undefined
                });
            }
            console.log(`✅ Total hotels (Partners + Giata): ${hotelCards.length}`);
        }
        catch (error) {
            console.error('⚠️  Failed to fetch Giata partners:', error);
            // Continue without Giata hotels - graceful degradation
        }
        res.json({
            hotels: hotelCards,
            total: partnersResponse.total,
            hasMore: partnersResponse.page < partnersResponse.total_pages
        });
    }
    catch (error) {
        console.error('Failed to fetch partners hotels:', error);
        res.status(500).json({
            error: 'Failed to fetch partners hotels',
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
        // Convert Supabase format to HotelCard format with parsed photos
        const parsedPhotos = parsePhotoUrls(supabaseHotel.photos);
        const parsedHeroPhoto = supabaseHotel.hero_photo
            ? (typeof supabaseHotel.hero_photo === 'string' && supabaseHotel.hero_photo.startsWith('{')
                ? parsePhotoUrls([supabaseHotel.hero_photo])[0]
                : supabaseHotel.hero_photo)
            : (parsedPhotos[0] || '');
        const hotel = {
            id: supabaseHotel.id,
            name: supabaseHotel.name,
            city: supabaseHotel.city,
            country: supabaseHotel.country,
            coords: supabaseHotel.coords,
            price: supabaseHotel.price,
            description: supabaseHotel.description,
            amenityTags: supabaseHotel.amenity_tags,
            photos: parsedPhotos, // Clean URL strings with metadata!
            heroPhoto: parsedHeroPhoto, // Clean URL string with metadata!
            bookingUrl: supabaseHotel.booking_url,
            rating: supabaseHotel.rating
        };
        res.json(hotel);
    }
    catch (error) {
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
        const hotels = await googlePlacesClient.searchHotels(cityName, parseInt(limit));
        const photos = hotels.flatMap(hotel => hotel.photos.map(photo => photo.url));
        res.json({
            city: cityName,
            photos,
            count: photos.length,
            source: 'google_places'
        });
    }
    catch (error) {
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
        const photos = await googlePlacesClient.getSpecificHotelPhotos(hotelName, city, parseInt(limit));
        res.json({
            hotel: hotelName,
            city,
            photos,
            count: photos.length,
            source: 'google_places_instagram_optimized',
            quality: 'instagram_ready'
        });
    }
    catch (error) {
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
        const photos = await googlePlacesClient.getSpecificHotelPhotos(hotelName, city, parseInt(limit));
        res.json({
            hotel: hotelName,
            city,
            photos,
            count: photos.length,
            source: 'google_places'
        });
    }
    catch (error) {
        console.error('Failed to fetch hotel photos:', error);
        res.status(500).json({
            error: 'Failed to fetch hotel photos',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ============================================================================
// GIATA PARTNERS API ENDPOINTS (Second Database)
// ============================================================================
// Get all Giata partners
app.get('/api/giata-partners', async (req, res) => {
    try {
        const { page = 1, per_page = 50, partner_status, search } = req.query;
        console.log(`🏨 Fetching Giata partners: page=${page}, per_page=${per_page}, status=${partner_status || 'all'}`);
        const response = await giataPartnersApi_1.giataPartnersApi.listPartners({
            page: parseInt(page),
            per_page: parseInt(per_page),
            partner_status: partner_status,
            search: search
        });
        console.log(`✅ Found ${response.partners.length} Giata partners`);
        res.json(response);
    }
    catch (error) {
        console.error('Failed to fetch Giata partners:', error);
        res.status(500).json({
            error: 'Failed to fetch Giata partners',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get single Giata partner by ID
app.get('/api/giata-partners/:partnerId', async (req, res) => {
    try {
        const { partnerId } = req.params;
        console.log(`🔍 Fetching Giata partner: ${partnerId}`);
        const response = await giataPartnersApi_1.giataPartnersApi.getPartner(partnerId);
        res.json(response);
    }
    catch (error) {
        console.error(`Failed to fetch Giata partner ${req.params.partnerId}:`, error);
        res.status(404).json({
            error: 'Partner not found',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get selected photos from Cloudflare for a Giata hotel
app.get('/api/giata/:giataId/photos/selected', async (req, res) => {
    try {
        const { giataId } = req.params;
        const { refresh = 'false' } = req.query;
        console.log(`📸 Fetching selected photos for Giata ID: ${giataId}`);
        const useCache = refresh !== 'true';
        const response = await giataPartnersApi_1.giataPartnersApi.getSelectedPhotos(parseInt(giataId), useCache);
        res.json(response);
    }
    catch (error) {
        console.error(`Failed to fetch photos for Giata ID ${req.params.giataId}:`, error);
        res.status(404).json({
            error: 'Photos not found',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get location data (coordinates) for a Giata hotel
app.get('/api/giata/:giataId/location', async (req, res) => {
    try {
        const { giataId } = req.params;
        console.log(`📍 Fetching location for Giata ID: ${giataId}`);
        const location = await giataPartnersApi_1.giataPartnersApi.getHotelLocation(parseInt(giataId));
        if (!location) {
            res.status(404).json({
                error: 'Location not found',
                message: `No location data available for Giata ID ${giataId}`
            });
            return;
        }
        res.json({
            success: true,
            location
        });
    }
    catch (error) {
        console.error(`Failed to fetch location for Giata ID ${req.params.giataId}:`, error);
        res.status(500).json({
            error: 'Failed to fetch location',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get Giata partner statistics
app.get('/api/giata-partners/stats', async (req, res) => {
    try {
        console.log('📊 Fetching Giata partner statistics...');
        const response = await giataPartnersApi_1.giataPartnersApi.getStats();
        res.json(response);
    }
    catch (error) {
        console.error('Failed to fetch Giata partner stats:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get unified hotel data (combining both databases)
app.get('/api/hotels/unified', async (req, res) => {
    try {
        const { limit = 20, offset = 0, source = 'all', // 'supabase', 'giata', or 'all'
         } = req.query;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        console.log(`🔄 Fetching unified hotels: limit=${limitNum}, offset=${offsetNum}, source=${source}`);
        const hotels = [];
        // Fetch from Supabase (first database)
        if (source === 'all' || source === 'supabase') {
            if (supabaseService) {
                const supabaseHotels = await supabaseService.getHotels(limitNum, offsetNum);
                const convertedHotels = supabaseHotels.map((hotel) => ({
                    id: hotel.id,
                    name: hotel.name,
                    city: hotel.city,
                    country: hotel.country,
                    coords: hotel.coords ? { lat: hotel.coords.lat, lng: hotel.coords.lng } : undefined,
                    price: hotel.price ? { amount: String(hotel.price.amount), currency: hotel.price.currency } : undefined,
                    description: hotel.description,
                    amenityTags: hotel.amenity_tags || [],
                    photos: hotel.photos || [],
                    heroPhoto: hotel.hero_photo || '',
                    bookingUrl: hotel.booking_url || '',
                    rating: hotel.rating || 0
                }));
                hotels.push(...convertedHotels);
            }
        }
        // Fetch from Giata Partners (second database)
        if (source === 'all' || source === 'giata') {
            try {
                const giataPartners = await giataPartnersApi_1.giataPartnersApi.listPartners({
                    page: Math.floor(offsetNum / limitNum) + 1,
                    per_page: limitNum,
                    partner_status: 'approved'
                });
                // Convert Giata partners to HotelCard format
                const giataHotels = await Promise.all(giataPartners.partners.map(async (partner) => {
                    // Fetch photos for this hotel
                    let photos = [];
                    let heroPhoto = '';
                    if (partner.has_selected_photos && partner.giata_id) {
                        try {
                            const photosData = await giataPartnersApi_1.giataPartnersApi.getSelectedPhotos(partner.giata_id);
                            photos = photosData.photos.map(p => p.cloudflare_public_url);
                            const heroPhotoData = photosData.photos.find(p => p.is_hero);
                            heroPhoto = heroPhotoData?.cloudflare_public_url || photos[0] || '';
                        }
                        catch (error) {
                            console.error(`Failed to fetch photos for Giata hotel ${partner.giata_id}`);
                        }
                    }
                    return {
                        id: `giata-${partner.giata_id}`,
                        name: partner.hotel_name,
                        city: partner.city_name || '',
                        country: partner.country_name || '',
                        coords: undefined, // Not available in Giata data
                        price: undefined, // Not available in Giata data
                        description: partner.notes_internal || '',
                        amenityTags: [],
                        photos: photos,
                        heroPhoto: heroPhoto,
                        bookingUrl: partner.website || '',
                        rating: partner.rating_internal || 0
                    };
                }));
                hotels.push(...giataHotels);
            }
            catch (error) {
                console.error('Failed to fetch Giata hotels:', error);
            }
        }
        console.log(`✅ Returning ${hotels.length} unified hotels`);
        // Count hotels by checking if ID starts with 'giata-'
        const supabaseCount = hotels.filter(h => !h.id.startsWith('giata-')).length;
        const giataCount = hotels.filter(h => h.id.startsWith('giata-')).length;
        res.json({
            hotels: hotels.slice(0, limitNum),
            total: hotels.length,
            hasMore: hotels.length === limitNum,
            sources: {
                supabase: supabaseCount,
                giata: giataCount
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch unified hotels:', error);
        res.status(500).json({
            error: 'Failed to fetch unified hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Test Giata API connection
app.get('/api/giata-partners/test', async (req, res) => {
    try {
        console.log('🧪 Testing Giata Partners API connection...');
        const result = await giataPartnersApi_1.giataPartnersApi.testConnection();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Connection test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ============================================================================
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
    }
    catch (error) {
        console.error('Failed to update personalization:', error);
        res.status(500).json({
            error: 'Failed to update personalization',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ==================== USER METRICS & PREFERENCES ENDPOINTS ====================
// Save user preferences to database
app.post('/api/user/preferences', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId, countryAffinity, amenityAffinity, seenHotels } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        console.log(`💾 Saving preferences for user ${userId}`);
        // Upsert user preferences
        const { error } = await supabase_1.supabase
            .from('user_preferences')
            .upsert({
            user_id: userId,
            country_affinity: countryAffinity || {},
            amenity_affinity: amenityAffinity || {},
            seen_hotels: seenHotels || [],
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });
        if (error) {
            console.error('Failed to save preferences:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save preferences',
                message: error.message
            });
        }
        res.json({
            success: true,
            message: 'Preferences saved successfully'
        });
    }
    catch (error) {
        console.error('Failed to save user preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save preferences',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Load user preferences from database
app.get('/api/user/preferences', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        console.log(`📥 Loading preferences for user ${userId}`);
        const { data, error } = await supabase_1.supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // No preferences found yet
                return res.json({
                    success: true,
                    preferences: null,
                    message: 'No preferences found for this user'
                });
            }
            console.error('Failed to load preferences:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load preferences',
                message: error.message
            });
        }
        res.json({
            success: true,
            preferences: {
                countryAffinity: data.country_affinity || {},
                amenityAffinity: data.amenity_affinity || {},
                seenHotels: data.seen_hotels || [],
                lastUpdated: data.updated_at
            }
        });
    }
    catch (error) {
        console.error('Failed to load user preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load preferences',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Save user interaction (swipe action)
app.post('/api/user/interactions', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId, hotelId, actionType, sessionId } = req.body;
        if (!userId || !hotelId || !actionType) {
            return res.status(400).json({
                success: false,
                error: 'userId, hotelId, and actionType are required'
            });
        }
        console.log(`👆 Saving interaction: ${userId} ${actionType} ${hotelId}`);
        // Insert interaction
        const { error } = await supabase_1.supabase
            .from('user_interactions')
            .insert({
            user_id: userId,
            hotel_id: hotelId,
            action_type: actionType,
            session_id: sessionId || null,
            created_at: new Date().toISOString()
        });
        if (error) {
            console.error('Failed to save interaction:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save interaction',
                message: error.message
            });
        }
        res.json({
            success: true,
            message: 'Interaction saved successfully'
        });
    }
    catch (error) {
        console.error('Failed to save user interaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save interaction',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Save hotel to user's saved list
app.post('/api/user/saved-hotels', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId, hotelId, saveType, hotelData } = req.body;
        if (!userId || !hotelId || !saveType || !hotelData) {
            return res.status(400).json({
                success: false,
                error: 'userId, hotelId, saveType, and hotelData are required'
            });
        }
        console.log(`💝 Saving hotel: ${userId} ${saveType} ${hotelId}`);
        // Upsert saved hotel
        const { error } = await supabase_1.supabase
            .from('user_saved_hotels')
            .upsert({
            user_id: userId,
            hotel_id: hotelId,
            save_type: saveType,
            hotel_data: hotelData,
            created_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,hotel_id'
        });
        if (error) {
            console.error('Failed to save hotel:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to save hotel',
                message: error.message
            });
        }
        res.json({
            success: true,
            message: 'Hotel saved successfully'
        });
    }
    catch (error) {
        console.error('Failed to save hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save hotel',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Load user's saved hotels
app.get('/api/user/saved-hotels', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId, type } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        console.log(`📚 Loading saved hotels for user ${userId}, type: ${type || 'all'}`);
        let query = supabase_1.supabase
            .from('user_saved_hotels')
            .select('*')
            .eq('user_id', userId);
        if (type) {
            query = query.eq('save_type', type);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error('Failed to load saved hotels:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to load saved hotels',
                message: error.message
            });
        }
        res.json({
            success: true,
            hotels: (data || []).map((item) => item.hotel_data)
        });
    }
    catch (error) {
        console.error('Failed to load saved hotels:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load saved hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Remove hotel from saved list
app.delete('/api/user/saved-hotels/:userId/:hotelId', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId, hotelId } = req.params;
        console.log(`🗑️  Removing saved hotel: ${userId} - ${hotelId}`);
        const { error } = await supabase_1.supabase
            .from('user_saved_hotels')
            .delete()
            .eq('user_id', userId)
            .eq('hotel_id', hotelId);
        if (error) {
            console.error('Failed to remove saved hotel:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to remove saved hotel',
                message: error.message
            });
        }
        res.json({
            success: true,
            message: 'Hotel removed successfully'
        });
    }
    catch (error) {
        console.error('Failed to remove saved hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove saved hotel',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get user stats
app.get('/api/user/stats', async (req, res) => {
    try {
        if (!supabaseService) {
            return res.status(503).json({
                success: false,
                error: 'Supabase service not available'
            });
        }
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }
        console.log(`📊 Loading stats for user ${userId}`);
        // Get interaction counts
        const { data: interactions, error: interactionsError } = await supabase_1.supabase
            .from('user_interactions')
            .select('action_type')
            .eq('user_id', userId);
        if (interactionsError) {
            console.error('Failed to load interactions:', interactionsError);
        }
        // Get saved hotel counts
        const { data: savedHotels, error: savedError } = await supabase_1.supabase
            .from('user_saved_hotels')
            .select('save_type')
            .eq('user_id', userId);
        if (savedError) {
            console.error('Failed to load saved hotels:', savedError);
        }
        // Calculate stats
        const stats = {
            totalInteractions: interactions?.length || 0,
            likes: interactions?.filter((i) => i.action_type === 'like').length || 0,
            superlikes: interactions?.filter((i) => i.action_type === 'superlike').length || 0,
            dismisses: interactions?.filter((i) => i.action_type === 'dismiss').length || 0,
            savedLikes: savedHotels?.filter((h) => h.save_type === 'like').length || 0,
            savedSuperlikes: savedHotels?.filter((h) => h.save_type === 'superlike').length || 0
        };
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('Failed to load user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load user stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Calculate personalization score for a hotel
function calculatePersonalizationScore(hotel, personalization) {
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
    const score = 0.6 * baseScore +
        0.25 * Math.min(countryScore, 1) + // Normalize to max 1
        0.15 * Math.min(amenityScore, 1) - // Normalize to max 1
        0.2 * seenPenalty;
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}
// Enhanced personalization score calculation with interaction history
function calculateEnhancedPersonalizationScore(hotel, personalization) {
    // Base score from rating (if available) or default
    const baseScore = hotel.rating ? hotel.rating / 5 : 0.7;
    // Country affinity score
    const countryScore = personalization.countryAffinity[hotel.country] || 0;
    // Amenity affinity score
    const amenityTags = hotel.amenityTags || [];
    const amenityScore = amenityTags.reduce((sum, tag) => {
        return sum + (personalization.amenityAffinity[tag] || 0);
    }, 0) / Math.max(amenityTags.length, 1);
    // Interaction history scoring
    let interactionScore = 0;
    // Superliked hotels get highest boost (direct matches)
    if (personalization.superlikedHotels.includes(hotel.id)) {
        interactionScore += 0.8;
    }
    // Liked hotels get moderate boost (direct matches)
    else if (personalization.likedHotels.includes(hotel.id)) {
        interactionScore += 0.5;
    }
    // Hotels in same country as liked hotels get small boost
    else {
        const countryLikedCount = personalization.likedHotels.length > 0 ?
            personalization.likedHotels.filter(id => {
                // This would need access to other hotels data to check country matches
                // For now, we'll use a simplified approach
                return false; // Placeholder - would need hotel lookup
            }).length / personalization.likedHotels.length : 0;
        interactionScore += countryLikedCount * 0.2;
    }
    // Seen penalty (should be 0 since we filter out seen hotels, but keeping for completeness)
    const seenPenalty = personalization.seenHotels.has(hotel.id) ? 0.3 : 0;
    // Enhanced weighted score calculation
    const score = 0.4 * baseScore +
        0.25 * Math.min(countryScore, 1) +
        0.15 * Math.min(amenityScore, 1) +
        0.15 * Math.min(interactionScore, 1) -
        0.3 * seenPenalty;
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// ==================== HOTEL DISCOVERY ENDPOINTS ====================
// Helper to check if discovery controller is available
function requireDiscoveryController(res) {
    if (!discoveryController) {
        res.status(503).json({
            success: false,
            error: 'Hotel Discovery Controller not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env'
        });
        return false;
    }
    return true;
}
// Start global hotel discovery
app.post('/api/discovery/start', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const config = req.body;
        // Validate configuration
        const validation = discoveryController.validateConfig(config);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid configuration',
                errors: validation.errors
            });
        }
        const sessionId = await discoveryController.startDiscovery(config);
        res.json({
            success: true,
            sessionId,
            message: 'Hotel discovery started successfully',
            config
        });
    }
    catch (error) {
        console.error('Failed to start discovery:', error);
        res.status(500).json({
            error: 'Failed to start discovery',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Stop current discovery session
app.post('/api/discovery/stop', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const stopped = await discoveryController.stopDiscovery();
        if (stopped) {
            res.json({
                success: true,
                message: 'Discovery session stopped successfully'
            });
        }
        else {
            res.status(400).json({
                error: 'No active discovery session to stop'
            });
        }
    }
    catch (error) {
        console.error('Failed to stop discovery:', error);
        res.status(500).json({
            error: 'Failed to stop discovery',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get current discovery status
app.get('/api/discovery/status', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const currentSession = discoveryController.getCurrentSession();
        const liveProgress = discoveryController.getLiveProgress();
        const stats = await discoveryController.getDiscoveryStats();
        res.json({
            currentSession,
            liveProgress,
            stats,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get discovery status:', error);
        res.status(500).json({
            error: 'Failed to get discovery status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get all discovery sessions
app.get('/api/discovery/sessions', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const sessions = discoveryController.getAllSessions();
        res.json({
            sessions,
            total: sessions.length,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get sessions:', error);
        res.status(500).json({
            error: 'Failed to get sessions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get specific session details
app.get('/api/discovery/sessions/:sessionId', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const { sessionId } = req.params;
        const session = discoveryController.getSession(sessionId);
        if (!session) {
            return res.status(404).json({
                error: 'Session not found',
                sessionId
            });
        }
        res.json({
            session,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get session:', error);
        res.status(500).json({
            error: 'Failed to get session',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get recommended configuration
app.get('/api/discovery/config/recommended', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const config = await discoveryController.getRecommendedConfig();
        res.json({
            config,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get recommended config:', error);
        res.status(500).json({
            error: 'Failed to get recommended config',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Validate configuration
app.post('/api/discovery/config/validate', async (req, res) => {
    try {
        if (!requireDiscoveryController(res))
            return;
        const config = req.body;
        const validation = discoveryController.validateConfig(config);
        res.json({
            valid: validation.valid,
            errors: validation.errors,
            config
        });
    }
    catch (error) {
        console.error('Failed to validate config:', error);
        res.status(500).json({
            error: 'Failed to validate config',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ==================== PHOTO CURATION ENDPOINTS ====================
// Save photo curation for a hotel
app.post('/api/photos/curate/:hotelId', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { originalPhotos, curatedPhotos } = req.body;
        if (!originalPhotos || !curatedPhotos) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'originalPhotos and curatedPhotos are required'
            });
        }
        await photo_curation_1.photoCurationService.savePhotoCuration(hotelId, originalPhotos, curatedPhotos);
        res.json({
            success: true,
            message: 'Photo curation saved successfully',
            hotelId,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to save photo curation:', error);
        res.status(500).json({
            error: 'Failed to save photo curation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get photo curation for a hotel
app.get('/api/photos/curate/:hotelId', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const curation = await photo_curation_1.photoCurationService.getPhotoCuration(hotelId);
        res.json({
            curation,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get photo curation:', error);
        res.status(500).json({
            error: 'Failed to get photo curation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Reset photo curation for a hotel
app.delete('/api/photos/curate/:hotelId', async (req, res) => {
    try {
        const { hotelId } = req.params;
        await photo_curation_1.photoCurationService.resetPhotoCuration(hotelId);
        res.json({
            success: true,
            message: 'Photo curation reset successfully',
            hotelId,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to reset photo curation:', error);
        res.status(500).json({
            error: 'Failed to reset photo curation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get all curated hotels
app.get('/api/photos/curated-hotels', async (req, res) => {
    try {
        const hotels = await photo_curation_1.photoCurationService.getCuratedHotels();
        res.json({
            hotels,
            count: hotels.length,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get curated hotels:', error);
        res.status(500).json({
            error: 'Failed to get curated hotels',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get photo quality statistics
app.get('/api/photos/stats', async (req, res) => {
    try {
        const stats = await photo_curation_1.photoCurationService.getPhotoQualityStats();
        res.json({
            stats,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to get photo stats:', error);
        res.status(500).json({
            error: 'Failed to get photo stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Direct photo removal endpoint (dev mode only)
app.delete('/api/photos/remove/:hotelId/:photoIndex', async (req, res) => {
    try {
        const { hotelId, photoIndex } = req.params;
        const index = parseInt(photoIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: 'Invalid photo index',
                message: 'Photo index must be a non-negative number'
            });
        }
        await photo_curation_1.photoCurationService.removePhotoDirectly(hotelId, index);
        res.json({
            success: true,
            message: 'Photo removed successfully',
            hotelId,
            photoIndex: index,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Failed to remove photo directly:', error);
        res.status(500).json({
            error: 'Failed to remove photo',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Export session results
app.get('/api/discovery/sessions/:sessionId/export', async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!requireDiscoveryController(res))
            return;
        const results = await discoveryController.exportResults(sessionId);
        res.json(results);
    }
    catch (error) {
        console.error('Failed to export results:', error);
        res.status(500).json({
            error: 'Failed to export results',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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
    // Display comprehensive network information
    (0, network_utils_1.displayServerInfo)(Number(port));
    // Check if database is seeded on startup
    database.isSeeded().then(seeded => {
        if (!seeded) {
            console.log('⚠️  DATABASE STATUS: Not seeded');
            console.log('   Call POST /api/seed to populate with hotels.');
            console.log('');
        }
        else {
            console.log('✅ DATABASE STATUS: Ready with hotel data');
            console.log('');
        }
    }).catch(() => {
        console.log('⚠️  DATABASE STATUS: Could not check status');
        console.log('');
    });
});
exports.default = app;
// ==================== ENHANCED GLOBAL HOTEL DISCOVERY ====================
const enhanced_global_hotel_discovery_1 = require("./enhanced-global-hotel-discovery");
// Initialize Enhanced Discovery (optional - requires Amadeus)
let enhancedDiscovery = null;
try {
    enhancedDiscovery = new enhanced_global_hotel_discovery_1.EnhancedGlobalHotelDiscovery();
    console.log('✅ Enhanced Global Hotel Discovery initialized');
}
catch (error) {
    console.warn('⚠️  Enhanced Global Hotel Discovery not available (optional):', error instanceof Error ? error.message : error);
}
// Start enhanced global hotel discovery
app.post('/api/discovery/enhanced', async (req, res) => {
    try {
        if (!enhancedDiscovery) {
            return res.status(503).json({
                success: false,
                error: 'Enhanced Global Hotel Discovery not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env'
            });
        }
        const { targetCount = 1000 } = req.body;
        console.log(`🌍 Starting Enhanced Global Hotel Discovery for ${targetCount} hotels...`);
        // Start the discovery process (non-blocking)
        enhancedDiscovery.discoverGlobalHotels(targetCount).catch(error => {
            console.error('Enhanced discovery failed:', error);
        });
        res.json({
            success: true,
            message: `Enhanced global hotel discovery started`,
            targetCount,
            strategies: [
                'Luxury Hotel Brands',
                'Unique Property Types',
                'Destination Types',
                'Exotic Locations',
                'Hidden Gems',
                'UNESCO & Natural Wonders',
                'Systematic Regional Coverage'
            ]
        });
    }
    catch (error) {
        console.error('Failed to start enhanced discovery:', error);
        res.status(500).json({
            error: 'Failed to start enhanced discovery',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ==================== TARGETED LUXURY DISCOVERY ====================
const targeted_luxury_discovery_1 = require("./targeted-luxury-discovery");
// Initialize Targeted Discovery (optional - requires Amadeus)
let targetedDiscovery = null;
try {
    targetedDiscovery = new targeted_luxury_discovery_1.TargetedLuxuryDiscovery();
    console.log('✅ Targeted Luxury Discovery initialized');
}
catch (error) {
    console.warn('⚠️  Targeted Luxury Discovery not available (optional):', error instanceof Error ? error.message : error);
}
// Start targeted luxury hotel discovery for under-represented destinations
app.post('/api/discovery/targeted-luxury', async (req, res) => {
    try {
        if (!targetedDiscovery) {
            return res.status(503).json({
                success: false,
                error: 'Targeted Luxury Discovery not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env'
            });
        }
        console.log('🎯 Starting Targeted Luxury Discovery for under-represented destinations...');
        // Start the discovery process (non-blocking)
        targetedDiscovery.discoverTargetedLuxuryHotels().catch(error => {
            console.error('Targeted luxury discovery failed:', error);
        });
        res.json({
            success: true,
            message: 'Targeted luxury hotel discovery started',
            focus: 'Under-represented and missing luxury destinations',
            criteria: {
                photoRequirement: 'Minimum 4 high-quality photos (1200x800+)',
                luxuryFilters: 'Boutique, luxury, premium, exclusive properties only',
                ratingMinimum: '4.0+ stars',
                sources: 'Amadeus + Google Places hybrid system'
            },
            targets: [
                'Major Urban Luxury: NYC, London, Paris, Singapore, Hong Kong',
                'Alpine Luxury: St. Moritz, Courchevel, Zermatt',
                'Caribbean Paradise: St. Barts, Barbados, Turks & Caicos',
                'Cultural Heritage: Machu Picchu, Petra',
                'Under-represented: Rome, Tokyo, Dubai (expansion)'
            ]
        });
    }
    catch (error) {
        console.error('Failed to start targeted luxury discovery:', error);
        res.status(500).json({
            error: 'Failed to start targeted luxury discovery',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=index.js.map