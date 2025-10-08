const axios = require('axios');
const cheerio = require('cheerio');

class GoogleImagesTest {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
  }

  async testGoogleImages() {
    console.log('🧪 TESTING GOOGLE IMAGES SCRAPING');
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
      const searchQuery = `${testHotel.name} ${testHotel.city} ${testHotel.country} hotel photos`;
      const photos = await this.searchGoogleImages(searchQuery, testHotel);
      
      console.log(`\n📊 Found ${photos.length} photos`);
      
      if (photos.length > 0) {
        console.log('✅ SUCCESS: Google Images scraping works!');
        console.log('\n📸 Sample photos:');
        photos.slice(0, 3).forEach((photo, index) => {
          console.log(`   ${index + 1}. ${photo.url}`);
        });
      } else {
        console.log('❌ FAILED: No photos found');
        console.log('⚠️ May need different approach');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async searchGoogleImages(query, hotel) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
      
      console.log(`\n🔍 Searching Google Images...`);
      console.log(`   Query: ${query}`);
      console.log(`   URL: ${searchUrl}`);
      
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
      
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response size: ${response.data.length} characters`);
      
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
      
      console.log(`   Images found: ${photos.length}`);
      
      return photos.slice(0, 8);
      
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

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}

// Run the test
async function runTest() {
  const tester = new GoogleImagesTest();
  await tester.testGoogleImages();
}

runTest();
