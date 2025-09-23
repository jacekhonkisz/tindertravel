const { TargetedLuxuryDiscovery } = require('./dist/targeted-luxury-discovery');

async function testTargetedLuxuryDiscovery() {
  console.log('�� TESTING TARGETED LUXURY DISCOVERY SYSTEM');
  console.log('============================================\n');
  
  console.log('📋 DISCOVERY CRITERIA:');
  console.log('✅ Beautiful, luxurious, boutique properties ONLY');
  console.log('✅ Minimum 4 high-quality photos (1200x800+)');
  console.log('✅ Rating 4.0+ stars');
  console.log('✅ Hybrid Amadeus + Google Places system');
  console.log('✅ Focus on under-represented destinations\n');
  
  console.log('🎯 TARGET DESTINATIONS:');
  console.log('🏙️  URBAN LUXURY: NYC, London, Paris, Singapore, Hong Kong');
  console.log('🏔️  ALPINE LUXURY: St. Moritz, Courchevel, Zermatt');
  console.log('🏝️  CARIBBEAN: St. Barts, Barbados, Turks & Caicos');
  console.log('🏛️  CULTURAL: Machu Picchu, Petra');
  console.log('📈 EXPANSION: Rome, Tokyo, Dubai\n');
  
  try {
    const discovery = new TargetedLuxuryDiscovery();
    const results = await discovery.discoverTargetedLuxuryHotels();
    
    console.log('\n🎉 TARGETED LUXURY DISCOVERY COMPLETED!');
    console.log('=====================================\n');
    
    console.log('📊 FINAL RESULTS:');
    console.log(`   Destinations Processed: ${results.processedTargets}/${results.totalTargets}`);
    console.log(`   Hotels Found: ${results.totalHotelsFound}`);
    console.log(`   Hotels with Quality Photos: ${results.totalHotelsWithPhotos}`);
    console.log(`   Hotels Stored: ${results.totalHotelsStored}`);
    
    if (results.failedDestinations.length > 0) {
      console.log(`   Failed Destinations: ${results.failedDestinations.join(', ')}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Targeted luxury discovery test failed:', error.message);
    process.exit(1);
  }
}

testTargetedLuxuryDiscovery();
