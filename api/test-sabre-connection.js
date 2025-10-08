const axios = require('axios');

class SabreConnectionTester {
  constructor() {
    // Sabre API configuration with provided credentials
    this.sabreBaseUrl = 'https://api.cert.platform.sabre.com'; // Using cert environment as specified
    this.sabreClientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.sabreClientSecret = 'nw6LvA5D';
    
    console.log('🔧 Sabre Connection Tester Initialized');
    console.log(`📍 Base URL: ${this.sabreBaseUrl}`);
    console.log(`🔑 Client ID: ${this.sabreClientId}`);
    console.log(`🔐 Client Secret: ${this.sabreClientSecret.substring(0, 3)}***`);
  }

  async testAuthentication() {
    console.log('\n🔑 Testing Sabre Authentication...');
    
    try {
      // Method 1: Using URLSearchParams (recommended)
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.sabreClientId);
      params.append('client_secret', this.sabreClientSecret);

      const response = await axios.post(`${this.sabreBaseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.access_token) {
        console.log('✅ Sabre authentication successful!');
        console.log(`🎫 Access Token: ${response.data.access_token.substring(0, 20)}...`);
        console.log(`⏰ Token Type: ${response.data.token_type}`);
        console.log(`⏱️  Expires In: ${response.data.expires_in} seconds`);
        return response.data.access_token;
      } else {
        console.log('❌ No access token in response');
        console.log('📄 Response:', response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ Sabre authentication failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`�� Error Data:`, error.response?.data);
      console.error(`🔍 Error Message:`, error.message);
      
      // Try alternative authentication method
      console.log('\n🔄 Trying alternative authentication method...');
      return await this.testAlternativeAuth();
    }
  }

  async testAlternativeAuth() {
    try {
      const response = await axios.post(`${this.sabreBaseUrl}/v2/auth/token`, {
        grant_type: 'client_credentials',
        client_id: this.sabreClientId,
        client_secret: this.sabreClientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.access_token) {
        console.log('✅ Alternative authentication successful!');
        return response.data.access_token;
      }
    } catch (error) {
      console.error('❌ Alternative authentication also failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
    }
    return null;
  }

  async testHotelAPI(accessToken) {
    if (!accessToken) {
      console.log('❌ No access token available for API testing');
      return;
    }

    console.log('\n🏨 Testing Sabre Hotel API...');
    
    try {
      // Test Hotel Descriptive Info API
      const hotelResponse = await axios.get(`${this.sabreBaseUrl}/v1/lists/supported/shop/hotels`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Hotel API accessible!');
      console.log(`📊 Status: ${hotelResponse.status}`);
      console.log(`📄 Response keys:`, Object.keys(hotelResponse.data));
      
      return true;
    } catch (error) {
      console.error('❌ Hotel API test failed:');
      console.error(`📊 Status: ${error.response?.status}`);
      console.error(`📄 Error Data:`, error.response?.data);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Sabre API Connection Test\n');
    
    const accessToken = await this.testAuthentication();
    
    if (accessToken) {
      await this.testHotelAPI(accessToken);
      console.log('\n✅ Sabre API connection test completed successfully!');
    } else {
      console.log('\n❌ Sabre API connection test failed');
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('1. Verify credentials in Sabre Developer Portal');
      console.log('2. Check if application has proper API access');
      console.log('3. Ensure no IP restrictions are blocking access');
      console.log('4. Verify the API endpoint URL is correct');
    }
  }
}

// Run the test
const tester = new SabreConnectionTester();
tester.runFullTest().catch(console.error);
