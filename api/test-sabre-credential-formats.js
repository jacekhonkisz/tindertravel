const axios = require('axios');

class SabreCredentialTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    
    // Original credentials
    this.originalClientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.originalClientSecret = 'nw6LvA5D';
    
    // Try different variations
    this.credentialVariations = [
      {
        name: 'Original Format',
        clientId: this.originalClientId,
        clientSecret: this.originalClientSecret
      },
      {
        name: 'Without V1: prefix',
        clientId: 'n07msjql7g5bqtku:DEVCENTER:EXT',
        clientSecret: this.originalClientSecret
      },
      {
        name: 'URL Encoded',
        clientId: encodeURIComponent(this.originalClientId),
        clientSecret: encodeURIComponent(this.originalClientSecret)
      },
      {
        name: 'Base64 Encoded',
        clientId: Buffer.from(this.originalClientId).toString('base64'),
        clientSecret: Buffer.from(this.originalClientSecret).toString('base64')
      }
    ];
  }

  async testCredentials(credentialSet) {
    console.log(`\n🔧 Testing: ${credentialSet.name}`);
    console.log(`   Client ID: ${credentialSet.clientId}`);
    console.log(`   Client Secret: ${credentialSet.clientSecret.substring(0, 3)}***`);
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', credentialSet.clientId);
      params.append('client_secret', credentialSet.clientSecret);

      const response = await axios.post(`${this.baseUrl}/v2/auth/token`, params, {
        headers: {
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

  async testBasicAuth(credentialSet) {
    console.log(`\n🔧 Testing Basic Auth: ${credentialSet.name}`);
    
    try {
      const credentials = Buffer.from(`${credentialSet.clientId}:${credentialSet.clientSecret}`).toString('base64');
      
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
        console.log('✅ SUCCESS! Basic Auth worked!');
        console.log(`🎫 Token: ${response.data.access_token.substring(0, 30)}...`);
        return response.data.access_token;
      }
    } catch (error) {
      console.log(`❌ Basic Auth Failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error}`);
    }
    
    return null;
  }

  async runAllTests() {
    console.log('🚀 Testing Sabre Credential Formats\n');
    console.log('📍 Base URL:', this.baseUrl);
    
    for (const credentialSet of this.credentialVariations) {
      const token = await this.testCredentials(credentialSet);
      if (token) {
        console.log('\n🎉 Found working credentials!');
        return token;
      }
      
      // Also try basic auth
      const basicToken = await this.testBasicAuth(credentialSet);
      if (basicToken) {
        console.log('\n🎉 Found working basic auth!');
        return basicToken;
      }
    }
    
    console.log('\n❌ All credential formats failed');
    console.log('\n🔧 Possible issues:');
    console.log('1. Credentials may be expired or invalid');
    console.log('2. Application may not be approved for API access');
    console.log('3. IP restrictions may be blocking access');
    console.log('4. Sabre API endpoint or authentication method may have changed');
    console.log('\n💡 Next steps:');
    console.log('1. Log into Sabre Developer Portal and verify credentials');
    console.log('2. Check application status and permissions');
    console.log('3. Contact Sabre support if credentials appear correct');
  }
}

const tester = new SabreCredentialTester();
tester.runAllTests().catch(console.error);
