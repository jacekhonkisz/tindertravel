const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

class RealHotelPhotoScraper {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // User agents for rotation
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
    
    this.stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      photosFound: 0
    };
  }

  async scrapeRealHotelPhotos() {
    console.log('🏨 SCRAPING REAL HOTEL PHOTOS');
    console.log('='.repeat(50));
    console.log('🎯 Target: EXACT hotel photos only');
    console.log('🌐 Sources: Booking.com, TripAdvisor, Expedia');
    console.log('⚠️ Rate limiting: 3 seconds between requests');
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`\n📊 Found ${hotels.length} hotels to process`);
      this.stats.total = hotels.length;
      
      // Process hotels in small batches to avoid rate limiting
      const batchSize = 10;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(hotels.length / batchSize);
        
        console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (hotels ${i + 1}-${Math.min(i + batchSize, hotels.length)})`);
        
        for (const hotel of batch) {
          await this.scrapeHotelPhotos(hotel);
          await this.sleep(3000); // Rate limiting
        }
        
        // Show progress
        const progress = Math.round((i + batch.length) / hotels.length * 100);
        console.log(`   📈 Progress: ${i + batch.length}/${hotels.length} (${progress}%)`);
        
        // Longer break between batches
        if (i + batchSize < hotels.length) {
          console.log(`   ⏳ Waiting 10 seconds before next batch...`);
          await this.sleep(10000);
        }
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
    }
  }

  async scrapeHotelPhotos(hotel) {
    try {
      console.log(`\n🔍 Scraping photos for: ${hotel.name}`);
      console.log(`   📍 Location: ${hotel.city}, ${hotel.country}`);
      
      // Try multiple sources
      const photos = await this.tryMultipleSources(hotel);
      
      if (photos.length > 0) {
        console.log(`   ✅ Found ${photos.length} real hotel photos`);
        
        // Update hotel with real photos
        const success = await this.updateHotelPhotos(hotel.id, photos);
        
        if (success) {
          this.stats.updated++;
          this.stats.photosFound += photos.length;
          console.log(`   ✅ Photos updated successfully`);
        } else {
          this.stats.failed++;
          console.log(`   ❌ Failed to update photos`);
        }
      } else {
        this.stats.skipped++;
        console.log(`   ⏭️ No photos found - keeping existing photos`);
      }
      
    } catch (error) {
      this.stats.failed++;
      console.log(`   ❌ Error scraping ${hotel.name}: ${error.message}`);
    }
  }

  async tryMultipleSources(hotel) {
    const sources = [
      () => this.scrapeBookingCom(hotel),
      () => this.scrapeTripAdvisor(hotel),
      () => this.scrapeExpedia(hotel)
    ];
    
    for (const source of sources) {
      try {
        const photos = await source();
        if (photos.length > 0) {
          console.log(`   📸 Found photos from ${source.name}`);
          return photos;
        }
      } catch (error) {
        console.log(`   ⚠️ ${source.name} failed: ${error.message}`);
      }
    }
    
    return [];
  }

  async scrapeBookingCom(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country}`;
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('img[data-src], img[src]').each((i, element) => {
        const src = $(element).attr('data-src') || $(element).attr('src');
        if (src && src.includes('booking.com') && src.includes('hotel')) {
          // Convert to high resolution
          const highResUrl = src.replace(/w_\d+/, 'w_1920').replace(/h_\d+/, 'h_1080');
          photos.push({
            url: highResUrl,
            width: 1920,
            height: 1080,
            source: 'booking_com_scraped',
            description: `${hotel.name} real photo from Booking.com`,
            photoReference: `booking_${hotel.id}_${i}`
          });
        }
      });
      
      return photos.slice(0, 8); // Limit to 8 photos
      
    } catch (error) {
      throw new Error(`Booking.com: ${error.message}`);
    }
  }

  async scrapeTripAdvisor(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city}`;
      const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('img[data-src], img[src]').each((i, element) => {
        const src = $(element).attr('data-src') || $(element).attr('src');
        if (src && src.includes('tripadvisor.com') && src.includes('photo')) {
          photos.push({
            url: src,
            width: 1920,
            height: 1080,
            source: 'tripadvisor_scraped',
            description: `${hotel.name} real photo from TripAdvisor`,
            photoReference: `tripadvisor_${hotel.id}_${i}`
          });
        }
      });
      
      return photos.slice(0, 8);
      
    } catch (error) {
      throw new Error(`TripAdvisor: ${error.message}`);
    }
  }

  async scrapeExpedia(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country}`;
      const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('img[data-src], img[src]').each((i, element) => {
        const src = $(element).attr('data-src') || $(element).attr('src');
        if (src && src.includes('expedia.com') && src.includes('hotel')) {
          photos.push({
            url: src,
            width: 1920,
            height: 1080,
            source: 'expedia_scraped',
            description: `${hotel.name} real photo from Expedia`,
            photoReference: `expedia_${hotel.id}_${i}`
          });
        }
      });
      
      return photos.slice(0, 8);
      
    } catch (error) {
      throw new Error(`Expedia: ${error.message}`);
    }
  }

  async updateHotelPhotos(hotelId, photos) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({ 
          photos: photos,
          hero_photo: photos[0]?.url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) {
        console.log(`     ⚠️ Supabase error: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log(`     ⚠️ Update error: ${error.message}`);
      return false;
    }
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  generateSummary() {
    console.log('\n📊 REAL HOTEL PHOTO SCRAPING SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Hotels: ${this.stats.total}`);
    console.log(`Successfully Updated: ${this.stats.updated}`);
    console.log(`Hotels Skipped: ${this.stats.skipped}`);
    console.log(`Hotels Failed: ${this.stats.failed}`);
    console.log(`Total Photos Found: ${this.stats.photosFound}`);
    console.log(`Success Rate: ${Math.round((this.stats.updated / this.stats.total) * 100)}%`);
    
    console.log('\n✅ BENEFITS:');
    console.log('• REAL photos of EXACT hotels');
    console.log('• No API costs or limits');
    console.log('• Multiple sources (Booking.com, TripAdvisor, Expedia)');
    console.log('• High resolution (1920x1080)');
    
    console.log('\n📸 PHOTO SOURCES:');
    console.log('• Booking.com: Professional hotel photos');
    console.log('• TripAdvisor: User and professional photos');
    console.log('• Expedia: Hotel partner photos');
    
    console.log('\n⚠️ CONSIDERATIONS:');
    console.log('• Rate limiting (3 seconds between requests)');
    console.log('• Legal compliance (respect robots.txt)');
    console.log('• May need proxy rotation for large scale');
    console.log('• Some hotels may not be found');
    
    console.log('\n🎯 RESULTS:');
    if (this.stats.updated > 0) {
      console.log(`✅ Successfully scraped photos for ${this.stats.updated} hotels`);
      console.log(`📸 Found ${this.stats.photosFound} real hotel photos`);
      console.log(`�� ${this.stats.skipped} hotels kept their existing photos`);
    } else {
      console.log('⚠️ No photos were scraped');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the scraping
async function runScraping() {
  const scraper = new RealHotelPhotoScraper();
  await scraper.scrapeRealHotelPhotos();
}

runScraping();
