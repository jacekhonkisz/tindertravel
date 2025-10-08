const axios = require('axios');

class DebugSabreAuth {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.clientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.clientSecret = 'nw6LvA5D';
  }

  async testExactWorkingMethod() {
    console.log('🔧 Testing exact method that worked before...');
    
    try {
      // This is the exact method that worked in the credential tester
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      console.log('Base64 credentials:', credentials);
      
      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.access_token) {
        console.log('✅ SUCCESS! Authentication worked!');
        console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
        console.log(`⏰ Type: ${response.data.token_type}`);
        console.log(`⏱️  Expires: ${response.data.expires_in}s`);
        return response.data.access_token;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error}`);
      console.log(`   Description: ${error.response?.data?.error_description}`);
    }
    
    return null;
  }

  async testWithDifferentHeaders() {
    console.log('\n🔧 Testing with different headers...');
    
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
          // Removed Accept header
        },
        timeout: 10000
      });

      if (response.data.access_token) {
        console.log('✅ SUCCESS with different headers!');
        return response.data.access_token;
      }
    } catch (error) {
      console.log(`❌ Failed with different headers: ${error.response?.status}`);
    }
    
    return null;
  }

  async runDebug() {
    console.log('🚀 Debugging Sabre Authentication\n');
    
    const token1 = await this.testExactWorkingMethod();
    const token2 = await this.testWithDifferentHeaders();
    
    if (token1 || token2) {
      console.log('\n🎉 Found working method!');
    } else {
      console.log('\n❌ All methods failed');
    }
  }
}

const debugger = new DebugSabreAuth();
debugger.runDebug().catch(console.error);
