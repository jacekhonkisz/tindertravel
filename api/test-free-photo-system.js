const { EnhancedFreeHotelPhotoService } = require('./enhanced-free-hotel-photo-service');
const { HotelPhotoReplacementSystem } = require('./hotel-photo-replacement-system');

async function testFreePhotoSystem() {
  console.log('🧪 Testing Free Hotel Photo System...\n');
  
  // Test 1: Photo Service
  console.log('📸 Test 1: Enhanced Photo Service');
  const photoService = new EnhancedFreeHotelPhotoService();
  
  try {
    const photos = await photoService.getExactHotelPhotos(
      'The Ritz-Carlton',
      'New York',
      'United States',
      5
    );
    
    console.log(`✅ Photo Service Test: ${photos.length} photos found`);
    if (photos.length > 0) {
      console.log(`   Sample photo: ${photos[0].url}`);
      console.log(`   Sources: ${photos.map(p => p.source).join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Photo Service Test Failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Database Integration
  console.log('🗄️ Test 2: Database Integration');
  
  try {
    const system = new HotelPhotoReplacementSystem();
    
    // Test database connection
    const hotelsNeedingPhotos = await system.getHotelsNeedingPhotos(3);
    console.log(`✅ Database Test: Found ${hotelsNeedingPhotos.length} hotels needing photos`);
    
    if (hotelsNeedingPhotos.length > 0) {
      console.log(`   Sample hotel: ${hotelsNeedingPhotos[0].name}`);
    }
    
  } catch (error) {
    console.log(`❌ Database Test Failed: ${error.message}`);
    console.log('   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: API Keys Check
  console.log('🔑 Test 3: API Keys Check');
  
  const requiredKeys = [
    'UNSPLASH_ACCESS_KEY',
    'PEXELS_API_KEY', 
    'PIXABAY_API_KEY'
  ];
  
  const missingKeys = requiredKeys.filter(key => !process.env[key] || process.env[key] === `YOUR_${key}`);
  
  if (missingKeys.length === 0) {
    console.log('✅ All API keys are configured');
  } else {
    console.log(`❌ Missing API keys: ${missingKeys.join(', ')}`);
    console.log('   Please add them to your .env file');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Summary
  console.log('📊 TEST SUMMARY:');
  console.log('1. Photo Service: Tests individual photo fetching');
  console.log('2. Database Integration: Tests Supabase connection');
  console.log('3. API Keys: Checks configuration');
  console.log('\n🚀 Next Steps:');
  console.log('1. Get free API keys from Unsplash, Pexels, Pixabay');
  console.log('2. Add keys to .env file');
  console.log('3. Run: node hotel-photo-replacement-system.js --test');
  console.log('4. Run: node hotel-photo-replacement-system.js (for all hotels)');
}

// Run the test
testFreePhotoSystem().catch(console.error);
