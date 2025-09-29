"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var express_rate_limit_1 = require("express-rate-limit");
var dotenv_1 = require("dotenv");
var amadeus_1 = require("./amadeus");
var database_1 = require("./database");
var google_places_1 = require("./google-places");
var supabase_1 = require("./supabase");
var curation_1 = require("./curation");
// Load environment variables
dotenv_1.default.config();
var app = (0, express_1.default)();
var port = process.env.PORT || 3001;
// Initialize Amadeus client
var amadeusClient;
try {
    amadeusClient = new amadeus_1.AmadeusClient();
}
catch (error) {
    console.error('Failed to initialize Amadeus client:', error);
    process.exit(1);
}
// Initialize Database service
var database;
try {
    database = new database_1.default();
    database.initializeTables().catch(console.error);
}
catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
}
// Initialize Google Places client (optional)
var googlePlacesClient;
try {
    googlePlacesClient = new google_places_1.GooglePlacesClient();
}
catch (error) {
    console.error('Failed to initialize Google Places client:', error);
}
// Initialize Supabase service
var supabaseService;
try {
    supabaseService = new supabase_1.SupabaseService();
    console.log('✅ Supabase service initialized');
}
catch (error) {
    console.error('Failed to initialize Supabase service:', error);
}
// CORS configuration - Allow all origins for development
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development
    credentials: true
}));
// Rate limiting: 100 requests per 15 minutes per IP
var limiter = (0, express_rate_limit_1.default)({
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
var seedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 seed requests per hour
    message: {
        error: 'Seeding rate limit exceeded. Please try again later.'
    }
});
// Body parsing middleware
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelCount, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            status: 'error',
                            message: 'Supabase service not available'
                        })];
                }
                return [4 /*yield*/, supabaseService.getHotelCount()];
            case 1:
                hotelCount = _a.sent();
                res.json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    seeded: hotelCount > 0,
                    hotelCount: hotelCount,
                    source: 'supabase'
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({
                    status: 'error',
                    message: 'Supabase connection failed',
                    error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Seed hotels from Amadeus API
app.post('/api/seed', seedLimiter, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hotels, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                console.log('Starting luxury hotel seeding process...');
                // Clear existing hotels first
                console.log('Clearing existing hotels...');
                if (!supabaseService) return [3 /*break*/, 2];
                return [4 /*yield*/, supabaseService.clearHotels()];
            case 1:
                _a.sent();
                console.log('✅ Cleared existing hotels');
                _a.label = 2;
            case 2: return [4 /*yield*/, amadeusClient.seedHotelsFromCities()];
            case 3:
                hotels = _a.sent();
                // Store hotels in Supabase
                return [4 /*yield*/, database.storeHotels(hotels)];
            case 4:
                // Store hotels in Supabase
                _a.sent();
                console.log("Successfully seeded ".concat(hotels.length, " luxury hotels to Supabase"));
                res.json({
                    success: true,
                    message: "Seeded ".concat(hotels.length, " luxury hotels to database"),
                    count: hotels.length
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                console.error('Seeding failed:', error_2);
                res.status(500).json({
                    error: 'Failed to seed hotels',
                    message: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Clear all hotels (for development)
app.delete('/api/hotels', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available',
                            message: 'Database service not initialized'
                        })];
                }
                return [4 /*yield*/, supabaseService.clearHotels()];
            case 1:
                _a.sent();
                console.log('✅ Cleared all hotels from database');
                res.json({
                    success: true,
                    message: 'All hotels cleared from database'
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Failed to clear hotels:', error_3);
                res.status(500).json({
                    error: 'Failed to clear hotels',
                    message: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get hotels with BOTH ad-worthy criteria AND Google Photos validation
app.get('/api/hotels/validated-ad-worthy', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, offset, _d, maxPrice_1, _e, minPhotos, allHotels, boutiqueAmenities_1, adWorthyHotels, validatedHotels, validationResults, _i, adWorthyHotels_1, hotel, googlePhotos, error_4, successRate, sortedHotels, finalHotels, continentAnalysis_1, error_5;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 9, , 10]);
                if (!supabaseService || !googlePlacesClient) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Required services not available',
                            message: 'Database or Google Places service not initialized'
                        })];
                }
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 50 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, _d = _a.maxPrice, maxPrice_1 = _d === void 0 ? 3000 : _d, _e = _a.minPhotos, minPhotos = _e === void 0 ? 3 : _e;
                console.log('🔍 Starting dual validation: Amadeus criteria + Google Photos...');
                return [4 /*yield*/, supabaseService.getHotels(100, 0)];
            case 1:
                allHotels = _f.sent();
                console.log("\uD83D\uDCCA Found ".concat(allHotels.length, " total hotels in database"));
                boutiqueAmenities_1 = [
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
                adWorthyHotels = allHotels.filter(function (hotel) {
                    // Check for boutique amenities
                    var hasBoutiqueAmenity = hotel.amenity_tags.some(function (tag) {
                        return boutiqueAmenities_1.some(function (amenity) { return tag.toLowerCase().includes(amenity.toLowerCase()); });
                    });
                    // Check rating (4.2+ for boutique quality, but allow unrated unique properties)
                    var goodRating = !hotel.rating || hotel.rating >= 4.2;
                    // Check price
                    var hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
                    var reasonablePrice = hotelPrice <= parseInt(maxPrice_1);
                    return hasBoutiqueAmenity && goodRating && reasonablePrice;
                });
                console.log("\u2705 ".concat(adWorthyHotels.length, " hotels passed Amadeus ad-worthy criteria"));
                validatedHotels = [];
                validationResults = {
                    totalTested: adWorthyHotels.length,
                    withPhotos: 0,
                    withoutPhotos: 0,
                    photoValidationErrors: 0,
                    averagePhotosPerHotel: 0,
                    totalPhotosFound: 0
                };
                _i = 0, adWorthyHotels_1 = adWorthyHotels;
                _f.label = 2;
            case 2:
                if (!(_i < adWorthyHotels_1.length)) return [3 /*break*/, 8];
                hotel = adWorthyHotels_1[_i];
                _f.label = 3;
            case 3:
                _f.trys.push([3, 6, , 7]);
                console.log("\uD83D\uDCF8 Checking photos for ".concat(hotel.name, " in ").concat(hotel.city, "..."));
                return [4 /*yield*/, googlePlacesClient.getSpecificHotelPhotos(hotel.name, hotel.city, 8 // Try to get up to 8 photos
                    )];
            case 4:
                googlePhotos = _f.sent();
                if (googlePhotos && googlePhotos.length >= parseInt(minPhotos)) {
                    validatedHotels.push(__assign(__assign({}, hotel), { googlePhotosCount: googlePhotos.length, googlePhotos: googlePhotos.slice(0, 6), validationStatus: 'success' }));
                    validationResults.withPhotos++;
                    validationResults.totalPhotosFound += googlePhotos.length;
                    console.log("\u2705 ".concat(hotel.name, ": Found ").concat(googlePhotos.length, " photos"));
                }
                else {
                    console.log("\u274C ".concat(hotel.name, ": Only ").concat((googlePhotos === null || googlePhotos === void 0 ? void 0 : googlePhotos.length) || 0, " photos (minimum ").concat(minPhotos, " required)"));
                    validationResults.withoutPhotos++;
                }
                // Small delay to respect API limits
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
            case 5:
                // Small delay to respect API limits
                _f.sent();
                return [3 /*break*/, 7];
            case 6:
                error_4 = _f.sent();
                console.error("\uD83D\uDEA8 Photo validation error for ".concat(hotel.name, ":"), error_4);
                validationResults.photoValidationErrors++;
                return [3 /*break*/, 7];
            case 7:
                _i++;
                return [3 /*break*/, 2];
            case 8:
                // Calculate statistics
                validationResults.averagePhotosPerHotel = validationResults.withPhotos > 0 ?
                    Math.round(validationResults.totalPhotosFound / validationResults.withPhotos) : 0;
                successRate = validationResults.totalTested > 0 ?
                    Math.round((validationResults.withPhotos / validationResults.totalTested) * 100) : 0;
                sortedHotels = validatedHotels.sort(function (a, b) {
                    // First by photo count (more photos = better)
                    if (a.googlePhotosCount !== b.googlePhotosCount) {
                        return b.googlePhotosCount - a.googlePhotosCount;
                    }
                    // Then by rating
                    return (b.rating || 0) - (a.rating || 0);
                });
                finalHotels = sortedHotels.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
                continentAnalysis_1 = {};
                validatedHotels.forEach(function (hotel) {
                    var continent = getContinent(hotel.country);
                    continentAnalysis_1[continent] = (continentAnalysis_1[continent] || 0) + 1;
                });
                res.json({
                    validatedHotels: finalHotels,
                    totalValidated: validatedHotels.length,
                    hasMore: sortedHotels.length > parseInt(offset) + parseInt(limit),
                    validation: __assign(__assign({}, validationResults), { successRate: successRate }),
                    analysis: {
                        continentDistribution: continentAnalysis_1,
                        criteria: {
                            amadeusCriteria: 'Boutique amenities + 4.2+ rating + reasonable price',
                            googlePhotosCriteria: "Minimum ".concat(minPhotos, " accessible photos"),
                            maxPrice: "\u20AC".concat(maxPrice_1),
                            boutiqueAmenities: boutiqueAmenities_1
                        }
                    },
                    summary: {
                        message: "Found ".concat(validatedHotels.length, " hotels that meet BOTH Amadeus ad-worthy criteria AND have ").concat(minPhotos, "+ Google Photos"),
                        dualValidationSuccess: "".concat(validationResults.withPhotos, "/").concat(validationResults.totalTested, " hotels (").concat(successRate, "%) passed both criteria"),
                        averagePhotosPerValidatedHotel: validationResults.averagePhotosPerHotel
                    }
                });
                return [3 /*break*/, 10];
            case 9:
                error_5 = _f.sent();
                console.error('Failed to validate ad-worthy hotels with photos:', error_5);
                res.status(500).json({
                    error: 'Failed to validate hotels',
                    message: error_5 instanceof Error ? error_5.message : 'Unknown error'
                });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Helper function to determine continent
function getContinent(country) {
    var continentMap = {
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
app.get('/api/test/global-coverage', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allHotels_1, globalDestinations, boutiqueAmenities_2, continentAnalysis_2, totalHotels, totalAdWorthy, priceRanges_1, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available'
                        })];
                }
                return [4 /*yield*/, supabaseService.getHotels(1000, 0)];
            case 1:
                allHotels_1 = _a.sent();
                globalDestinations = {
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
                boutiqueAmenities_2 = [
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
                continentAnalysis_2 = {};
                Object.entries(globalDestinations).forEach(function (_a) {
                    var continent = _a[0], destinations = _a[1];
                    var continentHotels = allHotels_1.filter(function (hotel) {
                        var location = "".concat(hotel.city, " ").concat(hotel.country).toLowerCase();
                        return destinations.some(function (dest) { return location.includes(dest.toLowerCase()); });
                    });
                    // Filter for ad-worthy hotels in this continent
                    var adWorthyHotels = continentHotels.filter(function (hotel) {
                        // Check for boutique amenities
                        var hasBoutiqueAmenity = hotel.amenity_tags.some(function (tag) {
                            return boutiqueAmenities_2.some(function (amenity) { return tag.toLowerCase().includes(amenity.toLowerCase()); });
                        });
                        // Check rating (4.2+ for boutique quality)
                        var goodRating = !hotel.rating || hotel.rating >= 4.2;
                        // Check reasonable price (under $500/night equivalent)
                        var hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
                        var reasonablePrice = hotelPrice <= 500;
                        return hasBoutiqueAmenity && goodRating && reasonablePrice;
                    });
                    // Analyze amenity distribution
                    var amenityCount = {};
                    adWorthyHotels.forEach(function (hotel) {
                        hotel.amenity_tags.forEach(function (tag) {
                            boutiqueAmenities_2.forEach(function (amenity) {
                                if (tag.toLowerCase().includes(amenity.toLowerCase())) {
                                    amenityCount[amenity] = (amenityCount[amenity] || 0) + 1;
                                }
                            });
                        });
                    });
                    continentAnalysis_2[continent] = {
                        totalHotels: continentHotels.length,
                        adWorthyHotels: adWorthyHotels.length,
                        adWorthyPercentage: continentHotels.length > 0 ?
                            Math.round((adWorthyHotels.length / continentHotels.length) * 100) : 0,
                        topAmenities: Object.entries(amenityCount)
                            .sort(function (_a, _b) {
                            var a = _a[1];
                            var b = _b[1];
                            return b - a;
                        })
                            .slice(0, 5)
                            .map(function (_a) {
                            var amenity = _a[0], count = _a[1];
                            return ({ amenity: amenity, count: count });
                        }),
                        destinations: destinations.map(function (dest) {
                            var destHotels = continentHotels.filter(function (hotel) {
                                return "".concat(hotel.city, " ").concat(hotel.country).toLowerCase().includes(dest.toLowerCase());
                            });
                            var destAdWorthy = adWorthyHotels.filter(function (hotel) {
                                return "".concat(hotel.city, " ").concat(hotel.country).toLowerCase().includes(dest.toLowerCase());
                            });
                            return {
                                destination: dest,
                                totalHotels: destHotels.length,
                                adWorthyHotels: destAdWorthy.length,
                                coverage: destHotels.length > 0 ? Math.round((destAdWorthy.length / destHotels.length) * 100) : 0
                            };
                        }).filter(function (dest) { return dest.totalHotels > 0; })
                    };
                });
                totalHotels = allHotels_1.length;
                totalAdWorthy = Object.values(continentAnalysis_2).reduce(function (sum, continent) {
                    return sum + continent.adWorthyHotels;
                }, 0);
                priceRanges_1 = {
                    budget: { min: 0, max: 150, count: 0 },
                    midRange: { min: 150, max: 300, count: 0 },
                    luxury: { min: 300, max: 600, count: 0 },
                    ultraLuxury: { min: 600, max: 10000, count: 0 }
                };
                allHotels_1.forEach(function (hotel) {
                    var hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
                    Object.entries(priceRanges_1).forEach(function (_a) {
                        var range = _a[0], config = _a[1];
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
                        continentBreakdown: continentAnalysis_2,
                        priceDistribution: priceRanges_1,
                        testCriteria: {
                            boutiqueAmenities: boutiqueAmenities_2,
                            minRating: 4.2,
                            maxPrice: 500,
                            continentsCovered: Object.keys(globalDestinations).length,
                            destinationsTested: Object.values(globalDestinations).flat().length
                        }
                    },
                    recommendations: {
                        strongestContinents: Object.entries(continentAnalysis_2)
                            .sort(function (_a, _b) {
                            var a = _a[1];
                            var b = _b[1];
                            return b.adWorthyHotels - a.adWorthyHotels;
                        })
                            .slice(0, 3)
                            .map(function (_a) {
                            var continent = _a[0], data = _a[1];
                            return ({ continent: continent, adWorthyHotels: data.adWorthyHotels });
                        }),
                        bestValueDestinations: Object.values(continentAnalysis_2)
                            .flatMap(function (continent) { return continent.destinations; })
                            .filter(function (dest) { return dest.adWorthyHotels >= 2; })
                            .sort(function (a, b) { return b.coverage - a.coverage; })
                            .slice(0, 10),
                        needsImprovement: Object.entries(continentAnalysis_2)
                            .filter(function (_a) {
                            var data = _a[1];
                            return data.adWorthyPercentage < 20;
                        })
                            .map(function (_a) {
                            var continent = _a[0], data = _a[1];
                            return ({
                                continent: continent,
                                percentage: data.adWorthyPercentage,
                                totalHotels: data.totalHotels
                            });
                        })
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Failed to analyze global coverage:', error_6);
                res.status(500).json({
                    error: 'Failed to analyze global coverage',
                    message: error_6 instanceof Error ? error_6.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get ad-worthy hotels - visually stunning like travel ads
app.get('/api/hotels/ad-worthy', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, offset, _d, minVisualScore, _e, maxPrice_2, _f, location_1, seenHotels, limitNum, offsetNum, supabaseHotels, hotels, adWorthyHotels, sortedHotels, finalHotels, error_7;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 2, , 3]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available',
                            message: 'Database service not initialized'
                        })];
                }
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, _d = _a.minVisualScore, minVisualScore = _d === void 0 ? 50 : _d, _e = _a.maxPrice, maxPrice_2 = _e === void 0 ? 400 : _e, _f = _a.location, location_1 = _f === void 0 ? '' : _f, seenHotels = _a.seenHotels;
                limitNum = parseInt(limit);
                offsetNum = parseInt(offset);
                return [4 /*yield*/, supabaseService.getHotels(limitNum * 2, offsetNum)];
            case 1:
                supabaseHotels = _g.sent();
                hotels = supabaseHotels.map(function (hotel) {
                    // Generate a proper booking URL if none exists
                    var bookingUrl = hotel.booking_url;
                    if (!bookingUrl || bookingUrl.trim() === '') {
                        // Generate a fallback booking.com search URL
                        var searchQuery = encodeURIComponent(hotel.name + ' ' + hotel.city);
                        bookingUrl = "https://www.booking.com/searchresults.html?ss=" + searchQuery;
                    }
                    
                    return {
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
                        bookingUrl: bookingUrl,
                        rating: hotel.rating
                    };
                });
                adWorthyHotels = hotels.filter(function (hotel) {
                    // Check for boutique and unique amenities
                    var boutiqueAmenities = [
                        'boutique-hotel', 'design-hotel', 'historic-building', 'castle-hotel',
                        'villa-hotel', 'manor-house', 'heritage-building', 'art-hotel',
                        'infinity-pool', 'rooftop-pool', 'spa-sanctuary', 'michelin-dining',
                        'private-beach', 'ocean-view', 'mountain-view', 'sunset-views',
                        'clifftop-location', 'overwater-villa', 'private-island', 'adults-only'
                    ];
                    var hasBoutiqueAmenity = hotel.amenityTags.some(function (tag) {
                        return boutiqueAmenities.some(function (amenity) { return tag.includes(amenity); });
                    });
                    // Check price if specified
                    var hotelPrice = typeof hotel.price === 'object' ? parseFloat(hotel.price.amount) : hotel.price || 0;
                    var priceOk = !maxPrice_2 || hotelPrice <= parseInt(maxPrice_2);
                    // Check rating (4.2+ for boutique quality)
                    var ratingOk = !hotel.rating || hotel.rating >= 4.2;
                    return hasBoutiqueAmenity && priceOk && ratingOk;
                });
                sortedHotels = adWorthyHotels.sort(function (a, b) {
                    // Prioritize hotels with multiple Instagram amenities
                    var aInstagramCount = a.amenityTags.filter(function (tag) {
                        return ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(function (keyword) { return tag.includes(keyword); });
                    }).length;
                    var bInstagramCount = b.amenityTags.filter(function (tag) {
                        return ['infinity-pool', 'ocean-view', 'spa', 'rooftop', 'private'].some(function (keyword) { return tag.includes(keyword); });
                    }).length;
                    if (aInstagramCount !== bInstagramCount) {
                        return bInstagramCount - aInstagramCount;
                    }
                    // Then by rating
                    return (b.rating || 0) - (a.rating || 0);
                });
                finalHotels = sortedHotels.slice(0, limitNum);
                res.json({
                    hotels: finalHotels,
                    total: finalHotels.length,
                    hasMore: sortedHotels.length > limitNum,
                    criteria: {
                        visualAppeal: 'Instagram-worthy amenities',
                        maxPrice: maxPrice_2 || 'unlimited',
                        minRating: 4.0,
                        focus: 'Travel ad quality hotels'
                    },
                    message: "Found ".concat(finalHotels.length, " ad-worthy hotels with stunning visual appeal")
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _g.sent();
                console.error('Failed to fetch ad-worthy hotels:', error_7);
                res.status(500).json({
                    error: 'Failed to fetch ad-worthy hotels',
                    message: error_7 instanceof Error ? error_7.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get curated hotels using Glintz pipeline
app.get('/api/hotels/glintz', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, limit, _c, offset, cityCode, limitNum, offsetNum, rawHotels, cityHotels, _i, cityHotels_1, hotel, content, error_8, curationResult, hotelCards, hasMore, error_9;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 11, , 12]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available',
                            message: 'Database service not initialized'
                        })];
                }
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, cityCode = _a.cityCode;
                limitNum = parseInt(limit);
                offsetNum = parseInt(offset);
                console.log("\uD83C\uDFAF Glintz curation request: limit=".concat(limitNum, ", offset=").concat(offsetNum, ", city=").concat(cityCode));
                rawHotels = [];
                if (!cityCode) return [3 /*break*/, 8];
                return [4 /*yield*/, amadeusClient.getHotelsByCity(cityCode, limitNum * 2)];
            case 1:
                cityHotels = _d.sent();
                _i = 0, cityHotels_1 = cityHotels;
                _d.label = 2;
            case 2:
                if (!(_i < cityHotels_1.length)) return [3 /*break*/, 7];
                hotel = cityHotels_1[_i];
                _d.label = 3;
            case 3:
                _d.trys.push([3, 5, , 6]);
                return [4 /*yield*/, amadeusClient.getHotelContent(hotel.hotel.hotelId)];
            case 4:
                content = _d.sent();
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
                            amenities: (content.amenities || []).map(function (amenity) { return amenity.code; }),
                            media: content.media || [],
                            ratings: undefined // Not available in AmadeusHotelContent
                        },
                        offers: hotel.offers || []
                    });
                }
                return [3 /*break*/, 6];
            case 5:
                error_8 = _d.sent();
                console.error("Failed to get content for hotel ".concat(hotel.hotel.hotelId, ":"), error_8);
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7: return [3 /*break*/, 9];
            case 8: 
            // For now, return a message that Glintz curation requires cityCode
            return [2 /*return*/, res.json({
                    hotels: [],
                    total: 0,
                    hasMore: false,
                    message: 'Glintz curation requires a cityCode parameter for live Amadeus data. Use /api/hotels for database hotels.'
                })];
            case 9:
                console.log("\uD83D\uDCCA Processing ".concat(rawHotels.length, " raw hotels through Glintz pipeline..."));
                return [4 /*yield*/, (0, curation_1.glintzCurate)(rawHotels)];
            case 10:
                curationResult = _d.sent();
                hotelCards = curationResult.cards.map(function (card) { return ({
                    id: card.id,
                    name: card.name,
                    city: card.city,
                    country: card.country,
                    coords: card.coords,
                    price: card.price,
                    description: card.description,
                    amenityTags: card.tags.map(function (tag) { return tag.label; }),
                    photos: card.photos,
                    heroPhoto: card.heroPhoto,
                    bookingUrl: "https://www.booking.com/searchresults.html?ss=".concat(encodeURIComponent(card.name + ' ' + card.city)),
                    rating: card.rating
                }); });
                hasMore = curationResult.cards.length >= limitNum;
                res.json({
                    hotels: hotelCards.slice(0, limitNum),
                    total: curationResult.cards.length,
                    hasMore: hasMore,
                    curation: {
                        stats: curationResult.curationStats,
                        diversity: curationResult.diversityStats,
                        summary: curationResult.summary
                    },
                    message: "Glintz curation: ".concat(curationResult.cards.length, " Instagram-worthy hotels curated from ").concat(rawHotels.length, " candidates")
                });
                return [3 /*break*/, 12];
            case 11:
                error_9 = _d.sent();
                console.error('Glintz curation error:', error_9);
                res.status(500).json({
                    error: 'Failed to curate hotels',
                    message: error_9 instanceof Error ? error_9.message : 'Unknown error occurred'
                });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
// Get hotels with personalization
app.get('/api/hotels', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelCount, _a, _b, limit, _c, offset, countryAffinity, amenityAffinity, seenHotels, limitNum, offsetNum, supabaseHotels, hotels, personalization_1, scoredHotels, responseHotels, error_10;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available',
                            message: 'Database service not initialized'
                        })];
                }
                return [4 /*yield*/, supabaseService.getHotelCount()];
            case 1:
                hotelCount = _d.sent();
                if (hotelCount === 0) {
                    return [2 /*return*/, res.json({
                            hotels: [],
                            total: 0,
                            hasMore: false,
                            message: 'No hotels available. Please populate the database with real photos first.'
                        })];
                }
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, countryAffinity = _a.countryAffinity, amenityAffinity = _a.amenityAffinity, seenHotels = _a.seenHotels;
                limitNum = parseInt(limit);
                offsetNum = parseInt(offset);
                return [4 /*yield*/, supabaseService.getHotels(limitNum, offsetNum)];
            case 2:
                supabaseHotels = _d.sent();
                hotels = supabaseHotels.map(function (hotel) {
                    // Generate a proper booking URL if none exists
                    var bookingUrl = hotel.booking_url;
                    if (!bookingUrl || bookingUrl.trim() === '') {
                        // Generate a fallback booking.com search URL
                        var searchQuery = encodeURIComponent(hotel.name + ' ' + hotel.city);
                        bookingUrl = "https://www.booking.com/searchresults.html?ss=" + searchQuery;
                    }
                    
                    return {
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
                        bookingUrl: bookingUrl,
                        rating: hotel.rating
                    };
                });
                personalization_1 = {
                    countryAffinity: countryAffinity ? JSON.parse(countryAffinity) : {},
                    amenityAffinity: amenityAffinity ? JSON.parse(amenityAffinity) : {},
                    seenHotels: new Set(seenHotels ? JSON.parse(seenHotels) : [])
                };
                scoredHotels = hotels.map(function (hotel) { return (__assign(__assign({}, hotel), { score: calculatePersonalizationScore(hotel, personalization_1) })); });
                // Sort by score (highest first)
                scoredHotels.sort(function (a, b) { return b.score - a.score; });
                responseHotels = scoredHotels.map(function (_a) {
                    var score = _a.score, hotel = __rest(_a, ["score"]);
                    return hotel;
                });
                res.json({
                    hotels: responseHotels,
                    total: hotelCount,
                    hasMore: offsetNum + limitNum < hotelCount
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _d.sent();
                console.error('Failed to fetch hotels:', error_10);
                res.status(500).json({
                    error: 'Failed to fetch hotels',
                    message: error_10 instanceof Error ? error_10.message : 'Unknown error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get specific hotel details
app.get('/api/hotels/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, supabaseHotel, hotel, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!supabaseService) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Supabase service not available',
                            message: 'Database service not initialized'
                        })];
                }
                id = req.params.id;
                return [4 /*yield*/, supabaseService.getHotelById(id)];
            case 1:
                supabaseHotel = _a.sent();
                if (!supabaseHotel) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'Hotel not found'
                        })];
                }
                hotel = {
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
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                console.error('Failed to fetch hotel details:', error_11);
                res.status(500).json({
                    error: 'Failed to fetch hotel details',
                    message: error_11 instanceof Error ? error_11.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get hotel photos for a city using Google Places
app.get('/api/photos/:cityName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cityName, _a, limit, photos, error_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                cityName = req.params.cityName;
                _a = req.query.limit, limit = _a === void 0 ? 6 : _a;
                if (!googlePlacesClient) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Google Places service not available',
                            message: 'Google Places API key not configured'
                        })];
                }
                console.log("Fetching photos for ".concat(cityName, "..."));
                return [4 /*yield*/, googlePlacesClient.getHotelPhotos(cityName, parseInt(limit))];
            case 1:
                photos = _b.sent();
                res.json({
                    city: cityName,
                    photos: photos,
                    count: photos.length,
                    source: 'google_places'
                });
                return [3 /*break*/, 3];
            case 2:
                error_12 = _b.sent();
                console.error('Failed to fetch photos:', error_12);
                res.status(500).json({
                    error: 'Failed to fetch photos',
                    message: error_12 instanceof Error ? error_12.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get Instagram-quality photos for a specific hotel
app.get('/api/photos/instagram/:hotelName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelName, _a, city, _b, limit, photos, error_13;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                hotelName = req.params.hotelName;
                _a = req.query, city = _a.city, _b = _a.limit, limit = _b === void 0 ? 6 : _b;
                if (!googlePlacesClient) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Google Places service not available',
                            message: 'Google Places API key not configured'
                        })];
                }
                if (!city) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'City parameter required',
                            message: 'Please provide city name as query parameter'
                        })];
                }
                console.log("Fetching Instagram-quality photos for ".concat(hotelName, " in ").concat(city, "..."));
                return [4 /*yield*/, googlePlacesClient.getSpecificHotelPhotos(hotelName, city, parseInt(limit))];
            case 1:
                photos = _c.sent();
                res.json({
                    hotel: hotelName,
                    city: city,
                    photos: photos,
                    count: photos.length,
                    source: 'google_places_instagram_optimized',
                    quality: 'instagram_ready'
                });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _c.sent();
                console.error('Failed to fetch Instagram-quality hotel photos:', error_13);
                res.status(500).json({
                    error: 'Failed to fetch Instagram-quality hotel photos',
                    message: error_13 instanceof Error ? error_13.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get photos for a specific hotel
app.get('/api/photos/hotel/:hotelName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelName, _a, city, _b, limit, photos, error_14;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                hotelName = req.params.hotelName;
                _a = req.query, city = _a.city, _b = _a.limit, limit = _b === void 0 ? 6 : _b;
                if (!googlePlacesClient) {
                    return [2 /*return*/, res.status(503).json({
                            error: 'Google Places service not available',
                            message: 'Google Places API key not configured'
                        })];
                }
                if (!city) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'City parameter required',
                            message: 'Please provide city name as query parameter'
                        })];
                }
                console.log("Fetching photos for ".concat(hotelName, " in ").concat(city, "..."));
                return [4 /*yield*/, googlePlacesClient.getSpecificHotelPhotos(hotelName, city, parseInt(limit))];
            case 1:
                photos = _c.sent();
                res.json({
                    hotel: hotelName,
                    city: city,
                    photos: photos,
                    count: photos.length,
                    source: 'google_places'
                });
                return [3 /*break*/, 3];
            case 2:
                error_14 = _c.sent();
                console.error('Failed to fetch hotel photos:', error_14);
                res.status(500).json({
                    error: 'Failed to fetch hotel photos',
                    message: error_14 instanceof Error ? error_14.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Update personalization data (for tracking likes/dislikes)
app.post('/api/personalization', function (req, res) {
    try {
        var _a = req.body, hotelId = _a.hotelId, action = _a.action, country = _a.country, amenityTags = _a.amenityTags;
        // In a real app, this would update user preferences in a database
        // For now, we just return success
        console.log("Personalization update: ".concat(action, " for hotel ").concat(hotelId, " in ").concat(country, " with tags ").concat(amenityTags === null || amenityTags === void 0 ? void 0 : amenityTags.join(', ')));
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
// Calculate personalization score for a hotel
function calculatePersonalizationScore(hotel, personalization) {
    // Base score from rating (if available) or default
    var baseScore = hotel.rating ? hotel.rating / 5 : 0.7;
    // Country affinity score
    var countryScore = personalization.countryAffinity[hotel.country] || 0;
    // Amenity affinity score
    var amenityTags = hotel.amenityTags || [];
    var amenityScore = amenityTags.reduce(function (sum, tag) {
        return sum + (personalization.amenityAffinity[tag] || 0);
    }, 0) / Math.max(amenityTags.length, 1);
    // Seen penalty (should be 0 since we filter out seen hotels, but keeping for completeness)
    var seenPenalty = personalization.seenHotels.has(hotel.id) ? 0.2 : 0;
    // Weighted score calculation (matching the spec)
    var score = 0.6 * baseScore +
        0.25 * Math.min(countryScore, 1) + // Normalize to max 1
        0.15 * Math.min(amenityScore, 1) - // Normalize to max 1
        0.2 * seenPenalty;
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}
// Error handling middleware
app.use(function (error, req, res, next) {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// 404 handler
app.use(function (req, res) {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested endpoint does not exist'
    });
});
// Start server
app.listen(port, function () {
    console.log("\uD83D\uDE80 Glintz API server running on port ".concat(port));
    console.log("\uD83D\uDCCD Health check: http://localhost:".concat(port, "/health"));
    console.log("\uD83C\uDFE8 Seed hotels: POST http://localhost:".concat(port, "/api/seed"));
    console.log("\uD83D\uDD0D Get hotels: GET http://localhost:".concat(port, "/api/hotels"));
    // Check if database is seeded on startup
    database.isSeeded().then(function (seeded) {
        if (!seeded) {
            console.log('\n⚠️  Database not seeded. Call POST /api/seed to populate with hotels.');
        }
    }).catch(function () {
        console.log('\n⚠️  Could not check database status. You may need to seed hotels.');
    });
});
exports.default = app;
