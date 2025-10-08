const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

class BookingPhotoReplacer {
  constructor() {
    this.apiKey = '16a8c91176msh728dc775b0ebbb4p15464ajsn09d3e69bcd89';
    this.apiHost = 'booking-com.p.rapidapi.com';
    this.stats = {
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0
    };
  }

  async replaceUnsplashPhotos() {
    console.log('🚀 REPLACING UNSPLASH PHOTOS WITH BOOKING.COM PHOTOS');
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

      console.log(`📋 Found ${hotels.length} hotels to analyze\n`);

      for (const hotel of hotels) {
        await this.processHotel(hotel);
      }

      this.generateReport();

    } catch (error) {
      console.error('Error:', error);
    }
  }

  async processHotel(hotel) {
    this.stats.processed++;
    
    // Check if hotel has Unsplash photos
    const hasUnsplash = this.hasUnsplashPhotos(hotel.photos);
    
    if (!hasUnsplash) {
      this.stats.skipped++;
      console.log(`⏭️  Skipping ${hotel.name} - no Unsplash photos`);
      return;
    }

    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    
    try {
      // Try to find hotel in Booking.com
      const bookingHotelId = await this.findBookingHotelId(hotel);
      
      if (!bookingHotelId) {
        console.log(`   ❌ Could not find hotel in Booking.com`);
        this.stats.failed++;
        return;
      }

      console.log(`   ✅ Found Booking.com hotel ID: ${bookingHotelId}`);

      // Fetch photos from Booking.com
      const bookingPhotos = await this.fetchBookingPhotos(bookingHotelId);
      
      if (!bookingPhotos || bookingPhotos.length === 0) {
        console.log(`   ❌ No photos found for Booking.com hotel`);
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

  async findBookingHotelId(hotel) {
    try {
      // Search for hotel by name and location
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country}`;
      
      const response = await fetch(`https://${this.apiHost}/v1/hotels/search?query=${encodeURIComponent(searchQuery)}&locale=en-gb`, {
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Search API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Find best match by name similarity
        const bestMatch = this.findBestMatch(hotel.name, data.results);
        return bestMatch ? bestMatch.hotel_id : null;
      }

      return null;
    } catch (error) {
      console.log(`   ⚠️  Search failed: ${error.message}`);
      return null;
    }
  }

  findBestMatch(hotelName, results) {
    const normalizedName = hotelName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    let bestMatch = null;
    let bestScore = 0;

    for (const result of results) {
      const resultName = result.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      // Simple similarity check
      const commonWords = normalizedName.split(' ').filter(word => 
        resultName.includes(word) && word.length > 2
      );
      
      const score = commonWords.length / Math.max(normalizedName.split(' ').length, resultName.split(' ').length);
      
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = result;
      }
    }

    return bestMatch;
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
    console.log('📊 BOOKING.COM PHOTO REPLACEMENT REPORT');
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
    }
  }
}

// Run the replacement
const replacer = new BookingPhotoReplacer();
replacer.replaceUnsplashPhotos().catch(console.error);
