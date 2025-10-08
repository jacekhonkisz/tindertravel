const axios = require('axios');

class SabreAuthMethodsTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.clientId = 'V1:ptnz4ecrrwxpk7cj:DEVCENTER:EXT';
    this.clientSecret = 'WRxe43oM';
    
    console.log('🔧 Sabre Auth Methods Tester');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🔑 Client ID: ${this.clientId}`);
    console.log(`🔐 Client Secret: ${this.clientSecret.substring(0, 3)}***`);
  }

  async testMethod1() {
    console.log('\n🔧 Method 1: Basic Auth with Base64');
    
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Method 1 SUCCESS!');
      console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod2() {
    console.log('\n🔧 Method 2: URLSearchParams');
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Method 2 SUCCESS!');
      console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Method 2 failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod3() {
    console.log('\n🔧 Method 3: Form data object');
    
    try {
      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Method 3 SUCCESS!');
      console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Method 3 failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod4() {
    console.log('\n🔧 Method 4: Different client_id format');
    
    try {
      // Try without the V1: prefix
      const clientId = this.clientId.replace('V1:', '');
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Method 4 SUCCESS!');
      console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Method 4 failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod5() {
    console.log('\n🔧 Method 5: Different base URL');
    
    try {
      // Try production URL instead of cert
      const productionUrl = 'https://api.sabre.com';
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post(`${productionUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Method 5 SUCCESS!');
      console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Method 5 failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async runAllMethods() {
    console.log('🚀 Testing All Sabre Authentication Methods\n');
    
    const methods = [
      () => this.testMethod1(),
      () => this.testMethod2(),
      () => this.testMethod3(),
      () => this.testMethod4(),
      () => this.testMethod5()
    ];

    for (const method of methods) {
      const token = await method();
      if (token) {
        console.log('\n�� Found working authentication method!');
        console.log('✅ These credentials work for Sabre API');
        return token;
      }
    }
    
    console.log('\n❌ All authentication methods failed');
    console.log('\n🔧 Possible issues:');
    console.log('1. Credentials may be expired or invalid');
    console.log('2. Application may not be approved for API access');
    console.log('3. IP restrictions may be blocking access');
    console.log('4. Sabre API endpoint or authentication method may have changed');
    console.log('\n💡 Next steps:');
    console.log('1. Verify credentials in Sabre Developer Portal');
    console.log('2. Check application status and permissions');
    console.log('3. Contact Sabre support if credentials appear correct');
    console.log('4. Consider using alternative hotel photo APIs');
    
    return null;
  }
}

// Run the tests
const tester = new SabreAuthMethodsTester();
tester.runAllMethods().catch(console.error);
