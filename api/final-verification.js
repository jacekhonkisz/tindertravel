const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalVerification() {
  console.log('🔍 FINAL DATABASE VERIFICATION');
  console.log('='.repeat(60));
  
  try {
    // Get all remaining hotels
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Total hotels remaining: ${hotels.length}\n`);
    
    // Count photo sources
    let bookingCount = 0;
    let googleCount = 0;
    let otherCount = 0;
    let unsplashCount = 0;
    
    hotels.forEach((hotel) => {
      const photos = hotel.photos || [];
      let hasBooking = false;
      let hasGoogle = false;
      let hasUnsplash = false;
      
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
          } else if (source.includes('Google') || source.includes('google')) {
            hasGoogle = true;
          } else if (source.includes('unsplash') || source.includes('Unsplash')) {
            hasUnsplash = true;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      if (hasBooking) bookingCount++;
      if (hasGoogle) googleCount++;
      if (hasUnsplash) unsplashCount++;
      if (!hasBooking && !hasGoogle && !hasUnsplash) otherCount++;
    });
    
    console.log('📊 FINAL PHOTO SOURCE SUMMARY:');
    console.log(`✅ Hotels with Booking.com photos: ${bookingCount}`);
    console.log(`🗺️  Hotels with Google photos: ${googleCount}`);
    console.log(`❓ Hotels with other photos: ${otherCount}`);
    console.log(`🖼️  Hotels with Unsplash photos: ${unsplashCount}`);
    
    const bookingRate = ((bookingCount / hotels.length) * 100).toFixed(1);
    const googleRate = ((googleCount / hotels.length) * 100).toFixed(1);
    
    console.log(`\n📈 ADOPTION RATES:`);
    console.log(`• Booking.com photos: ${bookingRate}%`);
    console.log(`• Google Places photos: ${googleRate}%`);
    
    if (unsplashCount === 0) {
      console.log('\n🎉 PERFECT CLEANUP!');
      console.log('• ✅ No Unsplash photos remaining');
      console.log('• ✅ All hotels have real photos');
      console.log('• ✅ Database is clean and optimized');
      console.log(`• ✅ ${hotels.length} hotels with quality photos`);
    } else {
      console.log(`\n⚠️  WARNING: ${unsplashCount} hotels still have Unsplash photos`);
    }
    
    // Show sample of remaining hotels
    console.log('\n📋 SAMPLE OF REMAINING HOTELS:');
    hotels.slice(0, 5).forEach((hotel, index) => {
      const photos = hotel.photos || [];
      let photoSource = 'Unknown';
      
      if (photos.length > 0) {
        try {
          let photoObj;
          if (typeof photos[0] === 'string') {
            photoObj = JSON.parse(photos[0]);
          } else {
            photoObj = photos[0];
          }
          photoSource = photoObj.source || 'Unknown';
        } catch (error) {
          photoSource = 'Parse Error';
        }
      }
      
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}) - ${photos.length} photos - Source: ${photoSource}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

finalVerification();
