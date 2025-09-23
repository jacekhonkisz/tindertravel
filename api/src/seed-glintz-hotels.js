"use strict";
// Seed Glintz-Curated Hotels
// Add boutique, luxury hotels with high-quality photos
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHOTO_QUALITY_REQUIREMENTS = void 0;
exports.seedGlintzHotels = seedGlintzHotels;
var supabase_1 = require("./supabase");
var google_places_1 = require("./google-places");
var curation_1 = require("./curation");
var GLINTZ_HOTEL_SEEDS = [
    {
        name: "Aman Tokyo",
        city: "Tokyo",
        country: "Japan",
        coords: { lat: 35.6762, lng: 139.7603 },
        price: { amount: "1200", currency: "USD" },
        description: "Urban sanctuary with traditional Japanese aesthetics and panoramic city views from the Otemachi Tower",
        amenityTags: ["city-view", "spa", "fine-dining", "minimalist-design", "luxury-suites", "cultural-immersion"],
        bookingUrl: "https://www.aman.com/resorts/aman-tokyo",
        rating: 4.9,
        searchQuery: "Aman Tokyo luxury hotel Otemachi"
    },
    {
        name: "Rosewood Hong Kong",
        city: "Hong Kong",
        country: "China",
        coords: { lat: 22.2783, lng: 114.1747 },
        price: { amount: "800", currency: "USD" },
        description: "Ultra-modern skyscraper hotel with harbor views and Michelin-starred dining",
        amenityTags: ["harbor-view", "rooftop-bar", "michelin-dining", "infinity-pool", "spa", "contemporary-design"],
        bookingUrl: "https://www.rosewoodhotels.com/hong-kong",
        rating: 4.8,
        searchQuery: "Rosewood Hong Kong luxury hotel Victoria Harbour"
    },
    {
        name: "Hotel Esencia",
        city: "Tulum",
        country: "Mexico",
        coords: { lat: 20.2114, lng: -87.4654 },
        price: { amount: "950", currency: "USD" },
        description: "Beachfront estate with private villas, cenote access, and authentic Mayan wellness experiences",
        amenityTags: ["private-beach", "cenote-access", "spa-sanctuary", "villas", "adults-only", "wellness"],
        bookingUrl: "https://www.hotelesencia.com",
        rating: 4.9,
        searchQuery: "Hotel Esencia Tulum beachfront luxury"
    },
    {
        name: "Singita Sasakwa Lodge",
        city: "Serengeti",
        country: "Tanzania",
        coords: { lat: -2.3333, lng: 34.8333 },
        price: { amount: "2200", currency: "USD" },
        description: "Edwardian-style safari lodge with panoramic Serengeti views and exclusive wildlife experiences",
        amenityTags: ["safari-view", "wildlife-sanctuary", "infinity-pool", "spa", "fine-dining", "private-airstrip"],
        bookingUrl: "https://www.singita.com/lodge/sasakwa",
        rating: 4.9,
        searchQuery: "Singita Sasakwa Lodge Serengeti safari luxury"
    },
    {
        name: "Amangiri",
        city: "Utah",
        country: "United States",
        coords: { lat: 37.0902, lng: -111.9712 },
        price: { amount: "1800", currency: "USD" },
        description: "Desert resort carved into dramatic sandstone formations with spa and adventure experiences",
        amenityTags: ["desert-view", "spa-sanctuary", "adventure-sports", "minimalist-design", "infinity-pool", "stargazing"],
        bookingUrl: "https://www.aman.com/resorts/amangiri",
        rating: 4.8,
        searchQuery: "Amangiri Utah desert luxury resort"
    },
    {
        name: "Nihi Sumba",
        city: "Sumba",
        country: "Indonesia",
        coords: { lat: -9.6492, lng: 119.8492 },
        price: { amount: "1600", currency: "USD" },
        description: "Remote island resort with world-class surfing, private beaches, and authentic Indonesian culture",
        amenityTags: ["private-beach", "surfing", "spa", "cultural-immersion", "infinity-pool", "adventure-sports"],
        bookingUrl: "https://www.nihisumba.com",
        rating: 4.9,
        searchQuery: "Nihi Sumba Indonesia luxury beach resort"
    },
    {
        name: "Borgo Egnazia",
        city: "Puglia",
        country: "Italy",
        coords: { lat: 40.8518, lng: 17.3595 },
        price: { amount: "750", currency: "EUR" },
        description: "Authentic Puglian village resort with traditional architecture, spa, and Mediterranean cuisine",
        amenityTags: ["traditional-architecture", "spa-sanctuary", "golf", "private-beach", "fine-dining", "cultural"],
        bookingUrl: "https://www.borgoegnazia.com",
        rating: 4.8,
        searchQuery: "Borgo Egnazia Puglia Italy luxury resort"
    },
    {
        name: "Cheval Blanc Randheli",
        city: "Maldives",
        country: "Maldives",
        coords: { lat: 5.2164, lng: 73.0992 },
        price: { amount: "2500", currency: "USD" },
        description: "Ultra-luxury overwater villas with private pools, butler service, and pristine coral reefs",
        amenityTags: ["overwater-villa", "private-pool", "butler-service", "spa", "diving-center", "fine-dining"],
        bookingUrl: "https://www.chevalblanc.com/randheli",
        rating: 4.9,
        searchQuery: "Cheval Blanc Randheli Maldives overwater villa"
    },
    {
        name: "Fogo Island Inn",
        city: "Newfoundland",
        country: "Canada",
        coords: { lat: 49.6606, lng: -54.1633 },
        price: { amount: "1100", currency: "CAD" },
        description: "Contemporary architecture on remote island with dramatic ocean views and local cultural immersion",
        amenityTags: ["ocean-view", "contemporary-design", "cultural-immersion", "spa", "fine-dining", "art-gallery"],
        bookingUrl: "https://www.fogoislandinn.ca",
        rating: 4.7,
        searchQuery: "Fogo Island Inn Newfoundland Canada architecture"
    },
    {
        name: "Alila Jabal Akhdar",
        city: "Nizwa",
        country: "Oman",
        coords: { lat: 23.0742, lng: 57.6433 },
        price: { amount: "600", currency: "USD" },
        description: "Mountain resort built into ancient stone terraces with infinity pool and traditional Omani hospitality",
        amenityTags: ["mountain-view", "infinity-pool", "spa", "cultural-immersion", "adventure-sports", "stargazing"],
        bookingUrl: "https://www.alilahotels.com/jabal-akhdar",
        rating: 4.8,
        searchQuery: "Alila Jabal Akhdar Oman mountain resort"
    }
];
function seedGlintzHotels() {
    return __awaiter(this, void 0, void 0, function () {
        var supabaseService, googlePlaces, addedCount, results, _i, GLINTZ_HOTEL_SEEDS_1, hotelSeed, searchResults, photos, rawHotel, curationResult, curatedCard, hotelData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🎯 Starting Glintz Hotel Seeding...');
                    supabaseService = new supabase_1.SupabaseService();
                    googlePlaces = new google_places_1.GooglePlacesClient();
                    addedCount = 0;
                    results = [];
                    _i = 0, GLINTZ_HOTEL_SEEDS_1 = GLINTZ_HOTEL_SEEDS;
                    _a.label = 1;
                case 1:
                    if (!(_i < GLINTZ_HOTEL_SEEDS_1.length)) return [3 /*break*/, 9];
                    hotelSeed = GLINTZ_HOTEL_SEEDS_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    console.log("\n\uD83D\uDCCD Processing: ".concat(hotelSeed.name, " in ").concat(hotelSeed.city));
                    // Search for high-quality photos using Google Places
                    console.log("\uD83D\uDD0D Searching for photos: \"".concat(hotelSeed.searchQuery, "\""));
                    return [4 /*yield*/, googlePlaces.searchHotels(hotelSeed.searchQuery, 1)];
                case 3:
                    searchResults = _a.sent();
                    if (searchResults.length === 0 || searchResults[0].photos.length < 4) {
                        console.log("\u274C Insufficient high-quality photos found");
                        return [3 /*break*/, 8];
                    }
                    photos = searchResults[0].photos.slice(0, 8);
                    console.log("\u2705 Found ".concat(photos.length, " high-quality photos"));
                    rawHotel = {
                        hotel: {
                            hotelId: "glintz-".concat(hotelSeed.name.toLowerCase().replace(/\s+/g, '-')),
                            name: hotelSeed.name,
                            chainCode: undefined,
                            rating: hotelSeed.rating,
                            cityCode: hotelSeed.city.toUpperCase(),
                            latitude: hotelSeed.coords.lat,
                            longitude: hotelSeed.coords.lng
                        },
                        content: {
                            hotelId: "glintz-".concat(hotelSeed.name.toLowerCase().replace(/\s+/g, '-')),
                            name: hotelSeed.name,
                            description: { text: hotelSeed.description, lang: 'en' },
                            amenities: hotelSeed.amenityTags,
                            media: photos.map(function (photo) { return ({
                                uri: photo.url,
                                category: 'EXTERIOR',
                                width: photo.width,
                                height: photo.height
                            }); }),
                            ratings: [{ provider: 'curated', rating: hotelSeed.rating.toString() }]
                        },
                        offers: [{
                                price: {
                                    total: hotelSeed.price.amount,
                                    currency: hotelSeed.price.currency
                                }
                            }]
                    };
                    return [4 /*yield*/, (0, curation_1.glintzCurate)([rawHotel])];
                case 4:
                    curationResult = _a.sent();
                    if (curationResult.cards.length === 0) {
                        console.log("\u274C Hotel failed Glintz curation pipeline");
                        return [3 /*break*/, 8];
                    }
                    curatedCard = curationResult.cards[0];
                    console.log("\uD83C\uDFAF Glintz Score: ".concat((curatedCard.score.total * 100).toFixed(1), "%"));
                    console.log("\uD83C\uDFF7\uFE0F  Tags: ".concat(curatedCard.tags.map(function (t) { return t.label; }).join(', ')));
                    hotelData = {
                        id: curatedCard.id,
                        name: curatedCard.name,
                        city: curatedCard.city,
                        country: curatedCard.country,
                        coords: curatedCard.coords,
                        price: curatedCard.price,
                        description: curatedCard.description,
                        amenity_tags: curatedCard.tags.map(function (tag) { return tag.label; }),
                        photos: curatedCard.photos,
                        hero_photo: curatedCard.heroPhoto,
                        booking_url: hotelSeed.bookingUrl,
                        rating: curatedCard.rating || hotelSeed.rating
                    };
                    return [4 /*yield*/, supabaseService.insertHotels([hotelData])];
                case 5:
                    _a.sent();
                    addedCount++;
                    console.log("\u2705 Added to database: ".concat(curatedCard.name));
                    results.push({
                        name: curatedCard.name,
                        city: curatedCard.city,
                        country: curatedCard.country,
                        score: curatedCard.score.total,
                        tags: curatedCard.tags.map(function (t) { return t.label; }),
                        photoCount: curatedCard.photos.length
                    });
                    // Rate limiting - wait between requests
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 6:
                    // Rate limiting - wait between requests
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error("\u274C Error processing ".concat(hotelSeed.name, ":"), error_1);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9:
                    console.log("\n\uD83C\uDF89 Glintz Hotel Seeding Complete!");
                    console.log("\uD83D\uDCCA Added ".concat(addedCount, " hotels out of ").concat(GLINTZ_HOTEL_SEEDS.length, " candidates"));
                    if (results.length > 0) {
                        console.log('\n🏆 Successfully Added Hotels:');
                        results.forEach(function (hotel) {
                            console.log("  \u2022 ".concat(hotel.name, ", ").concat(hotel.city, " - Score: ").concat((hotel.score * 100).toFixed(1), "% - ").concat(hotel.photoCount, " photos"));
                            console.log("    Tags: ".concat(hotel.tags.join(', ')));
                        });
                    }
                    return [2 /*return*/, results];
            }
        });
    });
}
// Photo quality requirements for Glintz curation
exports.PHOTO_QUALITY_REQUIREMENTS = {
    minPhotos: 4,
    maxPhotos: 8,
    minWidth: 1200,
    minHeight: 800,
    preferredTypes: ['exterior', 'interior', 'amenity', 'view'],
    aspectRatios: {
        landscape: { min: 1.2, max: 2.0 }, // 6:5 to 2:1
        portrait: { min: 0.7, max: 0.9 } // 7:10 to 9:10
    }
};
if (require.main === module) {
    seedGlintzHotels()
        .then(function () { return process.exit(0); })
        .catch(function (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
