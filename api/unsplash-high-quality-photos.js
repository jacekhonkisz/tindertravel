require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class UnsplashHighQualityPhotoFinder {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!this.unsplashAccessKey) {
      console.log('⚠️  No Unsplash API key found. Using free Unsplash API (limited).');
    }
  }

  async findHighQualityPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding HIGH QUALITY photos for: ${hotelName} in ${city}, ${country}`);
    
    const photos = [];
    
    // Strategy 1: Try Unsplash with specific hotel search
    try {
      console.log('  🔍 Searching Unsplash for high quality hotel photos...');
      const unsplashPhotos = await this.searchUnsplashHighQuality(hotelName, city, country);
      photos.push(...unsplashPhotos);
      console.log(`  ✅ Unsplash: ${unsplashPhotos.length} high quality photos found`);
    } catch (error) {
      console.log(`  ❌ Unsplash search failed: ${error.message}`);
    }
    
    // Strategy 2: Try Unsplash with city/location search
    try {
      console.log('  🔍 Searching Unsplash for city/location photos...');
      const cityPhotos = await this.searchUnsplashCity(hotelName, city, country);
      photos.push(...cityPhotos);
      console.log(`  ✅ Unsplash City: ${cityPhotos.length} high quality photos found`);
    } catch (error) {
      console.log(`  ❌ Unsplash city search failed: ${error.message}`);
    }
    
    // Strategy 3: Try Unsplash with luxury hotel search
    try {
      console.log('  🔍 Searching Unsplash for luxury hotel photos...');
      const luxuryPhotos = await this.searchUnsplashLuxury(hotelName, city, country);
      photos.push(...luxuryPhotos);
      console.log(`  ✅ Unsplash Luxury: ${luxuryPhotos.length} high quality photos found`);
    } catch (error) {
      console.log(`  ❌ Unsplash luxury search failed: ${error.message}`);
    }
    
    // Filter for high quality photos only
    const highQualityPhotos = this.filterHighQualityPhotos(photos);
    const uniquePhotos = this.removeDuplicatePhotos(highQualityPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} HIGH QUALITY photos for ${hotelName}`);
    
    return finalPhotos;
  }

  async searchUnsplashHighQuality(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = this.unsplashAccessKey 
        ? `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=10&orientation=landscape&w=1920&h=1080`
        : `https://unsplash.com/napi/search/photos?query=${searchQuery}&per_page=10&orientation=landscape`;
      
      console.log(`    🔍 Searching: ${url}`);
      
      const headers = this.unsplashAccessKey 
        ? { 'Authorization': `Client-ID ${this.unsplashAccessKey}` }
        : { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
      
      const response = await axios.get(url, { headers, timeout: 10000 });
      
      const photos = [];
      const results = response.data.results || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.urls && photo.urls.full) {
            photos.push({
              url: photo.urls.full,
              width: photo.width || 1920,
              height: photo.height || 1080,
              description: photo.description || `${hotelName} hotel photo from Unsplash`,
              source: 'unsplash',
              photographer: photo.user?.name || 'Unsplash',
              photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
              isExact: false, // Unsplash is generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Unsplash search failed: ${error.message}`);
    }
  }

  async searchUnsplashCity(hotelName, city, country) {
    try {
      // Search for city/location
      const searchQuery = encodeURIComponent(`${city} ${country} luxury hotel resort`);
      const url = this.unsplashAccessKey 
        ? `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=10&orientation=landscape&w=1920&h=1080`
        : `https://unsplash.com/napi/search/photos?query=${searchQuery}&per_page=10&orientation=landscape`;
      
      console.log(`    🔍 Searching: ${url}`);
      
      const headers = this.unsplashAccessKey 
        ? { 'Authorization': `Client-ID ${this.unsplashAccessKey}` }
        : { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
      
      const response = await axios.get(url, { headers, timeout: 10000 });
      
      const photos = [];
      const results = response.data.results || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.urls && photo.urls.full) {
            photos.push({
              url: photo.urls.full,
              width: photo.width || 1920,
              height: photo.height || 1080,
              description: photo.description || `${city} luxury hotel photo from Unsplash`,
              source: 'unsplash_city',
              photographer: photo.user?.name || 'Unsplash',
              photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
              isExact: false, // Unsplash is generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Unsplash city search failed: ${error.message}`);
    }
  }

  async searchUnsplashLuxury(hotelName, city, country) {
    try {
      // Search for luxury hotel concepts
      const searchQuery = encodeURIComponent(`luxury hotel resort ${city} architecture`);
      const url = this.unsplashAccessKey 
        ? `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=10&orientation=landscape&w=1920&h=1080`
        : `https://unsplash.com/napi/search/photos?query=${searchQuery}&per_page=10&orientation=landscape`;
      
      console.log(`    🔍 Searching: ${url}`);
      
      const headers = this.unsplashAccessKey 
        ? { 'Authorization': `Client-ID ${this.unsplashAccessKey}` }
        : { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
      
      const response = await axios.get(url, { headers, timeout: 10000 });
      
      const photos = [];
      const results = response.data.results || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.urls && photo.urls.full) {
            photos.push({
              url: photo.urls.full,
              width: photo.width || 1920,
              height: photo.height || 1080,
              description: photo.description || `Luxury hotel architecture in ${city} from Unsplash`,
              source: 'unsplash_luxury',
              photographer: photo.user?.name || 'Unsplash',
              photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
              isExact: false, // Unsplash is generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Unsplash luxury search failed: ${error.message}`);
    }
  }

  filterHighQualityPhotos(photos) {
    return photos.filter(photo => {
      // Filter out low quality indicators
      if (!photo.url || photo.url.includes('placeholder') || photo.url.includes('pixel')) {
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

  async updateFirst3HotelsWithHighQualityPhotos() {
    console.log('🔄 Updating first 3 hotels with HIGH QUALITY Unsplash photos...\n');
    
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

      console.log(`📋 Found ${hotels.length} hotels to update with high quality photos\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        
        // Get high quality photos
        const highQualityPhotos = await this.findHighQualityPhotos(hotel.name, hotel.city, hotel.country, 5);
        
        if (highQualityPhotos.length > 0) {
          console.log(`  📸 Found ${highQualityPhotos.length} HIGH QUALITY photos:`);
          highQualityPhotos.forEach((photo, j) => {
            console.log(`    ${j + 1}. ${photo.url}`);
            console.log(`       Source: ${photo.source}`);
            console.log(`       Quality: ${photo.quality}`);
            console.log(`       Photographer: ${photo.photographer}`);
          });
          
          // Update hotel with high quality photos
          const photoUrls = highQualityPhotos.map(photo => photo.url);
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
            console.log(`  ✅ SUCCESS: Updated with ${highQualityPhotos.length} HIGH QUALITY photos`);
          }
        } else {
          console.log(`  ❌ No high quality photos found`);
        }
        
        console.log('  ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(3000);
        }
      }
      
      console.log('\n🎉 First 3 hotels updated with HIGH QUALITY photos!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the high quality photo update
const finder = new UnsplashHighQualityPhotoFinder();
finder.updateFirst3HotelsWithHighQualityPhotos().catch(console.error);
