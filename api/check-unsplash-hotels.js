const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnsplashHotels() {
  console.log('🔍 CHECKING HOTELS WITH UNSPLASH PHOTOS');
  console.log('='.repeat(60));
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo')
      .limit(100);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for photo sources\n`);
    
    let unsplashCount = 0;
    let googleCount = 0;
    let serpapiCount = 0;
    let otherCount = 0;
    
    const unsplashHotels = [];
    
    data.forEach((hotel) => {
      const photos = hotel.photos || [];
      let hasUnsplash = false;
      let hasGoogle = false;
      let hasSerpapi = false;
      
      photos.forEach((photo) => {
        const source = photo.source || photo.photoReference || '';
        if (source.includes('unsplash') || source.includes('Unsplash')) {
          hasUnsplash = true;
        } else if (source.includes('google') || source.includes('Google')) {
          hasGoogle = true;
        } else if (source.includes('serpapi') || source.includes('SerpApi')) {
          hasSerpapi = true;
        }
      });
      
      if (hasUnsplash) {
        unsplashCount++;
        unsplashHotels.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: photos.length
        });
      }
      if (hasGoogle) googleCount++;
      if (hasSerpapi) serpapiCount++;
      if (!hasUnsplash && !hasGoogle && !hasSerpapi) otherCount++;
    });
    
    console.log('📊 PHOTO SOURCE ANALYSIS:');
    console.log(`🔢 Hotels with Unsplash photos: ${unsplashCount}`);
    console.log(`🔢 Hotels with Google photos: ${googleCount}`);
    console.log(`🔢 Hotels with SerpApi photos: ${serpapiCount}`);
    console.log(`🔢 Hotels with other photos: ${otherCount}`);
    
    if (unsplashHotels.length > 0) {
      console.log('\n🏨 HOTELS WITH UNSPLASH PHOTOS:');
      unsplashHotels.slice(0, 15).forEach((hotel, i) => {
        console.log(`${i+1}. ${hotel.name} (${hotel.city}, ${hotel.country}) - ${hotel.photoCount} photos`);
      });
      
      if (unsplashHotels.length > 15) {
        console.log(`... and ${unsplashHotels.length - 15} more hotels`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUnsplashHotels();
