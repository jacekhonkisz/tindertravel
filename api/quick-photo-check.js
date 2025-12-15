require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * Quick Photo Quality Check
 * Check a few hotels to understand the resolution issue
 */

async function quickCheck() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Quick Photo Quality Check\n');
  
  // Get first 10 hotels with photos
  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, city, country, photos')
    .not('photos', 'is', null)
    .limit(10);
  
  if (error) throw error;
  
  console.log(`Found ${data.length} hotels to check:\n`);
  
  data.forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Photos: ${hotel.photos.length}`);
    
    // Analyze first photo URL
    if (hotel.photos.length > 0) {
      const firstPhoto = hotel.photos[0];
      console.log(`   First photo URL: ${firstPhoto}`);
      
      // Check URL patterns
      if (firstPhoto.includes('maps.googleapis.com')) {
        if (firstPhoto.includes('maxwidth=4800')) {
          console.log(`   ✅ Resolution: 4800x3200 (Ultra High)`);
        } else if (firstPhoto.includes('maxwidth=3200')) {
          console.log(`   ✅ Resolution: 3200x2133 (High)`);
        } else if (firstPhoto.includes('maxwidth=1600')) {
          console.log(`   ✅ Resolution: 1600x1067 (Minimum)`);
        } else if (firstPhoto.includes('maxwidth=1200')) {
          console.log(`   ❌ Resolution: 1200x800 (Below Minimum!)`);
        } else if (firstPhoto.includes('maxwidth=800')) {
          console.log(`   ❌ Resolution: 800x600 (Below Minimum!)`);
        } else {
          console.log(`   ⚠️  Unknown resolution in URL`);
        }
      } else if (firstPhoto.includes('unsplash.com')) {
        console.log(`   📸 Unsplash photo (legacy)`);
      } else {
        console.log(`   🔗 Other source: ${firstPhoto.split('/')[2]}`);
      }
    }
    console.log('');
  });
}

quickCheck().catch(console.error);

