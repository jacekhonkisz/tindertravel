const axios = require('axios');

class NewSabreCredentialsTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.clientId = 'V1:ptnz4ecrrwxpk7cj:DEVCENTER:EXT';
    this.clientSecret = 'WRxe43oM';
    
    console.log('🔧 New Sabre Credentials Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🔑 Client ID: ${this.clientId}`);
    console.log(`🔐 Client Secret: ${this.clientSecret.substring(0, 3)}***`);
  }

  async getAccessToken() {
    console.log('\n🔑 Getting Sabre access token with new credentials...');
    
    try {
      // Use Basic Auth with Base64 encoded credentials (method that worked before)
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.access_token) {
        console.log('✅ Sabre authentication successful!');
        console.log(`🎫 Access Token: ${response.data.access_token.substring(0, 30)}...`);
        console.log(`⏰ Token Type: ${response.data.token_type}`);
        console.log(`⏱️  Expires In: ${response.data.expires_in} seconds`);
        return response.data.access_token;
      }
    } catch (error) {
      console.error('❌ Sabre authentication failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      return null;
    }
  }

  async testHotelMediaAPI(accessToken) {
    console.log('\n🏨 Testing GetHotelMediaRQ API with new credentials...');
    
    const requestPayload = {
      "GetHotelMediaRQ": {
        "HotelRefs": {
          "HotelRef": [
            {
              "HotelCode": "426",
              "CodeContext": "Sabre",
              "ImageRef": {
                "MaxImages": "6",
                "Images": {
                  "Image": [
                    {
                      "Type": "SMALL"
                    }
                  ]
                },
                "Categories": {
                  "Category": [
                    {
                      "Code": 3
                    }
                  ]
                },
                "AdditionalInfo": {
                  "Info": [
                    {
                      "Type": "CAPTION",
                      "content": true
                    }
                  ]
                },
                "Languages": {
                  "Language": [
                    {
                      "Code": "EN"
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    };

    // Try different possible endpoints for hotel media
    const endpoints = [
      '/v1/hotels/media',
      '/v1/shop/hotels/media',
      '/v1/hotel/media',
      '/v2/hotels/media',
      '/v2/shop/hotels/media',
      '/v1/hotels/GetHotelMedia',
      '/v1/shop/GetHotelMedia',
      '/v1/hotels/GetHotelMediaRQ',
      '/v1/shop/GetHotelMediaRQ'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔧 Trying endpoint: ${endpoint}`);
      
      try {
        const response = await axios.post(`${this.baseUrl}${endpoint}`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
        if (error.response?.data?.error_description) {
          console.log(`   Description: ${error.response.data.error_description}`);
        }
      }
    }
    
    return null;
  }

  async testOtherHotelEndpoints(accessToken) {
    console.log('\n🔍 Testing other hotel-related endpoints...');
    
    const testEndpoints = [
      '/v1/hotels',
      '/v1/shop/hotels',
      '/v1/hotels/descriptive',
      '/v1/shop/hotels/descriptive',
      '/v1/hotels/info',
      '/v1/shop/hotels/info',
      '/v1/hotels/list',
      '/v1/shop/hotels/list'
    ];

    for (const endpoint of testEndpoints) {
      console.log(`\n🔧 Testing GET ${endpoint}`);
      
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with GET ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response keys:`, Object.keys(response.data));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with GET ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async testFlightsAPI(accessToken) {
    console.log('\n✈️ Testing Flights API (should work)...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/v1/shop/flights`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          origin: 'LAX',
          destination: 'NYC'
        },
        timeout: 10000
      });

      console.log('✅ Flights API working (as expected)');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Found ${response.data.PricedItineraries?.length || 0} flight options`);
      return true;
    } catch (error) {
      console.log(`❌ Flights API failed: ${error.response?.status}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Testing New Sabre Credentials\n');
    
    // Test authentication
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      console.log('\n❌ Authentication failed - cannot proceed with API tests');
      return;
    }
    
    // Test flights API (should work)
    await this.testFlightsAPI(accessToken);
    
    // Test hotel media API
    const hotelMediaResult = await this.testHotelMediaAPI(accessToken);
    
    if (!hotelMediaResult) {
      // Test other hotel endpoints
      await this.testOtherHotelEndpoints(accessToken);
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`🔑 Authentication: ${accessToken ? '✅ Success' : '❌ Failed'}`);
    console.log(`✈️ Flights API: ${accessToken ? '✅ Should work' : '❌ Not tested'}`);
    console.log(`🏨 Hotel APIs: ${hotelMediaResult ? '✅ Working!' : '❌ Not accessible'}`);
    
    if (hotelMediaResult) {
      console.log('\n🎉 SUCCESS! These credentials have hotel photo access!');
    } else {
      console.log('\n⚠️ These credentials also don\'t have hotel photo access');
      console.log('💡 Consider using alternative hotel photo APIs');
    }
  }
}

// Run the tests
const tester = new NewSabreCredentialsTester();
tester.runAllTests().catch(console.error);
