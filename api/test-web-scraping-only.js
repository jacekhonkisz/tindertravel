const axios = require('axios');
const cheerio = require('cheerio');

class WebScrapingPhotoService {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      photosFound: 0
    };
  }

  async getExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n�� Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    const photos = [];
    
    try {
      // Try Booking.com search
      console.log('  🕷️ Trying Booking.com...');
      const bookingPhotos = await this.scrapeBookingPhotos(hotelName, city, country);
      photos.push(...bookingPhotos);
      console.log(`  ✅ Booking.com: ${bookingPhotos.length} photos found`);
      
      // Try TripAdvisor search
      console.log('  🕷️ Trying TripAdvisor...');
      const tripadvisorPhotos = await this.scrapeTripAdvisorPhotos(hotelName, city, country);
      photos.push(...tripadvisorPhotos);
      console.log(`  ✅ TripAdvisor: ${tripadvisorPhotos.length} photos found`);
      
    } catch (error) {
      console.log(`  ❌ Web scraping failed: ${error.message}`);
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    if (finalPhotos.length > 0) {
      this.stats.successful++;
      this.stats.photosFound += finalPhotos.length;
      console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} photos for ${hotelName}`);
    } else {
      this.stats.failed++;
      console.log(`  ❌ FAILED: No photos found for ${hotelName}`);
    }
    
    return finalPhotos;
  }

  async scrapeBookingPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
      
      console.log(`    🔍 Searching: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('[data-testid="property-card-photo"] img, .sr_property_photo img, .hotel_photo img, .property-card-photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          photos.push({
            url: src.replace(/\/\d+x\d+\//, '/1024x768/'), // Try to get higher resolution
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo`,
            source: 'booking_scraped',
            photographer: 'Booking.com',
            photographerUrl: 'https://www.booking.com'
          });
        }
      });
      
      return photos.slice(0, 5); // Limit to 5 photos per source
      
    } catch (error) {
      console.log(`    ❌ Booking.com scraping failed: ${error.message}`);
      return [];
    }
  }

  async scrapeTripAdvisorPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.tripadvisor.com/Search?q=${searchQuery}&ssrc=A`;
      
      console.log(`    🔍 Searching: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('.photo img, .prw_meta_hsx_listing img, .listing_photo img, .result img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          photos.push({
            url: src.replace(/\/\d+x\d+\//, '/1024x768/'), // Try to get higher resolution
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo`,
            source: 'tripadvisor_scraped',
            photographer: 'TripAdvisor',
            photographerUrl: 'https://www.tripadvisor.com'
          });
        }
      });
      
      return photos.slice(0, 5); // Limit to 5 photos per source
      
    } catch (error) {
      console.log(`    ❌ TripAdvisor scraping failed: ${error.message}`);
      return [];
    }
  }

  removeDuplicatePhotos(photos) {
    const seen = new Set();
    return photos.filter(photo => {
      if (seen.has(photo.url)) {
        return false;
      }
      seen.add(photo.url);
      return true;
    });
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async testWith5Hotels() {
    console.log('🧪 Testing Web Scraping Photo Service with 5 Hotels...\n');
    
    const testHotels = [
      { name: 'The Ritz-Carlton', city: 'New York', country: 'United States' },
      { name: 'Four Seasons', city: 'Paris', country: 'France' },
      { name: 'Aman Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'Mandarin Oriental', city: 'London', country: 'United Kingdom' },
      { name: 'Shangri-La', city: 'Singapore', country: 'Singapore' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.getExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`  📸 Sample photos:`);
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo.url}`);
        });
      }
      
      // Add delay between hotels
      await this.sleep(3000);
    }
    
    this.printStats();
  }

  printStats() {
    console.log('\n📊 WEB SCRAPING STATISTICS:');
    console.log(`Total hotels tested: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total photos found: ${this.stats.photosFound}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(1);
      console.log(`Success rate: ${successRate}%`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
const service = new WebScrapingPhotoService();
service.testWith5Hotels().catch(console.error);
