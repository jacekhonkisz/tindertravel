const axios = require('axios');
require('dotenv').config();

async function testAmadeusPhotos() {
  console.log('🖼️  Testing Amadeus hotel photos...');
  
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const baseUrl = process.env.AMADEUS_BASE_URL;
  
  try {
    // Get authentication token
    const tokenResponse = await axios.post(`${baseUrl}/v1/security/oauth2/token`, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Authentication successful');
    
    // Get a sample hotel from Rome
    console.log('\n🏨 Getting sample hotel from Rome...');
    const hotelsResponse = await axios.get(`${baseUrl}/v1/reference-data/locations/hotels/by-city`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      params: {
        cityCode: 'ROM',
        radius: 5,
        radiusUnit: 'KM',
        hotelSource: 'ALL'
      }
    });
    
    const hotels = hotelsResponse.data.data || [];
    if (hotels.length === 0) {
      console.log('❌ No hotels found');
      return;
    }
    
    const sampleHotel = hotels[0];
    console.log(`📋 Sample hotel: ${sampleHotel.name} (ID: ${sampleHotel.hotelId})`);
    
    // Test different endpoints for hotel content/photos
    const endpoints = [
      `/v1/reference-data/locations/hotels/by-hotels?hotelIds=${sampleHotel.hotelId}`,
      `/v2/reference-data/locations/hotels/by-hotels?hotelIds=${sampleHotel.hotelId}`,
      `/v1/reference-data/locations/hotel?hotelId=${sampleHotel.hotelId}`,
      `/v2/reference-data/locations/hotel?hotelId=${sampleHotel.hotelId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔍 Testing: ${endpoint}`);
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const data = response.data.data;
        if (data && data.length > 0) {
          const hotel = data[0];
          console.log('✅ Success! Hotel data found:');
          console.log('- Name:', hotel.name);
          console.log('- Address:', hotel.address?.lines?.[0]);
          console.log('- Media/Photos:', hotel.media ? `${hotel.media.length} items` : 'None');
          
          if (hotel.media && hotel.media.length > 0) {
            console.log('📸 Photo details:');
            hotel.media.slice(0, 3).forEach((media, i) => {
              console.log(`  ${i + 1}. ${media.uri} (${media.category || 'unknown'})`);
            });
          }
          
          // Check for other photo fields
          const photoFields = ['photos', 'images', 'multimedia', 'gallery'];
          photoFields.forEach(field => {
            if (hotel[field]) {
              console.log(`📷 Found ${field}:`, hotel[field]);
            }
          });
          
          break; // Found working endpoint
        }
      } catch (error) {
        console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.errors?.[0]?.title || error.message}`);
      }
    }
    
    // Test hotel offers to see if they include photos
    console.log('\n💰 Testing hotel offers for photo data...');
    try {
      const offersResponse = await axios.get(`${baseUrl}/v3/shopping/hotel-offers`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: {
          hotelIds: sampleHotel.hotelId,
          adults: 2,
          checkInDate: getDateString(7),
          checkOutDate: getDateString(9)
        }
      });
      
      const offers = offersResponse.data.data || [];
      if (offers.length > 0) {
        const offer = offers[0];
        console.log('✅ Offers found');
        console.log('- Hotel name:', offer.hotel?.name);
        console.log('- Media in offers:', offer.hotel?.media ? `${offer.hotel.media.length} items` : 'None');
        
        if (offer.hotel?.media) {
          offer.hotel.media.slice(0, 2).forEach((media, i) => {
            console.log(`  ${i + 1}. ${media.uri}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Offers failed:', error.response?.data?.errors?.[0]?.title || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

function getDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

testAmadeusPhotos(); 