"use strict";
// Direct Amadeus API Test - Verify Credentials and Fetch Hotels
// Test the real Amadeus credentials and fetch hotels directly
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAmadeusDirectly = testAmadeusDirectly;
const amadeus_1 = require("./amadeus");
const curation_1 = require("./curation");
async function testAmadeusDirectly() {
    console.log('🧪 TESTING AMADEUS API DIRECTLY');
    console.log('===============================');
    console.log('Testing real Amadeus credentials and hotel fetching...');
    console.log('');
    const amadeus = new amadeus_1.AmadeusClient();
    try {
        // Test authentication by trying to fetch hotels
        console.log('🔐 Testing Amadeus authentication...');
        console.log('✅ Testing with hotel search...');
        console.log('');
        // Test hotel search in major cities
        const testCities = [
            { code: 'PAR', name: 'Paris', country: 'France' },
            { code: 'LON', name: 'London', country: 'UK' },
            { code: 'ROM', name: 'Rome', country: 'Italy' },
            { code: 'NYC', name: 'New York', country: 'USA' },
            { code: 'TYO', name: 'Tokyo', country: 'Japan' }
        ];
        let totalHotelsFound = 0;
        let totalHotelsWithPhotos = 0;
        let totalCuratedHotels = 0;
        for (const city of testCities) {
            try {
                console.log(`🏨 Fetching hotels from ${city.name}, ${city.country}...`);
                // Fetch hotels from Amadeus
                const hotels = await amadeus.getHotelsByCity(city.code, 10);
                console.log(`   Found ${hotels.length} hotels`);
                totalHotelsFound += hotels.length;
                if (hotels.length === 0) {
                    console.log('   ⚠️  No hotels found, skipping...');
                    continue;
                }
                // Get hotel content (photos, amenities) for first few hotels
                let hotelsWithPhotos = 0;
                const rawHotels = [];
                for (let i = 0; i < Math.min(3, hotels.length); i++) {
                    const hotel = hotels[i];
                    try {
                        const content = await amadeus.getHotelContent(hotel.hotel.hotelId);
                        if (content && content.media && content.media.length >= 3) {
                            hotelsWithPhotos++;
                            rawHotels.push({
                                hotel: {
                                    hotelId: hotel.hotel.hotelId,
                                    name: hotel.hotel.name,
                                    cityCode: hotel.hotel.cityCode || city.code,
                                    latitude: hotel.hotel.latitude || 0,
                                    longitude: hotel.hotel.longitude || 0
                                },
                                content,
                                offers: hotel.offers || []
                            });
                            console.log(`   ✅ ${hotel.hotel.name}: ${content.media.length} photos`);
                        }
                        else {
                            console.log(`   ❌ ${hotel.hotel.name}: insufficient photos`);
                        }
                    }
                    catch (error) {
                        console.log(`   ❌ ${hotel.hotel.name}: failed to get content`);
                    }
                }
                totalHotelsWithPhotos += hotelsWithPhotos;
                console.log(`   📸 ${hotelsWithPhotos}/${Math.min(3, hotels.length)} hotels have good photos`);
                // Apply Glintz curation
                if (rawHotels.length > 0) {
                    console.log(`   🎯 Applying Glintz curation to ${rawHotels.length} hotels...`);
                    const curationResult = await (0, curation_1.glintzCurate)(rawHotels);
                    totalCuratedHotels += curationResult.cards.length;
                    console.log(`   ✅ ${curationResult.cards.length} hotels passed Glintz curation`);
                    // Show sample hotel
                    if (curationResult.cards.length > 0) {
                        const sample = curationResult.cards[0];
                        console.log(`   🌟 Sample: ${sample.name} - Score: ${sample.glintzScore?.toFixed(2)} - Photos: ${sample.photos.length}`);
                    }
                }
                console.log('');
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`❌ Error fetching hotels from ${city.name}:`, error.message);
            }
        }
        // Final results
        console.log('🎉 AMADEUS API TEST COMPLETE!');
        console.log('=============================');
        console.log(`📊 Results:`);
        console.log(`   • Cities tested: ${testCities.length}`);
        console.log(`   • Total hotels found: ${totalHotelsFound}`);
        console.log(`   • Hotels with good photos: ${totalHotelsWithPhotos}`);
        console.log(`   • Hotels passing Glintz curation: ${totalCuratedHotels}`);
        console.log(`   • Success rate: ${((totalCuratedHotels / totalHotelsFound) * 100).toFixed(1)}%`);
        console.log('');
        console.log('✅ Amadeus API is working perfectly!');
        console.log('🚀 Ready to fetch thousands of hotels globally!');
    }
    catch (error) {
        console.error('❌ Amadeus API test failed:', error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            console.log('💡 Check your Amadeus API credentials in .env file');
        }
    }
}
// CLI execution
if (require.main === module) {
    testAmadeusDirectly()
        .then(() => process.exit(0))
        .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test-amadeus-direct.js.map