const axios = require('axios');

class SabreTokenTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQK8L2bM5IvRv9bGxIrT9Lzfb3+QgKo27WdW+E89Ms/2xhD3Y+cXuee8J5gd7L1bmgUgAADglIARfFP73UvCNz+HolrznYonWj/EetVXVfeXFnHs6Zr3XvrdBM/d3QnjvZZ3Mlh/wWn9U1zxoJ3fvExsIjw0Wy1uv+HtYzJrk9aeh1wYVDoSnG3lCsptBSvbfuuhFWc3sHbdClThilgKSYGHaKKdz2sRULFLqiQRXAf8rpVmxmjqyzhwK0lU1KpYkJl+nzZtxxn7uSjTeZIe7kZYT/gYk/esTmtg+1X+I/P9kJ+WoorjdI7YiDcVVUKSeEzIrrgAKJ81yeL0yy4GWZObbSGiVhvyyxyizv2UbAzGWWJ9kH0*';
    
    console.log('🔧 Sabre Token Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Token: ${this.accessToken.substring(0, 30)}...`);
  }

  async testTokenValidity() {
    console.log('\n�� Testing token validity...');
    
    try {
      // Test with a simple API call first
      const response = await axios.get(`${this.baseUrl}/v1/lists/supported/shop/hotels`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Token is valid!');
      console.log(`�� Status: ${response.status}`);
      console.log(`📄 Response type: ${typeof response.data}`);
      
      if (Array.isArray(response.data)) {
        console.log(`📋 Number of items: ${response.data.length}`);
      } else if (typeof response.data === 'object') {
        console.log(`📝 Response keys:`, Object.keys(response.data));
      }
      
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

    try {
      const response = await axios.post(`${this.baseUrl}/v1/hotels/media`, requestPayload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Hotel Media API call successful!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Response type: ${typeof response.data}`);
      
      // Pretty print the response
      console.log('\n📋 Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('❌ Hotel Media API call failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      
      // Try alternative endpoint
      console.log('\n🔄 Trying alternative endpoint...');
      return await this.testAlternativeEndpoint(requestPayload);
    }
  }

  async testAlternativeEndpoint(requestPayload) {
    try {
      // Try different possible endpoints
      const endpoints = [
        '/v1/hotels/media',
        '/v1/shop/hotels/media',
        '/v1/hotel/media',
        '/v2/hotels/media',
        '/v2/shop/hotels/media'
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
            timeout: 10000
          });

          console.log(`✅ Success with endpoint: ${endpoint}`);
          console.log(`📊 Status: ${response.status}`);
          console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
          return response.data;
        } catch (error) {
          console.log(`❌ Failed with ${endpoint}: ${error.response?.status}`);
        }
      }
    } catch (error) {
      console.error('❌ All alternative endpoints failed');
    }
    
    return null;
  }

  async runTests() {
    console.log('🚀 Testing Sabre API with provided token\n');
    
    // Test token validity first
    const tokenValid = await this.testTokenValidity();
    
    if (tokenValid) {
      // Test hotel media API
      await this.testHotelMediaAPI();
      
      console.log('\n✅ All tests completed!');
    } else {
      console.log('\n❌ Token is invalid, skipping further tests');
    }
  }
}

// Run the tests
const tester = new SabreTokenTester();
tester.runTests().catch(console.error);
