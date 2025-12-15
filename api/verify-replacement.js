const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReplacement() {
  console.log('🔍 VERIFYING PHOTO REPLACEMENT RESULTS');
  console.log('='.repeat(60));
  
  try {
    // Get the first few hotels to check
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Checking ${hotels.length} hotels for photo sources\n`);
    
    hotels.forEach((hotel, index) => {
      console.log(`\n🏨 Hotel ${index + 1}: ${hotel.name} (${hotel.city}, ${hotel.country})`);
      
      const photos = hotel.photos || [];
      console.log(`📸 Total photos: ${photos.length}`);
      
      // Count photo sources
      let bookingCount = 0;
      let unsplashCount = 0;
      let googleCount = 0;
      let otherCount = 0;
      
      photos.forEach((photo, i) => {
        try {
          let photoObj;
          if (typeof photo === 'string') {
            photoObj = JSON.parse(photo);
          } else {
            photoObj = photo;
          }
          
          const source = photoObj.source || photoObj.photoReference || '';
          
          if (source.includes('Booking.com')) {
            bookingCount++;
          } else if (source.includes('unsplash') || source.includes('Unsplash')) {
            unsplashCount++;
          } else if (source.includes('Google') || source.includes('google')) {
            googleCount++;
          } else {
            otherCount++;
          }
        } catch (error) {
          otherCount++;
        }
      });
      
      console.log(`   📊 Photo sources:`);
      console.log(`   • Booking.com: ${bookingCount}`);
      console.log(`   • Unsplash: ${unsplashCount}`);
      console.log(`   • Google: ${googleCount}`);
      console.log(`   • Other: ${otherCount}`);
      
      // Show first photo details
      if (photos.length > 0) {
        try {
          let firstPhoto;
          if (typeof photos[0] === 'string') {
            firstPhoto = JSON.parse(photos[0]);
          } else {
            firstPhoto = photos[0];
          }
          
          console.log(`   🖼️  First photo: ${firstPhoto.source || 'Unknown source'}`);
          console.log(`   📝 Description: ${firstPhoto.description || 'No description'}`);
        } catch (error) {
          console.log(`   🖼️  First photo: Could not parse`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyReplacement();
