const axios = require('axios');

class SabreHotelMediaTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQK8L2bM5IvRv9bGxIrT9Lzfb3+QgKo27WdW+E89Ms/2xhD3Y+cXuee8J5gd7L1bmgUgAADglIARfFP73UvCNz+HolrznYonWj/EetVXVfeXFnHs6Zr3XvrdBM/d3QnjvZZ3Mlh/wWn9U1zxoJ3fvExsIjw0Wy1uv+HtYzJrk9aeh1wYVDoSnG3lCsptBSvbfuuhFWc3sHbdClThilgKSYGHaKKdz2sRULFLqiQRXAf8rpVmxmjqyzhwK0lU1KpYkJl+nzZtxxn7uSjTeZIe7kZYT/gYk/esTmtg+1X+I/P9kJ+WoorjdI7YiDcVVUKSeEzIrrgAKJ81yeL0yy4GWZObbSGiVhvyyxyizv2UbAzGWWJ9kH0*';
    
    console.log('🔧 Sabre Hotel Media Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Token: ${this.accessToken.substring(0, 30)}...`);
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
          timeout: 10000
        });

        console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${endpoint}: ${error.response?.status}`);
        if (error.response?.data) {
          console.log(`   Error:`, JSON.stringify(error.response.data, null, 2));
        }
      }
    }
    
    return null;
  }

  async testOtherEndpoints() {
    console.log('\n🔍 Testing other Sabre endpoints...');
    
    const testEndpoints = [
      '/v1/lists/supported/shop/hotels',
      '/v1/shop/hotels',
      '/v1/hotels',
      '/v1/lists/supported/hotels',
      '/v1/shop/hotels/descriptive',
      '/v1/hotels/descriptive',
      '/v1/shop/hotels/info',
      '/v1/hotels/info'
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

  async runTests() {
    console.log('🚀 Testing Sabre Hotel Media API\n');
    
    // Test hotel media API
    const mediaResult = await this.testHotelMediaAPI();
    
    if (!mediaResult) {
      // If hotel media failed, try other endpoints
      await this.testOtherEndpoints();
    }
    
    console.log('\n✅ Tests completed!');
  }
}

// Run the tests
const tester = new SabreHotelMediaTester();
tester.runTests().catch(console.error);
