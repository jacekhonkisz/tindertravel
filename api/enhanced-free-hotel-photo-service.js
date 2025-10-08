const axios = require('axios');
const cheerio = require('cheerio');

class EnhancedFreeHotelPhotoService {
  constructor() {
    // Free API keys - you need to get these
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
    this.pexelsApiKey = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY';
    this.pixabayApiKey = process.env.PIXABAY_API_KEY || 'YOUR_PIXABAY_API_KEY';
    
    // API endpoints
    this.unsplashBaseUrl = 'https://api.unsplash.com';
    this.pexelsBaseUrl = 'https://api.pexels.com/v1';
    this.pixabayBaseUrl = 'https://pixabay.com/api';
    
    // User agents for web scraping
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      sources: {
        unsplash: 0,
        pexels: 0,
        pixabay: 0,
        webScraping: 0
      }
    };
  }

  /**
   * Get exact hotel photos using multiple free sources
   * This is the main method that tries to find photos of the SPECIFIC hotel
   */
  async getExactHotelPhotos(hotelName, city, country, count = 8) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    const photos = [];
    
    // Strategy 1: Try exact hotel name searches first
    const exactQueries = [
      `${hotelName} hotel ${city}`,
      `${hotelName} ${city}`,
      `${hotelName} hotel`,
      `${hotelName} resort ${city}`,
      `${hotelName} luxury hotel ${city}`
    ];
    
    // Strategy 2: Try web scraping for exact hotel photos
    try {
      console.log('  🕷️ Trying web scraping for exact hotel photos...');
      const scrapedPhotos = await this.scrapeExactHotelPhotos(hotelName, city, country);
      photos.push(...scrapedPhotos);
      console.log(`  ✅ Web scraping: ${scrapedPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Web scraping failed: ${error.message}`);
    }
    
    // Strategy 3: Try free APIs with exact queries
    for (const query of exactQueries) {
      if (photos.length >= count) break;
      
      try {
        console.log(`  📸 Trying exact query: "${query}"`);
        
        // Try Unsplash first (best quality)
        const unsplashPhotos = await this.getUnsplashPhotos(query, Math.ceil((count - photos.length) / 3));
        photos.push(...unsplashPhotos);
        this.stats.sources.unsplash += unsplashPhotos.length;
        
        if (photos.length >= count) break;
        
        // Try Pexels
        const pexelsPhotos = await this.getPexelsPhotos(query, Math.ceil((count - photos.length) / 2));
        photos.push(...pexelsPhotos);
        this.stats.sources.pexels += pexelsPhotos.length;
        
        if (photos.length >= count) break;
        
        // Try Pixabay
        const pixabayPhotos = await this.getPixabayPhotos(query, count - photos.length);
        photos.push(...pixabayPhotos);
        this.stats.sources.pixabay += pixabayPhotos.length;
        
      } catch (error) {
        console.log(`  ❌ API search failed for "${query}": ${error.message}`);
      }
    }
    
    // Strategy 4: If we still don't have enough, try generic luxury hotel photos
    if (photos.length < count) {
      console.log(`  🔄 Only ${photos.length}/${count} photos found, trying generic luxury hotel photos...`);
      
      const genericQueries = [
        `luxury hotel ${city}`,
        `boutique hotel ${city}`,
        `resort ${city}`,
        `hotel room ${city}`,
        `luxury hotel room`
      ];
      
      for (const query of genericQueries) {
        if (photos.length >= count) break;
        
        try {
          const genericPhotos = await this.getUnsplashPhotos(query, count - photos.length);
          photos.push(...genericPhotos);
          this.stats.sources.unsplash += genericPhotos.length;
        } catch (error) {
          console.log(`  ❌ Generic search failed for "${query}": ${error.message}`);
        }
      }
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    if (finalPhotos.length > 0) {
      this.stats.successful++;
      console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} photos for ${hotelName}`);
    } else {
      this.stats.failed++;
      console.log(`  ❌ FAILED: No photos found for ${hotelName}`);
    }
    
    return finalPhotos;
  }

  /**
   * Web scraping for exact hotel photos from booking sites
   */
  async scrapeExactHotelPhotos(hotelName, city, country) {
    const photos = [];
    
    try {
      // Try Booking.com search
      const bookingPhotos = await this.scrapeBookingPhotos(hotelName, city, country);
      photos.push(...bookingPhotos);
      
      // Try TripAdvisor search
      const tripadvisorPhotos = await this.scrapeTripAdvisorPhotos(hotelName, city, country);
      photos.push(...tripadvisorPhotos);
      
    } catch (error) {
      console.log(`  ❌ Web scraping error: ${error.message}`);
    }
    
    return photos;
  }

  /**
   * Scrape photos from Booking.com
   */
  async scrapeBookingPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('[data-testid="property-card-photo"] img, .sr_property_photo img, .hotel_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder')) {
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
      console.log(`  ❌ Booking.com scraping failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape photos from TripAdvisor
   */
  async scrapeTripAdvisorPhotos(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      const searchUrl = `https://www.tripadvisor.com/Search?q=${searchQuery}&ssrc=A`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images in search results
      $('.photo img, .prw_meta_hsx_listing img, .listing_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder')) {
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
      console.log(`  ❌ TripAdvisor scraping failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get photos from Unsplash API
   */
  async getUnsplashPhotos(query, count = 8) {
    try {
      const response = await axios.get(`${this.unsplashBaseUrl}/search/photos`, {
        params: {
          query: query,
          per_page: Math.min(count, 30),
          orientation: 'landscape',
          w: 1920,
          h: 1080
        },
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        },
        timeout: 10000
      });

      return response.data.results.map(photo => ({
        url: photo.urls.regular,
        width: photo.width,
        height: photo.height,
        description: photo.description || photo.alt_description,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html
      }));
    } catch (error) {
      console.log(`  ❌ Unsplash API error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get photos from Pexels API
   */
  async getPexelsPhotos(query, count = 8) {
    try {
      const response = await axios.get(`${this.pexelsBaseUrl}/search`, {
        params: {
          query: query,
          per_page: Math.min(count, 80),
          orientation: 'landscape',
          size: 'large'
        },
        headers: {
          'Authorization': this.pexelsApiKey
        },
        timeout: 10000
      });

      return response.data.photos.map(photo => ({
        url: photo.src.large2x,
        width: photo.width,
        height: photo.height,
        description: photo.alt,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
      }));
    } catch (error) {
      console.log(`  ❌ Pexels API error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get photos from Pixabay API
   */
  async getPixabayPhotos(query, count = 8) {
    try {
      const response = await axios.get(this.pixabayBaseUrl, {
        params: {
          key: this.pixabayApiKey,
          q: query,
          per_page: Math.min(count, 200),
          orientation: 'horizontal',
          image_type: 'photo',
          min_width: 1920,
          min_height: 1080,
          category: 'travel'
        },
        timeout: 10000
      });

      return response.data.hits.map(photo => ({
        url: photo.largeImageURL,
        width: photo.imageWidth,
        height: photo.imageHeight,
        description: photo.tags,
        source: 'pixabay',
        photographer: photo.user,
        photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`
      }));
    } catch (error) {
      console.log(`  ❌ Pixabay API error: ${error.message}`);
      return [];
    }
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
   * Get random user agent for web scraping
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Test the service with sample hotels
   */
  async testService() {
    console.log('🧪 Testing Enhanced Free Hotel Photo Service...');
    
    const testHotels = [
      { name: 'The Ritz-Carlton', city: 'New York', country: 'United States' },
      { name: 'Aman Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'Four Seasons', city: 'Paris', country: 'France' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.getExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      console.log(`  Result: ${photos.length} photos found`);
      
      if (photos.length > 0) {
        console.log(`  Sample photo: ${photos[0].url}`);
        console.log(`  Sources: ${photos.map(p => p.source).join(', ')}`);
      }
      
      // Add delay between requests
      await this.sleep(2000);
    }
    
    this.printStats();
  }

  /**
   * Print service statistics
   */
  printStats() {
    console.log('\n📊 SERVICE STATISTICS:');
    console.log(`Total hotels processed: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Success rate: ${((this.stats.successful / this.stats.total) * 100).toFixed(1)}%`);
    console.log('\n📸 Photos by source:');
    Object.entries(this.stats.sources).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} photos`);
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the service
module.exports = { EnhancedFreeHotelPhotoService };

// Test the service if run directly
if (require.main === module) {
  const service = new EnhancedFreeHotelPhotoService();
  service.testService().catch(console.error);
}
