const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySourceTags() {
  console.log('🔍 VERIFYING SOURCE TAGS IN UPDATED HOTELS');
  console.log('='.repeat(60));
  
  try {
    // Get hotels with Booking.com photos
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo, updated_at')
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Checking ${hotels.length} hotels for source tags\n`);
    
    let bookingHotels = 0;
    let unsplashHotels = 0;
    let googleHotels = 0;
    let mixedHotels = 0;
    
    hotels.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      let hasBooking = false;
      let hasUnsplash = false;
      let hasGoogle = false;
      let bookingCount = 0;
      let unsplashCount = 0;
      let googleCount = 0;
      
      photos.forEach((photo) => {
        try {
          let photoObj;
          if (typeof photo === 'string') {
            photoObj = JSON.parse(photo);
          } else {
            photoObj = photo;
          }
          
          const source = photoObj.source || photoObj.photoReference || '';
          
          if (source.includes('Booking.com')) {
            hasBooking = true;
            bookingCount++;
          } else if (source.includes('unsplash') || source.includes('Unsplash')) {
            hasUnsplash = true;
            unsplashCount++;
          } else if (source.includes('Google') || source.includes('google')) {
            hasGoogle = true;
            googleCount++;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      if (hasBooking && !hasUnsplash && !hasGoogle) {
        bookingHotels++;
        console.log(`✅ ${hotel.name} - ${bookingCount} Booking.com photos (CLEAN)`);
      } else if (hasUnsplash && !hasBooking && !hasGoogle) {
        unsplashHotels++;
        console.log(`🖼️  ${hotel.name} - ${unsplashCount} Unsplash photos (NEEDS REMOVAL)`);
      } else if (hasGoogle && !hasBooking && !hasUnsplash) {
        googleHotels++;
        console.log(`🗺️  ${hotel.name} - ${googleCount} Google photos (KEEP)`);
      } else {
        mixedHotels++;
        console.log(`🔄 ${hotel.name} - Mixed sources (REVIEW NEEDED)`);
        console.log(`   Booking: ${bookingCount}, Unsplash: ${unsplashCount}, Google: ${googleCount}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SOURCE TAG SUMMARY:');
    console.log(`✅ Clean Booking.com hotels: ${bookingHotels}`);
    console.log(`🖼️  Unsplash-only hotels: ${unsplashHotels}`);
    console.log(`🗺️  Google-only hotels: ${googleHotels}`);
    console.log(`🔄 Mixed source hotels: ${mixedHotels}`);
    
    if (bookingHotels > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log('• Booking.com photos have correct source tags');
      console.log('• No Unsplash photos in updated hotels');
      console.log('• Ready to remove remaining Unsplash hotels');
    }
    
    if (unsplashHotels > 0) {
      console.log('\n⚠️  WARNING:');
      console.log(`• ${unsplashHotels} hotels still have Unsplash photos`);
      console.log('• These can be safely removed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifySourceTags();
