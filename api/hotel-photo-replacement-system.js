const { createClient } = require('@supabase/supabase-js');
const { EnhancedFreeHotelPhotoService } = require('./enhanced-free-hotel-photo-service');

class HotelPhotoReplacementSystem {
  constructor() {
    // Initialize Supabase client
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Initialize photo service
    this.photoService = new EnhancedFreeHotelPhotoService();
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      photosAdded: 0
    };
  }

  /**
   * Replace photos for all hotels in the database
   */
  async replaceAllHotelPhotos(options = {}) {
    const {
      limit = 1000, // Process up to 1000 hotels
      batchSize = 10, // Process 10 hotels at a time
      skipExisting = true, // Skip hotels that already have good photos
      minPhotos = 3 // Minimum photos required
    } = options;

    console.log(`🚀 Starting hotel photo replacement for up to ${limit} hotels...`);
    console.log(`📊 Batch size: ${batchSize}, Skip existing: ${skipExisting}, Min photos: ${minPhotos}`);

    try {
      // Get hotels from database
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels in database`);

      // Process hotels in batches
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotels.length / batchSize)} (${batch.length} hotels)`);
        
        await this.processBatch(batch, { skipExisting, minPhotos });
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < hotels.length) {
          console.log('⏳ Waiting 5 seconds before next batch...');
          await this.sleep(5000);
        }
      }

      this.printFinalStats();
      
    } catch (error) {
      console.error('❌ Error in replaceAllHotelPhotos:', error);
      throw error;
    }
  }

  /**
   * Process a batch of hotels
   */
  async processBatch(hotels, options) {
    const { skipExisting, minPhotos } = options;
    
    for (const hotel of hotels) {
      try {
        await this.replaceHotelPhotos(hotel, { skipExisting, minPhotos });
        
        // Add delay between hotels
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Error processing ${hotel.name}:`, error.message);
        this.stats.failed++;
      }
    }
  }

  /**
   * Replace photos for a single hotel
   */
  async replaceHotelPhotos(hotel, options = {}) {
    const { skipExisting = true, minPhotos = 3 } = options;
    
    this.stats.total++;
    
    console.log(`\n🏨 Processing: ${hotel.name} in ${hotel.city}, ${hotel.country}`);
    
    // Check if hotel already has good photos
    if (skipExisting && this.hasGoodPhotos(hotel, minPhotos)) {
      console.log(`  ⏭️ Skipping - already has ${hotel.photos?.length || 0} photos`);
      this.stats.skipped++;
      return;
    }
    
    try {
      // Get new photos using the enhanced service
      const newPhotos = await this.photoService.getExactHotelPhotos(
        hotel.name,
        hotel.city,
        hotel.country,
        8 // Get up to 8 photos
      );
      
      if (newPhotos.length < minPhotos) {
        console.log(`  ❌ Insufficient photos: ${newPhotos.length}/${minPhotos} required`);
        this.stats.failed++;
        return;
      }
      
      // Convert photos to the format expected by your database
      const photoUrls = newPhotos.map(photo => photo.url);
      const heroPhoto = photoUrls[0] || '';
      
      // Update hotel in database
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: photoUrls,
          hero_photo: heroPhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotel.id);
      
      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      console.log(`  ✅ SUCCESS: Updated with ${newPhotos.length} photos`);
      console.log(`  📸 Sources: ${newPhotos.map(p => p.source).join(', ')}`);
      console.log(`  🎯 Sample: ${photoUrls[0]}`);
      
      this.stats.successful++;
      this.stats.photosAdded += newPhotos.length;
      
    } catch (error) {
      console.error(`  ❌ FAILED: ${error.message}`);
      this.stats.failed++;
    }
  }

  /**
   * Check if hotel already has good photos
   */
  hasGoodPhotos(hotel, minPhotos) {
    if (!hotel.photos || !Array.isArray(hotel.photos)) {
      return false;
    }
    
    // Filter out broken or placeholder photos
    const validPhotos = hotel.photos.filter(photo => {
      if (typeof photo === 'string') {
        return photo.includes('http') && !photo.includes('placeholder');
      }
      return false;
    });
    
    return validPhotos.length >= minPhotos;
  }

  /**
   * Replace photos for specific hotels by name
   */
  async replaceSpecificHotels(hotelNames, options = {}) {
    console.log(`🎯 Replacing photos for specific hotels: ${hotelNames.join(', ')}`);
    
    try {
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .in('name', hotelNames);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} matching hotels`);

      for (const hotel of hotels) {
        await this.replaceHotelPhotos(hotel, { skipExisting: false, minPhotos: 3 });
        await this.sleep(1000);
      }

    } catch (error) {
      console.error('❌ Error in replaceSpecificHotels:', error);
      throw error;
    }
  }

  /**
   * Get hotels that need photo updates
   */
  async getHotelsNeedingPhotos(minPhotos = 3) {
    try {
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      const hotelsNeedingPhotos = hotels.filter(hotel => !this.hasGoodPhotos(hotel, minPhotos));
      
      console.log(`📊 Analysis Results:`);
      console.log(`  Total hotels: ${hotels.length}`);
      console.log(`  Hotels needing photos: ${hotelsNeedingPhotos.length}`);
      console.log(`  Hotels with good photos: ${hotels.length - hotelsNeedingPhotos.length}`);
      
      return hotelsNeedingPhotos;
      
    } catch (error) {
      console.error('❌ Error in getHotelsNeedingPhotos:', error);
      throw error;
    }
  }

  /**
   * Test the system with a few sample hotels
   */
  async testSystem() {
    console.log('🧪 Testing Hotel Photo Replacement System...');
    
    const testHotels = [
      'The Ritz-Carlton',
      'Four Seasons',
      'Aman Tokyo'
    ];
    
    await this.replaceSpecificHotels(testHotels, { skipExisting: false });
    this.printFinalStats();
  }

  /**
   * Print final statistics
   */
  printFinalStats() {
    console.log('\n📊 FINAL STATISTICS:');
    console.log(`Total hotels processed: ${this.stats.total}`);
    console.log(`Successful updates: ${this.stats.successful}`);
    console.log(`Failed updates: ${this.stats.failed}`);
    console.log(`Skipped (already good): ${this.stats.skipped}`);
    console.log(`Total photos added: ${this.stats.photosAdded}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(1);
      console.log(`Success rate: ${successRate}%`);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the system
module.exports = { HotelPhotoReplacementSystem };

// Run if called directly
if (require.main === module) {
  const system = new HotelPhotoReplacementSystem();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    system.testSystem().catch(console.error);
  } else if (args.includes('--analyze')) {
    system.getHotelsNeedingPhotos().catch(console.error);
  } else {
    // Default: replace photos for all hotels
    system.replaceAllHotelPhotos({ limit: 100 }).catch(console.error);
  }
}
