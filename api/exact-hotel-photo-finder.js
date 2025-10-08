require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

class ExactHotelPhotoFinder {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      exactPhotos: 0,
      genericPhotos: 0
    };
  }

  async findExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    const photos = [];
    
    // Strategy 1: Try to find the hotel's official website
    try {
      console.log('  🌐 Searching for official hotel website...');
      const officialPhotos = await this.findOfficialHotelPhotos(hotelName, city, country);
      photos.push(...officialPhotos);
      console.log(`  ✅ Official website: ${officialPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Official website search failed: ${error.message}`);
    }
    
    // Strategy 2: Search Google Images for exact hotel photos
    try {
      console.log('  🔍 Searching Google Images for exact hotel...');
      const googlePhotos = await this.searchGoogleImages(hotelName, city, country);
      photos.push(...googlePhotos);
      console.log(`  ✅ Google Images: ${googlePhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Google Images search failed: ${error.message}`);
    }
    
    // Strategy 3: Search hotel booking sites
    try {
      console.log('  🏨 Searching booking sites...');
      const bookingPhotos = await this.searchBookingSites(hotelName, city, country);
      photos.push(...bookingPhotos);
      console.log(`  ✅ Booking sites: ${bookingPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Booking sites search failed: ${error.message}`);
    }
    
    // Strategy 4: Search travel review sites
    try {
      console.log('  📝 Searching travel review sites...');
      const reviewPhotos = await this.searchReviewSites(hotelName, city, country);
      photos.push(...reviewPhotos);
      console.log(`  ✅ Review sites: ${reviewPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Review sites search failed: ${error.message}`);
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    // Categorize photos as exact vs generic
    const exactPhotos = finalPhotos.filter(photo => this.isExactHotelPhoto(photo, hotelName));
    const genericPhotos = finalPhotos.filter(photo => !this.isExactHotelPhoto(photo, hotelName));
    
    this.stats.exactPhotos += exactPhotos.length;
    this.stats.genericPhotos += genericPhotos.length;
    
    if (finalPhotos.length > 0) {
      this.stats.successful++;
      console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} photos (${exactPhotos.length} exact, ${genericPhotos.length} generic)`);
    } else {
      this.stats.failed++;
      console.log(`  ❌ FAILED: No photos found for ${hotelName}`);
    }
    
    return finalPhotos;
  }

  async findOfficialHotelPhotos(hotelName, city, country) {
    try {
      // Try to find the hotel's official website
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" official website`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for official website links
      $('a[href*="http"]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('google.com') && !href.includes('youtube.com')) {
          // This would be where we'd scrape the official website
          // For now, we'll simulate finding photos
          console.log(`    Found potential official site: ${href}`);
        }
      });
      
      return photos;
    } catch (error) {
      throw new Error(`Official website search failed: ${error.message}`);
    }
  }

  async searchGoogleImages(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel photos`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for image URLs in Google Images results
      $('img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('google.com') && !src.includes('gstatic.com')) {
          photos.push({
            url: src,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Google Images`,
            source: 'google_images',
            photographer: 'Google Images',
            photographerUrl: 'https://www.google.com',
            isExact: this.isExactHotelPhoto({ url: src }, hotelName)
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Google Images search failed: ${error.message}`);
    }
  }

  async searchBookingSites(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      
      // Try Booking.com
      const bookingUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}`;
      
      const response = await axios.get(bookingUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('[data-testid="property-card-photo"] img, .sr_property_photo img, .hotel_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder')) {
          photos.push({
            url: src.replace(/\/\d+x\d+\//, '/1024x768/'),
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Booking.com`,
            source: 'booking_com',
            photographer: 'Booking.com',
            photographerUrl: 'https://www.booking.com',
            isExact: true // Photos from booking sites are usually exact
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Booking sites search failed: ${error.message}`);
    }
  }

  async searchReviewSites(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`${hotelName} ${city} ${country}`);
      
      // Try TripAdvisor
      const tripadvisorUrl = `https://www.tripadvisor.com/Search?q=${searchQuery}`;
      
      const response = await axios.get(tripadvisorUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for hotel images
      $('.photo img, .prw_meta_hsx_listing img, .listing_photo img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder')) {
          photos.push({
            url: src.replace(/\/\d+x\d+\//, '/1024x768/'),
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from TripAdvisor`,
            source: 'tripadvisor',
            photographer: 'TripAdvisor',
            photographerUrl: 'https://www.tripadvisor.com',
            isExact: true // Photos from review sites are usually exact
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Review sites search failed: ${error.message}`);
    }
  }

  isExactHotelPhoto(photo, hotelName) {
    // Check if the photo URL or description contains the hotel name
    const hotelNameLower = hotelName.toLowerCase();
    const photoUrl = photo.url ? photo.url.toLowerCase() : '';
    const photoDesc = photo.description ? photo.description.toLowerCase() : '';
    
    return photoUrl.includes(hotelNameLower) || photoDesc.includes(hotelNameLower);
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
    console.log('🧪 Testing EXACT Hotel Photo Finder with your real hotels...\n');
    
    const testHotels = [
      { name: 'Long Bay Beach Club', city: 'Turks and Caicos', country: 'Turks and Caicos Islands' },
      { name: 'Hotel das Cataratas', city: 'Iguazu Falls', country: 'Argentina' },
      { name: 'Villa Spalletti Trivelli', city: 'Rome', country: 'Italy' }
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
      
      // Add delay between hotels
      await this.sleep(3000);
    }
    
    this.printStats();
  }

  printStats() {
    console.log('\n📊 EXACT HOTEL PHOTO STATISTICS:');
    console.log(`Total hotels tested: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Exact photos found: ${this.stats.exactPhotos}`);
    console.log(`Generic photos found: ${this.stats.genericPhotos}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(1);
      const exactRate = ((this.stats.exactPhotos / (this.stats.exactPhotos + this.stats.genericPhotos)) * 100).toFixed(1);
      console.log(`Success rate: ${successRate}%`);
      console.log(`Exact photo rate: ${exactRate}%`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
const finder = new ExactHotelPhotoFinder();
finder.testWithRealHotels().catch(console.error);
