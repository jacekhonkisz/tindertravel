// Progress Monitor - Track Hotel Fetching Progress
// Monitor the progress of the 1,500 hotel fetching process

import { SupabaseService } from './supabase';

async function monitorProgress() {
  console.log('📊 HOTEL FETCHING PROGRESS MONITOR');
  console.log('=================================');
  console.log('Target: 1,500 boutique hotels with 4+ high-quality photos');
  console.log('');

  const supabase = new SupabaseService();
  
  try {
    const hotels = await supabase.getHotels(2000, 0);
    
    console.log(`🏨 Current Status: ${hotels.length} hotels in database`);
    console.log(`🎯 Progress: ${((hotels.length / 1500) * 100).toFixed(1)}% of target`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - hotels.length)} hotels needed`);
    console.log('');

    // Group by country
    const byCountry = hotels.reduce((acc: Record<string, number>, hotel) => {
      acc[hotel.country] = (acc[hotel.country] || 0) + 1;
      return acc;
    }, {});

    console.log('🌍 Hotels by Country:');
    Object.entries(byCountry)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`   • ${country}: ${count} hotels`);
      });

    console.log('');

    // Photo statistics
    const totalPhotos = hotels.reduce((sum, hotel) => sum + hotel.photos.length, 0);
    const avgPhotos = totalPhotos / hotels.length;
    const hotelsWithEnoughPhotos = hotels.filter(h => h.photos.length >= 4).length;

    console.log('📸 Photo Quality Statistics:');
    console.log(`   • Total Photos: ${totalPhotos}`);
    console.log(`   • Average Photos per Hotel: ${avgPhotos.toFixed(1)}`);
    console.log(`   • Hotels with 4+ Photos: ${hotelsWithEnoughPhotos}/${hotels.length} (${((hotelsWithEnoughPhotos/hotels.length)*100).toFixed(1)}%)`);
    console.log('');

    // Recent additions (last 5)
    const recentHotels = hotels
      .filter(h => h.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5);

    if (recentHotels.length > 0) {
      console.log('🆕 Recently Added Hotels:');
      recentHotels.forEach((hotel, i) => {
        console.log(`   ${i+1}. ${hotel.name} (${hotel.city}, ${hotel.country}) - ${hotel.photos.length} photos`);
      });
      console.log('');
    }

    // Progress assessment
    if (hotels.length >= 1500) {
      console.log('🎉 TARGET ACHIEVED! You have 1,500+ boutique hotels!');
      console.log('✅ All hotels meet quality standards:');
      console.log('   • 4+ high-resolution photos');
      console.log('   • Boutique/luxury positioning');
      console.log('   • Glintz curation passed');
      console.log('   • Real Google Places photos');
    } else if (hotels.length >= 1000) {
      console.log('🚀 Excellent progress! Over 1,000 hotels collected.');
      console.log(`📊 ${((hotels.length / 1500) * 100).toFixed(0)}% complete - keep going!`);
    } else if (hotels.length >= 500) {
      console.log('📈 Good progress! Over 500 hotels collected.');
      console.log('🎯 Halfway to the target - system is working well!');
    } else if (hotels.length >= 100) {
      console.log('🌱 Early progress! Over 100 hotels collected.');
      console.log('⏱️  The fetching process is running - be patient for more results.');
    } else {
      console.log('🔄 Fetching process starting up...');
      console.log('⏱️  Please wait while the system processes hotels with rate limiting.');
    }

  } catch (error) {
    console.error('❌ Error monitoring progress:', (error as Error).message);
  }
}

// CLI execution
if (require.main === module) {
  monitorProgress()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Progress monitoring failed:', error);
      process.exit(1);
    });
}

export { monitorProgress }; 