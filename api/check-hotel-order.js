require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class HotelOrderChecker {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async checkHotelOrder() {
    console.log('🔍 Checking current hotel order in database...\n');
    
    try {
      // Get first 10 hotels to see the order
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 First 10 hotels in current order:\n`);

      hotels.forEach((hotel, i) => {
        console.log(`${i + 1}. ${hotel.name}`);
        console.log(`   Location: ${hotel.city}, ${hotel.country}`);
        console.log(`   Photos: ${hotel.photos?.length || 0}`);
        console.log(`   Created: ${hotel.created_at}`);
        
        // Check if this hotel has exact photos (Bing Images)
        const hasExactPhotos = hotel.photos && hotel.photos.some(photo => 
          typeof photo === 'string' && photo.includes('bing.net')
        );
        
        if (hasExactPhotos) {
          console.log(`   ✅ HAS EXACT PHOTOS (Bing Images)`);
        } else {
          console.log(`   ❌ Generic photos (Unsplash)`);
        }
        
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async reorderHotelsWithExactPhotos() {
    console.log('🔄 Reordering hotels to show exact photos first...\n');
    
    try {
      // Get all hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} total hotels`);

      // Separate hotels with exact photos from those without
      const hotelsWithExactPhotos = [];
      const hotelsWithGenericPhotos = [];

      hotels.forEach(hotel => {
        const hasExactPhotos = hotel.photos && hotel.photos.some(photo => 
          typeof photo === 'string' && photo.includes('bing.net')
        );
        
        if (hasExactPhotos) {
          hotelsWithExactPhotos.push(hotel);
        } else {
          hotelsWithGenericPhotos.push(hotel);
        }
      });

      console.log(`✅ Hotels with exact photos: ${hotelsWithExactPhotos.length}`);
      console.log(`❌ Hotels with generic photos: ${hotelsWithGenericPhotos.length}`);

      // Update hotels with exact photos to have recent timestamps (so they appear first)
      const now = new Date().toISOString();
      
      for (let i = 0; i < hotelsWithExactPhotos.length; i++) {
        const hotel = hotelsWithExactPhotos[i];
        const newTimestamp = new Date(Date.now() - (i * 1000)).toISOString(); // 1 second apart
        
        const { error: updateError } = await this.supabase
          .from('hotels')
          .update({
            updated_at: newTimestamp,
            created_at: newTimestamp
          })
          .eq('id', hotel.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${hotel.name}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${hotel.name} to appear first`);
        }
      }

      console.log('\n🎉 Hotels with exact photos are now ordered first!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async addPhotoSourceTags() {
    console.log('🏷️ Adding photo source tags to hotels...\n');
    
    try {
      // Get all hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Processing ${hotels.length} hotels for tagging...`);

      let exactPhotosCount = 0;
      let genericPhotosCount = 0;

      for (const hotel of hotels) {
        const hasExactPhotos = hotel.photos && hotel.photos.some(photo => 
          typeof photo === 'string' && photo.includes('bing.net')
        );
        
        let tags = hotel.amenity_tags || [];
        
        if (hasExactPhotos) {
          // Add exact photos tag
          if (!tags.includes('exact_photos')) {
            tags.push('exact_photos');
          }
          if (!tags.includes('bing_images')) {
            tags.push('bing_images');
          }
          exactPhotosCount++;
        } else {
          // Add generic photos tag
          if (!tags.includes('generic_photos')) {
            tags.push('generic_photos');
          }
          if (!tags.includes('unsplash')) {
            tags.push('unsplash');
          }
          genericPhotosCount++;
        }
        
        // Update hotel with tags
        const { error: updateError } = await this.supabase
          .from('hotels')
          .update({
            amenity_tags: tags
          })
          .eq('id', hotel.id);
        
        if (updateError) {
          console.log(`❌ Failed to tag ${hotel.name}: ${updateError.message}`);
        }
      }

      console.log(`\n📊 Tagging Results:`);
      console.log(`✅ Hotels with exact photos: ${exactPhotosCount}`);
      console.log(`❌ Hotels with generic photos: ${genericPhotosCount}`);
      console.log(`🏷️ All hotels tagged with photo source!`);
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Run the checks
const checker = new HotelOrderChecker();

async function runAllChecks() {
  await checker.checkHotelOrder();
  console.log('\n' + '='.repeat(60) + '\n');
  await checker.addPhotoSourceTags();
  console.log('\n' + '='.repeat(60) + '\n');
  await checker.reorderHotelsWithExactPhotos();
}

runAllChecks().catch(console.error);
