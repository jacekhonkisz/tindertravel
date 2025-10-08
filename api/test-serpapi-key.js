const axios = require('axios');

async function testSerpApiKey() {
  const apiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
  
  console.log('🔑 Testing SerpApi key...');
  console.log(`Key: ${apiKey.substring(0, 10)}...`);
  
  try {
    // Test with a simple Google search first
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: 'hotel',
        api_key: apiKey
      },
      timeout: 10000
    });
    
    console.log('✅ API key is valid!');
    console.log(`Response status: ${response.status}`);
    console.log(`Search results: ${response.data.organic_results?.length || 0} results`);
    
    // Now test Google Hotels specifically
    console.log('\n🏨 Testing Google Hotels API...');
    const hotelsResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_hotels',
        q: 'Hotel Ritz Paris',
        api_key: apiKey,
        gl: 'us',
        hl: 'en'
      },
      timeout: 10000
    });
    
    console.log('✅ Google Hotels API works!');
    console.log(`Hotels found: ${hotelsResponse.data.properties?.length || 0}`);
    
    if (hotelsResponse.data.properties?.length > 0) {
      const hotel = hotelsResponse.data.properties[0];
      console.log(`Hotel: ${hotel.name}`);
      console.log(`Photos: ${hotel.images?.length || 0}`);
      console.log(`Rating: ${hotel.overall_rating || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testSerpApiKey();
