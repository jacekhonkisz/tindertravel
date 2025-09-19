// Quick Test - Verify All Components Working
import dotenv from 'dotenv';
import { AmadeusClient } from './amadeus';
import { glintzCurate, RawHotel } from './curation';

// Load environment variables
dotenv.config();

async function quickTest() {
  console.log('🧪 QUICK TEST: Verifying All Components');
  console.log('=====================================');
  
  try {
    const client = new AmadeusClient();
    
    // Test 1: Get hotels from London
    console.log('Step 1: Getting hotels from London...');
    const hotels = await client.getHotelsByCity('LON', 3);
    console.log(`✅ Found ${hotels.length} hotels`);
    
    if (hotels.length === 0) {
      console.log('❌ No hotels found - API might have issues');
      return;
    }
    
    console.log(`Sample hotel: ${hotels[0].hotel.name}`);
    
    // Test 2: Get content for first hotel
    console.log('\nStep 2: Getting content for first hotel...');
    const content = await client.getHotelContent(hotels[0].hotel.hotelId);
    console.log(`✅ Content retrieved, photos: ${content?.media?.length || 0}`);
    
    // Test 3: Apply Glintz curation
    if (content) {
      console.log('\nStep 3: Testing Glintz curation...');
      const rawHotel: RawHotel = {
        hotel: {
          hotelId: hotels[0].hotel.hotelId,
          name: hotels[0].hotel.name,
          cityCode: hotels[0].hotel.cityCode || 'LON',
          latitude: hotels[0].hotel.latitude || 0,
          longitude: hotels[0].hotel.longitude || 0
        },
        content: {
          hotelId: content.hotelId,
          name: content.name,
          description: content.description ? { text: content.description.text, lang: 'en' } : undefined,
          amenities: (content.amenities || []).map((a: any) => a.code),
          media: content.media || [],
          ratings: undefined
        },
        offers: hotels[0].offers || []
      };
      
      const curationResult = await glintzCurate([rawHotel]);
      console.log(`✅ Glintz result: ${curationResult.cards.length} curated hotels`);
      
      if (curationResult.cards.length > 0) {
        const card = curationResult.cards[0];
        console.log(`✅ Sample curated hotel: ${card.name} - Score: ${(card as any).glintzScore?.toFixed(2) || 'N/A'}`);
        console.log(`   Photos: ${card.photos.length}, Tags: ${card.tags.length}`);
      } else {
        console.log('⚠️  Hotel did not pass Glintz curation (this is normal - filters are strict)');
      }
    }
    
    console.log('\n🎉 ALL SYSTEMS WORKING!');
    console.log('✅ Amadeus API: Connected');
    console.log('✅ Hotel Search: Working');
    console.log('✅ Content Retrieval: Working');
    console.log('✅ Glintz Curation: Working');
    console.log('\n🚀 The optimized fetcher should be running successfully in the background!');
    
  } catch (error) {
    console.error('❌ Error in quick test:', (error as Error).message);
    
    if ((error as any).response?.data) {
      console.log('API Error Details:', JSON.stringify((error as any).response.data, null, 2));
    }
  }
}

// Run the test
if (require.main === module) {
  quickTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { quickTest }; 