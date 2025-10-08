require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class HotelOrderFixer {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async fixHotelOrder() {
    console.log('🔄 Fixing hotel order to show exact photos first...\n');
    
    try {
      // First, let's find the hotels with exact photos
      const { data: allHotels, error } = await this.supabase
        .from('hotels')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      // Find hotels with exact photos (Bing Images)
      const hotelsWithExactPhotos = allHotels.filter(hotel => 
        hotel.photos && hotel.photos.some(photo => 
          typeof photo === 'string' && photo.includes('bing.net')
        )
      );

      console.log(`📋 Found ${hotelsWithExactPhotos.length} hotels with exact photos:`);
      hotelsWithExactPhotos.forEach((hotel, i) => {
        console.log(`  ${i + 1}. ${hotel.name} (${hotel.city})`);
      });

      // Update these hotels to have the most recent timestamps (so they appear first)
      const now = new Date();
      
      for (let i = 0; i < hotelsWithExactPhotos.length; i++) {
        const hotel = hotelsWithExactPhotos[i];
        // Set timestamp to be very recent (so it appears first)
        const newTimestamp = new Date(now.getTime() + (i * 1000)).toISOString();
        
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
      
      // Verify the new order
      console.log('\n🔍 Verifying new order...');
      const { data: orderedHotels, error: orderError } = await this.supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (orderError) {
        throw new Error(`Failed to verify order: ${orderError.message}`);
      }

      console.log('\n📋 First 5 hotels in new order:');
      orderedHotels.forEach((hotel, i) => {
        const hasExactPhotos = hotel.photos && hotel.photos.some(photo => 
          typeof photo === 'string' && photo.includes('bing.net')
        );
        
        console.log(`${i + 1}. ${hotel.name} (${hotel.city})`);
        console.log(`   ${hasExactPhotos ? '✅ EXACT PHOTOS' : '❌ Generic photos'}`);
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Run the fix
const fixer = new HotelOrderFixer();
fixer.fixHotelOrder().catch(console.error);
