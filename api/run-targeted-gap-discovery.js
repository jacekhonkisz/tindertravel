const { TargetedGapDiscovery } = require('./dist/targeted-gap-discovery');

async function runTargetedDiscovery() {
  console.log('🎯 Starting Targeted Gap Discovery for Under-Represented Destinations...\n');
  
  console.log('🏨 LUXURY CRITERIA:');
  console.log('   ⭐ Rating: 4.0+ stars (or unrated unique properties)');
  console.log('   📸 Photos: Minimum 4 high-quality images');
  console.log('   💰 Price Level: High-end (3+ or unrated)');
  console.log('   🏷️  Keywords: Must contain luxury/boutique indicators');
  console.log('   🎯 Focus: Beautiful, unique, luxurious properties only\n');
  
  console.log('🌍 TARGET DESTINATIONS:');
  console.log('   🏙️  Urban Luxury: NYC, London, Paris, Singapore, Hong Kong, Rome, Tokyo, Dubai');
  console.log('   🏔️  Alpine Luxury: St. Moritz, Courchevel, Zermatt');
  console.log('   🏝️  Caribbean Paradise: St. Barts, Barbados, Turks & Caicos');
  console.log('   🏛️  Cultural Heritage: Machu Picchu, Petra');
  console.log('   📊 Total: 15+ destinations with gaps to fill\n');
  
  try {
    const discovery = new TargetedGapDiscovery();
    await discovery.discoverTargetedHotels();
    
    console.log('\n🎉 Targeted gap discovery completed successfully!');
    console.log('📊 Check the results above for detailed statistics.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Targeted discovery failed:', error.message);
    process.exit(1);
  }
}

runTargetedDiscovery();
