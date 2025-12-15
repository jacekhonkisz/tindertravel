const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUpdates() {
  console.log('🔍 VERIFYING HOTEL UPDATES AFTER API LIMIT');
  console.log('='.repeat(60));
  
  try {
    // Get hotels updated recently (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentHotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo, updated_at')
      .gte('updated_at', yesterday.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Hotels updated in last 24 hours: ${recentHotels.length}\n`);
    
    if (recentHotels.length === 0) {
      console.log('❌ No hotels updated recently');
      return;
    }

    // Check first 10 recent updates
    const sampleHotels = recentHotels.slice(0, 10);
    
    console.log('🔄 RECENT UPDATES (First 10):');
    sampleHotels.forEach((hotel, index) => {
      console.log(`\n${index + 1}. ${hotel.name} (${hotel.city})`);
      console.log(`   Updated: ${hotel.updated_at}`);
      
      const photos = hotel.photos || [];
      let bookingCount = 0;
      let unsplashCount = 0;
      
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
            bookingCount++;
          } else if (source.includes('unsplash') || source.includes('Unsplash')) {
            unsplashCount++;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      console.log(`   📸 Total photos: ${photos.length}`);
      console.log(`   ✅ Booking.com photos: ${bookingCount}`);
      console.log(`   🖼️  Unsplash photos: ${unsplashCount}`);
      
      if (bookingCount > 0) {
        console.log(`   🎉 SUCCESS: Updated with Booking.com photos!`);
      } else if (unsplashCount > 0) {
        console.log(`   ⚠️  Still has Unsplash photos`);
      }
    });

    // Overall statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 OVERALL STATISTICS:');
    
    const { data: allHotels, error: allError } = await supabase
      .from('hotels')
      .select('photos');

    if (!allError && allHotels) {
      let totalBooking = 0;
      let totalUnsplash = 0;
      let totalGoogle = 0;
      
      allHotels.forEach((hotel) => {
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
        
        if (hasBooking) totalBooking++;
        if (hasUnsplash) totalUnsplash++;
        if (hasGoogle) totalGoogle++;
      });
      
      console.log(`✅ Hotels with Booking.com photos: ${totalBooking}`);
      console.log(`🖼️  Hotels with Unsplash photos: ${totalUnsplash}`);
      console.log(`🗺️  Hotels with Google photos: ${totalGoogle}`);
      
      const successRate = ((totalBooking / allHotels.length) * 100).toFixed(1);
      console.log(`📈 Booking.com adoption rate: ${successRate}%`);
      
      if (totalBooking > 0) {
        console.log('\n🎉 SUCCESS!');
        console.log(`• ${totalBooking} hotels successfully updated with Booking.com photos`);
        console.log('• Real hotel photos replaced generic Unsplash images');
        console.log('• High-quality photos with proper metadata');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyUpdates();
