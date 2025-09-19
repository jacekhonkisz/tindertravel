const { AmadeusClient } = require('./dist/amadeus');
require('dotenv').config();

async function testLuxuryHotels() {
  console.log('🏨 Testing Luxury Hotel System...\n');

  try {
    const amadeus = new AmadeusClient();
    
    // Test seeding luxury hotels
    console.log('📋 Seeding curated luxury hotels...');
    const hotels = await amadeus.seedHotelsFromCities();
    
    console.log(`\n✅ Successfully processed ${hotels.length} hotels\n`);
    
    // Display sample hotels
    hotels.slice(0, 3).forEach((hotel, index) => {
      console.log(`🏨 Hotel ${index + 1}: ${hotel.name}`);
      console.log(`   📍 Location: ${hotel.city}, ${hotel.country}`);
      console.log(`   💰 Price: €${hotel.price?.amount} ${hotel.price?.currency}`);
      console.log(`   ⭐ Rating: ${hotel.rating}/5.0`);
      console.log(`   📸 Photos: ${hotel.photos.length} images`);
      console.log(`   🔗 Booking: ${hotel.bookingUrl}`);
      console.log(`   🏷️  Amenities: ${hotel.amenityTags.join(', ')}`);
      console.log(`   📝 Description: ${hotel.description.substring(0, 100)}...`);
      console.log('');
    });

    // Test photo quality
    const hotelWithPhotos = hotels.find(h => h.photos.length > 0);
    if (hotelWithPhotos) {
      console.log('📸 Sample Photos from Google Places API:');
      hotelWithPhotos.photos.slice(0, 3).forEach((photo, i) => {
        console.log(`   Photo ${i + 1}: ${photo}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLuxuryHotels(); 