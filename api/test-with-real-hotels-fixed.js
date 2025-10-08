require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class RealHotelPhotoTester {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async testWithRealHotels() {
    console.log('🧪 Testing with REAL hotels from your database...\n');
    
    try {
      // Get 5 hotels from your database
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .limit(5);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels in your database\n`);

      for (const hotel of hotels) {
        console.log(`🏨 Hotel: ${hotel.name}`);
        console.log(`   Location: ${hotel.city}, ${hotel.country}`);
        console.log(`   Current photos: ${hotel.photos?.length || 0}`);
        console.log(`   Hero photo: ${hotel.hero_photo ? 'Yes' : 'No'}`);
        
        if (hotel.photos && hotel.photos.length > 0) {
          console.log(`   Sample photo URLs:`);
          hotel.photos.slice(0, 3).forEach((photo, i) => {
            if (typeof photo === 'string') {
              console.log(`     ${i + 1}. ${photo}`);
            } else {
              console.log(`     ${i + 1}. ${JSON.stringify(photo)}`);
            }
          });
        }
        
        console.log('   ' + '-'.repeat(50));
      }

      // Analyze photo quality
      this.analyzePhotoQuality(hotels);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  analyzePhotoQuality(hotels) {
    console.log('\n📊 PHOTO QUALITY ANALYSIS:');
    
    let totalHotels = hotels.length;
    let hotelsWithPhotos = 0;
    let hotelsWithGoodPhotos = 0;
    let totalPhotos = 0;
    let brokenPhotos = 0;
    
    const photoSources = {};
    
    hotels.forEach(hotel => {
      if (hotel.photos && hotel.photos.length > 0) {
        hotelsWithPhotos++;
        
        let goodPhotos = 0;
        hotel.photos.forEach(photo => {
          totalPhotos++;
          
          if (typeof photo === 'string') {
            if (photo.includes('http') && !photo.includes('placeholder')) {
              goodPhotos++;
              
              // Track photo sources
              if (photo.includes('unsplash')) {
                photoSources.unsplash = (photoSources.unsplash || 0) + 1;
              } else if (photo.includes('pexels')) {
                photoSources.pexels = (photoSources.pexels || 0) + 1;
              } else if (photo.includes('pixabay')) {
                photoSources.pixabay = (photoSources.pixabay || 0) + 1;
              } else if (photo.includes('google')) {
                photoSources.google = (photoSources.google || 0) + 1;
              } else if (photo.includes('booking')) {
                photoSources.booking = (photoSources.booking || 0) + 1;
              } else {
                photoSources.other = (photoSources.other || 0) + 1;
              }
            } else {
              brokenPhotos++;
            }
          } else {
            brokenPhotos++;
          }
        });
        
        if (goodPhotos >= 3) {
          hotelsWithGoodPhotos++;
        }
      }
    });
    
    console.log(`Total hotels: ${totalHotels}`);
    console.log(`Hotels with photos: ${hotelsWithPhotos}`);
    console.log(`Hotels with 3+ good photos: ${hotelsWithGoodPhotos}`);
    console.log(`Total photos: ${totalPhotos}`);
    console.log(`Broken photos: ${brokenPhotos}`);
    console.log(`Photo success rate: ${((totalPhotos - brokenPhotos) / totalPhotos * 100).toFixed(1)}%`);
    
    console.log('\n📸 Photo sources:');
    Object.entries(photoSources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} photos`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (hotelsWithGoodPhotos < totalHotels * 0.8) {
      console.log('❌ Many hotels need better photos');
      console.log('✅ Run the free photo replacement system');
    } else {
      console.log('✅ Most hotels have good photos');
    }
  }
}

// Run the test
const tester = new RealHotelPhotoTester();
tester.testWithRealHotels().catch(console.error);
