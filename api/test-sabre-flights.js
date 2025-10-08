const axios = require('axios');

class SabreFlightsTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQK8L2bM5IvRv9bGxIrT9Lzfb3+QgKo27WdW+E89Ms/2xhD3Y+cXuee8J5gd7L1bmgUgAADglIARfFP73UvCNz+HolrznYonWj/EetVXVfeXFnHs6Zr3XvrdBM/d3QnjvZZ3Mlh/wWn9U1zxoJ3fvExsIjw0Wy1uv+HtYzJrk9aeh1wYVDoSnG3lCsptBSvbfuuhFWc3sHbdClThilgKSYGHaKKdz2sRULFLqiQRXAf8rpVmxmjqyzhwK0lU1KpYkJl+nzZtxxn7uSjTeZIe7kZYT/gYk/esTmtg+1X+I/P9kJ+WoorjdI7YiDcVVUKSeEzIrrgAKJ81yeL0yy4GWZObbSGiVhvyyxyizv2UbAzGWWJ9kH0*';
    
    console.log('🔧 Sabre Flights Tester Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Token: ${this.accessToken.substring(0, 30)}...`);
  }

  async testFlightsAPI() {
    console.log('\n✈️ Testing Sabre Flights API...');
    
    // Test with required parameters
    const testParams = {
      origin: 'LAX',
      destination: 'NYC',
      departuredate: '2025-10-15',
      returndate: '2025-10-20',
      passengers: 1
    };

    try {
      const response = await axios.get(`${this.baseUrl}/v1/shop/flights`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        params: testParams,
        timeout: 15000
      });

      console.log('✅ Flights API call successful!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.log(`❌ Flights API failed: ${error.response?.status}`);
      console.log(`📄 Error:`, error.response?.data);
      
      // Try with different parameters
      console.log('\n🔄 Trying with different parameters...');
      return await this.testFlightsWithDifferentParams();
    }
  }

  async testFlightsWithDifferentParams() {
    const testCases = [
      {
        name: 'Minimal params',
        params: { origin: 'LAX', destination: 'NYC' }
      },
      {
        name: 'With departure date',
        params: { origin: 'LAX', destination: 'NYC', departuredate: '2025-10-15' }
      },
      {
        name: 'Round trip',
        params: { 
          origin: 'LAX', 
          destination: 'NYC', 
          departuredate: '2025-10-15',
          returndate: '2025-10-20'
        }
      },
      {
        name: 'With passengers',
        params: { 
          origin: 'LAX', 
          destination: 'NYC', 
          departuredate: '2025-10-15',
          passengers: 1
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔧 Testing: ${testCase.name}`);
      
      try {
        const response = await axios.get(`${this.baseUrl}/v1/shop/flights`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          },
          params: testCase.params,
          timeout: 10000
        });

        console.log(`✅ SUCCESS with ${testCase.name}!`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${testCase.name}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async testOtherAccessibleEndpoints() {
    console.log('\n🔍 Testing other potentially accessible endpoints...');
    
    const endpoints = [
      {
        path: '/v1/shop/flights',
        method: 'GET',
        params: { origin: 'LAX', destination: 'NYC' }
      },
      {
        path: '/v1/shop/flights/cheapest',
        method: 'GET',
        params: { origin: 'LAX', destination: 'NYC' }
      },
      {
        path: '/v1/shop/flights/calendar',
        method: 'GET',
        params: { origin: 'LAX', destination: 'NYC' }
      },
      {
        path: '/v1/shop/flights/inspiration',
        method: 'GET',
        params: { origin: 'LAX' }
      }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔧 Testing ${endpoint.method} ${endpoint.path}`);
      
      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        };

        let response;
        if (endpoint.method === 'GET') {
          response = await axios.get(`${this.baseUrl}${endpoint.path}`, {
            ...config,
            params: endpoint.params
          });
        } else {
          response = await axios.post(`${this.baseUrl}${endpoint.path}`, endpoint.params, config);
        }

        console.log(`✅ SUCCESS with ${endpoint.method} ${endpoint.path}!`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${endpoint.method} ${endpoint.path}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async runTests() {
    console.log('🚀 Testing Sabre Flights API\n');
    
    // Test flights API
    const flightsResult = await this.testFlightsAPI();
    
    if (!flightsResult) {
      // Test other accessible endpoints
      await this.testOtherAccessibleEndpoints();
    }
    
    console.log('\n✅ Flights API testing completed!');
  }
}

// Run the tests
const tester = new SabreFlightsTester();
tester.runTests().catch(console.error);
