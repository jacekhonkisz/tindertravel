"use strict";
// Seed Glintz-Curated Hotels
// Add boutique, luxury hotels with high-quality photos
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHOTO_QUALITY_REQUIREMENTS = void 0;
exports.seedGlintzHotels = seedGlintzHotels;
const supabase_1 = require("./supabase");
const google_places_1 = require("./google-places");
const curation_1 = require("./curation");
const GLINTZ_HOTEL_SEEDS = [
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
async function seedGlintzHotels() {
    console.log('🎯 Starting Glintz Hotel Seeding...');
    const supabaseService = new supabase_1.SupabaseService();
    const googlePlaces = new google_places_1.GooglePlacesClient();
    let addedCount = 0;
    const results = [];
    for (const hotelSeed of GLINTZ_HOTEL_SEEDS) {
        try {
            console.log(`\n📍 Processing: ${hotelSeed.name} in ${hotelSeed.city}`);
            // Search for high-quality photos using Google Places
            console.log(`🔍 Searching for photos: "${hotelSeed.searchQuery}"`);
            const searchResults = await googlePlaces.searchHotels(hotelSeed.searchQuery, 1);
            if (searchResults.length === 0 || searchResults[0].photos.length < 4) {
                console.log(`❌ Insufficient high-quality photos found`);
                continue;
            }
            const photos = searchResults[0].photos.slice(0, 8); // Max 8 photos
            console.log(`✅ Found ${photos.length} high-quality photos`);
            // Create RawHotel for Glintz curation
            const rawHotel = {
                hotel: {
                    hotelId: `glintz-${hotelSeed.name.toLowerCase().replace(/\s+/g, '-')}`,
                    name: hotelSeed.name,
                    chainCode: undefined,
                    rating: hotelSeed.rating,
                    cityCode: hotelSeed.city.toUpperCase(),
                    latitude: hotelSeed.coords.lat,
                    longitude: hotelSeed.coords.lng
                },
                content: {
                    hotelId: `glintz-${hotelSeed.name.toLowerCase().replace(/\s+/g, '-')}`,
                    name: hotelSeed.name,
                    description: { text: hotelSeed.description, lang: 'en' },
                    amenities: hotelSeed.amenityTags,
                    media: photos.map((photo) => ({
                        uri: photo.url,
                        category: 'EXTERIOR',
                        width: photo.width,
                        height: photo.height
                    })),
                    ratings: [{ provider: 'curated', rating: hotelSeed.rating.toString() }]
                },
                offers: [{
                        price: {
                            total: hotelSeed.price.amount,
                            currency: hotelSeed.price.currency
                        }
                    }]
            };
            // Apply Glintz curation
            const curationResult = await (0, curation_1.glintzCurate)([rawHotel]);
            if (curationResult.cards.length === 0) {
                console.log(`❌ Hotel failed Glintz curation pipeline`);
                continue;
            }
            const curatedCard = curationResult.cards[0];
            console.log(`🎯 Glintz Score: ${(curatedCard.score.total * 100).toFixed(1)}%`);
            console.log(`🏷️  Tags: ${curatedCard.tags.map(t => t.label).join(', ')}`);
            // Save to database
            const hotelData = {
                id: curatedCard.id,
                name: curatedCard.name,
                city: curatedCard.city,
                country: curatedCard.country,
                coords: curatedCard.coords,
                price: curatedCard.price,
                description: curatedCard.description,
                amenity_tags: curatedCard.tags.map(tag => tag.label),
                photos: curatedCard.photos,
                hero_photo: curatedCard.heroPhoto,
                booking_url: hotelSeed.bookingUrl,
                rating: curatedCard.rating || hotelSeed.rating
            };
            await supabaseService.insertHotels([hotelData]);
            addedCount++;
            console.log(`✅ Added to database: ${curatedCard.name}`);
            results.push({
                name: curatedCard.name,
                city: curatedCard.city,
                country: curatedCard.country,
                score: curatedCard.score.total,
                tags: curatedCard.tags.map(t => t.label),
                photoCount: curatedCard.photos.length
            });
            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        catch (error) {
            console.error(`❌ Error processing ${hotelSeed.name}:`, error);
        }
    }
    console.log(`\n🎉 Glintz Hotel Seeding Complete!`);
    console.log(`📊 Added ${addedCount} hotels out of ${GLINTZ_HOTEL_SEEDS.length} candidates`);
    if (results.length > 0) {
        console.log('\n🏆 Successfully Added Hotels:');
        results.forEach(hotel => {
            console.log(`  • ${hotel.name}, ${hotel.city} - Score: ${(hotel.score * 100).toFixed(1)}% - ${hotel.photoCount} photos`);
            console.log(`    Tags: ${hotel.tags.join(', ')}`);
        });
    }
    return results;
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
        .then(() => process.exit(0))
        .catch(error => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed-glintz-hotels.js.map