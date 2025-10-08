const axios = require('axios');
const cheerio = require('cheerio');

class RealPhotoScrapingTest {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
  }

  async testScraping() {
    console.log('�� TESTING REAL HOTEL PHOTO SCRAPING');
    console.log('='.repeat(50));
    
    // Test with a known hotel
    const testHotel = {
      name: 'Grand Palladium Select Palace Ibiza',
      city: 'Ibiza',
      country: 'Spain'
    };
    
    console.log(`🎯 Testing with: ${testHotel.name}`);
    console.log(`📍 Location: ${testHotel.city}, ${testHotel.country}`);
    
    try {
      // Test Booking.com scraping
      console.log('\n🔍 Testing Booking.com...');
      const bookingPhotos = await this.scrapeBookingCom(testHotel);
      console.log(`   Found ${bookingPhotos.length} photos from Booking.com`);
      
      if (bookingPhotos.length > 0) {
        console.log('   📸 Sample photo URL:');
        console.log(`   ${bookingPhotos[0].url}`);
      }
      
      // Test TripAdvisor scraping
      console.log('\n🔍 Testing TripAdvisor...');
      const tripadvisorPhotos = await this.scrapeTripAdvisor(testHotel);
      console.log(`   Found ${tripadvisorPhotos.length} photos from TripAdvisor`);
      
      if (tripadvisorPhotos.length > 0) {
        console.log('   📸 Sample photo URL:');
        console.log(`   ${tripadvisorPhotos[0].url}`);
      }
      
      // Test Expedia scraping
      console.log('\n🔍 Testing Expedia...');
      const expediaPhotos = await this.scrapeExpedia(testHotel);
      console.log(`   Found ${expediaPhotos.length} photos from Expedia`);
      
      if (expediaPhotos.length > 0) {
        console.log('   📸 Sample photo URL:');
        console.log(`   ${expediaPhotos[0].url}`);
      }
      
      const totalPhotos = bookingPhotos.length + tripadvisorPhotos.length + expediaPhotos.length;
      console.log(`\n📊 TOTAL PHOTOS FOUND: ${totalPhotos}`);
      
      if (totalPhotos > 0) {
        console.log('✅ SUCCESS: Real hotel photos can be scraped!');
        console.log('🚀 Ready to implement for all hotels');
      } else {
        console.log('❌ FAILED: No photos found');
        console.log('⚠️ May need different approach or better selectors');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async scrapeBookingCom(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country}`;
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchQuery)}`;
      
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
      
      return photos.slice(0, 8);
      
    } catch (error) {
      console.log(`   ⚠️ Booking.com error: ${error.message}`);
      return [];
    }
  }

  async scrapeTripAdvisor(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city}`;
      const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`;
      
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
      console.log(`   ⚠️ TripAdvisor error: ${error.message}`);
      return [];
    }
  }

  async scrapeExpedia(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city} ${hotel.country}`;
      const searchUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(searchQuery)}`;
      
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
      console.log(`   ⚠️ Expedia error: ${error.message}`);
      return [];
    }
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}

// Run the test
async function runTest() {
  const tester = new RealPhotoScrapingTest();
  await tester.testScraping();
}

runTest();
