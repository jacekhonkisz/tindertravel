const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

class UnsplashHotelRemover {
  constructor() {
    this.stats = {
      totalHotels: 0,
      unsplashHotels: 0,
      hotelsToRemove: 0,
      removedHotels: 0,
      failedRemovals: 0
    };
  }

  async removeUnsplashHotels() {
    console.log('🗑️  REMOVING HOTELS WITH UNSPLASH PHOTOS');
    console.log('='.repeat(60));
    console.log('⚠️  WARNING: This will permanently delete hotels with Unsplash photos!');
    console.log('📋 First, let\'s identify which hotels will be removed...\n');
    
    try {
      // Get all hotels
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, city, country, photos, hero_photo');

      if (error) {
        console.error('Error fetching hotels:', error);
        return;
      }

      this.stats.totalHotels = hotels.length;
      console.log(`📋 Total hotels in database: ${this.stats.totalHotels}\n`);

      // Identify hotels with Unsplash photos
      const unsplashHotels = [];
      
      hotels.forEach((hotel) => {
        if (this.hasUnsplashPhotos(hotel.photos)) {
          unsplashHotels.push(hotel);
        }
      });

      this.stats.unsplashHotels = unsplashHotels.length;
      this.stats.hotelsToRemove = unsplashHotels.length;

      console.log(`🖼️  Hotels with Unsplash photos: ${unsplashHotels.length}`);
      console.log(`🗑️  Hotels to be removed: ${unsplashHotels.length}\n`);

      if (unsplashHotels.length === 0) {
        console.log('✅ No hotels with Unsplash photos found!');
        return;
      }

      // Show first 10 hotels that will be removed
      console.log('📋 HOTELS TO BE REMOVED (First 10):');
      unsplashHotels.slice(0, 10).forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
      });

      if (unsplashHotels.length > 10) {
        console.log(`... and ${unsplashHotels.length - 10} more hotels`);
      }

      // Ask for confirmation
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  CONFIRMATION REQUIRED');
      console.log('='.repeat(60));
      console.log(`This will permanently delete ${unsplashHotels.length} hotels with Unsplash photos.`);
      console.log('This action cannot be undone!');
      console.log('\nTo proceed, uncomment the removal code below and run again.');
      console.log('// await this.performRemoval(unsplashHotels);');
      
      // Uncomment the line below to actually perform the removal
      // await this.performRemoval(unsplashHotels);

    } catch (error) {
      console.error('Error:', error);
    }
  }

  hasUnsplashPhotos(photos) {
    if (!photos || !Array.isArray(photos)) return false;
    
    return photos.some(photo => {
      try {
        let photoObj;
        if (typeof photo === 'string') {
          photoObj = JSON.parse(photo);
        } else {
          photoObj = photo;
        }
        
        const source = photoObj.source || photoObj.photoReference || '';
        return source.includes('unsplash') || source.includes('Unsplash');
      } catch (error) {
        // If parsing fails, check if it's a URL string
        if (typeof photo === 'string' && photo.includes('unsplash')) {
          return true;
        }
        return false;
      }
    });
  }

  async performRemoval(unsplashHotels) {
    console.log('\n🗑️  PERFORMING REMOVAL...');
    console.log('='.repeat(60));
    
    for (let i = 0; i < unsplashHotels.length; i++) {
      const hotel = unsplashHotels[i];
      
      try {
        console.log(`[${i + 1}/${unsplashHotels.length}] Removing: ${hotel.name}`);
        
        const { error } = await supabase
          .from('hotels')
          .delete()
          .eq('id', hotel.id);

        if (error) {
          console.log(`   ❌ Failed to remove ${hotel.name}: ${error.message}`);
          this.stats.failedRemovals++;
        } else {
          console.log(`   ✅ Removed ${hotel.name}`);
          this.stats.removedHotels++;
        }
        
        // Add small delay to avoid overwhelming the database
        if (i < unsplashHotels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.log(`   ❌ Error removing ${hotel.name}: ${error.message}`);
        this.stats.failedRemovals++;
      }
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REMOVAL REPORT');
    console.log('='.repeat(60));
    console.log(`📋 Total hotels processed: ${this.stats.totalHotels}`);
    console.log(`🖼️  Hotels with Unsplash photos: ${this.stats.unsplashHotels}`);
    console.log(`🗑️  Hotels marked for removal: ${this.stats.hotelsToRemove}`);
    console.log(`✅ Hotels successfully removed: ${this.stats.removedHotels}`);
    console.log(`❌ Failed removals: ${this.stats.failedRemovals}`);
    
    if (this.stats.removedHotels > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log(`• Removed ${this.stats.removedHotels} hotels with Unsplash photos`);
      console.log('• Database now contains only hotels with real photos');
      console.log('• Booking.com and Google Places photos preserved');
    }
  }
}

// Run the identification
const remover = new UnsplashHotelRemover();
remover.removeUnsplashHotels().catch(console.error);
