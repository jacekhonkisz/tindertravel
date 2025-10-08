const { createClient } = require('@supabase/supabase-js');
const probe = require('probe-image-size');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class PhotoQualityFilterBatch {
  constructor() {
    this.stats = {
      totalHotels: 0,
      hotelsProcessed: 0,
      photosChecked: 0,
      photosKept: 0,
      photosRemoved: 0,
      hotelsWith4Plus: 0,
      hotelsWith1To3: 0,
      hotelsWith0: 0,
      errors: 0,
      batchNumber: 0
    };
    this.batchSize = 100;
    this.batchStats = [];
  }

  async getImageDimensions(photoUrl) {
    try {
      const dimensions = await probe(photoUrl, {
        timeout: 10000
      });

      return {
        width: dimensions.width,
        height: dimensions.height,
        minDimension: Math.min(dimensions.width, dimensions.height)
      };

    } catch (error) {
      console.log(`     ⚠️  Error checking photo: ${error.message}`);
      return null;
    }
  }

  async filterHotelPhotos(hotel) {
    try {
      console.log(`\n📸 Filtering: ${hotel.name} (${hotel.city}, ${hotel.country})`);
      
      if (!hotel.photos || hotel.photos.length === 0) {
        console.log(`   ❌ No photos found`);
        this.stats.hotelsWith0++;
        return;
      }

      console.log(`   📊 Checking ${hotel.photos.length} photos...`);
      
      const qualityPhotos = [];
      
      for (let i = 0; i < hotel.photos.length; i++) {
        const photoUrl = hotel.photos[i];
        console.log(`     [${i+1}/${hotel.photos.length}] Checking...`);
        
        this.stats.photosChecked++;
        
        const dimensions = await this.getImageDimensions(photoUrl);
        
        if (!dimensions) {
          console.log(`     ❌ Could not check dimensions`);
          this.stats.errors++;
          continue;
        }
        
        // Keep photos with BOTH width >= 1600px AND height >= 1067px
        if (dimensions.width >= 1600 && dimensions.height >= 1067) {
          console.log(`     ✅ ${dimensions.width}x${dimensions.height} (KEEP - ${dimensions.width}px ≥ 1600px AND ${dimensions.height}px ≥ 1067px)`);
          qualityPhotos.push(photoUrl);
          this.stats.photosKept++;
        } else {
          console.log(`     ❌ ${dimensions.width}x${dimensions.height} (REMOVE - ${dimensions.width}px < 1600px OR ${dimensions.height}px < 1067px)`);
          this.stats.photosRemoved++;
        }
      }

      // Update hotel in database
      const { error } = await supabase
        .from('hotels')
        .update({ photos: qualityPhotos })
        .eq('id', hotel.id);

      if (error) {
        console.log(`   ❌ Database update failed: ${error.message}`);
        this.stats.errors++;
        return;
      }

      // Count photos for statistics
      if (qualityPhotos.length >= 4) {
        this.stats.hotelsWith4Plus++;
      } else if (qualityPhotos.length >= 1) {
        this.stats.hotelsWith1To3++;
      } else {
        this.stats.hotelsWith0++;
      }

      console.log(`   ✅ Updated: ${qualityPhotos.length} photos kept, ${hotel.photos.length - qualityPhotos.length} removed`);

    } catch (error) {
      console.log(`   ❌ Error processing hotel: ${error.message}`);
      this.stats.errors++;
    }
  }

  printBatchSummary() {
    this.stats.batchNumber++;
    const batchStats = {
      batch: this.stats.batchNumber,
      hotelsProcessed: this.stats.hotelsProcessed,
      photosChecked: this.stats.photosChecked,
      photosKept: this.stats.photosKept,
      photosRemoved: this.stats.photosRemoved,
      hotelsWith4Plus: this.stats.hotelsWith4Plus,
      hotelsWith1To3: this.stats.hotelsWith1To3,
      hotelsWith0: this.stats.hotelsWith0,
      errors: this.stats.errors
    };
    
    this.batchStats.push(batchStats);
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 BATCH ${this.stats.batchNumber} SUMMARY (${this.stats.hotelsProcessed}/${this.stats.totalHotels} hotels)`);
    console.log('='.repeat(60));
    console.log(`Photos Checked: ${this.stats.photosChecked}`);
    console.log(`Photos Kept (≥1600x1067): ${this.stats.photosKept}`);
    console.log(`Photos Removed (<1600x1067): ${this.stats.photosRemoved}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log('');
    console.log('🏨 HOTEL DISTRIBUTION BY PHOTO COUNT:');
    console.log(`Hotels with 4+ photos: ${this.stats.hotelsWith4Plus} (${((this.stats.hotelsWith4Plus/this.stats.hotelsProcessed)*100).toFixed(1)}%)`);
    console.log(`Hotels with 1-3 photos: ${this.stats.hotelsWith1To3} (${((this.stats.hotelsWith1To3/this.stats.hotelsProcessed)*100).toFixed(1)}%)`);
    console.log(`Hotels with 0 photos: ${this.stats.hotelsWith0} (${((this.stats.hotelsWith0/this.stats.hotelsProcessed)*100).toFixed(1)}%)`);
    console.log('');
    console.log('✅ Database updated with current batch results');
    console.log('='.repeat(60));
  }

  async runFilter() {
    try {
      console.log('🚀 Starting Photo Quality Filter (1600x1067+ ONLY - BOTH dimensions must meet minimum) - BATCH MODE');
      console.log('='.repeat(60));

      // Get all hotels
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, city, country, photos')
        .order('name');

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      this.stats.totalHotels = hotels.length;
      console.log(`📊 Found ${hotels.length} hotels to process in batches of ${this.batchSize}`);

      // Process hotels in batches
      for (let i = 0; i < hotels.length; i += this.batchSize) {
        const batch = hotels.slice(i, i + this.batchSize);
        
        console.log(`\n🔄 Processing Batch ${Math.floor(i/this.batchSize) + 1}: Hotels ${i+1}-${Math.min(i + this.batchSize, hotels.length)}`);
        
        // Process each hotel in the batch
        for (const hotel of batch) {
          await this.filterHotelPhotos(hotel);
          this.stats.hotelsProcessed++;
        }
        
        // Print batch summary
        this.printBatchSummary();
        
        // Small delay between batches
        if (i + this.batchSize < hotels.length) {
          console.log('\n⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Final report
      console.log('\n' + '='.repeat(60));
      console.log('🎉 FINAL FILTER COMPLETE - ALL BATCHES PROCESSED');
      console.log('='.repeat(60));
      console.log(`Total Hotels Processed: ${this.stats.hotelsProcessed}`);
      console.log(`Total Photos Checked: ${this.stats.photosChecked}`);
      console.log(`Photos Kept (≥1600x1067): ${this.stats.photosKept}`);
      console.log(`Photos Removed (<1600x1067): ${this.stats.photosRemoved}`);
      console.log(`Errors: ${this.stats.errors}`);
      console.log('');
      console.log('🏨 FINAL HOTEL DISTRIBUTION BY PHOTO COUNT:');
      console.log(`Hotels with 4+ photos: ${this.stats.hotelsWith4Plus} (${((this.stats.hotelsWith4Plus/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`Hotels with 1-3 photos: ${this.stats.hotelsWith1To3} (${((this.stats.hotelsWith1To3/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`Hotels with 0 photos: ${this.stats.hotelsWith0} (${((this.stats.hotelsWith0/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log('');
      console.log('✅ Quality filter complete! Only photos with BOTH width ≥1600px AND height ≥1067px remain in database.');

    } catch (error) {
      console.error('❌ Filter failed:', error.message);
    }
  }
}

// Run the filter
const filter = new PhotoQualityFilterBatch();
filter.runFilter();
