const axios = require('axios');
const cheerio = require('cheerio');

class RealHotelPhotoScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Get real hotel photos from Booking.com (FREE)
   */
  async getBookingPhotos(hotelName, city, country) {
    try {
      console.log(`  🔍 Searching Booking.com for ${hotelName}...`);
      
      // Search for hotel on Booking.com
      const searchQuery = `${hotelName} ${city} ${country}`.replace(/\s+/g, '+');
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}&nflt=`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const photos = [];

      // Look for hotel images in search results
      $('[data-testid="property-card-image"] img, .sr_property_photo img, .property-image img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('booking.com') && src.includes('photo')) {
          // Convert to high resolution
          const highResSrc = src.replace(/max[0-9]+/, 'max1024').replace(/w[0-9]+/, 'w1024');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            source: 'booking.com',
            description: `${hotelName} hotel photo`
          });
        }
      });

      return photos.slice(0, 8); // Limit to 8 photos
    } catch (error) {
      console.log(`    ❌ Booking.com failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get real hotel photos from TripAdvisor (FREE)
   */
  async getTripAdvisorPhotos(hotelName, city, country) {
    try {
      console.log(`  🔍 Searching TripAdvisor for ${hotelName}...`);
      
      // Search for hotel on TripAdvisor
      const searchQuery = `${hotelName} ${city} ${country}`.replace(/\s+/g, '+');
      const searchUrl = `https://www.tripadvisor.com/Search?q=${searchQuery}&ssrc=h`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const photos = [];

      // Look for hotel images in search results
      $('.result-photo img, .photo img, .property-photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('tripadvisor.com') && src.includes('photo')) {
          // Convert to high resolution
          const highResSrc = src.replace(/w[0-9]+/, 'w1024').replace(/h[0-9]+/, 'h768');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            source: 'tripadvisor.com',
            description: `${hotelName} hotel photo`
          });
        }
      });

      return photos.slice(0, 8); // Limit to 8 photos
    } catch (error) {
      console.log(`    ❌ TripAdvisor failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get real hotel photos from Expedia (FREE)
   */
  async getExpediaPhotos(hotelName, city, country) {
    try {
      console.log(`  🔍 Searching Expedia for ${hotelName}...`);
      
      // Search for hotel on Expedia
      const searchQuery = `${hotelName} ${city} ${country}`.replace(/\s+/g, '+');
      const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${searchQuery}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const photos = [];

      // Look for hotel images in search results
      $('.hotel-image img, .property-image img, .hotel-photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('expedia.com') && src.includes('photo')) {
          // Convert to high resolution
          const highResSrc = src.replace(/w[0-9]+/, 'w1024').replace(/h[0-9]+/, 'h768');
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            source: 'expedia.com',
            description: `${hotelName} hotel photo`
          });
        }
      });

      return photos.slice(0, 8); // Limit to 8 photos
    } catch (error) {
      console.log(`    ❌ Expedia failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get real hotel photos from multiple sources
   */
  async getRealHotelPhotos(hotelName, city, country, count = 10) {
    console.log(`🏨 Getting REAL photos for ${hotelName} (${city}, ${country})...`);
    
    let allPhotos = [];
    
    // Try multiple sources
    const sources = [
      () => this.getBookingPhotos(hotelName, city, country),
      () => this.getTripAdvisorPhotos(hotelName, city, country),
      () => this.getExpediaPhotos(hotelName, city, country)
    ];
    
    for (const source of sources) {
      try {
        const photos = await source();
        allPhotos = allPhotos.concat(photos);
        
        if (allPhotos.length >= count) {
          break;
        }
        
        // Rate limiting between sources
        await this.sleep(1000);
      } catch (error) {
        console.log(`    ❌ Source failed: ${error.message}`);
      }
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(allPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ Found ${finalPhotos.length} REAL hotel photos from ${this.getSourceBreakdown(finalPhotos)}`);
    
    return finalPhotos;
  }

  /**
   * Remove duplicate photos based on URL
   */
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

  /**
   * Get breakdown of photo sources
   */
  getSourceBreakdown(photos) {
    const sources = {};
    photos.forEach(photo => {
      sources[photo.source] = (sources[photo.source] || 0) + 1;
    });
    return Object.entries(sources).map(([source, count]) => `${source}(${count})`).join(', ');
  }

  /**
   * Test the scraper with a sample hotel
   */
  async testScraper() {
    console.log('🧪 Testing REAL hotel photo scraper...');
    
    const testHotels = [
      { name: 'Hotel Ritz', city: 'Paris', country: 'France' },
      { name: 'Marriott', city: 'New York', country: 'USA' },
      { name: 'Hilton', city: 'London', country: 'UK' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n📸 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.getRealHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`  ✅ Found ${photos.length} photos:`);
        photos.forEach((photo, index) => {
          console.log(`    ${index + 1}. ${photo.source}: ${photo.width}x${photo.height}`);
          console.log(`       ${photo.url}`);
        });
      } else {
        console.log(`  ❌ No photos found`);
      }
      
      // Rate limiting between hotels
      await this.sleep(2000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the scraper
module.exports = { RealHotelPhotoScraper };

// Test the scraper if run directly
if (require.main === module) {
  const scraper = new RealHotelPhotoScraper();
  scraper.testScraper().catch(console.error);
}
