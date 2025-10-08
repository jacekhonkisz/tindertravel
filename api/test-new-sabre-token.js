const axios = require('axios');

class NewSabreTokenTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQJ85mPwMuv+AAPIk8YR9V2BkF9gdY3pwCNQ82NXG79A7RCPnP6m+Bo+ESriu+L1LrewAADg/YuvJXuzjsp1YrRaCVZF8IRU5upx4yKgzyOcKM2ahYnaWVT2gQlfPu1qbxrU2Faa3mpoe9jXrE17OiukiEO67nIoD9YY7yV79c4GmLOUo9Qj7NuGsdMfIaVqibMpAc1r1au3e0WSlDew2zbpDmU5aPObtpfoKQrMTufzudptTocYy+JoLeps7LthpAqqEA3t7R9yRQqCOwGIeLtq3m5gyTT77LjKE9S0euVMbde+CmHsrH5lZgjyoqwqqx3VzdKhUt8Pjsc3SjoUgGufCpSsz+zu0Pplhf2ff52S8AePIOY*';
    this.clientId = 'V1:ptnz4ecrrwxpk7cj:DEVCENTER:EXT';
    this.clientSecret = 'WRxe43oM';
    
    console.log('🔧 New Sabre Token Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Access Token: ${this.accessToken.substring(0, 30)}...`);
    console.log(`🔑 Client ID: ${this.clientId}`);
  }

  async testTokenValidity() {
    console.log('\n🔑 Testing token validity...');
    
    try {
      // Test with flights API first (should work)
      const response = await axios.get(`${this.baseUrl}/v1/shop/flights`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          origin: 'LAX',
          destination: 'NYC'
        },
        timeout: 15000
      });

      console.log('✅ Token is valid!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Found ${response.data.PricedItineraries?.length || 0} flight options`);
      
      return true;
    } catch (error) {
      console.error('❌ Token validation failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      return false;
    }
  }

  async testHotelMediaAPI() {
    console.log('\n🏨 Testing GetHotelMediaRQ API...');
    
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
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
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

  async testOtherHotelEndpoints() {
    console.log('\n🔍 Testing other hotel-related endpoints...');
    
    const testEndpoints = [
      '/v1/hotels',
      '/v1/shop/hotels',
      '/v1/hotels/descriptive',
      '/v1/shop/hotels/descriptive',
      '/v1/hotels/info',
      '/v1/shop/hotels/info',
      '/v1/hotels/list',
      '/v1/shop/hotels/list',
      '/v1/lists/supported/shop/hotels',
      '/v1/shop/hotels/search'
    ];

    for (const endpoint of testEndpoints) {
      console.log(`\n🔧 Testing GET ${endpoint}`);
      
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with GET ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response type: ${typeof response.data}`);
        
        if (Array.isArray(response.data)) {
          console.log(`📋 Number of items: ${response.data.length}`);
          if (response.data.length > 0) {
            console.log(`📝 Sample item keys:`, Object.keys(response.data[0]));
          }
        } else if (typeof response.data === 'object') {
          console.log(`📝 Response keys:`, Object.keys(response.data));
        }
        
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

  async testHotelSearch() {
    console.log('\n🔍 Testing hotel search functionality...');
    
    const searchPayloads = [
      {
        name: 'Hotel Search',
        payload: {
          "HotelSearchRQ": {
            "Criteria": {
              "Criterion": [
                {
                  "HotelRef": {
                    "HotelCode": "426",
                    "CodeContext": "Sabre"
                  }
                }
              ]
            }
          }
        }
      },
      {
        name: 'Hotel Descriptive Info',
        payload: {
          "GetHotelDescriptiveInfoRQ": {
            "HotelRefs": {
              "HotelRef": [
                {
                  "HotelCode": "426",
                  "CodeContext": "Sabre"
                }
              ]
            }
          }
        }
      }
    ];

    for (const test of searchPayloads) {
      console.log(`\n🔧 Testing ${test.name}...`);
      
      const endpoints = [
        '/v1/hotels/search',
        '/v1/shop/hotels/search',
        '/v1/hotels/descriptive',
        '/v1/shop/hotels/descriptive'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(`${this.baseUrl}${endpoint}`, test.payload, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          console.log(`✅ SUCCESS with ${test.name} at ${endpoint}`);
          console.log(`📊 Status: ${response.status}`);
          console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
          return response.data;
        } catch (error) {
          console.log(`❌ Failed ${test.name} at ${endpoint}: ${error.response?.status}`);
        }
      }
    }
    
    return null;
  }

  async runAllTests() {
    console.log('🚀 Testing New Sabre Access Token\n');
    
    // Test token validity first
    const tokenValid = await this.testTokenValidity();
    
    if (!tokenValid) {
      console.log('\n❌ Token is invalid - cannot proceed with hotel API tests');
      return;
    }
    
    // Test hotel media API
    const hotelMediaResult = await this.testHotelMediaAPI();
    
    if (!hotelMediaResult) {
      // Test other hotel endpoints
      await this.testOtherHotelEndpoints();
      
      // Test hotel search functionality
      await this.testHotelSearch();
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`🔑 Token Validity: ${tokenValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`🏨 Hotel Media API: ${hotelMediaResult ? '✅ Working!' : '❌ Not accessible'}`);
    
    if (hotelMediaResult) {
      console.log('\n�� SUCCESS! This token has hotel photo access!');
      console.log('✅ You can now use Sabre API for hotel photos');
    } else {
      console.log('\n⚠️ This token also doesn\'t have hotel photo access');
      console.log('💡 Consider using alternative hotel photo APIs');
    }
  }
}

// Run the tests
const tester = new NewSabreTokenTester();
tester.runAllTests().catch(console.error);
