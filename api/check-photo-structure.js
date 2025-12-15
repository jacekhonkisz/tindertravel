const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhotoStructure() {
  console.log('🔍 CHECKING PHOTO STRUCTURE IN HOTELS');
  console.log('='.repeat(60));
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for photo structure\n`);
    
    data.forEach((hotel, index) => {
      console.log(`\n🏨 Hotel ${index + 1}: ${hotel.name} (${hotel.city}, ${hotel.country})`);
      console.log(`ID: ${hotel.id}`);
      console.log(`Hero Photo: ${hotel.hero_photo}`);
      
      const photos = hotel.photos || [];
      console.log(`Photos Count: ${photos.length}`);
      
      if (photos.length > 0) {
        console.log('First 3 photos:');
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`  ${i + 1}. ${JSON.stringify(photo, null, 2)}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPhotoStructure();
