const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

class PhotoSourceTagger {
  constructor() {
    this.stats = {
      hotelsProcessed: 0,
      photosTagged: 0,
      hotelsUpdated: 0,
      errors: 0
    };
  }

  async addPhotoSourceTags() {
    console.log('🏷️ ADDING PHOTO SOURCE TAGS');
    console.log('='.repeat(60));
    console.log('🎯 Target: ALL hotels in database');
    console.log('📊 Adding source tags to all photos');
    console.log('🔧 For dev mode display');
    
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
        
        await this.tagHotelPhotos(hotel);
        
        // Rate limiting
        if (i < data.length - 1) {
          await this.sleep(100);
        }
      }
      
      this.generateTaggingReport();
      
    } catch (error) {
      console.error('Failed to tag photos:', error);
    }
  }

  async tagHotelPhotos(hotel) {
    this.stats.hotelsProcessed++;
    
    try {
      const photos = hotel.photos || [];
      
      if (photos.length === 0) {
        console.log(`  ⏭️ No photos to tag`);
        return;
      }
      
      console.log(`  📸 Photos: ${photos.length}`);
      
      let taggedPhotos = [];
      let photosTagged = 0;
      
      photos.forEach((photo, index) => {
        const taggedPhoto = this.tagPhoto(photo, index);
        taggedPhotos.push(taggedPhoto);
        if (taggedPhoto !== photo) {
          photosTagged++;
        }
      });
      
      if (photosTagged > 0) {
        console.log(`  🏷️ Tagged ${photosTagged} photos`);
        
        // Update hotel with tagged photos
        const { error } = await supabase
          .from('hotels')
          .update({
            photos: taggedPhotos,
            hero_photo: taggedPhotos[0] || hotel.hero_photo,
            updated_at: new Date().toISOString()
          })
          .eq('id', hotel.id);

        if (error) {
          console.log(`  ⚠️ Database update failed: ${error.message}`);
          this.stats.errors++;
        } else {
          console.log(`  ✅ Successfully updated hotel photos`);
          this.stats.hotelsUpdated++;
          this.stats.photosTagged += photosTagged;
        }
      } else {
        console.log(`  ✅ All photos already tagged`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error tagging ${hotel.name}: ${error.message}`);
      this.stats.errors++;
    }
  }

  tagPhoto(photo, index) {
    // If already an object with source, return as is
    if (typeof photo === 'object' && photo.source) {
      return photo;
    }
    
    // Determine source from URL or existing data
    let source = 'Unknown';
    let url = photo;
    let width = 0;
    let height = 0;
    let description = '';
    
    if (typeof photo === 'string') {
      url = photo;
      
      if (photo.includes('maps.googleapis.com')) {
        source = 'Google Places';
        // Extract dimensions from URL
        const maxWidthMatch = photo.match(/maxwidth=(\d+)/);
        const maxHeightMatch = photo.match(/maxheight=(\d+)/);
        if (maxWidthMatch && maxHeightMatch) {
          width = parseInt(maxWidthMatch[1]);
          height = parseInt(maxHeightMatch[1]);
        }
        description = `Google Places photo ${index + 1}`;
      } else if (photo.includes('unsplash.com')) {
        source = 'Unsplash';
        // Extract dimensions from URL
        const widthMatch = photo.match(/w=(\d+)/);
        const heightMatch = photo.match(/h=(\d+)/);
        if (widthMatch && heightMatch) {
          width = parseInt(widthMatch[1]);
          height = parseInt(heightMatch[1]);
        }
        description = `Unsplash curated photo ${index + 1}`;
      } else if (photo.includes('serpapi')) {
        source = 'SerpAPI';
        width = 1920;
        height = 1080;
        description = `SerpAPI real photo ${index + 1}`;
      } else {
        source = 'Other';
        description = `Photo ${index + 1}`;
      }
    } else if (typeof photo === 'object') {
      // Handle existing object format
      url = photo.url || photo;
      source = photo.source || 'Unknown';
      width = photo.width || 0;
      height = photo.height || 0;
      description = photo.description || `Photo ${index + 1}`;
    }
    
    // Return tagged photo object
    return {
      url: url,
      source: source,
      width: width,
      height: height,
      description: description,
      photoReference: `${source.toLowerCase()}_${index + 1}`,
      taggedAt: new Date().toISOString()
    };
  }

  generateTaggingReport() {
    console.log('\n📊 PHOTO SOURCE TAGGING REPORT');
    console.log('='.repeat(60));
    console.log(`🏨 Hotels processed: ${this.stats.hotelsProcessed}`);
    console.log(`🏷️ Photos tagged: ${this.stats.photosTagged}`);
    console.log(`✅ Hotels updated: ${this.stats.hotelsUpdated}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    if (this.stats.photosTagged > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log(`✅ Tagged ${this.stats.photosTagged} photos with source information`);
      console.log(`✅ Updated ${this.stats.hotelsUpdated} hotels`);
      console.log(`✅ Ready for dev mode display`);
      console.log('\n📱 PHOTO SOURCES AVAILABLE:');
      console.log('• Google Places - Real hotel photos from Google');
      console.log('• Unsplash - Curated high-quality photos');
      console.log('• SerpAPI - Real hotel photos from SerpAPI');
      console.log('• Other - Unknown or custom sources');
    } else {
      console.log('\n✅ All photos were already tagged');
    }
    
    console.log('\n💰 COST ANALYSIS:');
    console.log(`• Database operations: FREE`);
    console.log(`• Photo tagging: FREE`);
    console.log(`• Total cost: $0`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runTagging() {
  const tagger = new PhotoSourceTagger();
  await tagger.addPhotoSourceTags();
}

runTagging().catch(console.error);
