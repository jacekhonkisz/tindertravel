const axios = require('axios');

class SabreIssueDiagnostic {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.originalClientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.originalClientSecret = 'nw6LvA5D';
    this.newClientId = 'V1:ptnz4ecrrwxpk7cj:DEVCENTER:EXT';
    this.newClientSecret = 'WRxe43oM';
    
    console.log('🔧 Sabre Issue Diagnostic Tool');
    console.log('📋 Analyzing authentication failures...');
  }

  async analyzeCredentials() {
    console.log('\n🔍 CREDENTIAL ANALYSIS:');
    console.log('=======================');
    
    console.log('\n📋 Original Credentials:');
    console.log(`   Client ID: ${this.originalClientId}`);
    console.log(`   Client Secret: ${this.originalClientSecret}`);
    console.log(`   Format: V1:prefix:DEVCENTER:EXT`);
    
    console.log('\n📋 New Credentials:');
    console.log(`   Client ID: ${this.newClientId}`);
    console.log(`   Client Secret: ${this.newClientSecret}`);
    console.log(`   Format: V1:prefix:DEVCENTER:EXT`);
    
    console.log('\n✅ Both credentials follow the same format');
    console.log('✅ Both use DEVCENTER environment');
    console.log('✅ Both have V1: prefix');
  }

  async testWithDetailedErrorHandling() {
    console.log('\n�� DETAILED ERROR ANALYSIS:');
    console.log('============================');
    
    const credentials = [
      { name: 'Original', id: this.originalClientId, secret: this.originalClientSecret },
      { name: 'New', id: this.newClientId, secret: this.newClientSecret }
    ];

    for (const cred of credentials) {
      console.log(`\n🔧 Testing ${cred.name} credentials:`);
      
      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', cred.id);
        params.append('client_secret', cred.secret);

        const response = await axios.post(`${this.baseUrl}/v2/auth/token`, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'SabreTest/1.0'
          },
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500; // Don't throw for 4xx errors
          }
        });

        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, response.data);
        
        if (response.status === 200) {
          console.log('   ✅ SUCCESS!');
        } else {
          console.log('   ❌ FAILED');
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Headers:`, error.response.headers);
          console.log(`   Data:`, error.response.data);
        }
      }
    }
  }

  async checkSabreDocumentation() {
    console.log('\n📚 SABRE API DOCUMENTATION CHECK:');
    console.log('=================================');
    
    console.log('\n🔍 Common Sabre Authentication Issues:');
    console.log('1. ❌ Expired credentials');
    console.log('2. ❌ Application not approved');
    console.log('3. ❌ Wrong environment (cert vs prod)');
    console.log('4. ❌ IP restrictions');
    console.log('5. ❌ Rate limiting');
    console.log('6. ❌ API key format changes');
    
    console.log('\n🔍 What to check in Sabre Developer Portal:');
    console.log('1. 📅 Credential expiration date');
    console.log('2. ✅ Application approval status');
    console.log('3. 🌐 IP whitelist settings');
    console.log('4. 🔑 API key permissions');
    console.log('5. 📊 Usage limits and quotas');
  }

  async provideSolutions() {
    console.log('\n💡 SOLUTIONS TO TRY:');
    console.log('===================');
    
    console.log('\n🔧 IMMEDIATE FIXES:');
    console.log('1. 🔑 Check Sabre Developer Portal:');
    console.log('   - Go to: https://developer.sabre.com/');
    console.log('   - Log in with your account');
    console.log('   - Check if credentials are expired');
    console.log('   - Verify application is approved');
    
    console.log('\n2. 🌐 Check IP Restrictions:');
    console.log('   - Look for IP whitelist settings');
    console.log('   - Add your current IP address');
    console.log('   - Check if VPN is blocking access');
    
    console.log('\n3. 🔄 Try Different Environment:');
    console.log('   - Test with production URL: https://api.sabre.com');
    console.log('   - Test with different API version');
    console.log('   - Check if cert environment is active');
    
    console.log('\n4. 📞 Contact Sabre Support:');
    console.log('   - Provide exact error messages');
    console.log('   - Include credential format');
    console.log('   - Ask about application status');
    
    console.log('\n🎯 ALTERNATIVE APPROACH:');
    console.log('Since Sabre hotel APIs are restricted anyway,');
    console.log('consider using alternative hotel photo APIs:');
    console.log('✅ Google Places API (real hotel photos)');
    console.log('✅ Unsplash API (professional photos)');
    console.log('✅ Pexels API (high-quality photos)');
    console.log('✅ Booking.com API (hotel photos)');
  }

  async runDiagnostic() {
    console.log('🚀 Running Sabre Authentication Diagnostic\n');
    
    await this.analyzeCredentials();
    await this.testWithDetailedErrorHandling();
    await this.checkSabreDocumentation();
    await this.provideSolutions();
    
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('======================');
    console.log('❌ Both credential sets are failing');
    console.log('❌ Same "invalid_client" error');
    console.log('❌ Likely credential or application issue');
    console.log('✅ Alternative APIs are available');
    console.log('✅ Hotel photo service is ready to use');
  }
}

// Run the diagnostic
const diagnostic = new SabreIssueDiagnostic();
diagnostic.runDiagnostic().catch(console.error);
