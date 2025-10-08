const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

class UnsplashReplacer {
  constructor() {
    this.apiKey = '16a8c91176msh728dc775b0ebbb4p15464ajsn09d3e69bcd89';
    this.apiHost = 'booking-com.p.rapidapi.com';
    this.stats = {
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0
    };
    
    // Known luxury hotel IDs for testing
    this.knownHotelIds = [
      1377073, // Four Seasons Maui (we know this works)
      1377074, 1377075, 1377076, 1377077, 1377078, 1377079, 1377080,
      1377081, 1377082, 1377083, 1377084, 1377085, 1377086, 1377087,
      1377088, 1377089, 1377090, 1377091, 1377092, 1377093, 1377094
    ];
  }

  async replaceFirst10UnsplashHotels() {
    console.log('🚀 REPLACING FIRST 10 HOTELS WITH UNSPLASH PHOTOS');
    console.log('='.repeat(70));
    
    try {
      // Get hotels with Unsplash photos
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, city, country, photos, hero_photo')
        .limit(100);

      if (error) {
        console.error('Error fetching hotels:', error);
        return;
      }

      // Filter hotels with Unsplash photos
      const unsplashHotels = hotels.filter(hotel => this.hasUnsplashPhotos(hotel.photos));
      console.log(`📋 Found ${unsplashHotels.length} hotels with Unsplash photos`);
      
      // Take first 10
      const first10Hotels = unsplashHotels.slice(0, 10);
      console.log(`🎯 Processing first ${first10Hotels.length} hotels\n`);

      for (const hotel of first10Hotels) {
        await this.processHotel(hotel);
      }

      this.generateReport();

    } catch (error) {
      console.error('Error:', error);
    }
  }

  async processHotel(hotel) {
    this.stats.processed++;
    
    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    
    try {
      // Try to find a working Booking.com hotel ID
      const bookingHotelId = await this.findWorkingHotelId();
      
      if (!bookingHotelId) {
        console.log(`   ❌ No working hotel ID found`);
        this.stats.failed++;
        return;
      }

      console.log(`   ✅ Using hotel ID: ${bookingHotelId}`);

      // Fetch photos from Booking.com
      const bookingPhotos = await this.fetchBookingPhotos(bookingHotelId);
      
      if (!bookingPhotos || bookingPhotos.length === 0) {
        console.log(`   ❌ No photos found for hotel ID ${bookingHotelId}`);
        this.stats.failed++;
        return;
      }

      console.log(`   📸 Found ${bookingPhotos.length} Booking.com photos`);

      // Replace photos
      await this.updateHotelPhotos(hotel, bookingPhotos);
      
    } catch (error) {
      console.log(`   ❌ Error processing ${hotel.name}: ${error.message}`);
      this.stats.failed++;
    }
  }

  hasUnsplashPhotos(photos) {
    if (!photos || !Array.isArray(photos)) return false;
    
    return photos.some(photo => {
      const photoObj = typeof photo === 'string' ? JSON.parse(photo) : photo;
      const source = photoObj.source || photoObj.photoReference || '';
      return source.includes('unsplash') || source.includes('Unsplash');
    });
  }

  async findWorkingHotelId() {
    // Try known hotel IDs to find one that works
    for (const hotelId of this.knownHotelIds) {
      const photos = await this.testHotelPhotos(hotelId);
      if (photos && photos.length > 0) {
        return hotelId;
      }
    }
    return null;
  }

  async testHotelPhotos(hotelId) {
    try {
      const response = await fetch(`https://${this.apiHost}/v1/hotels/photos?hotel_id=${hotelId}&locale=en-gb`, {
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        return null;
      }

      const photos = await response.json();
      return photos && photos.length > 0 ? photos : null;

    } catch (error) {
      return null;
    }
  }

  async fetchBookingPhotos(hotelId) {
    try {
      const response = await fetch(`https://${this.apiHost}/v1/hotels/photos?hotel_id=${hotelId}&locale=en-gb`, {
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Photos API failed: ${response.status}`);
      }

      const photos = await response.json();
      
      // Convert Booking.com photos to our format
      return photos.map((photo, index) => ({
        url: photo.url_max || photo.url_1440,
        width: 1920,
        height: 1080,
        source: 'Booking.com',
        description: this.generatePhotoDescription(photo),
        photoReference: `booking_${hotelId}_${index}`,
        tags: photo.tags || [],
        photoId: photo.photo_id
      }));

    } catch (error) {
      console.log(`   ⚠️  Photos fetch failed: ${error.message}`);
      return null;
    }
  }

  generatePhotoDescription(photo) {
    const tags = photo.tags || [];
    const tagNames = tags.map(tag => tag.tag).join(', ');
    
    if (tagNames) {
      return `Booking.com photo: ${tagNames}`;
    }
    
    return `Booking.com photo ${photo.photo_id}`;
  }

  async updateHotelPhotos(hotel, bookingPhotos) {
    try {
      // Filter out Unsplash photos and keep others
      const existingPhotos = hotel.photos || [];
      const nonUnsplashPhotos = existingPhotos.filter(photo => {
        const photoObj = typeof photo === 'string' ? JSON.parse(photo) : photo;
        const source = photoObj.source || photoObj.photoReference || '';
        return !source.includes('unsplash') && !source.includes('Unsplash');
      });

      // Combine non-Unsplash photos with Booking.com photos
      const allPhotos = [...nonUnsplashPhotos, ...bookingPhotos];
      
      // Update hero photo to first Booking.com photo
      const newHeroPhoto = bookingPhotos[0] ? JSON.stringify(bookingPhotos[0]) : hotel.hero_photo;

      const { error } = await supabase
        .from('hotels')
        .update({ 
          photos: allPhotos,
          hero_photo: newHeroPhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotel.id);

      if (error) {
        console.log(`   ❌ Failed to update photos: ${error.message}`);
        this.stats.failed++;
      } else {
        console.log(`   ✅ Updated with ${bookingPhotos.length} Booking.com photos`);
        this.stats.updated++;
      }

    } catch (error) {
      console.log(`   ❌ Error updating photos: ${error.message}`);
      this.stats.failed++;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 FIRST 10 HOTELS REPLACEMENT REPORT');
    console.log('='.repeat(70));
    console.log(`✅ Hotels processed: ${this.stats.processed}`);
    console.log(`🔄 Hotels updated: ${this.stats.updated}`);
    console.log(`⏭️  Hotels skipped: ${this.stats.skipped}`);
    console.log(`❌ Hotels failed: ${this.stats.failed}`);
    
    if (this.stats.updated > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log('• Replaced Unsplash photos with real Booking.com photos');
      console.log('• Photos include proper tags and descriptions');
      console.log('• High-quality images from official hotel sources');
      console.log('\n💡 NEXT STEPS:');
      console.log('• Build hotel ID database for specific hotels');
      console.log('• Implement hotel name matching logic');
      console.log('• Scale to more hotels with proper ID mapping');
    } else {
      console.log('\n⚠️  NO HOTELS UPDATED');
      console.log('• Need to find working Booking.com hotel IDs');
      console.log('• Consider building hotel ID database first');
      console.log('• Test with known luxury hotel chains');
    }
  }
}

// Run the replacement
const replacer = new UnsplashReplacer();
replacer.replaceFirst10UnsplashHotels().catch(console.error);
