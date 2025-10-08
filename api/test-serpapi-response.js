const axios = require('axios');

async function testSerpApiResponse() {
  const serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
  const baseUrl = 'https://serpapi.com/search';
  
  console.log('🔍 TESTING SERPAPI RESPONSE FORMAT');
  console.log('='.repeat(50));
  
  try {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 7);
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 10);
    
    const response = await axios.get(baseUrl, {
      params: {
        engine: 'google_hotels',
        q: 'Shadow Mountain Lodge Aspen Colorado',
        check_in_date: checkInDate.toISOString().split('T')[0],
        check_out_date: checkOutDate.toISOString().split('T')[0],
        api_key: serpApiKey,
        gl: 'us',
        hl: 'en'
      },
      timeout: 15000
    });

    console.log('📊 SerpApi Response Structure:');
    console.log('Properties found:', response.data.properties?.length || 0);
    
    if (response.data.properties && response.data.properties.length > 0) {
      const hotel = response.data.properties[0];
      console.log('Hotel name:', hotel.name);
      console.log('Images found:', hotel.images?.length || 0);
      
      if (hotel.images && hotel.images.length > 0) {
        console.log('\n📸 FIRST IMAGE STRUCTURE:');
        console.log(JSON.stringify(hotel.images[0], null, 2));
        
        console.log('\n🔍 WHAT WE NEED:');
        console.log('URL:', hotel.images[0].url);
        console.log('Width:', hotel.images[0].width);
        console.log('Height:', hotel.images[0].height);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSerpApiResponse();
