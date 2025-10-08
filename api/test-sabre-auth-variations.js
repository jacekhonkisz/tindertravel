const axios = require('axios');

class SabreAuthVariations {
  constructor() {
    this.sabreClientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.sabreClientSecret = 'nw6LvA5D';
    
    // Try different base URLs
    this.baseUrls = [
      'https://api.cert.platform.sabre.com',
      'https://api.sabre.com',
      'https://api.test.platform.sabre.com'
    ];
  }

  async testMethod1(baseUrl) {
    console.log(`\n🔧 Method 1: URLSearchParams with ${baseUrl}`);
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.sabreClientId);
      params.append('client_secret', this.sabreClientSecret);

      const response = await axios.post(`${baseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Success!');
      console.log(`Token: ${response.data.access_token.substring(0, 20)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod2(baseUrl) {
    console.log(`\n🔧 Method 2: Form data object with ${baseUrl}`);
    try {
      const response = await axios.post(`${baseUrl}/v2/auth/token`, {
        grant_type: 'client_credentials',
        client_id: this.sabreClientId,
        client_secret: this.sabreClientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Success!');
      console.log(`Token: ${response.data.access_token.substring(0, 20)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod3(baseUrl) {
    console.log(`\n🔧 Method 3: Basic Auth with ${baseUrl}`);
    try {
      const credentials = Buffer.from(`${this.sabreClientId}:${this.sabreClientSecret}`).toString('base64');
      
      const response = await axios.post(`${baseUrl}/v2/auth/token`, 
        'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Success!');
      console.log(`Token: ${response.data.access_token.substring(0, 20)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async testMethod4(baseUrl) {
    console.log(`\n🔧 Method 4: Different client_id format with ${baseUrl}`);
    try {
      // Try without the V1: prefix
      const clientId = this.sabreClientId.replace('V1:', '');
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', this.sabreClientSecret);

      const response = await axios.post(`${baseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Success!');
      console.log(`Token: ${response.data.access_token.substring(0, 20)}...`);
      return response.data.access_token;
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.error_description}`);
      return null;
    }
  }

  async runAllTests() {
    console.log('🚀 Testing Sabre Authentication Variations\n');
    
    for (const baseUrl of this.baseUrls) {
      console.log(`\n📍 Testing with base URL: ${baseUrl}`);
      
      const methods = [
        () => this.testMethod1(baseUrl),
        () => this.testMethod2(baseUrl),
        () => this.testMethod3(baseUrl),
        () => this.testMethod4(baseUrl)
      ];

      for (const method of methods) {
        const token = await method();
        if (token) {
          console.log(`\n🎉 Found working method!`);
          return token;
        }
      }
    }
    
    console.log('\n❌ All authentication methods failed');
    console.log('\n🔧 Next steps:');
    console.log('1. Double-check credentials in Sabre Developer Portal');
    console.log('2. Verify the application is approved and active');
    console.log('3. Check if there are IP restrictions');
    console.log('4. Contact Sabre support if credentials are correct');
  }
}

const tester = new SabreAuthVariations();
tester.runAllTests().catch(console.error);
