const axios = require('axios');

class SabreEndpointTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQK8L2bM5IvRv9bGxIrT9Lzfb3+QgKo27WdW+E89Ms/2xhD3Y+cXuee8J5gd7L1bmgUgAADglIARfFP73UvCNz+HolrznYonWj/EetVXVfeXFnHs6Zr3XvrdBM/d3QnjvZZ3Mlh/wWn9U1zxoJ3fvExsIjw0Wy1uv+HtYzJrk9aeh1wYVDoSnG3lCsptBSvbfuuhFWc3sHbdClThilgKSYGHaKKdz2sRULFLqiQRXAf8rpVmxmjqyzhwK0lU1KpYkJl+nzZtxxn7uSjTeZIe7kZYT/gYk/esTmtg+1X+I/P9kJ+WoorjdI7YiDcVVUKSeEzIrrgAKJ81yeL0yy4GWZObbSGiVhvyyxyizv2UbAzGWWJ9kH0*';
    
    console.log('🔧 Sabre Endpoint Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Token: ${this.accessToken.substring(0, 30)}...`);
  }

  async testBasicEndpoints() {
    console.log('\n🔍 Testing basic Sabre endpoints...');
    
    const basicEndpoints = [
      '/v1',
      '/v2',
      '/v1/',
      '/v2/',
      '/v1/lists',
      '/v1/shop',
      '/v1/hotels',
      '/v1/flights',
      '/v1/cars',
      '/v1/air',
      '/v1/travel',
      '/v1/utility',
      '/v1/geo',
      '/v1/lists/supported',
      '/v1/shop/hotels',
      '/v1/shop/flights',
      '/v1/shop/cars',
      '/v1/shop/air',
      '/v1/shop/travel',
      '/v1/shop/utility',
      '/v1/shop/geo'
    ];

    const workingEndpoints = [];

    for (const endpoint of basicEndpoints) {
      console.log(`\n🔧 Testing GET ${endpoint}`);
      
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 5000
        });

        console.log(`✅ SUCCESS with GET ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response type: ${typeof response.data}`);
        
        if (typeof response.data === 'object') {
          console.log(`📝 Response keys:`, Object.keys(response.data));
        }
        
        workingEndpoints.push(endpoint);
        
        // If we get a successful response, let's see what's available
        if (response.data && typeof response.data === 'object') {
          console.log(`📋 Sample response:`, JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
        }
        
      } catch (error) {
        console.log(`❌ Failed with GET ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return workingEndpoints;
  }

  async testSOAPEndpoints() {
    console.log('\n🔍 Testing SOAP-style endpoints...');
    
    const soapEndpoints = [
      '/v1/hotels/GetHotelMediaRQ',
      '/v1/shop/GetHotelMediaRQ',
      '/v1/hotels/GetHotelDescriptiveInfoRQ',
      '/v1/shop/GetHotelDescriptiveInfoRQ',
      '/v1/hotels/GetHotelListRQ',
      '/v1/shop/GetHotelListRQ',
      '/v1/hotels/GetHotelRateInfoRQ',
      '/v1/shop/GetHotelRateInfoRQ'
    ];

    const requestPayload = {
      "GetHotelMediaRQ": {
        "HotelRefs": {
          "HotelRef": [
            {
              "HotelCode": "426",
              "CodeContext": "Sabre"
            }
          ]
        }
      }
    };

    for (const endpoint of soapEndpoints) {
      console.log(`\n🔧 Testing POST ${endpoint}`);
      
      try {
        const response = await axios.post(`${this.baseUrl}${endpoint}`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with POST ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with POST ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async runTests() {
    console.log('🚀 Testing Available Sabre Endpoints\n');
    
    // Test basic endpoints
    const workingEndpoints = await this.testBasicEndpoints();
    
    if (workingEndpoints.length > 0) {
      console.log(`\n✅ Found ${workingEndpoints.length} working endpoints:`);
      workingEndpoints.forEach(endpoint => console.log(`   - ${endpoint}`));
    } else {
      console.log('\n❌ No working endpoints found');
    }
    
    // Test SOAP endpoints
    await this.testSOAPEndpoints();
    
    console.log('\n✅ Endpoint testing completed!');
  }
}

// Run the tests
const tester = new SabreEndpointTester();
tester.runTests().catch(console.error);
