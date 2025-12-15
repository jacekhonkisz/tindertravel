const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUnknownPhotos() {
  console.log('🔍 DEBUGGING UNKNOWN PHOTO SOURCES');
  console.log('='.repeat(60));
  console.log('🎯 Finding photos with "Unknown" or missing sources');
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for photo source issues\n`);
    
    let unknownCount = 0;
    let totalPhotos = 0;
    
    data.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      console.log(`${index + 1}. ${hotel.name}`);
      console.log(`   📍 ${hotel.city}, ${hotel.country}`);
      console.log(`   📸 Photos: ${photos.length}`);
      
      photos.forEach((photo, i) => {
        totalPhotos++;
        const source = getPhotoSource(photo);
        
        if (source === 'Unknown') {
          unknownCount++;
          console.log(`   ❌ Photo ${i + 1}: UNKNOWN SOURCE`);
          console.log(`      Type: ${typeof photo}`);
          console.log(`      Data: ${JSON.stringify(photo).substring(0, 100)}...`);
        } else {
          console.log(`   ✅ Photo ${i + 1}: ${source}`);
        }
      });
      console.log('');
    });
    
    console.log('📊 SUMMARY:');
    console.log(`📸 Total photos analyzed: ${totalPhotos}`);
    console.log(`❌ Unknown sources: ${unknownCount}`);
    console.log(`✅ Known sources: ${totalPhotos - unknownCount}`);
    console.log(`📊 Unknown percentage: ${Math.round((unknownCount / totalPhotos) * 100)}%`);
    
    if (unknownCount > 0) {
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Check photo data structure in database');
      console.log('2. Verify photo URL patterns');
      console.log('3. Re-run photo tagging script if needed');
    } else {
      console.log('\n✅ All photos have known sources');
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function getPhotoSource(photo) {
  // If it's an object with source property
  if (typeof photo === 'object' && photo.source) {
    return photo.source;
  }
  
  // If it's a string URL, try to detect source
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';
    } else if (photo.includes('serpapi')) {
      return 'SerpAPI';
    }
  }
  
  return 'Unknown';
}

debugUnknownPhotos().catch(console.error);
