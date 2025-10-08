/**
 * Hotelbeds API Usage Example
 * 
 * This example shows how to use the Hotelbeds API client
 * to fetch hotels with priority photos (XXL quality 2048px)
 */

require('dotenv').config();
const { HotelbedsClient } = require('../src/hotelbeds.js');

async function exampleUsage() {
  console.log('🏨 Hotelbeds API Usage Example');
  console.log('=' .repeat(50));
  
  try {
    // Initialize client (uses environment variables)
    const client = new HotelbedsClient();
    
    // Get API info
    const apiInfo = client.getApiInfo();
    console.log('📋 API Configuration:');
    console.log('   Base URL:', apiInfo.baseUrl);
    console.log('   Photo Base URL:', apiInfo.photoBaseUrl);
    console.log('   Has Credentials:', apiInfo.hasCredentials);
    
    // Example 1: Get single hotel with priority photos
    console.log('\\n🔍 Example 1: Single Hotel with Priority Photos');
    const hotelData = await client.getHotelWithPriorityPhotos(1);
    
    console.log('   Hotel:', hotelData.hotel.name?.content);
    console.log('   Rating:', hotelData.hotel.S2C);
    console.log('   Total Images:', hotelData.allPhotos.length);
    console.log('   General Views:', hotelData.priorityPhotos.generalViews.length);
    console.log('   Pools:', hotelData.priorityPhotos.pools.length);
    console.log('   Rooms:', hotelData.priorityPhotos.rooms.length);
    
    // Example 2: Get multiple hotels
    console.log('\\n🔍 Example 2: Multiple Hotels');
    const hotelsData = await client.getHotelsWithPriorityPhotos([1, 2]);
    
    hotelsData.forEach((hotel, index) => {
      console.log(`   Hotel ${index + 1}:`, hotel.hotel.name?.content);
      console.log(`   Images:`, hotel.allPhotos.length);
    });
    
    // Example 3: Test image accessibility
    console.log('\\n🔍 Example 3: Test Image Accessibility');
    if (hotelData.priorityPhotos.generalViews.length > 0) {
      const testResult = await client.testImageAccess(hotelData.priorityPhotos.generalViews[0]);
      console.log('   First Image Test:', testResult);
    }
    
    console.log('\\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = { exampleUsage };
