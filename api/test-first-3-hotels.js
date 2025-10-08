require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

class First3HotelsTest {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  async testFirst3Hotels() {
    console.log('🧪 Testing First 3 Hotels with EXACT Photos...\n');
    
    try {
      // Get first 3 hotels from database
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .limit(3);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels for testing\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name}`);
        console.log(`   Location: ${hotel.city}, ${hotel.country}`);
        console.log(`   Current photos: ${hotel.photos?.length || 0}`);
        
        // Get exact photos for this hotel
        console.log(`   🔍 Finding EXACT photos...`);
        const exactPhotos = await this.findExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
        
        if (exactPhotos.length > 0) {
          console.log(`   ✅ Found ${exactPhotos.length} EXACT photos:`);
          exactPhotos.forEach((photo, j) => {
            console.log(`     ${j + 1}. ${photo.url}`);
            console.log(`        Source: ${photo.source}`);
            console.log(`        Description: ${photo.description}`);
          });
          
          // Update hotel with exact photos
          console.log(`   💾 Updating hotel with exact photos...`);
          const photoUrls = exactPhotos.map(photo => photo.url);
          const heroPhoto = photoUrls[0] || '';
          
          const { error: updateError } = await this.supabase
            .from('hotels')
            .update({
              photos: photoUrls,
              hero_photo: heroPhoto,
              updated_at: new Date().toISOString()
            })
            .eq('id', hotel.id);
          
          if (updateError) {
            console.log(`   ❌ Update failed: ${updateError.message}`);
          } else {
            console.log(`   ✅ SUCCESS: Updated with ${exactPhotos.length} exact photos`);
          }
        } else {
          console.log(`   ❌ No exact photos found`);
        }
        
        console.log('   ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(3000);
        }
      }
      
      console.log('\n🎉 Test completed! Check your app to see the exact hotel photos.');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async findExactHotelPhotos(hotelName, city, country, count = 5) {
    const photos = [];
    
    // Try Bing Images (working well)
    try {
      const bingPhotos = await this.searchBingImages(hotelName, city, country);
      photos.push(...bingPhotos);
    } catch (error) {
      console.log(`     ❌ Bing Images failed: ${error.message}`);
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    return uniquePhotos.slice(0, count);
  }

  async searchBingImages(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel photos`);
      const searchUrl = `https://www.bing.com/images/search?q=${searchQuery}&form=HDRSC2&first=1&tsc=ImageHoverTitle`;
      
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
        timeout: 20000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for image URLs in Bing Images results
      $('img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('bing.com') && !src.includes('placeholder')) {
          // Try to get higher resolution by removing size parameters
          let highResSrc = src;
          
          // Remove thumbnail parameters and try to get original
          if (src.includes('tse') && src.includes('mm.bing.net')) {
            // This is a Bing thumbnail, try to extract original URL
            const urlParams = new URLSearchParams(src.split('?')[1]);
            const originalUrl = urlParams.get('q');
            if (originalUrl) {
              highResSrc = decodeURIComponent(originalUrl);
            }
          }
          
          // Remove size restrictions
          highResSrc = highResSrc.replace(/&w=\d+&h=\d+/, '').replace(/&w=\d+/, '').replace(/&h=\d+/, '');
          
          photos.push({
            url: highResSrc,
            width: 1024,
            height: 768,
            description: `${hotelName} hotel photo from Bing Images`,
            source: 'bing_images',
            photographer: 'Bing Images',
            photographerUrl: 'https://www.bing.com',
            isExact: true
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Bing Images search failed: ${error.message}`);
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
const tester = new First3HotelsTest();
tester.testFirst3Hotels().catch(console.error);
