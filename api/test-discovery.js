const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

class DiscoveryTester {
  constructor() {
    this.sessionId = null;
  }

  async testDiscoverySystem() {
    console.log('🧪 Testing Global Hotel Discovery System\n');

    try {
      // 1. Get recommended configuration
      console.log('📋 Getting recommended configuration...');
      const configResponse = await axios.get(`${API_BASE}/discovery/config/recommended`);
      console.log('✅ Recommended config:', JSON.stringify(configResponse.data.config, null, 2));

      // 2. Test with a smaller configuration for demo
      const testConfig = {
        targetCount: 50,
        continents: ['Europe'],
        skipExisting: false,
        batchSize: 5,
        qualityThreshold: {
          minPhotos: 4,
          minRating: 4.0
        }
      };

      // 3. Validate configuration
      console.log('\n🔍 Validating test configuration...');
      const validationResponse = await axios.post(`${API_BASE}/discovery/config/validate`, testConfig);
      console.log('✅ Validation result:', validationResponse.data);

      if (!validationResponse.data.valid) {
        console.log('❌ Configuration invalid, stopping test');
        return;
      }

      // 4. Start discovery
      console.log('\n🚀 Starting hotel discovery...');
      const startResponse = await axios.post(`${API_BASE}/discovery/start`, testConfig);
      this.sessionId = startResponse.data.sessionId;
      console.log('✅ Discovery started:', startResponse.data);

      // 5. Monitor progress
      console.log('\n📊 Monitoring progress...');
      await this.monitorProgress();

      // 6. Get final results
      console.log('\n📈 Getting final results...');
      const finalStatus = await axios.get(`${API_BASE}/discovery/status`);
      console.log('✅ Final status:', JSON.stringify(finalStatus.data, null, 2));

    } catch (error) {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }

  async monitorProgress() {
    const maxChecks = 20; // Maximum number of status checks
    let checks = 0;

    while (checks < maxChecks) {
      try {
        const statusResponse = await axios.get(`${API_BASE}/discovery/status`);
        const { currentSession, liveProgress, stats } = statusResponse.data;

        if (!currentSession) {
          console.log('ℹ️ No active session');
          break;
        }

        console.log(`\n📊 Progress Update (${checks + 1}/${maxChecks}):`);
        console.log(`   Session: ${currentSession.id}`);
        console.log(`   Status: ${currentSession.status}`);
        
        if (liveProgress) {
          console.log(`   Locations: ${liveProgress.processedLocations}/${liveProgress.totalLocations}`);
          console.log(`   Hotels Found: ${liveProgress.totalHotelsFound}`);
          console.log(`   With Photos: ${liveProgress.totalHotelsWithPhotos}`);
          console.log(`   Stored: ${liveProgress.totalHotelsStored}`);
          console.log(`   Current: ${liveProgress.currentLocation || 'N/A'}`);
        }

        if (stats) {
          console.log(`   Total Hotels in DB: ${stats.totalHotels}`);
        }

        if (currentSession.status === 'completed' || currentSession.status === 'failed') {
          console.log(`\n🎉 Discovery ${currentSession.status}!`);
          break;
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        checks++;

      } catch (error) {
        console.error('❌ Error checking status:', error.response?.data || error.message);
        break;
      }
    }
  }

  async testQuickStart() {
    console.log('⚡ Quick Start Test - Finding hotels in Santorini\n');

    try {
      const quickConfig = {
        targetCount: 10,
        continents: ['Europe'],
        skipExisting: false,
        batchSize: 2
      };

      console.log('🚀 Starting quick discovery...');
      const startResponse = await axios.post(`${API_BASE}/discovery/start`, quickConfig);
      console.log('✅ Started:', startResponse.data.sessionId);

      // Monitor for 30 seconds
      setTimeout(async () => {
        try {
          const status = await axios.get(`${API_BASE}/discovery/status`);
          console.log('\n📊 Quick test results:', JSON.stringify(status.data, null, 2));
        } catch (error) {
          console.error('Error getting final status:', error.message);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Quick test failed:', error.response?.data || error.message);
    }
  }

  async testAPIEndpoints() {
    console.log('🔧 Testing API Endpoints\n');

    try {
      // Test all endpoints
      console.log('1. Testing /discovery/status');
      const status = await axios.get(`${API_BASE}/discovery/status`);
      console.log('✅ Status endpoint working');

      console.log('2. Testing /discovery/sessions');
      const sessions = await axios.get(`${API_BASE}/discovery/sessions`);
      console.log('✅ Sessions endpoint working');

      console.log('3. Testing /discovery/config/recommended');
      const config = await axios.get(`${API_BASE}/discovery/config/recommended`);
      console.log('✅ Config endpoint working');

      console.log('\n🎉 All API endpoints are working!');

    } catch (error) {
      console.error('❌ API test failed:', error.response?.data || error.message);
    }
  }
}

// Run tests
async function runTests() {
  const tester = new DiscoveryTester();

  const testType = process.argv[2] || 'api';

  switch (testType) {
    case 'full':
      await tester.testDiscoverySystem();
      break;
    case 'quick':
      await tester.testQuickStart();
      break;
    case 'api':
    default:
      await tester.testAPIEndpoints();
      break;
  }
}

console.log('🌍 Global Hotel Discovery Test Suite');
console.log('Usage: node test-discovery.js [api|quick|full]\n');

runTests().catch(console.error); 