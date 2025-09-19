const axios = require('axios');
require('dotenv').config();

async function testAmadeusConnection() {
  console.log('🧪 Testing Amadeus API connection...');
  
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const baseUrl = process.env.AMADEUS_BASE_URL;
  
  console.log('Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET');
  console.log('Base URL:', baseUrl);
  
  if (!clientId || !clientSecret) {
    console.error('❌ Amadeus credentials not set');
    return;
  }
  
  try {
    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const tokenResponse = await axios.post(`${baseUrl}/v1/security/oauth2/token`, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Authentication successful');
    console.log('Token expires in:', tokenResponse.data.expires_in, 'seconds');
    
    // Test hotel search - try different endpoint
    console.log('\n🏨 Testing hotel search for Rome...');
    
    // First try to get hotel list by city
    try {
      const hotelsResponse = await axios.get(`${baseUrl}/v1/reference-data/locations/hotels/by-city`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          cityCode: 'ROM',
          radius: 5,
          radiusUnit: 'KM',
          hotelSource: 'ALL'
        }
      });
      
      const hotels = hotelsResponse.data.data || [];
      console.log(`✅ Found ${hotels.length} hotels in Rome via reference data`);
      
      if (hotels.length > 0) {
        const firstHotel = hotels[0];
        console.log('\n📋 Sample hotel from reference:');
        console.log('- Name:', firstHotel.name);
        console.log('- Hotel ID:', firstHotel.hotelId);
        console.log('- Address:', firstHotel.address?.lines?.[0]);
        
        // Now try to get offers for this hotel
        console.log('\n💰 Testing hotel offers...');
        try {
          const offersResponse = await axios.get(`${baseUrl}/v3/shopping/hotel-offers`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              hotelIds: firstHotel.hotelId,
              adults: 2,
              checkInDate: getDateString(7),
              checkOutDate: getDateString(9),
              roomQuantity: 1,
              currency: 'EUR'
            }
          });
          
          const offers = offersResponse.data.data || [];
          console.log(`✅ Found ${offers.length} offers for hotel ${firstHotel.hotelId}`);
          
          if (offers.length > 0) {
            const offer = offers[0];
            console.log('- Price:', offer.offers?.[0]?.price?.total, offer.offers?.[0]?.price?.currency);
          }
        } catch (offerError) {
          console.log('⚠️ Could not get offers:', offerError.response?.data || offerError.message);
        }
      }
    } catch (error) {
      console.log('⚠️ Hotel reference search failed, trying alternative...');
      
      // Try city search instead
      const cityResponse = await axios.get(`${baseUrl}/v1/reference-data/locations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          keyword: 'Rome',
          subType: 'CITY'
        }
      });
      
             console.log('✅ City search successful:', cityResponse.data.data?.length || 0, 'results');
     }
    
    console.log('\n🎉 Amadeus API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Amadeus API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

function getDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

testAmadeusConnection(); 