const { HotelPhotoReplacementSystem } = require('./hotel-photo-replacement-system');

async function implementFreePhotos() {
  console.log('🚀 IMPLEMENTING FREE HOTEL PHOTOS FOR TINDERTRAVEL');
  console.log('='.repeat(60));
  
  try {
    const system = new HotelPhotoReplacementSystem();
    
    // Step 1: Analyze current state
    console.log('\n📊 Step 1: Analyzing current hotel photo status...');
    const hotelsNeedingPhotos = await system.getHotelsNeedingPhotos(3);
    
    // Step 2: Start with a small batch for testing
    console.log('\n🧪 Step 2: Testing with first 10 hotels...');
    const testHotels = hotelsNeedingPhotos.slice(0, 10);
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      await system.replaceHotelPhotos(hotel, { skipExisting: false, minPhotos: 3 });
      
      // Add delay between hotels
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 3: Show results
    console.log('\n📈 Step 3: Test Results');
    system.printFinalStats();
    
    // Step 4: Ask if user wants to continue with all hotels
    console.log('\n🎯 Step 4: Ready for full implementation?');
    console.log(`Found ${hotelsNeedingPhotos.length} hotels needing photos`);
    console.log('Estimated time: 30-60 minutes for 1000 hotels');
    console.log('Cost: $0 (completely free)');
    
    console.log('\n🚀 To run full implementation:');
    console.log('node hotel-photo-replacement-system.js');
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Implementation failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has all API keys');
    console.log('2. Verify Supabase credentials');
    console.log('3. Run: node test-free-photo-system.js');
  }
}

// Run the implementation
implementFreePhotos().catch(console.error);
