const axios = require('axios');

class WorkingSabreClient {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.clientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.clientSecret = 'nw6LvA5D';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    console.log('🔧 Working Sabre Client Initialized');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🔑 Client ID: ${this.clientId}`);
  }

  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('✅ Using existing valid token');
      return this.accessToken;
    }

    console.log('🔑 Getting new Sabre access token...');
    
    try {
      // Use Basic Auth with Base64 encoded credentials (this method works!)
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
        this.accessToken = response.data.access_token;
        // Set expiry time (subtract 60 seconds for safety margin)
        this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
        
        console.log('✅ Sabre access token obtained successfully');
        console.log(`⏰ Token expires in: ${response.data.expires_in} seconds`);
        return this.accessToken;
      }
    } catch (error) {
      console.error('❌ Failed to get Sabre access token:', error.response?.data || error.message);
      throw error;
    }
  }

  async testHotelAPI() {
    console.log('\n🏨 Testing Sabre Hotel API...');
    
    try {
      const token = await this.getAccessToken();
      
      // Test the hotel descriptive info API
      const response = await axios.get(`${this.baseUrl}/v1/lists/supported/shop/hotels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Hotel API accessible!');
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
      console.error('❌ Hotel API test failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      throw error;
    }
  }

  async searchHotels(searchParams = {}) {
    console.log('\n🔍 Searching hotels with Sabre API...');
    
    try {
      const token = await this.getAccessToken();
      
      // Example hotel search - you may need to adjust parameters based on Sabre API docs
      const params = {
        ...searchParams,
        // Add default parameters if needed
      };
      
      const response = await axios.get(`${this.baseUrl}/v1/lists/supported/shop/hotels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: params,
        timeout: 15000
      });

      console.log('✅ Hotel search successful!');
      console.log(`📊 Status: ${response.status}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Hotel search failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      throw error;
    }
  }

  async runTests() {
    console.log('🚀 Running Sabre API Tests\n');
    
    try {
      // Test authentication
      await this.getAccessToken();
      
      // Test hotel API
      await this.testHotelAPI();
      
      console.log('\n✅ All Sabre API tests completed successfully!');
      console.log('\n🎯 Ready to use Sabre API for hotel data');
      
    } catch (error) {
      console.log('\n❌ Sabre API tests failed');
      console.error('Error:', error.message);
    }
  }
}

// Export for use in other modules
module.exports = WorkingSabreClient;

// Run tests if this file is executed directly
if (require.main === module) {
  const client = new WorkingSabreClient();
  client.runTests().catch(console.error);
}
