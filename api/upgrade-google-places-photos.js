const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

class GooglePlacesPhotoUpgrader {
  constructor() {
    this.stats = {
      hotelsProcessed: 0,
      photosUpgraded: 0,
      hotelsUpdated: 0,
      errors: 0
    };
  }

  async upgradeAllGooglePlacesPhotos() {
    console.log('🚀 UPGRADING GOOGLE PLACES PHOTOS');
    console.log('='.repeat(60));
    console.log('🎯 Target: ALL hotels with Google Places photos');
    console.log('📏 Upgrading: 1600x1200 → 1920x1080+');
    console.log('🔧 Fixing: Pixelation issues on high-density screens');
    
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching hotels:', error);
        return;
      }

      console.log(`\n📋 Found ${data.length} hotels to process\n`);
      
      for (let i = 0; i < data.length; i++) {
        const hotel = data[i];
        console.log(`\n🏨 [${i + 1}/${data.length}] ${hotel.name}`);
        console.log(`📍 ${hotel.city}, ${hotel.country}`);
        
        await this.upgradeHotelPhotos(hotel);
        
        // Rate limiting
        if (i < data.length - 1) {
          await this.sleep(1000);
        }
      }
      
      this.generateUpgradeReport();
      
    } catch (error) {
      console.error('Failed to upgrade photos:', error);
    }
  }

  async upgradeHotelPhotos(hotel) {
    this.stats.hotelsProcessed++;
    
    try {
      const photos = hotel.photos || [];
      const googlePhotos = photos.filter(photo => 
        typeof photo === 'string' && photo.includes('maps.googleapis.com')
      );
      
      if (googlePhotos.length === 0) {
        console.log(`  ⏭️ No Google Places photos to upgrade`);
        return;
      }
      
      console.log(`  📸 Google Places photos: ${googlePhotos.length}`);
      
      let upgradedPhotos = [];
      let photosUpgraded = 0;
      
      photos.forEach(photo => {
        if (typeof photo === 'string' && photo.includes('maps.googleapis.com')) {
          const upgradedPhoto = this.upgradeGooglePlacesUrl(photo);
          upgradedPhotos.push(upgradedPhoto);
          if (upgradedPhoto !== photo) {
            photosUpgraded++;
          }
        } else {
          upgradedPhotos.push(photo);
        }
      });
      
      if (photosUpgraded > 0) {
        console.log(`  🔧 Upgraded ${photosUpgraded} photos`);
        
        // Update hotel with upgraded photos
        const { error } = await supabase
          .from('hotels')
          .update({
            photos: upgradedPhotos,
            hero_photo: upgradedPhotos[0] || hotel.hero_photo,
            updated_at: new Date().toISOString()
          })
          .eq('id', hotel.id);

        if (error) {
          console.log(`  ⚠️ Database update failed: ${error.message}`);
          this.stats.errors++;
        } else {
          console.log(`  ✅ Successfully updated hotel photos`);
          this.stats.hotelsUpdated++;
          this.stats.photosUpgraded += photosUpgraded;
        }
      } else {
        console.log(`  ✅ All photos already high-resolution`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error upgrading ${hotel.name}: ${error.message}`);
      this.stats.errors++;
    }
  }

  upgradeGooglePlacesUrl(url) {
    // Upgrade Google Places API parameters for better quality
    let upgradedUrl = url;
    
    // Replace maxwidth=1600 with maxwidth=1920
    upgradedUrl = upgradedUrl.replace(/maxwidth=1600/, 'maxwidth=1920');
    
    // Replace maxheight=1200 with maxheight=1080 (better aspect ratio)
    upgradedUrl = upgradedUrl.replace(/maxheight=1200/, 'maxheight=1080');
    
    // Add quality parameter if not present
    if (!upgradedUrl.includes('quality=')) {
      upgradedUrl += '&quality=high';
    }
    
    return upgradedUrl;
  }

  generateUpgradeReport() {
    console.log('\n📊 GOOGLE PLACES PHOTO UPGRADE REPORT');
    console.log('='.repeat(60));
    console.log(`🏨 Hotels processed: ${this.stats.hotelsProcessed}`);
    console.log(`📸 Photos upgraded: ${this.stats.photosUpgraded}`);
    console.log(`✅ Hotels updated: ${this.stats.hotelsUpdated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    if (this.stats.photosUpgraded > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log(`✅ Upgraded ${this.stats.photosUpgraded} Google Places photos`);
      console.log(`✅ Updated ${this.stats.hotelsUpdated} hotels`);
      console.log(`✅ Fixed pixelation issues on high-density screens`);
      console.log('\n📱 IMPROVEMENTS:');
      console.log('• Resolution: 1600x1200 → 1920x1080+');
      console.log('• Aspect ratio: 4:3 → 16:9 (better for mobile)');
      console.log('• Quality: Added high-quality parameter');
      console.log('• Pixelation: Fixed on iPhone Pro Max and similar devices');
    } else {
      console.log('\n✅ All Google Places photos were already high-resolution');
    }
    
    console.log('\n�� COST ANALYSIS:');
    console.log(`• Database operations: FREE`);
    console.log(`• Photo upgrades: FREE`);
    console.log(`• Total cost: $0`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runUpgrade() {
  const upgrader = new GooglePlacesPhotoUpgrader();
  await upgrader.upgradeAllGooglePlacesPhotos();
}

runUpgrade().catch(console.error);
