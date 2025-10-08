require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class PhotoChecker {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async checkCurrentPhotos() {
    console.log('🔍 Checking current photos for first 3 hotels...\n');
    
    try {
      // Get first 3 hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels to check\n`);

      hotels.forEach((hotel, i) => {
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        console.log(`   Photos: ${hotel.photos?.length || 0}`);
        
        if (hotel.photos && hotel.photos.length > 0) {
          console.log(`   📸 Photo URLs:`);
          hotel.photos.forEach((photo, j) => {
            console.log(`     ${j + 1}. ${photo}`);
            
            // Check if it's from exact hotel or generic
            if (photo.includes('unsplash.com')) {
              console.log(`        ❌ GENERIC: Unsplash stock photo (not exact hotel)`);
            } else if (photo.includes('pexels.com')) {
              console.log(`        ❌ GENERIC: Pexels stock photo (not exact hotel)`);
            } else if (photo.includes('pixabay.com')) {
              console.log(`        ❌ GENERIC: Pixabay stock photo (not exact hotel)`);
            } else if (photo.includes('bing.net')) {
              console.log(`        ❌ GENERIC: Bing thumbnail (low quality)`);
            } else if (photo.includes('google.com')) {
              console.log(`        ❌ GENERIC: Google Images (not exact hotel)`);
            } else {
              console.log(`        ✅ POTENTIAL: Unknown source (might be exact)`);
            }
          });
        } else {
          console.log(`   ❌ No photos found`);
        }
        
        console.log('   ' + '='.repeat(60));
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Run the photo check
const checker = new PhotoChecker();
checker.checkCurrentPhotos().catch(console.error);
