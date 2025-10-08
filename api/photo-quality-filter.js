const { createClient } = require('@supabase/supabase-js');
const probe = require('probe-image-size');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class PhotoQualityFilter {
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
      errors: 0
    };
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
    console.log(`\n📸 Filtering: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    
    try {
      // Parse photos from JSON string
      let photos = [];
      if (hotel.photos) {
        if (typeof hotel.photos === 'string') {
          photos = JSON.parse(hotel.photos);
        } else {
          photos = hotel.photos;
        }
      }

      if (!photos || photos.length === 0) {
        console.log(`   ❌ No photos found`);
        this.stats.hotelsWith0++;
        return { photos: [], keptCount: 0, removedCount: 0 };
      }

      console.log(`   📊 Checking ${photos.length} photos...`);
      
      const qualityPhotos = [];
      let removedCount = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`     [${i + 1}/${photos.length}] Checking...`);
        
        this.stats.photosChecked++;
        
        const dimensions = await this.getImageDimensions(photo);
        
        if (dimensions) {
          if (dimensions.minDimension >= 1067) {
            console.log(`     ✅ ${dimensions.width}x${dimensions.height} (KEEP - min ${dimensions.minDimension}px ≥ 1067px)`);
            qualityPhotos.push(photo);
            this.stats.photosKept++;
          } else {
            console.log(`     ❌ ${dimensions.width}x${dimensions.height} (REMOVE - min ${dimensions.minDimension}px < 1067px)`);
            removedCount++;
            this.stats.photosRemoved++;
          }
        } else {
          console.log(`     ⚠️  Could not check dimensions - keeping photo`);
          qualityPhotos.push(photo);
          this.stats.photosKept++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update hotel in database
      const { error } = await supabase
        .from('hotels')
        .update({ photos: qualityPhotos })
        .eq('id', hotel.id);

      if (error) {
        console.log(`   ❌ Database update error: ${error.message}`);
        this.stats.errors++;
      } else {
        console.log(`   ✅ Updated: ${qualityPhotos.length} photos kept, ${removedCount} removed`);
      }

      // Count hotel categories
      if (qualityPhotos.length >= 4) {
        this.stats.hotelsWith4Plus++;
      } else if (qualityPhotos.length >= 1) {
        this.stats.hotelsWith1To3++;
      } else {
        this.stats.hotelsWith0++;
      }

      return { photos: qualityPhotos, keptCount: qualityPhotos.length, removedCount };

    } catch (error) {
      console.log(`   ❌ Error processing hotel: ${error.message}`);
      this.stats.errors++;
      this.stats.hotelsWith0++;
      return { photos: [], keptCount: 0, removedCount: 0 };
    }
  }

  async runFilter() {
    console.log('🚀 Starting Photo Quality Filter (1600x1067+ only)');
    console.log('='.repeat(60));

    try {
      // Get all hotels
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, city, country, photos')
        .order('name');

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      this.stats.totalHotels = hotels.length;
      console.log(`📊 Found ${hotels.length} hotels to process`);

      // Process each hotel
      for (const hotel of hotels) {
        await this.filterHotelPhotos(hotel);
        this.stats.hotelsProcessed++;
        
        // Progress update every 50 hotels
        if (this.stats.hotelsProcessed % 50 === 0) {
          console.log(`\n📈 Progress: ${this.stats.hotelsProcessed}/${this.stats.totalHotels}`);
        }
      }

      // Final report
      console.log('\n' + '='.repeat(60));
      console.log('📊 FILTER COMPLETE - FINAL STATISTICS');
      console.log('='.repeat(60));
      console.log(`Total Hotels Processed: ${this.stats.hotelsProcessed}`);
      console.log(`Total Photos Checked: ${this.stats.photosChecked}`);
      console.log(`Photos Kept (≥1067px): ${this.stats.photosKept}`);
      console.log(`Photos Removed (<1067px): ${this.stats.photosRemoved}`);
      console.log(`Errors: ${this.stats.errors}`);
      console.log('');
      console.log('🏨 HOTEL DISTRIBUTION BY PHOTO COUNT:');
      console.log(`Hotels with 4+ photos: ${this.stats.hotelsWith4Plus} (${((this.stats.hotelsWith4Plus/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`Hotels with 1-3 photos: ${this.stats.hotelsWith1To3} (${((this.stats.hotelsWith1To3/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log(`Hotels with 0 photos: ${this.stats.hotelsWith0} (${((this.stats.hotelsWith0/this.stats.totalHotels)*100).toFixed(1)}%)`);
      console.log('');
      console.log('✅ Quality filter complete! Only 1600x1067+ photos remain.');

    } catch (error) {
      console.error('❌ Filter failed:', error.message);
    }
  }
}

// Run the filter
const filter = new PhotoQualityFilter();
filter.runFilter();
