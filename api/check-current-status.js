const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentStatus() {
  console.log('📊 CHECKING CURRENT REPLACEMENT STATUS');
  console.log('='.repeat(60));
  
  try {
    // Get all hotels
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Total hotels in database: ${hotels.length}\n`);
    
    // Count photo sources
    let bookingCount = 0;
    let unsplashCount = 0;
    let googleCount = 0;
    let otherCount = 0;
    let mixedCount = 0;
    
    hotels.forEach((hotel) => {
      const photos = hotel.photos || [];
      let hasBooking = false;
      let hasUnsplash = false;
      let hasGoogle = false;
      
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
          } else if (source.includes('unsplash') || source.includes('Unsplash')) {
            hasUnsplash = true;
          } else if (source.includes('Google') || source.includes('google')) {
            hasGoogle = true;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      if (hasBooking) bookingCount++;
      if (hasUnsplash) unsplashCount++;
      if (hasGoogle) googleCount++;
      if (!hasBooking && !hasUnsplash && !hasGoogle) otherCount++;
      if ((hasBooking && hasUnsplash) || (hasBooking && hasGoogle) || (hasUnsplash && hasGoogle)) mixedCount++;
    });
    
    console.log('📊 PHOTO SOURCE SUMMARY:');
    console.log(`✅ Hotels with Booking.com photos: ${bookingCount}`);
    console.log(`🖼️  Hotels with Unsplash photos: ${unsplashCount}`);
    console.log(`🗺️  Hotels with Google photos: ${googleCount}`);
    console.log(`❓ Hotels with other photos: ${otherCount}`);
    console.log(`🔄 Hotels with mixed sources: ${mixedCount}`);
    
    const successRate = ((bookingCount / hotels.length) * 100).toFixed(1);
    console.log(`\n📈 Booking.com adoption rate: ${successRate}%`);
    
    if (bookingCount > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log(`• ${bookingCount} hotels now have Booking.com photos`);
      console.log('• High-quality real hotel photos replaced generic Unsplash images');
      console.log('• Photos include proper metadata and descriptions');
    }
    
    if (unsplashCount > 0) {
      console.log(`\n⚠️  REMAINING WORK:`);
      console.log(`• ${unsplashCount} hotels still have Unsplash photos`);
      console.log('• Can continue processing remaining hotels');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentStatus();
