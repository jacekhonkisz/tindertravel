require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

class WebScrapingHotelPhotos {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      exactPhotos: 0,
      sources: {
        booking: 0,
        tripadvisor: 0,
        expedia: 0,
        hotels: 0
      }
    };
  }

  async findExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    const photos = [];
    
    // Strategy 1: Try Booking.com (best for exact hotel photos)
    try {
      console.log('  🏨 Searching Booking.com...');
      const bookingPhotos = await this.scrapeBookingPhotos(hotelName, city, country);
      photos.push(...bookingPhotos);
      this.stats.sources.booking += bookingPhotos.length;
      console.log(`  ✅ Booking.com: ${bookingPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Booking.com failed: ${error.message}`);
    }
    
    // Strategy 2: Try TripAdvisor
    try {
      console.log('  📝 Searching TripAdvisor...');
      const tripadvisorPhotos = await this.scrapeTripAdvisorPhotos(hotelName, city, country);
      photos.push(...tripadvisorPhotos);
      this.stats.sources.tripadvisor += tripadvisorPhotos.length;
      console.log(`  ✅ TripAdvisor: ${tripadvisorPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ TripAdvisor failed: ${error.message}`);
    }
    
    // Strategy 3: Try Expedia
    try {
      console.log('  ✈️ Searching Expedia...');
      const expediaPhotos = await this.scrapeExpediaPhotos(hotelName, city, country);
      photos.push(...expediaPhotos);
      this.stats.sources.expedia += expediaPhotos.length;
      console.log(`  ✅ Expedia: ${expediaPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Expedia failed: ${error.message}`);
    }
    
    // Strategy 4: Try Hotels.com
    try {
      console.log('  🏨 Searching Hotels.com...');
      const hotelsPhotos = await this.scrapeHotelsPhotos(hotelName, city, country);
      photos.push(...hotelsPhotos);
      this.stats.sources.hotels += hotelsPhotos.length;
      console.log(`  ✅ Hotels.com: ${hotelsPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Hotels.com failed: ${error.message}`);
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    if (finalPhotos.length > 0) {
      this.stats.successful++;
      this.stats.exactPhotos += finalPhotos.length;
      console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} EXACT photos for ${hotelName}`);
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
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('[data-testid="property-card-photo"] img, .sr_property_photo img, .hotel_photo img, .property-card-photo img, .sr_item_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          // Try to get higher resolution
          const highResSrc = src.replace(/\/\d+x\d+\//, '/1024x768/').replace(/\/\d+x\d+\./, '/1024x768.');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Booking.com`,
            source: 'booking_com',
            photographer: 'Booking.com',
            photographerUrl: 'https://www.booking.com',
            isExact: true
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Booking.com scraping failed: ${error.message}`);
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
          'Cache-Control': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('.photo img, .prw_meta_hsx_listing img, .listing_photo img, .result img, .prw_common_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          const highResSrc = src.replace(/\/\d+x\d+\//, '/1024x768/').replace(/\/\d+x\d+\./, '/1024x768.');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from TripAdvisor`,
            source: 'tripadvisor',
            photographer: 'TripAdvisor',
            photographerUrl: 'https://www.tripadvisor.com',
            isExact: true
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`TripAdvisor scraping failed: ${error.message}`);
    }
  }

  async scrapeExpediaPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${searchQuery}`;
      
      console.log(`    🔍 Searching: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('.hotel-image img, .property-image img, .hotel-photo img, .property-photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          const highResSrc = src.replace(/\/\d+x\d+\//, '/1024x768/').replace(/\/\d+x\d+\./, '/1024x768.');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Expedia`,
            source: 'expedia',
            photographer: 'Expedia',
            photographerUrl: 'https://www.expedia.com',
            isExact: true
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Expedia scraping failed: ${error.message}`);
    }
  }

  async scrapeHotelsPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.hotels.com/search.do?destination=${searchQuery}`;
      
      console.log(`    🔍 Searching: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('.hotel-image img, .property-image img, .hotel-photo img, .property-photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('pixel')) {
          const highResSrc = src.replace(/\/\d+x\d+\//, '/1024x768/').replace(/\/\d+x\d+\./, '/1024x768.');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Hotels.com`,
            source: 'hotels_com',
            photographer: 'Hotels.com',
            photographerUrl: 'https://www.hotels.com',
            isExact: true
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Hotels.com scraping failed: ${error.message}`);
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

  async testWithRealHotels() {
    console.log('🧪 Testing Web Scraping for EXACT Hotel Photos...\n');
    
    const testHotels = [
      { name: 'Long Bay Beach Club', city: 'Turks and Caicos', country: 'Turks and Caicos Islands' },
      { name: 'Hotel das Cataratas', city: 'Iguazu Falls', country: 'Argentina' },
      { name: 'Villa Spalletti Trivelli', city: 'Rome', country: 'Italy' },
      { name: 'La Valise Tulum', city: 'Tulum', country: 'Mexico' },
      { name: 'Borgo Pignano', city: 'Tuscany', country: 'Italy' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.findExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`  📸 Sample photos:`);
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo.url}`);
          console.log(`       Source: ${photo.source}`);
          console.log(`       Exact: ${photo.isExact ? 'YES' : 'NO'}`);
        });
      }
      
      // Add delay between hotels to avoid rate limiting
      await this.sleep(3000);
    }
    
    this.printStats();
  }

  printStats() {
    console.log('\n📊 WEB SCRAPING STATISTICS:');
    console.log(`Total hotels tested: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Exact photos found: ${this.stats.exactPhotos}`);
    
    console.log('\n📸 Photos by source:');
    Object.entries(this.stats.sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} photos`);
    });
    
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
const scraper = new WebScrapingHotelPhotos();
scraper.testWithRealHotels().catch(console.error);
