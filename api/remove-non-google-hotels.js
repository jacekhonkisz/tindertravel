const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeNonGoogleHotels() {
  console.log('🗑️  REMOVING HOTELS WITHOUT GOOGLE PLACES PHOTOS');
  console.log('='.repeat(60));
  
  try {
    // Get all hotels
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Total hotels in database: ${hotels.length}\n`);
    
    // Categorize hotels
    let googleHotels = [];
    let nonGoogleHotels = [];
    
    hotels.forEach((hotel) => {
      const photos = hotel.photos || [];
      let hasGoogle = false;
      let hasOther = false;
      
      photos.forEach((photo) => {
        try {
          let photoObj;
          if (typeof photo === 'string') {
            photoObj = JSON.parse(photo);
          } else {
            photoObj = photo;
          }
          
          const source = photoObj.source || photoObj.photoReference || '';
          
          if (source.includes('Google') || source.includes('google')) {
            hasGoogle = true;
          } else if (source.includes('Booking.com') || source.includes('unsplash') || source.includes('Unsplash')) {
            hasOther = true;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      if (hasGoogle && !hasOther) {
        googleHotels.push(hotel);
      } else {
        nonGoogleHotels.push(hotel);
      }
    });
    
    console.log('📊 HOTEL CATEGORIES:');
    console.log(`✅ Google Places only: ${googleHotels.length}`);
    console.log(`❌ Non-Google (to be removed): ${nonGoogleHotels.length}`);
    
    if (nonGoogleHotels.length === 0) {
      console.log('\n✅ No hotels to remove! All hotels have Google Places photos.');
      return;
    }
    
    console.log('\n🗑️  HOTELS TO BE REMOVED:');
    nonGoogleHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    console.log('\n⚠️  CONFIRMATION REQUIRED:');
    console.log(`This will remove ${nonGoogleHotels.length} hotels from the database.`);
    console.log('Only hotels with Google Places photos will remain.');
    console.log('\nProceeding with removal...\n');
    
    // Remove non-Google hotels
    let removedCount = 0;
    let failedCount = 0;
    
    for (const hotel of nonGoogleHotels) {
      try {
        const { error } = await supabase
          .from('hotels')
          .delete()
          .eq('id', hotel.id);
        
        if (error) {
          console.log(`❌ Failed to remove ${hotel.name}: ${error.message}`);
          failedCount++;
        } else {
          console.log(`✅ Removed ${hotel.name}`);
          removedCount++;
        }
      } catch (error) {
        console.log(`❌ Error removing ${hotel.name}: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 REMOVAL SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully removed: ${removedCount} hotels`);
    console.log(`❌ Failed to remove: ${failedCount} hotels`);
    console.log(`🗺️  Remaining Google Places hotels: ${googleHotels.length}`);
    
    // Verify final count
    const { count: finalCount, error: countError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📋 Final hotel count: ${finalCount}`);
    }
    
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('Only hotels with Google Places photos remain in the database.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

removeNonGoogleHotels();
