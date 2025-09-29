const axios = require('axios');

async function testPhotoAudit() {
  try {
    console.log('🔍 Testing photo quality audit system...');
    
    // Test if the audit endpoint exists
    const response = await axios.post('http://localhost:3001/api/audit/photos');
    console.log('✅ Photo audit completed:', response.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Photo audit endpoint not found');
      console.log('Available endpoints:');
      
      // Test basic endpoints
      try {
        const health = await axios.get('http://localhost:3001/health');
        console.log('✅ Health endpoint working');
      } catch (e) {
        console.log('❌ Health endpoint not working');
      }
      
      try {
        const hotels = await axios.get('http://localhost:3001/api/hotels?limit=1');
        console.log('✅ Hotels endpoint working');
      } catch (e) {
        console.log('❌ Hotels endpoint not working');
      }
      
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

testPhotoAudit();
