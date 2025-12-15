const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGooglePlacesBackup() {
  console.log('🔍 CHECKING GOOGLE PLACES PHOTOS FOR BACKUP');
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
    
    // Categorize hotels
    let bookingHotels = [];
    let unsplashHotels = [];
    let googleHotels = [];
    let mixedHotels = [];
    let unassignedHotels = [];
    
    hotels.forEach((hotel) => {
      const photos = hotel.photos || [];
      let hasBooking = false;
      let hasUnsplash = false;
      let hasGoogle = false;
      let googlePhotoCount = 0;
      
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
            googlePhotoCount++;
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      if (hasBooking && !hasUnsplash && !hasGoogle) {
        bookingHotels.push({...hotel, googlePhotoCount});
      } else if (hasUnsplash && !hasBooking && !hasGoogle) {
        unsplashHotels.push({...hotel, googlePhotoCount});
      } else if (hasGoogle && !hasBooking && !hasUnsplash) {
        googleHotels.push({...hotel, googlePhotoCount});
      } else if (hasBooking || hasUnsplash || hasGoogle) {
        mixedHotels.push({...hotel, googlePhotoCount});
      } else {
        unassignedHotels.push({...hotel, googlePhotoCount});
      }
    });
    
    console.log('📊 HOTEL CATEGORIES:');
    console.log(`✅ Booking.com only: ${bookingHotels.length}`);
    console.log(`🖼️  Unsplash only: ${unsplashHotels.length}`);
    console.log(`🗺️  Google Places only: ${googleHotels.length}`);
    console.log(`🔄 Mixed sources: ${mixedHotels.length}`);
    console.log(`❓ Unassigned: ${unassignedHotels.length}`);
    
    // Check for Google Places backup in Booking.com hotels
    console.log('\n🔍 CHECKING FOR GOOGLE PLACES BACKUP IN BOOKING.COM HOTELS:');
    let bookingWithGoogleBackup = 0;
    let bookingWithoutGoogleBackup = 0;
    
    bookingHotels.forEach((hotel) => {
      if (hotel.googlePhotoCount > 0) {
        bookingWithGoogleBackup++;
        console.log(`✅ ${hotel.name} - Has ${hotel.googlePhotoCount} Google Places photos as backup`);
      } else {
        bookingWithoutGoogleBackup++;
        console.log(`❌ ${hotel.name} - No Google Places backup`);
      }
    });
    
    console.log(`\n📊 BOOKING.COM HOTELS WITH GOOGLE BACKUP:`);
    console.log(`✅ With Google backup: ${bookingWithGoogleBackup}`);
    console.log(`❌ Without Google backup: ${bookingWithoutGoogleBackup}`);
    
    // Check for Google Places backup in Unsplash hotels
    console.log('\n🔍 CHECKING FOR GOOGLE PLACES BACKUP IN UNSPLASH HOTELS:');
    let unsplashWithGoogleBackup = 0;
    let unsplashWithoutGoogleBackup = 0;
    
    unsplashHotels.forEach((hotel) => {
      if (hotel.googlePhotoCount > 0) {
        unsplashWithGoogleBackup++;
        console.log(`✅ ${hotel.name} - Has ${hotel.googlePhotoCount} Google Places photos as backup`);
      } else {
        unsplashWithoutGoogleBackup++;
        console.log(`❌ ${hotel.name} - No Google Places backup`);
      }
    });
    
    console.log(`\n📊 UNSPLASH HOTELS WITH GOOGLE BACKUP:`);
    console.log(`✅ With Google backup: ${unsplashWithGoogleBackup}`);
    console.log(`❌ Without Google backup: ${unsplashWithoutGoogleBackup}`);
    
    // Check mixed hotels
    console.log('\n🔍 CHECKING MIXED SOURCE HOTELS:');
    mixedHotels.forEach((hotel) => {
      console.log(`🔄 ${hotel.name} - Mixed sources, Google photos: ${hotel.googlePhotoCount}`);
    });
    
    // Check unassigned hotels
    console.log('\n🔍 CHECKING UNASSIGNED HOTELS:');
    unassignedHotels.forEach((hotel) => {
      console.log(`❓ ${hotel.name} - No photo sources identified`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 SUMMARY:');
    console.log('='.repeat(60));
    
    if (bookingWithGoogleBackup > 0) {
      console.log(`✅ ${bookingWithGoogleBackup} Booking.com hotels have Google Places backup`);
      console.log('• Can safely remove incorrect Booking.com photos');
      console.log('• Google Places photos are likely from correct hotels');
    }
    
    if (unsplashWithGoogleBackup > 0) {
      console.log(`✅ ${unsplashWithGoogleBackup} Unsplash hotels have Google Places backup`);
      console.log('• Can replace Unsplash with Google Places photos');
      console.log('• Google Places photos are likely from correct hotels');
    }
    
    if (bookingWithoutGoogleBackup > 0) {
      console.log(`⚠️  ${bookingWithoutGoogleBackup} Booking.com hotels have NO Google backup`);
      console.log('• Need to find correct photos for these hotels');
    }
    
    if (unsplashWithoutGoogleBackup > 0) {
      console.log(`⚠️  ${unsplashWithoutGoogleBackup} Unsplash hotels have NO Google backup`);
      console.log('• Need to find correct photos for these hotels');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGooglePlacesBackup();
