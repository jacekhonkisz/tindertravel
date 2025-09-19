// Start Global Hotel Fetching
// Launch comprehensive worldwide hotel collection

import { GlobalHotelFetcher } from './global-hotel-fetcher';

interface BatchResult {
  processed: number;
  added: number;
  failed: number;
  countries: string[];
  cities: string[];
}

async function startGlobalFetch() {
  console.log('🌍 LAUNCHING GLOBAL HOTEL COLLECTION');
  console.log('=====================================');
  console.log('Target: Thousands of boutique hotels from EVERY country globally');
  console.log('Coverage: All 6 continents, 195+ countries, 1000+ cities');
  console.log('');

  const fetcher = new GlobalHotelFetcher();

  // Get current stats
  console.log('📊 Current Database Status:');
  const currentStats = await fetcher.getGlobalStats();
  console.log(`   • Total Hotels: ${currentStats.totalHotels}`);
  console.log(`   • Countries: ${currentStats.countriesRepresented}`);
  console.log(`   • Cities: ${currentStats.citiesRepresented}`);
  console.log('');

  // Start with Europe (most reliable data)
  console.log('🇪🇺 Phase 1: Starting with EUROPE (47 countries)...');
  const europeResults = await fetcher.fetchGlobalHotels({
    continents: ['europe'],
    maxHotelsPerCity: 15,
    batchSize: 30,
    skipExisting: true
  });

  console.log('\n🇪🇺 EUROPE COMPLETE!');
  console.log(`   • Added: ${europeResults.added} hotels`);
  console.log(`   • Countries: ${europeResults.countries.length}`);
  console.log(`   • Cities: ${europeResults.cities.length}`);

  // Continue with Asia
  console.log('\n🌏 Phase 2: Continuing with ASIA (50 countries)...');
  const asiaResults = await fetcher.fetchGlobalHotels({
    continents: ['asia'],
    maxHotelsPerCity: 12,
    batchSize: 25,
    skipExisting: true
  });

  console.log('\n🌏 ASIA COMPLETE!');
  console.log(`   • Added: ${asiaResults.added} hotels`);
  console.log(`   • Countries: ${asiaResults.countries.length}`);
  console.log(`   • Cities: ${asiaResults.cities.length}`);

  // Continue with North America
  console.log('\n🌎 Phase 3: Continuing with NORTH AMERICA (23 countries)...');
  const northAmericaResults = await fetcher.fetchGlobalHotels({
    continents: ['northAmerica'],
    maxHotelsPerCity: 20,
    batchSize: 35,
    skipExisting: true
  });

  console.log('\n🌎 NORTH AMERICA COMPLETE!');
  console.log(`   • Added: ${northAmericaResults.added} hotels`);
  console.log(`   • Countries: ${northAmericaResults.countries.length}`);
  console.log(`   • Cities: ${northAmericaResults.cities.length}`);

  // Continue with South America
  console.log('\n🌎 Phase 4: Continuing with SOUTH AMERICA (12 countries)...');
  const southAmericaResults = await fetcher.fetchGlobalHotels({
    continents: ['southAmerica'],
    maxHotelsPerCity: 10,
    batchSize: 20,
    skipExisting: true
  });

  console.log('\n🌎 SOUTH AMERICA COMPLETE!');
  console.log(`   • Added: ${southAmericaResults.added} hotels`);
  console.log(`   • Countries: ${southAmericaResults.countries.length}`);
  console.log(`   • Cities: ${southAmericaResults.cities.length}`);

  // Continue with Africa
  console.log('\n🌍 Phase 5: Continuing with AFRICA (54 countries)...');
  const africaResults = await fetcher.fetchGlobalHotels({
    continents: ['africa'],
    maxHotelsPerCity: 8,
    batchSize: 15,
    skipExisting: true
  });

  console.log('\n🌍 AFRICA COMPLETE!');
  console.log(`   • Added: ${africaResults.added} hotels`);
  console.log(`   • Countries: ${africaResults.countries.length}`);
  console.log(`   • Cities: ${africaResults.cities.length}`);

  // Finish with Oceania
  console.log('\n🌏 Phase 6: Finishing with OCEANIA (14 countries)...');
  const oceaniaResults = await fetcher.fetchGlobalHotels({
    continents: ['oceania'],
    maxHotelsPerCity: 15,
    batchSize: 25,
    skipExisting: true
  });

  console.log('\n🌏 OCEANIA COMPLETE!');
  console.log(`   • Added: ${oceaniaResults.added} hotels`);
  console.log(`   • Countries: ${oceaniaResults.countries.length}`);
  console.log(`   • Cities: ${oceaniaResults.cities.length}`);

  // Final statistics
  const finalStats = await fetcher.getGlobalStats();
  
  console.log('\n🎉 GLOBAL HOTEL COLLECTION COMPLETE!');
  console.log('=====================================');
  console.log('📊 FINAL RESULTS:');
  console.log(`   • Total Hotels: ${finalStats.totalHotels}`);
  console.log(`   • Countries Represented: ${finalStats.countriesRepresented}`);
  console.log(`   • Cities Represented: ${finalStats.citiesRepresented}`);
  console.log('');
  console.log('🌍 Continental Breakdown:');
  Object.entries(finalStats.continentBreakdown).forEach(([continent, count]) => {
    console.log(`   • ${continent}: ${count} hotels`);
  });
  console.log('');

  const totalAdded = europeResults.added + asiaResults.added + northAmericaResults.added + 
                    southAmericaResults.added + africaResults.added + oceaniaResults.added;

  console.log(`✅ Successfully added ${totalAdded} new boutique hotels!`);
  console.log(`🎯 All hotels meet Glintz curation criteria:`);
  console.log(`   • High-quality photos (4+ images)`);
  console.log(`   • Boutique/luxury positioning`);
  console.log(`   • Great reviews (4.0+ rating)`);
  console.log(`   • Unique experiences & amenities`);
  console.log(`   • Instagram-worthy visual appeal`);
  console.log('');
  console.log('🚀 Ready for thousands of users to discover amazing stays worldwide!');
}

// Quick fetch for testing (single continent)
async function quickFetch(continent: string = 'europe'): Promise<BatchResult> {
  console.log(`🚀 Quick fetch from ${continent.toUpperCase()}...`);
  
  const fetcher = new GlobalHotelFetcher();
  const results = await fetcher.fetchGlobalHotels({
    continents: [continent],
    maxHotelsPerCity: 5,
    batchSize: 10,
    skipExisting: true
  });

  console.log('\n✅ Quick fetch complete!');
  console.log(`   • Added: ${results.added} hotels`);
  console.log(`   • Countries: ${results.countries.length}`);
  console.log(`   • Cities: ${results.cities.length}`);

  return results;
}

// Export functions for different use cases
export { startGlobalFetch, quickFetch };

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'full';

  if (mode === 'quick') {
    const continent = args[1] || 'europe';
    quickFetch(continent)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Quick fetch failed:', error);
        process.exit(1);
      });
  } else {
    startGlobalFetch()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Global fetch failed:', error);
        process.exit(1);
      });
  }
} 