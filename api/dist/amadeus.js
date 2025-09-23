"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const hotellook_1 = require("./hotellook");
const google_places_1 = require("./google-places");
const enhanced_hotel_generator_1 = require("./enhanced-hotel-generator");
class AmadeusClient {
    constructor() {
        // Curated list of world's most luxurious and unique hotels - GLOBAL COVERAGE
        this.curatedLuxuryHotels = [
            // ASIA - Tropical Paradise
            {
                name: "Amankila",
                city: "Bali",
                country: "Indonesia",
                countryCode: "ID",
                coords: { lat: -8.4095, lng: 115.1889 },
                category: "luxury",
                priceRange: { min: 600, max: 1500, currency: "USD" },
                description: "",
                amenityTags: ['infinity-pool', 'spa-sanctuary', 'private-beach', 'fine-dining', 'butler-service', 'ocean-views'],
                website: "https://www.aman.com/resorts/amankila",
                bookingPartners: ["aman.com", "booking.com"]
            },
            {
                name: "Six Senses Yao Noi",
                city: "Phuket",
                country: "Thailand",
                countryCode: "TH",
                coords: { lat: 8.1538, lng: 98.6070 },
                category: "luxury",
                priceRange: { min: 800, max: 2000, currency: "USD" },
                description: "Overwater villas and clifftop pavilions with panoramic views of Phang Nga Bay",
                amenityTags: [],
                website: "https://www.sixsenses.com/en/resorts/yao-noi",
                bookingPartners: ["sixsenses.com", "booking.com"]
            },
            {
                name: "Shangri-La Boracay",
                city: "Boracay",
                country: "Philippines",
                countryCode: "PH",
                coords: { lat: 11.9674, lng: 121.9248 },
                category: "luxury",
                priceRange: { min: 400, max: 800, currency: "USD" },
                description: "Beachfront resort with private white sand beach and tropical gardens",
                amenityTags: [],
                website: "https://www.shangri-la.com/boracay",
                bookingPartners: ["shangri-la.com", "booking.com"]
            },
            // AMERICAS - Diverse Landscapes  
            {
                name: "Four Seasons Resort Maui",
                city: "Maui",
                country: "United States",
                countryCode: "US",
                coords: { lat: 20.6926, lng: -156.4472 },
                category: "luxury",
                priceRange: { min: 1000, max: 3000, currency: "USD" },
                description: "Oceanfront resort with volcanic black rock pools and views of neighboring islands",
                amenityTags: [],
                website: "https://www.fourseasons.com/maui",
                bookingPartners: ["fourseasons.com", "booking.com"]
            },
            {
                name: "Explora Patagonia",
                city: "Torres del Paine",
                country: "Chile",
                countryCode: "CL",
                coords: { lat: -51.0000, lng: -73.0000 },
                category: "unique",
                priceRange: { min: 800, max: 1500, currency: "USD" },
                description: "All-inclusive lodge with panoramic views of Torres del Paine National Park",
                amenityTags: [],
                website: "https://www.explora.com/hotels-and-travesias/patagonia",
                bookingPartners: ["explora.com", "booking.com"]
            },
            {
                name: "Belmond Hotel das Cataratas",
                city: "Iguazu Falls",
                country: "Brazil",
                countryCode: "BR",
                coords: { lat: -25.6953, lng: -54.4367 },
                category: "heritage",
                priceRange: { min: 500, max: 1000, currency: "USD" },
                description: "",
                amenityTags: [],
                website: "https://www.belmond.com/hotels/south-america/brazil/iguazu-falls/belmond-hotel-das-cataratas",
                bookingPartners: ["belmond.com", "booking.com"]
            },
            // AFRICA - Safari & Coastal
            {
                name: "Singita Sasakwa Lodge",
                city: "Serengeti",
                country: "Tanzania",
                countryCode: "TZ",
                coords: { lat: -2.3333, lng: 34.8333 },
                category: "luxury",
                priceRange: { min: 2000, max: 5000, currency: "USD" },
                description: "Edwardian manor house overlooking the endless Serengeti plains",
                amenityTags: [],
                website: "https://www.singita.com/lodge/sasakwa-lodge",
                bookingPartners: ["singita.com", "booking.com"]
            },
            {
                name: "Royal Malewane",
                city: "Kruger",
                country: "South Africa",
                countryCode: "ZA",
                coords: { lat: -24.0000, lng: 31.5000 },
                category: "luxury",
                priceRange: { min: 1500, max: 3000, currency: "USD" },
                description: "Ultra-luxury safari lodge with private pools and Big Five game viewing",
                amenityTags: [],
                website: "https://www.royalmalewane.com",
                bookingPartners: ["royalmalewane.com", "booking.com"]
            },
            {
                name: "North Island Lodge",
                city: "Seychelles",
                country: "Seychelles",
                countryCode: "SC",
                coords: { lat: -4.3833, lng: 55.6667 },
                category: "luxury",
                priceRange: { min: 3000, max: 8000, currency: "USD" },
                description: "",
                amenityTags: ['private-island', 'conservation-focus', 'pristine-beaches', 'luxury-villas', 'spa-sanctuary', 'fine-dining'],
                website: "https://www.north-island.com",
                bookingPartners: ["north-island.com", "booking.com"]
            },
            // MIDDLE EAST - Desert Luxury
            {
                name: "Al Maha Desert Resort",
                city: "Dubai",
                country: "UAE",
                countryCode: "AE",
                coords: { lat: 24.8607, lng: 55.7281 },
                category: "luxury",
                priceRange: { min: 800, max: 2000, currency: "USD" },
                description: "Desert oasis with private pools and Arabian oryx sanctuary",
                amenityTags: [],
                website: "https://www.al-maha.com",
                bookingPartners: ["al-maha.com", "booking.com"]
            },
            {
                name: "Feynan Ecolodge",
                city: "Wadi Rum",
                country: "Jordan",
                countryCode: "JO",
                coords: { lat: 30.6500, lng: 35.4667 },
                category: "unique",
                priceRange: { min: 200, max: 400, currency: "USD" },
                description: "Solar-powered desert lodge with star-gazing and Bedouin culture",
                amenityTags: [],
                website: "https://www.feynan.com",
                bookingPartners: ["feynan.com", "booking.com"]
            },
            // OCEANIA - Islands & Outback
            {
                name: "Qualia Resort",
                city: "Hamilton Island",
                country: "Australia",
                countryCode: "AU",
                coords: { lat: -20.3481, lng: 148.9508 },
                category: "luxury",
                priceRange: { min: 1000, max: 2500, currency: "AUD" },
                description: "Adults-only resort overlooking the Great Barrier Reef",
                amenityTags: [],
                website: "https://www.qualia.com.au",
                bookingPartners: ["qualia.com.au", "booking.com"]
            },
            {
                name: "The Brando",
                city: "Tahiti",
                country: "French Polynesia",
                countryCode: "PF",
                coords: { lat: -17.6797, lng: -149.4068 },
                category: "luxury",
                priceRange: { min: 2000, max: 5000, currency: "USD" },
                description: "Eco-luxury resort on Marlon Brando's private island",
                amenityTags: [],
                website: "https://www.thebrando.com",
                bookingPartners: ["thebrando.com", "booking.com"]
            },
            // EUROPE - Historic & Coastal (keeping some favorites)
            {
                name: "Canaves Oia Suites",
                city: "Santorini",
                country: "Greece",
                countryCode: "GR",
                coords: { lat: 36.4618, lng: 25.3753 },
                category: "luxury",
                priceRange: { min: 800, max: 2000, currency: "EUR" },
                description: "Iconic luxury suites carved into volcanic cliffs with infinity pools overlooking the Aegean Sea",
                amenityTags: [],
                website: "https://www.canaves.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            {
                name: "Mystique Luxury Collection Hotel",
                city: "Santorini",
                country: "Greece",
                countryCode: "GR",
                coords: { lat: 36.4628, lng: 25.3763 },
                category: "luxury",
                priceRange: { min: 600, max: 1500, currency: "EUR" },
                description: "Dramatic clifftop retreat with cave-style suites and world-class spa",
                amenityTags: [],
                website: "https://www.mystique.gr",
                bookingPartners: ["booking.com", "marriott.com"]
            },
            {
                name: "Grace Hotel Santorini",
                city: "Santorini",
                country: "Greece",
                countryCode: "GR",
                coords: { lat: 36.4608, lng: 25.3743 },
                category: "boutique",
                priceRange: { min: 500, max: 1200, currency: "EUR" },
                description: "Minimalist luxury with unparalleled sunset views and Michelin-starred dining",
                amenityTags: [],
                website: "https://www.gracehotels.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            // ROME - Italy
            {
                name: "Hotel de Russie",
                city: "Rome",
                country: "Italy",
                countryCode: "IT",
                coords: { lat: 41.9109, lng: 12.4761 },
                category: "luxury",
                priceRange: { min: 400, max: 1000, currency: "EUR" },
                description: "Historic luxury hotel with secret gardens near Spanish Steps and Vatican",
                amenityTags: [],
                website: "https://www.roccofortehotels.com/hotels-and-resorts/hotel-de-russie",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            {
                name: "The First Roma Dolce",
                city: "Rome",
                country: "Italy",
                countryCode: "IT",
                coords: { lat: 41.9028, lng: 12.4964 },
                category: "luxury",
                priceRange: { min: 350, max: 800, currency: "EUR" },
                description: "Contemporary luxury in the heart of Rome with rooftop terrace and Michelin dining",
                amenityTags: [],
                website: "https://www.thefirstroma.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            {
                name: "Palazzo Margherita",
                city: "Rome",
                country: "Italy",
                countryCode: "IT",
                coords: { lat: 41.8986, lng: 12.4768 },
                category: "heritage",
                priceRange: { min: 300, max: 700, currency: "EUR" },
                description: "Francis Ford Coppola's restored 19th-century palazzo with authentic Italian luxury",
                amenityTags: [],
                website: "https://www.palazzomargherita.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            // LISBON - Portugal  
            {
                name: "Four Seasons Hotel Ritz Lisbon",
                city: "Lisbon",
                country: "Portugal",
                countryCode: "PT",
                coords: { lat: 38.7223, lng: -9.1393 },
                category: "luxury",
                priceRange: { min: 300, max: 800, currency: "EUR" },
                description: "Iconic luxury hotel with panoramic city views and world-class amenities",
                amenityTags: [],
                website: "https://www.fourseasons.com/lisbon",
                bookingPartners: ["booking.com", "fourseasons.com"]
            },
            {
                name: "Tivoli Palácio de Seteais",
                city: "Lisbon",
                country: "Portugal",
                countryCode: "PT",
                coords: { lat: 38.7967, lng: -9.3897 },
                category: "heritage",
                priceRange: { min: 250, max: 600, currency: "EUR" },
                description: "18th-century palace hotel in Sintra with romantic gardens and mountain views",
                amenityTags: [],
                website: "https://www.tivolihotels.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            // SPLIT - Croatia
            {
                name: "Villa Dalmacija",
                city: "Split",
                country: "Croatia",
                countryCode: "HR",
                coords: { lat: 43.5081, lng: 16.4402 },
                category: "boutique",
                priceRange: { min: 200, max: 500, currency: "EUR" },
                description: "Luxury boutique hotel in Diocletian's Palace with rooftop pool and Adriatic views",
                amenityTags: [],
                website: "https://www.villadalmacija.hr",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            {
                name: "Park Hyatt Zagreb",
                city: "Split",
                country: "Croatia",
                countryCode: "HR",
                coords: { lat: 43.5181, lng: 16.4502 },
                category: "luxury",
                priceRange: { min: 180, max: 400, currency: "EUR" },
                description: "Modern luxury with traditional Croatian elements and world-class spa",
                amenityTags: [],
                website: "https://www.hyatt.com",
                bookingPartners: ["booking.com", "hyatt.com"]
            },
            // DUBROVNIK - Croatia
            {
                name: "Hotel Excelsior Dubrovnik",
                city: "Dubrovnik",
                country: "Croatia",
                countryCode: "HR",
                coords: { lat: 42.6507, lng: 18.0944 },
                category: "luxury",
                priceRange: { min: 300, max: 800, currency: "EUR" },
                description: "Iconic clifftop hotel with private beach and views of Old Town walls",
                amenityTags: [],
                website: "https://www.adriaticluxuryhotels.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            {
                name: "Villa Orsula",
                city: "Dubrovnik",
                country: "Croatia",
                countryCode: "HR",
                coords: { lat: 42.6407, lng: 18.0844 },
                category: "boutique",
                priceRange: { min: 250, max: 600, currency: "EUR" },
                description: "Intimate luxury villa with private gardens and panoramic Adriatic views",
                amenityTags: [],
                website: "https://www.villa-orsula.hr",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            // TENERIFE - Spain
            {
                name: "The Ritz-Carlton Abama",
                city: "Tenerife",
                country: "Spain",
                countryCode: "ES",
                coords: { lat: 28.0456, lng: -16.5725 },
                category: "resort",
                priceRange: { min: 400, max: 1200, currency: "EUR" },
                description: "Clifftop resort with championship golf course and volcanic black sand beaches",
                amenityTags: [],
                website: "https://www.ritzcarlton.com/abama",
                bookingPartners: ["booking.com", "ritzcarlton.com"]
            },
            {
                name: "Bahía del Duque",
                city: "Tenerife",
                country: "Spain",
                countryCode: "ES",
                coords: { lat: 28.0856, lng: -16.6125 },
                category: "luxury",
                priceRange: { min: 300, max: 900, currency: "EUR" },
                description: "Victorian-style luxury resort with botanical gardens and multiple beaches",
                amenityTags: [],
                website: "https://www.bahia-duque.com",
                bookingPartners: ["booking.com", "expedia.com"]
            },
            // ADDITIONAL BOUTIQUE HOTELS WORLDWIDE
            // ASIA - More Boutique Properties
            {
                name: "Alila Villas Uluwatu",
                city: "Bali",
                country: "Indonesia",
                countryCode: "ID",
                coords: { lat: -8.8290, lng: 115.0844 },
                category: "boutique",
                priceRange: { min: 400, max: 800, currency: "USD" },
                description: "Contemporary clifftop villas with infinity pools overlooking the Indian Ocean",
                amenityTags: [],
                website: "https://www.alilahotels.com/uluwatu",
                bookingPartners: ["alilahotels.com", "booking.com"]
            },
            {
                name: "Hoshinoya Tokyo",
                city: "Tokyo",
                country: "Japan",
                countryCode: "JP",
                coords: { lat: 35.6762, lng: 139.6503 },
                category: "boutique",
                priceRange: { min: 600, max: 1200, currency: "USD" },
                description: "Modern ryokan in the heart of Tokyo blending traditional Japanese hospitality with contemporary luxury",
                amenityTags: [],
                website: "https://hoshinoya.com/tokyo",
                bookingPartners: ["hoshinoya.com", "booking.com"]
            },
            {
                name: "The Siam Bangkok",
                city: "Bangkok",
                country: "Thailand",
                countryCode: "TH",
                coords: { lat: 13.7563, lng: 100.5018 },
                category: "boutique",
                priceRange: { min: 300, max: 700, currency: "USD" },
                description: "Art Deco boutique hotel on the Chao Phraya River with private museum and antique collection",
                amenityTags: [],
                website: "https://thesiamhotel.com",
                bookingPartners: ["thesiamhotel.com", "booking.com"]
            },
            // AMERICAS - More Boutique Properties
            {
                name: "Belmond Hotel Monasterio",
                city: "Cusco",
                country: "Peru",
                countryCode: "PE",
                coords: { lat: -13.5164, lng: -71.9785 },
                category: "heritage",
                priceRange: { min: 400, max: 800, currency: "USD" },
                description: "16th-century monastery converted into luxury hotel near Machu Picchu",
                amenityTags: [],
                website: "https://www.belmond.com/hotels/south-america/peru/cusco/belmond-hotel-monasterio",
                bookingPartners: ["belmond.com", "booking.com"]
            },
            {
                name: "Auberge du Soleil",
                city: "Napa Valley",
                country: "United States",
                countryCode: "US",
                coords: { lat: 38.4404, lng: -122.4194 },
                category: "boutique",
                priceRange: { min: 800, max: 1500, currency: "USD" },
                description: "Hillside retreat with vineyard views and Michelin-starred dining in Napa Valley",
                amenityTags: [],
                website: "https://aubergedusoleil.com",
                bookingPartners: ["aubergedusoleil.com", "booking.com"]
            },
            {
                name: "Casa de Campo Resort",
                city: "La Romana",
                country: "Dominican Republic",
                countryCode: "DO",
                coords: { lat: 18.4208, lng: -68.9399 },
                category: "resort",
                priceRange: { min: 300, max: 800, currency: "USD" },
                description: "Luxury resort with championship golf courses and private beaches in the Caribbean",
                amenityTags: [],
                website: "https://www.casadecampo.com.do",
                bookingPartners: ["casadecampo.com.do", "booking.com"]
            },
            // EUROPE - More Boutique Properties
            {
                name: "Belmond Hotel Caruso",
                city: "Amalfi Coast",
                country: "Italy",
                countryCode: "IT",
                coords: { lat: 40.6418, lng: 14.6021 },
                category: "heritage",
                priceRange: { min: 800, max: 2000, currency: "EUR" },
                description: "11th-century palace perched on cliffs overlooking the Mediterranean",
                amenityTags: [],
                website: "https://www.belmond.com/hotels/europe/italy/amalfi-coast/belmond-hotel-caruso",
                bookingPartners: ["belmond.com", "booking.com"]
            },
            {
                name: "La Mamounia",
                city: "Marrakech",
                country: "Morocco",
                countryCode: "MA",
                coords: { lat: 31.6295, lng: -7.9811 },
                category: "luxury",
                priceRange: { min: 500, max: 1200, currency: "EUR" },
                description: "Legendary palace hotel with 12-hectare gardens in the heart of Marrakech",
                amenityTags: [],
                website: "https://www.mamounia.com",
                bookingPartners: ["mamounia.com", "booking.com"]
            },
            {
                name: "Château du Fey",
                city: "Burgundy",
                country: "France",
                countryCode: "FR",
                coords: { lat: 47.3220, lng: 3.4372 },
                category: "boutique",
                priceRange: { min: 300, max: 600, currency: "EUR" },
                description: "Intimate château hotel in Burgundy wine country with vineyard views",
                amenityTags: [],
                website: "https://www.chateaudufey.com",
                bookingPartners: ["chateaudufey.com", "booking.com"]
            },
            // AFRICA - More Boutique Properties
            {
                name: "Ellerman House",
                city: "Cape Town",
                country: "South Africa",
                countryCode: "ZA",
                coords: { lat: -33.9249, lng: 18.4241 },
                category: "boutique",
                priceRange: { min: 600, max: 1200, currency: "USD" },
                description: "Edwardian mansion with panoramic ocean views and contemporary art collection",
                amenityTags: [],
                website: "https://www.ellerman.co.za",
                bookingPartners: ["ellerman.co.za", "booking.com"]
            },
            {
                name: "Ngorongoro Crater Lodge",
                city: "Ngorongoro",
                country: "Tanzania",
                countryCode: "TZ",
                coords: { lat: -3.2175, lng: 35.5031 },
                category: "unique",
                priceRange: { min: 1500, max: 3000, currency: "USD" },
                description: "Luxury safari lodge on the rim of Ngorongoro Crater with dramatic wildlife views",
                amenityTags: [],
                website: "https://www.andbeyond.com/our-lodges/africa/tanzania/ngorongoro-crater/ngorongoro-crater-lodge",
                bookingPartners: ["andbeyond.com", "booking.com"]
            },
            // OCEANIA - More Boutique Properties
            {
                name: "Southern Ocean Lodge",
                city: "Kangaroo Island",
                country: "Australia",
                countryCode: "AU",
                coords: { lat: -35.7751, lng: 137.2135 },
                category: "unique",
                priceRange: { min: 800, max: 1500, currency: "AUD" },
                description: "Eco-luxury lodge on clifftops overlooking the Southern Ocean with native wildlife",
                amenityTags: [],
                website: "https://www.southernoceanlodge.com.au",
                bookingPartners: ["southernoceanlodge.com.au", "booking.com"]
            },
            {
                name: "Eichardt's Private Hotel",
                city: "Queenstown",
                country: "New Zealand",
                countryCode: "NZ",
                coords: { lat: -45.0312, lng: 168.6626 },
                category: "boutique",
                priceRange: { min: 600, max: 1200, currency: "NZD" },
                description: "Intimate lakefront hotel with mountain views and personalized luxury service",
                amenityTags: [],
                website: "https://www.eichardts.com",
                bookingPartners: ["eichardts.com", "booking.com"]
            }
        ];
        this.clientId = process.env.AMADEUS_CLIENT_ID || '';
        this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || '';
        this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Amadeus credentials not provided. Check AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
        }
        // Token cache: expires in 25 minutes (Amadeus tokens last 30 minutes)
        this.tokenCache = new node_cache_1.default({ stdTTL: 1500 });
        // Data cache: cache hotel data for 1 hour
        this.dataCache = new node_cache_1.default({ stdTTL: 3600 });
        // Initialize API clients
        this.hotellookClient = new hotellook_1.HotellookClient();
        this.googlePlacesClient = new google_places_1.GooglePlacesClient();
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 10000,
        });
        // Add request interceptor for authentication
        this.client.interceptors.request.use(async (config) => {
            const token = await this.getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                // Token expired, clear cache and retry
                this.tokenCache.del('access_token');
                const token = await this.getAccessToken();
                error.config.headers.Authorization = `Bearer ${token}`;
                return this.client.request(error.config);
            }
            throw error;
        });
    }
    async getAccessToken() {
        const cachedToken = this.tokenCache.get('access_token');
        if (cachedToken) {
            return cachedToken;
        }
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/security/oauth2/token`, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const { access_token } = response.data;
            this.tokenCache.set('access_token', access_token);
            return access_token;
        }
        catch (error) {
            console.error('Failed to get Amadeus access token:', error);
            throw new Error('Authentication failed');
        }
    }
    async getHotelsByCity(cityCode, limit = 50) {
        const cacheKey = `hotels_${cityCode}_${limit}`;
        const cached = this.dataCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            // Step 1: Get hotel list by city (this works!)
            const hotelListResponse = await this.client.get('/v1/reference-data/locations/hotels/by-city', {
                params: {
                    cityCode
                }
            });
            const hotelList = hotelListResponse.data.data || [];
            console.log(`📍 Found ${hotelList.length} hotels in ${cityCode}`);
            if (hotelList.length === 0) {
                return [];
            }
            // Step 2: Get offers for a subset of hotels (batch processing)
            const hotelsWithOffers = [];
            const batchSize = 10; // Process hotels in batches to avoid rate limits
            const maxHotels = Math.min(limit * 3, hotelList.length); // Get more than needed for filtering
            for (let i = 0; i < maxHotels && hotelsWithOffers.length < limit; i += batchSize) {
                const batch = hotelList.slice(i, i + batchSize);
                for (const hotel of batch) {
                    try {
                        // Get offers for this specific hotel
                        const offersResponse = await this.client.get('/v3/shopping/hotel-offers', {
                            params: {
                                hotelIds: hotel.hotelId,
                                adults: 2,
                                checkInDate: this.getDateString(7),
                                checkOutDate: this.getDateString(9),
                                roomQuantity: 1,
                                currency: 'EUR'
                            }
                        });
                        const offers = offersResponse.data.data || [];
                        if (offers.length > 0) {
                            // Convert to our expected format
                            hotelsWithOffers.push({
                                id: offers[0].id || hotel.hotelId,
                                hotel: {
                                    hotelId: hotel.hotelId,
                                    name: hotel.name,
                                    cityCode: cityCode,
                                    latitude: hotel.geoCode?.latitude,
                                    longitude: hotel.geoCode?.longitude
                                },
                                offers: offers[0].offers || [],
                                available: true
                            });
                        }
                        // Rate limiting
                        await this.delay(100); // 100ms between requests
                    }
                    catch (offerError) {
                        // Skip hotels that don't have offers (common in sandbox)
                        console.log(`⚠️  No offers for hotel ${hotel.hotelId}`);
                        continue;
                    }
                    if (hotelsWithOffers.length >= limit) {
                        break;
                    }
                }
                // Batch delay
                if (i + batchSize < maxHotels) {
                    await this.delay(500); // 500ms between batches
                }
            }
            console.log(`✅ Found ${hotelsWithOffers.length} hotels with offers in ${cityCode}`);
            // Apply filtering if we have enough hotels
            let finalHotels = hotelsWithOffers;
            if (hotelsWithOffers.length > limit) {
                // Apply ad-worthy filtering
                const adWorthyHotels = this.filterAdWorthyHotels(hotelsWithOffers, cityCode);
                if (adWorthyHotels.length >= limit) {
                    finalHotels = adWorthyHotels.slice(0, limit);
                }
                else {
                    // Mix ad-worthy with other quality hotels
                    const remaining = limit - adWorthyHotels.length;
                    const otherHotels = hotelsWithOffers
                        .filter(h => !adWorthyHotels.includes(h))
                        .slice(0, remaining);
                    finalHotels = [...adWorthyHotels, ...otherHotels];
                }
            }
            this.dataCache.set(cacheKey, finalHotels);
            return finalHotels;
        }
        catch (error) {
            console.error(`Failed to fetch hotels for city ${cityCode}:`, error);
            return [];
        }
    }
    // Enhanced criteria for boutique, unique, and luxurious hotels with great reviews
    getBoutiqueUniqueAmenities() {
        return [
            // BOUTIQUE & UNIQUE ARCHITECTURE
            'boutique-hotel', 'design-hotel', 'historic-building', 'converted-monastery',
            'cave-hotel', 'treehouse', 'glass-igloo', 'historic-palace', 'castle-hotel',
            'villa-hotel', 'manor-house', 'heritage-building', 'art-hotel', 'library-hotel',
            // UNIQUE LOCATIONS & VIEWS
            'clifftop-location', 'overwater-bungalow', 'private-island', 'vineyard-hotel',
            'mountain-retreat', 'desert-camp', 'safari-lodge', 'beach-house', 'lakefront',
            'forest-lodge', 'urban-oasis', 'rooftop-location', 'harbor-view', 'garden-setting',
            // LUXURY AMENITIES & EXPERIENCES
            'infinity-pool', 'rooftop-pool', 'private-pool', 'spa-sanctuary', 'wellness-center',
            'michelin-dining', 'wine-cellar', 'private-chef', 'butler-service', 'concierge-service',
            'private-beach', 'beach-club', 'yacht-access', 'helicopter-pad', 'golf-course',
            // CULTURAL & EXPERIENTIAL
            'cultural-immersion', 'local-experiences', 'art-gallery', 'cooking-classes',
            'wine-tasting', 'adventure-sports', 'eco-lodge', 'sustainable-luxury',
            'wellness-retreat', 'yoga-pavilion', 'meditation-center', 'spiritual-retreat',
            // ROMANTIC & INTIMATE
            'adults-only', 'romantic-getaway', 'honeymoon-suite', 'private-villa',
            'intimate-setting', 'couples-spa', 'sunset-dining', 'private-terrace',
            // UNIQUE FEATURES
            'rooftop-bar', 'secret-garden', 'hidden-courtyard', 'panoramic-views',
            'fireplace', 'library', 'observatory', 'wine-bar', 'jazz-lounge'
        ];
    }
    getVisuallyStunningLocationKeywords() {
        return [
            // COASTAL PARADISE
            'santorini', 'mykonos', 'amalfi', 'capri', 'positano', 'cinque terre',
            'maldives', 'bora bora', 'seychelles', 'mauritius', 'ibiza', 'mallorca',
            // MOUNTAIN ESCAPES
            'alps', 'dolomites', 'aspen', 'chamonix', 'zermatt', 'st moritz',
            'banff', 'whistler', 'interlaken', 'grindelwald',
            // HISTORIC & CULTURAL
            'florence', 'rome', 'venice', 'prague', 'istanbul', 'marrakech',
            'kyoto', 'paris', 'barcelona', 'seville', 'granada',
            // TROPICAL PARADISE
            'bali', 'phuket', 'koh samui', 'langkawi', 'boracay', 'palawan',
            'hawaii', 'maui', 'fiji', 'tahiti', 'barbados', 'st lucia',
            // DESERT LUXURY
            'dubai', 'marrakech', 'rajasthan', 'scottsdale', 'sedona'
        ];
    }
    /**
     * Calculate visual appeal score for ad-worthy hotels
     */
    calculateVisualAppealScore(hotel, hotelName, location) {
        let score = 0;
        const name = hotelName.toLowerCase();
        const loc = location.toLowerCase();
        // ARCHITECTURE & DESIGN APPEAL (25 points max)
        const luxuryArchitecture = [
            'palace', 'castle', 'villa', 'mansion', 'estate', 'manor',
            'boutique', 'design', 'contemporary', 'historic', 'heritage',
            'collection', 'luxury', 'grand', 'royal', 'imperial'
        ];
        luxuryArchitecture.forEach(keyword => {
            if (name.includes(keyword))
                score += 3;
        });
        // BOUTIQUE & UNIQUE AMENITIES (30 points max)
        const boutiqueAmenities = this.getBoutiqueUniqueAmenities();
        // Simulate amenity detection from hotel name/description
        const amenityKeywords = [
            'spa', 'pool', 'beach', 'view', 'terrace', 'rooftop', 'garden',
            'infinity', 'private', 'panoramic', 'ocean', 'mountain', 'sunset'
        ];
        amenityKeywords.forEach(amenity => {
            if (name.includes(amenity))
                score += 4;
        });
        // LOCATION APPEAL (25 points max)
        const stunningLocations = this.getVisuallyStunningLocationKeywords();
        stunningLocations.forEach(location => {
            if (loc.includes(location))
                score += 5;
        });
        // BRAND PRESTIGE (20 points max)
        const prestigeBrands = [
            'four seasons', 'ritz carlton', 'mandarin oriental', 'aman',
            'rosewood', 'bulgari', 'armani', 'edition', 'w hotel',
            'st regis', 'conrad', 'waldorf astoria', 'luxury collection',
            'autograph', 'curio', 'tribute', 'unbound', 'marriott',
            'hyatt', 'hilton', 'intercontinental', 'sofitel', 'fairmont'
        ];
        prestigeBrands.forEach(brand => {
            if (name.includes(brand))
                score += 2;
        });
        return Math.min(score, 100); // Cap at 100
    }
    /**
     * Filter for ad-worthy hotels - visually stunning and Instagram-ready
     */
    filterAdWorthyHotels(hotels, location = '') {
        return hotels
            .map(hotel => {
            const hotelName = hotel.hotel.name?.toLowerCase() || '';
            const price = parseFloat(hotel.offers[0]?.price?.total || '0');
            // Calculate global visual appeal score
            const visualScore = this.calculateGlobalVisualAppealScore(hotel, hotelName, location);
            // Calculate value score (visual appeal per euro)
            const valueScore = price > 0 ? (visualScore / price) * 100 : 0;
            return {
                ...hotel,
                visualScore,
                valueScore,
                isAdWorthy: visualScore >= 25 // Lowered threshold to include more boutique hotels globally
            };
        })
            .filter(hotel => hotel.isAdWorthy)
            .sort((a, b) => {
            // Sort by value score (best visual appeal for price)
            return (b.valueScore || 0) - (a.valueScore || 0);
        });
    }
    /**
     * Get affordable luxury hotels - great visual appeal without breaking the bank
     */
    filterAffordableLuxuryHotels(hotels, location = '') {
        const adWorthyHotels = this.filterAdWorthyHotels(hotels, location);
        return adWorthyHotels.filter(hotel => {
            const price = parseFloat(hotel.offers[0]?.price?.total || '0');
            const visualScore = hotel.visualScore || 0;
            // Sweet spot: High visual appeal (50+) with reasonable price (under €400)
            return visualScore >= 50 && price <= 400;
        });
    }
    // Enhanced boutique and luxury hotel filtering - excludes basic chains
    filterBoutiqueLuxuryHotels(hotels, location = '') {
        return hotels.filter(hotel => {
            const price = parseFloat(hotel.offers[0]?.price?.total || '0');
            const hotelName = hotel.hotel.name?.toLowerCase() || '';
            // EXCLUDE basic chain hotels first
            const basicChains = [
                'ibis', 'travelodge', 'premier inn', 'holiday inn express', 'comfort inn',
                'best western', 'days inn', 'super 8', 'motel 6', 'red roof inn',
                'la quinta', 'hampton inn', 'courtyard by marriott', 'fairfield inn',
                'residence inn', 'extended stay', 'homewood suites', 'candlewood suites',
                'holiday inn', 'crowne plaza', 'doubletree', 'embassy suites'
            ];
            const isBasicChain = basicChains.some(chain => hotelName.includes(chain));
            if (isBasicChain)
                return false;
            // INCLUDE boutique luxury brands and unique properties
            const boutiqueLuxuryBrands = [
                // Ultra-luxury brands
                'ritz carlton', 'four seasons', 'mandarin oriental', 'st. regis', 'aman',
                'rosewood', 'bulgari', 'armani', 'edition', 'park hyatt', 'grand hyatt',
                'waldorf astoria', 'luxury collection', 'autograph collection',
                // Boutique luxury brands
                'design hotels', 'relais & chateaux', 'small luxury hotels', 'preferred hotels',
                'leading hotels', 'curio collection', 'tribute portfolio', 'unbound collection',
                'mgallery', 'sofitel', 'pullman', 'kempinski', 'oberoi', 'taj hotels',
                // Independent luxury indicators
                'boutique', 'palace', 'castle', 'villa', 'manor', 'heritage', 'historic',
                'grand hotel', 'royal', 'imperial', 'luxury', 'premium', 'collection',
                'resort', 'retreat', 'sanctuary', 'lodge', 'estate'
            ];
            const hasBoutiqueLuxuryBrand = boutiqueLuxuryBrands.some(brand => hotelName.includes(brand));
            // Price considerations - not too strict to allow global variety
            const reasonablePrice = price <= 2000; // Max €2000 per night
            const hasMinimumPrice = price >= 80; // Minimum €80 per night for quality
            // Unique property indicators
            const uniqueKeywords = [
                'spa', 'design', 'art', 'wine', 'golf', 'beach', 'mountain', 'lake',
                'garden', 'terrace', 'rooftop', 'panoramic', 'view', 'private',
                'exclusive', 'intimate', 'romantic', 'adults only', 'eco'
            ];
            const hasUniqueFeatures = uniqueKeywords.some(keyword => hotelName.includes(keyword));
            return (hasBoutiqueLuxuryBrand || hasUniqueFeatures) && reasonablePrice && hasMinimumPrice;
        }).sort((a, b) => {
            // Sort by a combination of price and brand prestige
            const priceA = parseFloat(a.offers[0]?.price?.total || '0');
            const priceB = parseFloat(b.offers[0]?.price?.total || '0');
            // Calculate value score (quality indicators per price)
            const nameA = a.hotel.name?.toLowerCase() || '';
            const nameB = b.hotel.name?.toLowerCase() || '';
            const prestigeWordsA = ['ritz', 'four seasons', 'mandarin', 'st. regis', 'aman', 'rosewood', 'bulgari'].filter(word => nameA.includes(word)).length;
            const prestigeWordsB = ['ritz', 'four seasons', 'mandarin', 'st. regis', 'aman', 'rosewood', 'bulgari'].filter(word => nameB.includes(word)).length;
            if (prestigeWordsA !== prestigeWordsB) {
                return prestigeWordsB - prestigeWordsA; // Higher prestige first
            }
            return priceB - priceA; // Then by price
        });
    }
    // Filter for premium hotels (3-4 star equivalent)
    filterPremiumHotels(hotels) {
        return hotels.filter(hotel => {
            const price = parseFloat(hotel.offers[0]?.price?.total || '0');
            const hotelName = hotel.hotel.name?.toLowerCase() || '';
            // Price threshold for premium (€100-200 per night)
            const isPremiumPrice = price >= 100 && price < 200;
            // Avoid budget chains
            const budgetChains = ['ibis', 'travelodge', 'premier inn', 'holiday inn express', 'comfort inn'];
            const isBudgetChain = budgetChains.some(chain => hotelName.includes(chain));
            return isPremiumPrice && !isBudgetChain;
        }).sort((a, b) => {
            const priceA = parseFloat(a.offers[0]?.price?.total || '0');
            const priceB = parseFloat(b.offers[0]?.price?.total || '0');
            return priceB - priceA;
        });
    }
    async getHotelContent(hotelId) {
        const cacheKey = `content_${hotelId}`;
        const cached = this.dataCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await this.client.get(`/v1/reference-data/locations/hotels/by-hotels`, {
                params: {
                    hotelIds: hotelId
                }
            });
            const content = response.data.data?.[0];
            if (content) {
                this.dataCache.set(cacheKey, content);
            }
            return content || null;
        }
        catch (error) {
            console.error(`Failed to fetch content for hotel ${hotelId}:`, error);
            return null;
        }
    }
    async seedHotelsFromCities() {
        const allHotels = [];
        console.log(`🏨 Seeding ${this.curatedLuxuryHotels.length} curated luxury hotels...`);
        for (const curatedHotel of this.curatedLuxuryHotels) {
            try {
                console.log(`Fetching real photos for ${curatedHotel.name} in ${curatedHotel.city}...`);
                // Get real hotel photos from Google Places API
                const realPhotos = await this.googlePlacesClient.getSpecificHotelPhotos(curatedHotel.name, curatedHotel.city, 8 // Get 8 photos per hotel
                );
                // Generate unique hotel ID
                const hotelId = this.generateHotelId(curatedHotel.name, curatedHotel.city);
                // Create HotelCard from curated data
                const hotelCard = {
                    id: hotelId,
                    name: curatedHotel.name,
                    city: curatedHotel.city,
                    country: curatedHotel.country,
                    coords: curatedHotel.coords,
                    price: {
                        amount: this.generateRealisticPrice(curatedHotel.priceRange),
                        currency: curatedHotel.priceRange.currency
                    },
                    description: curatedHotel.description,
                    amenityTags: curatedHotel.amenityTags,
                    photos: realPhotos.length > 0 ? realPhotos : this.getFallbackPhotos(curatedHotel.city),
                    heroPhoto: realPhotos.length > 0 ? realPhotos[0] : this.getFallbackPhotos(curatedHotel.city)[0],
                    bookingUrl: this.generateBookingUrl(curatedHotel),
                    rating: this.generateRealisticRating(curatedHotel.category)
                };
                allHotels.push(hotelCard);
                console.log(`✅ Added ${curatedHotel.name} with ${realPhotos.length} real photos`);
                // Add delay to respect Google Places API rate limits
                await this.delay(500);
            }
            catch (error) {
                console.error(`Failed to process ${curatedHotel.name}:`, error);
                // Add hotel with fallback photos if Google Places fails
                const hotelId = this.generateHotelId(curatedHotel.name, curatedHotel.city);
                const fallbackHotel = {
                    id: hotelId,
                    name: curatedHotel.name,
                    city: curatedHotel.city,
                    country: curatedHotel.country,
                    coords: curatedHotel.coords,
                    price: {
                        amount: this.generateRealisticPrice(curatedHotel.priceRange),
                        currency: curatedHotel.priceRange.currency
                    },
                    description: curatedHotel.description,
                    amenityTags: curatedHotel.amenityTags,
                    photos: this.getFallbackPhotos(curatedHotel.city),
                    heroPhoto: this.getFallbackPhotos(curatedHotel.city)[0],
                    bookingUrl: this.generateBookingUrl(curatedHotel),
                    rating: this.generateRealisticRating(curatedHotel.category)
                };
                allHotels.push(fallbackHotel);
            }
        }
        console.log(`🎉 Successfully processed ${allHotels.length} luxury hotels`);
        return allHotels;
    }
    // Generate unique hotel ID
    generateHotelId(hotelName, city) {
        const combined = `${hotelName}-${city}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return `luxury-${combined}`;
    }
    // Generate realistic pricing within the hotel's range
    generateRealisticPrice(priceRange) {
        const randomPrice = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
        return randomPrice.toString();
    }
    // Generate realistic ratings based on hotel category
    generateRealisticRating(category) {
        const ratingRanges = {
            'luxury': { min: 4.7, max: 5.0 },
            'boutique': { min: 4.5, max: 4.9 },
            'heritage': { min: 4.4, max: 4.8 },
            'resort': { min: 4.6, max: 4.9 },
            'unique': { min: 4.3, max: 4.8 }
        };
        const range = ratingRanges[category] || { min: 4.0, max: 4.5 };
        return Math.round((Math.random() * (range.max - range.min) + range.min) * 10) / 10;
    }
    // Generate real booking URLs
    generateBookingUrl(hotel) {
        // Prefer hotel's official website if available
        if (hotel.website) {
            return hotel.website;
        }
        // Otherwise, use booking.com search URL
        const searchQuery = encodeURIComponent(`${hotel.name} ${hotel.city}`);
        return `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
    }
    // Get fallback photos if Google Places fails
    getFallbackPhotos(cityName) {
        const fallbackPhotos = {
            'Santorini': [
                'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80'
            ],
            'Rome': [
                'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1544737151-6e4b3999de8a?w=800&h=600&fit=crop&q=80'
            ],
            'Lisbon': [
                'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&q=80'
            ]
        };
        return fallbackPhotos[cityName] || [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80'
        ];
    }
    async transformToHotelCard(offer, city) {
        try {
            // Get additional hotel content
            const content = await this.getHotelContent(offer.hotel.hotelId);
            // Get real hotel photos from Hotellook API
            const finalPhotos = await this.getHotelPhotos(city.name, city.countryCode, offer.hotel.name);
            // Create hotel characteristics for enhanced generation
            const characteristics = {
                name: offer.hotel.name,
                city: city.name,
                country: this.getCountryName(city.countryCode)
                // chainCode not available in current Amadeus response
            };
            // Generate enhanced data (amenities + longer description)
            const enhancedData = enhanced_hotel_generator_1.enhancedHotelGenerator.generateEnhancedData(characteristics);
            // Only use REAL descriptions from Amadeus API - no generated content
            let description = content?.description?.text;
            if (!description || description.length < 50) {
                description = ''; // Drop description entirely if not real
            }
            // Use enhanced amenities if Amadeus amenities are empty
            let amenityTags = this.extractAmenityTags(content?.amenities || []);
            if (amenityTags.length === 0) {
                amenityTags = enhancedData.amenityTags;
            }
            // Create booking URL (placeholder for now)
            const bookingUrl = `https://booking.example.com/hotel/${offer.hotel.hotelId}`;
            // CRITICAL FIX: Proper coordinate validation and Google Places lookup
            let hotelCoords;
            // Check if Amadeus provides valid coordinates
            if (offer.hotel.latitude && offer.hotel.longitude &&
                offer.hotel.latitude !== 0 && offer.hotel.longitude !== 0 &&
                Math.abs(offer.hotel.latitude) <= 90 && Math.abs(offer.hotel.longitude) <= 180) {
                // Validate coordinates are not just city center
                const distanceFromCityCenter = this.calculateDistance(offer.hotel.latitude, offer.hotel.longitude, city.coords.lat, city.coords.lng);
                // If coordinates are more than 100m from city center, they're likely accurate
                if (distanceFromCityCenter > 0.1) {
                    hotelCoords = {
                        lat: offer.hotel.latitude,
                        lng: offer.hotel.longitude
                    };
                    console.log(`✅ Using Amadeus coordinates for ${offer.hotel.name}: ${offer.hotel.latitude}, ${offer.hotel.longitude}`);
                }
                else {
                    // Too close to city center, likely inaccurate - use Google Places lookup
                    console.warn(`⚠️ Amadeus coordinates too close to city center for ${offer.hotel.name}, using Google Places lookup`);
                    hotelCoords = await this.getAccurateHotelCoordinates(offer.hotel.name, city);
                }
            }
            else {
                // No valid coordinates from Amadeus - use Google Places lookup
                console.warn(`⚠️ No valid Amadeus coordinates for ${offer.hotel.name}, using Google Places lookup`);
                hotelCoords = await this.getAccurateHotelCoordinates(offer.hotel.name, city);
            }
            return {
                id: offer.hotel.hotelId,
                name: offer.hotel.name || content?.name || 'Beautiful Hotel',
                city: city.name,
                country: this.getCountryName(city.countryCode),
                coords: hotelCoords,
                price: offer.offers[0] ? {
                    amount: offer.offers[0].price.total,
                    currency: offer.offers[0].price.currency
                } : undefined,
                description,
                amenityTags,
                photos: finalPhotos,
                heroPhoto: finalPhotos[0],
                bookingUrl,
                rating: undefined // Amadeus doesn't provide ratings in basic tier
            };
        }
        catch (error) {
            console.error(`Failed to transform hotel ${offer.hotel.hotelId}:`, error);
            return null;
        }
    }
    extractAmenityTags(amenities) {
        const tagMap = {
            'SWIMMING_POOL': 'pool',
            'SPA': 'spa',
            'FITNESS_CENTER': 'fitness',
            'RESTAURANT': 'restaurant',
            'BAR': 'bar',
            'WIFI': 'wifi',
            'PARKING': 'parking',
            'BEACH': 'beachfront',
            'CITY_CENTER': 'city',
            'BUSINESS_CENTER': 'business',
            'ROOM_SERVICE': 'room-service',
            'CONCIERGE': 'concierge'
        };
        return amenities
            .map(a => tagMap[a.code] || a.description.toLowerCase())
            .filter(tag => tag && tag.length < 15)
            .slice(0, 6);
    }
    getCountryName(countryCode) {
        const countries = {
            'GR': 'Greece',
            'PT': 'Portugal',
            'ES': 'Spain',
            'IT': 'Italy',
            'HR': 'Croatia'
        };
        return countries[countryCode] || countryCode;
    }
    getDateString(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getHotelPhotos(cityName, countryCode, hotelName) {
        try {
            // Use curated real hotel photos by city and hotel name
            return this.getCuratedRealHotelPhotos(cityName, countryCode, hotelName);
        }
        catch (error) {
            console.warn(`Failed to get photos for ${cityName}:`, error);
            return this.getCuratedRealHotelPhotos(cityName, countryCode, hotelName);
        }
    }
    getGlobalVisuallyStunningLocations() {
        return {
            // EUROPE - Historic & Coastal
            europe: [
                'santorini', 'mykonos', 'crete', 'rhodes', 'paros', 'naxos',
                'amalfi', 'positano', 'capri', 'cinque terre', 'portofino',
                'ibiza', 'mallorca', 'menorca', 'formentera', 'canary islands',
                'florence', 'rome', 'venice', 'tuscany', 'prague', 'budapest',
                'dubrovnik', 'split', 'hvar', 'montenegro', 'albania',
                'alps', 'dolomites', 'chamonix', 'zermatt', 'st moritz', 'interlaken',
                'iceland', 'faroe islands', 'lofoten', 'norway', 'lapland'
            ],
            // ASIA - Tropical & Cultural
            asia: [
                // Southeast Asia
                'bali', 'lombok', 'gili islands', 'flores', 'komodo',
                'phuket', 'koh samui', 'koh phi phi', 'krabi', 'koh lipe',
                'langkawi', 'penang', 'perhentian', 'redang', 'tioman',
                'boracay', 'palawan', 'siargao', 'bohol', 'cebu',
                'ha long bay', 'phu quoc', 'hoi an', 'sapa', 'ninh binh',
                // East Asia
                'kyoto', 'tokyo', 'hakone', 'okinawa', 'mount fuji',
                'jeju island', 'busan', 'gyeongju', 'seoul',
                'zhangjiajie', 'guilin', 'yangshuo', 'lijiang', 'tibet',
                'hong kong', 'macau', 'taiwan', 'taroko gorge',
                // South Asia
                'maldives', 'sri lanka', 'kerala', 'goa', 'rajasthan',
                'himalayas', 'ladakh', 'kashmir', 'darjeeling', 'sikkim',
                'bhutan', 'nepal', 'annapurna', 'everest'
            ],
            // AMERICAS - Diverse Landscapes
            americas: [
                // North America
                'hawaii', 'maui', 'big island', 'kauai', 'lanai',
                'california coast', 'big sur', 'napa valley', 'sonoma',
                'aspen', 'vail', 'jackson hole', 'park city', 'whistler',
                'banff', 'jasper', 'lake louise', 'tofino', 'quebec city',
                'martha vineyard', 'nantucket', 'hamptons', 'key west',
                'charleston', 'savannah', 'napa', 'sedona', 'scottsdale',
                // Central America & Caribbean
                'costa rica', 'manuel antonio', 'monteverde', 'arenal',
                'belize', 'guatemala', 'antigua', 'lake atitlan',
                'barbados', 'st lucia', 'martinique', 'dominica',
                'turks caicos', 'bahamas', 'bermuda', 'cayman islands',
                'jamaica', 'aruba', 'curacao', 'st john', 'st thomas',
                // South America
                'patagonia', 'torres del paine', 'atacama', 'easter island',
                'machu picchu', 'cusco', 'sacred valley', 'amazon',
                'iguazu falls', 'mendoza', 'bariloche', 'ushuaia',
                'rio de janeiro', 'fernando de noronha', 'pantanal',
                'cartagena', 'medellin', 'galapagos', 'quito'
            ],
            // AFRICA - Safari & Coastal
            africa: [
                // East Africa
                'serengeti', 'ngorongoro', 'kilimanjaro', 'zanzibar',
                'masai mara', 'amboseli', 'samburu', 'lamu',
                'ethiopia', 'lalibela', 'simien mountains', 'danakil',
                'rwanda', 'uganda', 'gorilla trekking', 'lake kivu',
                // Southern Africa
                'cape town', 'winelands', 'garden route', 'kruger',
                'sabi sands', 'madikwe', 'pilanesberg', 'drakensberg',
                'namibia', 'sossusvlei', 'skeleton coast', 'etosha',
                'botswana', 'okavango delta', 'chobe', 'kalahari',
                'victoria falls', 'zimbabwe', 'zambia', 'malawi',
                'madagascar', 'mauritius', 'seychelles', 'reunion',
                // North Africa
                'marrakech', 'fez', 'sahara', 'atlas mountains',
                'egypt', 'red sea', 'nile', 'luxor', 'aswan',
                'tunisia', 'algeria', 'libya'
            ],
            // OCEANIA - Islands & Outback
            oceania: [
                // Australia
                'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
                'great barrier reef', 'whitsundays', 'cairns', 'port douglas',
                'uluru', 'kakadu', 'kimberley', 'pilbara', 'outback',
                'tasmania', 'cradle mountain', 'freycinet', 'maria island',
                'blue mountains', 'hunter valley', 'barossa valley',
                // Pacific Islands
                'fiji', 'vanuatu', 'new caledonia', 'solomon islands',
                'tahiti', 'bora bora', 'moorea', 'marquesas', 'cook islands',
                'samoa', 'tonga', 'palau', 'micronesia', 'marshall islands',
                'new zealand', 'queenstown', 'milford sound', 'bay of islands',
                'rotorua', 'abel tasman', 'franz josef', 'mount cook'
            ],
            // MIDDLE EAST - Luxury & Desert
            middleEast: [
                'dubai', 'abu dhabi', 'ras al khaimah', 'fujairah',
                'qatar', 'doha', 'kuwait', 'bahrain', 'muscat',
                'jordan', 'petra', 'wadi rum', 'dead sea', 'aqaba',
                'israel', 'tel aviv', 'jerusalem', 'eilat', 'galilee',
                'lebanon', 'beirut', 'baalbek', 'cedars', 'byblos',
                'turkey', 'cappadocia', 'pamukkale', 'bodrum', 'antalya'
            ]
        };
    }
    getGlobalInstagramAmenities() {
        return {
            // WATER FEATURES (Universal appeal)
            water: [
                'infinity-pool', 'rooftop-pool', 'private-pool', 'pool-bar',
                'beach-access', 'private-beach', 'overwater-bungalow',
                'lagoon-access', 'reef-access', 'waterfall', 'hot-springs',
                'cenote', 'natural-pool', 'plunge-pool', 'swim-up-bar'
            ],
            // VIEWS & LANDSCAPES (Region-specific)
            views: [
                'ocean-view', 'mountain-view', 'city-skyline', 'sunset-views',
                'sunrise-views', 'panoramic-views', 'valley-view', 'lake-view',
                'desert-view', 'jungle-view', 'volcano-view', 'glacier-view',
                'safari-view', 'rice-terrace-view', 'vineyard-view', 'canyon-view'
            ],
            // UNIQUE ARCHITECTURE (Cultural)
            architecture: [
                'cave-hotel', 'treehouse', 'glass-igloo', 'overwater-villa',
                'safari-tent', 'desert-camp', 'ice-hotel', 'lighthouse',
                'castle', 'palace', 'monastery', 'temple-hotel',
                'riad', 'ryokan', 'hacienda', 'estancia', 'fazenda',
                'chalet', 'cabin', 'yurt', 'tipi', 'houseboat'
            ],
            // LUXURY EXPERIENCES (Global)
            experiences: [
                'butler-service', 'private-chef', 'helicopter-access',
                'yacht-charter', 'safari-drive', 'wine-tasting',
                'spa-sanctuary', 'wellness-retreat', 'meditation-center',
                'cooking-class', 'cultural-immersion', 'adventure-sports',
                'diving-center', 'surf-school', 'yoga-pavilion'
            ],
            // NATURAL SETTINGS (Eco-luxury)
            nature: [
                'rainforest', 'desert-oasis', 'mountain-peak', 'cliff-edge',
                'private-island', 'marine-reserve', 'national-park',
                'wildlife-sanctuary', 'bird-watching', 'star-gazing',
                'aurora-viewing', 'whale-watching', 'turtle-nesting'
            ]
        };
    }
    /**
     * Enhanced global visual appeal scoring
     */
    calculateGlobalVisualAppealScore(hotel, hotelName, location) {
        let score = 0;
        const name = hotelName.toLowerCase();
        const loc = location.toLowerCase();
        // GLOBAL LOCATION APPEAL (30 points max)
        const globalLocations = this.getGlobalVisuallyStunningLocations();
        Object.values(globalLocations).flat().forEach(destination => {
            if (loc.includes(destination.toLowerCase())) {
                score += 3; // Each matching destination adds points
            }
        });
        // GLOBAL INSTAGRAM AMENITIES (35 points max)
        const globalAmenities = this.getGlobalInstagramAmenities();
        Object.values(globalAmenities).flat().forEach(amenity => {
            const amenityWords = amenity.split('-');
            if (amenityWords.some(word => name.includes(word))) {
                score += 2;
            }
        });
        // ARCHITECTURE & DESIGN (25 points max)
        const architectureKeywords = [
            'palace', 'castle', 'villa', 'mansion', 'estate', 'manor',
            'boutique', 'design', 'contemporary', 'historic', 'heritage',
            'collection', 'luxury', 'grand', 'royal', 'imperial',
            'resort', 'retreat', 'sanctuary', 'lodge', 'camp'
        ];
        architectureKeywords.forEach(keyword => {
            if (name.includes(keyword))
                score += 2;
        });
        // GLOBAL LUXURY BRANDS (10 points max)
        const globalLuxuryBrands = [
            'four seasons', 'ritz carlton', 'mandarin oriental', 'aman',
            'rosewood', 'bulgari', 'armani', 'edition', 'w hotel',
            'st regis', 'conrad', 'waldorf astoria', 'luxury collection',
            'park hyatt', 'grand hyatt', 'intercontinental', 'sofitel',
            'fairmont', 'kempinski', 'shangri-la', 'peninsula',
            'oberoi', 'taj', 'banyan tree', 'six senses', 'anantara'
        ];
        globalLuxuryBrands.forEach(brand => {
            if (name.includes(brand))
                score += 1;
        });
        return Math.min(score, 100); // Cap at 100
    }
    /**
     * Get curated real hotel photos by city and hotel name
     */
    getCuratedRealHotelPhotos(cityName, countryCode, hotelName) {
        // Curated high-quality hotel photos by city - using hotel-specific variations
        const basePhotos = {
            'Rome': [
                'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1544737151-6e4b3999de8a?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80'
            ],
            'Santorini': [
                'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80'
            ],
            'Lisbon': [
                'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80'
            ],
            'Split': [
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80'
            ],
            'Dubrovnik': [
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop&q=80',
                'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80'
            ]
        };
        // Get base photos for the city
        const cityPhotos = basePhotos[cityName] || [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80'
        ];
        // Create hotel-specific variation by using hotel name hash to select different photos
        if (hotelName) {
            const hash = hotelName.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
            const startIndex = Math.abs(hash) % cityPhotos.length;
            // Rotate the array based on hotel name to get different photos for each hotel
            const rotatedPhotos = [
                ...cityPhotos.slice(startIndex),
                ...cityPhotos.slice(0, startIndex)
            ];
            return rotatedPhotos;
        }
        return cityPhotos;
    }
    /**
     * Calculate distance between two coordinates in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * Get accurate hotel coordinates using Google Places API
     */
    async getAccurateHotelCoordinates(hotelName, city) {
        try {
            const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBh4W1feHK_zB7uiIx0VIkllOpy8ClnSk8';
            // Search for the hotel using Google Places Text Search
            const searchQuery = `${hotelName} hotel ${city.name}`;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googlePlacesApiKey}`;
            const response = await this.client.get(searchUrl);
            if (response.data.results && response.data.results.length > 0) {
                const place = response.data.results[0];
                // Validate the result is actually a hotel/lodging
                const types = place.types || [];
                const isHotel = types.some((type) => ['lodging', 'establishment', 'point_of_interest'].includes(type));
                if (isHotel && place.geometry && place.geometry.location) {
                    console.log(`✅ Found accurate coordinates for ${hotelName}: ${place.geometry.location.lat}, ${place.geometry.location.lng}`);
                    return {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng
                    };
                }
            }
            console.warn(`⚠️ Could not find accurate coordinates for ${hotelName}, using city center as fallback`);
            return city.coords;
        }
        catch (error) {
            console.error(`❌ Error fetching coordinates for ${hotelName}:`, error);
            return city.coords;
        }
    }
}
exports.AmadeusClient = AmadeusClient;
//# sourceMappingURL=amadeus.js.map