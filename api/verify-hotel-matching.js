const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyHotelMatching() {
  console.log('🔍 VERIFYING HOTEL MATCHING ACCURACY');
  console.log('='.repeat(60));
  console.log('⚠️  CRITICAL QUESTION: Are Booking.com photos from the CORRECT hotels?');
  console.log('='.repeat(60));
  
  try {
    // Get hotels with Booking.com photos
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, photos, hero_photo')
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📋 Analyzing ${hotels.length} hotels with Booking.com photos\n`);
    
    hotels.forEach((hotel, index) => {
      console.log(`\n🏨 Hotel ${index + 1}: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      
      const photos = hotel.photos || [];
      let bookingPhotos = [];
      
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
            bookingPhotos.push(photoObj);
          }
        } catch (error) {
          // Handle parsing errors
        }
      });
      
      console.log(`📸 Booking.com photos: ${bookingPhotos.length}`);
      
      if (bookingPhotos.length > 0) {
        console.log(`🔍 Photo analysis:`);
        
        // Analyze photo descriptions and tags
        bookingPhotos.slice(0, 3).forEach((photo, i) => {
          console.log(`   ${i + 1}. Description: ${photo.description || 'No description'}`);
          console.log(`      Tags: ${photo.tags ? photo.tags.map(t => t.tag).join(', ') : 'No tags'}`);
          console.log(`      Photo ID: ${photo.photoId || 'Unknown'}`);
        });
        
        // Check if photos seem relevant to the hotel
        const allDescriptions = bookingPhotos.map(p => p.description || '').join(' ').toLowerCase();
        const allTags = bookingPhotos.map(p => p.tags ? p.tags.map(t => t.tag).join(' ') : '').join(' ').toLowerCase();
        
        console.log(`\n🎯 RELEVANCE CHECK:`);
        console.log(`   Hotel name: "${hotel.name.toLowerCase()}"`);
        console.log(`   Hotel city: "${hotel.city.toLowerCase()}"`);
        console.log(`   Photo descriptions: "${allDescriptions.substring(0, 100)}..."`);
        
        // Check for matches
        const hotelNameWords = hotel.name.toLowerCase().split(' ').filter(w => w.length > 2);
        const cityWords = hotel.city.toLowerCase().split(' ').filter(w => w.length > 2);
        
        let nameMatches = 0;
        let cityMatches = 0;
        
        hotelNameWords.forEach(word => {
          if (allDescriptions.includes(word) || allTags.includes(word)) {
            nameMatches++;
          }
        });
        
        cityWords.forEach(word => {
          if (allDescriptions.includes(word) || allTags.includes(word)) {
            cityMatches++;
          }
        });
        
        console.log(`   Name word matches: ${nameMatches}/${hotelNameWords.length}`);
        console.log(`   City word matches: ${cityMatches}/${cityWords.length}`);
        
        if (nameMatches === 0 && cityMatches === 0) {
          console.log(`   ⚠️  WARNING: No obvious connection between photos and hotel!`);
        } else if (nameMatches > 0 || cityMatches > 0) {
          console.log(`   ✅ Some connection found between photos and hotel`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🚨 CRITICAL ANALYSIS');
    console.log('='.repeat(60));
    console.log('Based on the analysis above:');
    console.log('• We used random hotel IDs (1377073, 1377074, etc.)');
    console.log('• These IDs may not correspond to the actual hotels');
    console.log('• Photos might be from completely different hotels');
    console.log('• This could be misleading to users');
    console.log('\n💡 RECOMMENDATION:');
    console.log('• Need to find CORRECT hotel IDs for each hotel');
    console.log('• Or use hotel name matching to find proper IDs');
    console.log('• Current photos may be from random hotels');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyHotelMatching();
