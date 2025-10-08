const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMissingPhotos() {
  console.log('🔍 ANALYZING HOTELS WITHOUT GOOGLE PLACES PHOTOS');
  console.log('='.repeat(60));
  console.log('🎯 Finding hotels that were not upgraded');
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels\n`);
    
    const analysis = {
      totalHotels: data.length,
      hotelsWithGooglePlaces: 0,
      hotelsWithUnsplash: 0,
      hotelsWithSerpAPI: 0,
      hotelsWithNoPhotos: 0,
      hotelsWithMixedSources: 0,
      hotelsWithOtherSources: 0
    };
    
    // Sample first 20 hotels for detailed analysis
    const sampleHotels = data.slice(0, 20);
    
    console.log('🔍 DETAILED ANALYSIS (First 20 hotels):\n');
    
    sampleHotels.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      console.log(`${index + 1}. ${hotel.name}`);
      console.log(`   📍 ${hotel.city}, ${hotel.country}`);
      console.log(`   📸 Total photos: ${photos.length}`);
      
      if (photos.length === 0) {
        console.log(`   ❌ NO PHOTOS`);
        analysis.hotelsWithNoPhotos++;
      } else {
        const photoSources = analyzePhotoSources(photos);
        console.log(`   📊 Photo sources:`);
        photoSources.forEach(source => {
          console.log(`      • ${source.type}: ${source.count} photos`);
        });
        
        // Categorize hotel
        if (photoSources.some(s => s.type === 'Google Places')) {
          analysis.hotelsWithGooglePlaces++;
        }
        if (photoSources.some(s => s.type === 'Unsplash')) {
          analysis.hotelsWithUnsplash++;
        }
        if (photoSources.some(s => s.type === 'SerpAPI')) {
          analysis.hotelsWithSerpAPI++;
        }
        if (photoSources.length > 1) {
          analysis.hotelsWithMixedSources++;
        }
        if (photoSources.some(s => s.type === 'Other')) {
          analysis.hotelsWithOtherSources++;
        }
      }
      console.log('');
    });
    
    // Quick analysis of all hotels
    console.log('📊 QUICK ANALYSIS (All 1000 hotels):\n');
    
    data.forEach(hotel => {
      const photos = hotel.photos || [];
      if (photos.length === 0) {
        analysis.hotelsWithNoPhotos++;
      } else {
        const photoSources = analyzePhotoSources(photos);
        if (photoSources.some(s => s.type === 'Google Places')) {
          analysis.hotelsWithGooglePlaces++;
        }
        if (photoSources.some(s => s.type === 'Unsplash')) {
          analysis.hotelsWithUnsplash++;
        }
        if (photoSources.some(s => s.type === 'SerpAPI')) {
          analysis.hotelsWithSerpAPI++;
        }
        if (photoSources.length > 1) {
          analysis.hotelsWithMixedSources++;
        }
        if (photoSources.some(s => s.type === 'Other')) {
          analysis.hotelsWithOtherSources++;
        }
      }
    });
    
    console.log('📈 FINAL RESULTS:');
    console.log(`🏨 Total hotels: ${analysis.totalHotels}`);
    console.log(`📸 Hotels with Google Places photos: ${analysis.hotelsWithGooglePlaces}`);
    console.log(`📸 Hotels with Unsplash photos: ${analysis.hotelsWithUnsplash}`);
    console.log(`📸 Hotels with SerpAPI photos: ${analysis.hotelsWithSerpAPI}`);
    console.log(`📸 Hotels with mixed photo sources: ${analysis.hotelsWithMixedSources}`);
    console.log(`📸 Hotels with other photo sources: ${analysis.hotelsWithOtherSources}`);
    console.log(`❌ Hotels with NO photos: ${analysis.hotelsWithNoPhotos}`);
    
    const hotelsNotUpgraded = analysis.totalHotels - analysis.hotelsWithGooglePlaces;
    console.log(`\n🔍 HOTELS NOT UPGRADED: ${hotelsNotUpgraded}`);
    console.log(`   • Hotels with Unsplash only: ${analysis.hotelsWithUnsplash - analysis.hotelsWithMixedSources}`);
    console.log(`   • Hotels with SerpAPI only: ${analysis.hotelsWithSerpAPI - analysis.hotelsWithMixedSources}`);
    console.log(`   • Hotels with no photos: ${analysis.hotelsWithNoPhotos}`);
    console.log(`   • Hotels with other sources: ${analysis.hotelsWithOtherSources}`);
    
    if (analysis.hotelsWithNoPhotos > 0) {
      console.log('\n⚠️ ACTION NEEDED:');
      console.log(`• ${analysis.hotelsWithNoPhotos} hotels need photos added`);
      console.log('• Consider running photo discovery for these hotels');
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function analyzePhotoSources(photos) {
  const sources = {};
  
  photos.forEach(photo => {
    let sourceType = 'Other';
    
    if (typeof photo === 'string') {
      if (photo.includes('maps.googleapis.com')) {
        sourceType = 'Google Places';
      } else if (photo.includes('unsplash.com')) {
        sourceType = 'Unsplash';
      } else if (photo.includes('serpapi')) {
        sourceType = 'SerpAPI';
      }
    } else if (typeof photo === 'object' && photo.source) {
      sourceType = photo.source;
    }
    
    sources[sourceType] = (sources[sourceType] || 0) + 1;
  });
  
  return Object.entries(sources).map(([type, count]) => ({ type, count }));
}

analyzeMissingPhotos().catch(console.error);
