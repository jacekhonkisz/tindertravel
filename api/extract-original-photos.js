require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

class OriginalPhotoExtractor {
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

  async extractOriginalPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Extracting ORIGINAL photos for: ${hotelName} in ${city}, ${country}`);
    
    const photos = [];
    
    // Strategy 1: Try to get original URLs from Bing Images
    try {
      console.log('  🔍 Extracting original URLs from Bing Images...');
      const bingPhotos = await this.extractBingOriginalUrls(hotelName, city, country);
      photos.push(...bingPhotos);
      console.log(`  ✅ Bing Images: ${bingPhotos.length} original photos extracted`);
    } catch (error) {
      console.log(`  ❌ Bing Images extraction failed: ${error.message}`);
    }
    
    // Strategy 2: Try Google Images with better extraction
    try {
      console.log('  🔍 Extracting original URLs from Google Images...');
      const googlePhotos = await this.extractGoogleOriginalUrls(hotelName, city, country);
      photos.push(...googlePhotos);
      console.log(`  ✅ Google Images: ${googlePhotos.length} original photos extracted`);
    } catch (error) {
      console.log(`  ❌ Google Images extraction failed: ${error.message}`);
    }
    
    // Strategy 3: Try DuckDuckGo Images
    try {
      console.log('  🔍 Extracting original URLs from DuckDuckGo Images...');
      const duckPhotos = await this.extractDuckDuckGoOriginalUrls(hotelName, city, country);
      photos.push(...duckPhotos);
      console.log(`  ✅ DuckDuckGo Images: ${duckPhotos.length} original photos extracted`);
    } catch (error) {
      console.log(`  ❌ DuckDuckGo Images extraction failed: ${error.message}`);
    }
    
    // Filter for high quality photos only
    const highQualityPhotos = this.filterHighQualityPhotos(photos);
    const uniquePhotos = this.removeDuplicatePhotos(highQualityPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} ORIGINAL photos for ${hotelName}`);
    
    return finalPhotos;
  }

  async extractBingOriginalUrls(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel photos`);
      const searchUrl = `https://www.bing.com/images/search?q=${searchQuery}&form=HDRSC2&first=1&tsc=ImageHoverTitle&qft=+filterui:imagesize-large`;
      
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
        timeout: 20000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for image containers with data attributes
      $('.img_cont, .iusc, .img_container').each((i, element) => {
        const $el = $(element);
        
        // Try to get the original URL from various data attributes
        let originalUrl = $el.attr('data-src') || 
                         $el.attr('data-original') || 
                         $el.attr('data-url') ||
                         $el.find('img').attr('data-src') ||
                         $el.find('img').attr('data-original');
        
        // If we have a Bing thumbnail, try to extract the original URL
        if (originalUrl && originalUrl.includes('tse') && originalUrl.includes('bing.net')) {
          try {
            const urlParams = new URLSearchParams(originalUrl.split('?')[1]);
            const extractedUrl = urlParams.get('q');
            if (extractedUrl) {
              originalUrl = decodeURIComponent(extractedUrl);
            }
          } catch (e) {
            // If extraction fails, try to get a larger version
            originalUrl = originalUrl.replace(/&w=\d+&h=\d+/, '').replace(/&w=\d+/, '').replace(/&h=\d+/, '');
          }
        }
        
        // Also try to get the URL from the img src
        if (!originalUrl) {
          const imgSrc = $el.find('img').attr('src');
          if (imgSrc && imgSrc.includes('http') && !imgSrc.includes('bing.com')) {
            originalUrl = imgSrc;
          }
        }
        
        if (originalUrl && originalUrl.includes('http') && !originalUrl.includes('bing.com') && !originalUrl.includes('placeholder')) {
          photos.push({
            url: originalUrl,
            width: 1920,
            height: 1080,
            description: `${hotelName} hotel photo from Bing Images`,
            source: 'bing_images',
            photographer: 'Bing Images',
            photographerUrl: 'https://www.bing.com',
            isExact: true,
            quality: 'high'
          });
        }
      });
      
      return photos.slice(0, 8);
    } catch (error) {
      throw new Error(`Bing Images extraction failed: ${error.message}`);
    }
  }

  async extractGoogleOriginalUrls(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel photos`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch&safe=off&tbs=isz:l`;
      
      console.log(`    🔍 Searching: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 20000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for image containers
      $('.rg_i, .img_cont, .iusc').each((i, element) => {
        const $el = $(element);
        
        // Try to get the original URL from various data attributes
        let originalUrl = $el.attr('data-src') || 
                         $el.attr('data-original') || 
                         $el.attr('data-url') ||
                         $el.find('img').attr('data-src') ||
                         $el.find('img').attr('data-original');
        
        // If we have a Google thumbnail, try to extract the original URL
        if (originalUrl && originalUrl.includes('googleusercontent.com')) {
          // Try to get the original URL by removing size parameters
          originalUrl = originalUrl.replace(/=w\d+-h\d+/, '').replace(/=w\d+/, '').replace(/=h\d+/, '');
        }
        
        if (originalUrl && originalUrl.includes('http') && !originalUrl.includes('google.com') && !originalUrl.includes('gstatic.com') && !originalUrl.includes('placeholder')) {
          photos.push({
            url: originalUrl,
            width: 1920,
            height: 1080,
            description: `${hotelName} hotel photo from Google Images`,
            source: 'google_images',
            photographer: 'Google Images',
            photographerUrl: 'https://www.google.com',
            isExact: true,
            quality: 'high'
          });
        }
      });
      
      return photos.slice(0, 8);
    } catch (error) {
      throw new Error(`Google Images extraction failed: ${error.message}`);
    }
  }

  async extractDuckDuckGoOriginalUrls(hotelName, city, country) {
    try {
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel photos`);
      const searchUrl = `https://duckduckgo.com/?q=${searchQuery}&t=h_&iax=images&ia=images&iaf=size%3ALarge`;
      
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
        timeout: 20000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for image containers
      $('.tile--img, .img_cont, .iusc').each((i, element) => {
        const $el = $(element);
        
        // Try to get the original URL from various data attributes
        let originalUrl = $el.attr('data-src') || 
                         $el.attr('data-original') || 
                         $el.attr('data-url') ||
                         $el.find('img').attr('data-src') ||
                         $el.find('img').attr('data-original');
        
        if (originalUrl && originalUrl.includes('http') && !originalUrl.includes('duckduckgo.com') && !originalUrl.includes('placeholder')) {
          photos.push({
            url: originalUrl,
            width: 1920,
            height: 1080,
            description: `${hotelName} hotel photo from DuckDuckGo Images`,
            source: 'duckduckgo_images',
            photographer: 'DuckDuckGo Images',
            photographerUrl: 'https://duckduckgo.com',
            isExact: true,
            quality: 'high'
          });
        }
      });
      
      return photos.slice(0, 8);
    } catch (error) {
      throw new Error(`DuckDuckGo Images extraction failed: ${error.message}`);
    }
  }

  filterHighQualityPhotos(photos) {
    return photos.filter(photo => {
      // Filter out low quality indicators
      if (!photo.url || photo.url.includes('placeholder') || photo.url.includes('pixel')) {
        return false;
      }
      
      // Filter out very small images
      if (photo.url.includes('w=42') || photo.url.includes('w=89') || photo.url.includes('w=149')) {
        return false;
      }
      
      // Filter out black/empty images
      if (photo.url.includes('black') || photo.url.includes('empty') || photo.url.includes('blank')) {
        return false;
      }
      
      // Prefer images that look like they could be high quality
      if (photo.url.includes('1920') || photo.url.includes('1080') || photo.url.includes('2048') || photo.url.includes('4096')) {
        return true;
      }
      
      // Prefer images from known high-quality sources
      if (photo.url.includes('unsplash.com') || photo.url.includes('pexels.com') || photo.url.includes('pixabay.com')) {
        return true;
      }
      
      // Prefer images that don't look like thumbnails
      if (!photo.url.includes('thumb') && !photo.url.includes('small') && !photo.url.includes('mini')) {
        return true;
      }
      
      return false;
    });
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

  async updateFirst3HotelsWithOriginalPhotos() {
    console.log('🔄 Updating first 3 hotels with ORIGINAL photos...\n');
    
    try {
      // Get first 3 hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels to update with original photos\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        
        // Get original photos
        const originalPhotos = await this.extractOriginalPhotos(hotel.name, hotel.city, hotel.country, 5);
        
        if (originalPhotos.length > 0) {
          console.log(`  📸 Found ${originalPhotos.length} ORIGINAL photos:`);
          originalPhotos.forEach((photo, j) => {
            console.log(`    ${j + 1}. ${photo.url}`);
            console.log(`       Source: ${photo.source}`);
            console.log(`       Quality: ${photo.quality}`);
          });
          
          // Update hotel with original photos
          const photoUrls = originalPhotos.map(photo => photo.url);
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
            console.log(`  ❌ Update failed: ${updateError.message}`);
          } else {
            console.log(`  ✅ SUCCESS: Updated with ${originalPhotos.length} ORIGINAL photos`);
          }
        } else {
          console.log(`  ❌ No original photos found`);
        }
        
        console.log('  ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(5000);
        }
      }
      
      console.log('\n🎉 First 3 hotels updated with ORIGINAL photos!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the original photo extraction
const extractor = new OriginalPhotoExtractor();
extractor.updateFirst3HotelsWithOriginalPhotos().catch(console.error);
