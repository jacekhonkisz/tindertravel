const { EnhancedGlobalHotelDiscovery } = require('./dist/enhanced-global-hotel-discovery');

async function runEnhancedDiscovery() {
  console.log('🚀 Starting Enhanced Global Hotel Discovery...\n');
  
  try {
    const discovery = new EnhancedGlobalHotelDiscovery();
    await discovery.discoverGlobalHotels(1000);
    
    console.log('\n🎉 Enhanced discovery completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Enhanced discovery failed:', error.message);
    process.exit(1);
  }
}

runEnhancedDiscovery();
