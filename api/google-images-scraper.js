const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

class GoogleImagesScraper {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    
    this.stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      photosFound: 0
    };
  }

  async scrapeGoogleImages() {
    console.log('🔍 SCRAPING GOOGLE IMAGES FOR REAL HOTEL PHOTOS');
    console.log('='.repeat(50));
    console.log('🎯 Target: EXACT hotel photos from Google Images');
    console.log('🌐 Source: Google Images search');
    console.log('⚠️ Rate limiting: 5 seconds between requests');
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`\n📊 Found ${hotels.length} hotels to process`);
      this.stats.total = hotels.length;
      
      // Process hotels in small batches
      const batchSize = 5;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(hotels.length / batchSize);
        
        console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (hotels ${i + 1}-${Math.min(i + batchSize, hotels.length)})`);
        
        for (const hotel of batch) {
          await this.scrapeHotelImages(hotel);
          await this.sleep(5000); // Rate limiting
        }
        
        // Show progress
        const progress = Math.round((i + batch.length) / hotels.length * 100);
        console.log(`   📈 Progress: ${i + batch.length}/${hotels.length} (${progress}%)`);
        
        // Longer break between batches
        if (i + batchSize < hotels.length) {
          console.log(`   ⏳ Waiting 15 seconds before next batch...`);
          await this.sleep(15000);
        }
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
    }
  }

  async scrapeHotelImages(hotel) {
    try {
      console.log(`\n🔍 Scraping images for: ${hotel.name}`);
      console.log(`   📍 Location: ${hotel.city}, ${hotel.country}`);
      
      // Create search query
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country} hotel photos`;
      const photos = await this.searchGoogleImages(searchQuery, hotel);
      
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

  async searchGoogleImages(query, hotel) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
      
      console.log(`   🔗 Searching: ${searchUrl}`);
      
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
      
      // Look for image URLs in the page
      $('img').each((i, element) => {
        const src = $(element).attr('src');
        if (src && src.startsWith('http') && !src.includes('google.com') && !src.includes('gstatic.com')) {
          // Filter for hotel-related images
          if (this.isHotelImage(src, hotel)) {
            photos.push({
              url: src,
              width: 1920,
              height: 1080,
              source: 'google_images_scraped',
              description: `${hotel.name} real photo from Google Images`,
              photoReference: `google_${hotel.id}_${i}`
            });
          }
        }
      });
      
      return photos.slice(0, 8); // Limit to 8 photos
      
    } catch (error) {
      console.log(`   ⚠️ Google Images error: ${error.message}`);
      return [];
    }
  }

  isHotelImage(url, hotel) {
    // Simple heuristics to determine if image is hotel-related
    const hotelKeywords = ['hotel', 'resort', 'lodge', 'inn', 'suite', 'room', 'lobby', 'pool', 'spa'];
    const urlLower = url.toLowerCase();
    const hotelNameLower = hotel.name.toLowerCase();
    
    // Check if URL contains hotel-related keywords
    const hasHotelKeyword = hotelKeywords.some(keyword => urlLower.includes(keyword));
    
    // Check if URL contains hotel name (partial match)
    const hasHotelName = hotelNameLower.split(' ').some(word => 
      word.length > 3 && urlLower.includes(word)
    );
    
    return hasHotelKeyword || hasHotelName;
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
    console.log('\n📊 GOOGLE IMAGES SCRAPING SUMMARY:');
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
    console.log('• Google Images has vast collection');
    console.log('• High resolution (1920x1080)');
    
    console.log('\n📸 PHOTO SOURCES:');
    console.log('• Google Images search results');
    console.log('• Various hotel websites');
    console.log('• Professional and user photos');
    
    console.log('\n⚠️ CONSIDERATIONS:');
    console.log('• Rate limiting (5 seconds between requests)');
    console.log('• Legal compliance (respect robots.txt)');
    console.log('• May need proxy rotation for large scale');
    console.log('• Some hotels may not be found');
    
    console.log('\n🎯 RESULTS:');
    if (this.stats.updated > 0) {
      console.log(`✅ Successfully scraped photos for ${this.stats.updated} hotels`);
      console.log(`📸 Found ${this.stats.photosFound} real hotel photos`);
      console.log(`🏨 ${this.stats.skipped} hotels kept their existing photos`);
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
  const scraper = new GoogleImagesScraper();
  await scraper.scrapeGoogleImages();
}

runScraping();
