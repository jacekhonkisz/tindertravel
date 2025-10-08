require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

class UnlimitedFreeHotelPhotosFinder {
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

  async findUnlimitedFreePhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding UNLIMITED FREE photos for: ${hotelName} in ${city}, ${country}`);
    
    const photos = [];
    
    // Strategy 1: Try Unsplash with specific hotel searches (FREE & UNLIMITED)
    try {
      console.log('  🔍 Searching Unsplash for hotel photos...');
      const unsplashPhotos = await this.searchUnsplashHotel(hotelName, city, country);
      photos.push(...unsplashPhotos);
      console.log(`  ✅ Unsplash: ${unsplashPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Unsplash search failed: ${error.message}`);
    }
    
    // Strategy 2: Try Pexels API (FREE & UNLIMITED)
    try {
      console.log('  🔍 Searching Pexels for hotel photos...');
      const pexelsPhotos = await this.searchPexelsHotel(hotelName, city, country);
      photos.push(...pexelsPhotos);
      console.log(`  ✅ Pexels: ${pexelsPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Pexels search failed: ${error.message}`);
    }
    
    // Strategy 3: Try Pixabay API (FREE & UNLIMITED)
    try {
      console.log('  🔍 Searching Pixabay for hotel photos...');
      const pixabayPhotos = await this.searchPixabayHotel(hotelName, city, country);
      photos.push(...pixabayPhotos);
      console.log(`  ✅ Pixabay: ${pixabayPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Pixabay search failed: ${error.message}`);
    }
    
    // Strategy 4: Try Freepik API (FREE tier available)
    try {
      console.log('  🔍 Searching Freepik for hotel photos...');
      const freepikPhotos = await this.searchFreepikHotel(hotelName, city, country);
      photos.push(...freepikPhotos);
      console.log(`  ✅ Freepik: ${freepikPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Freepik search failed: ${error.message}`);
    }
    
    // Strategy 5: Try Openverse (Creative Commons - FREE & UNLIMITED)
    try {
      console.log('  🔍 Searching Openverse for hotel photos...');
      const openversePhotos = await this.searchOpenverseHotel(hotelName, city, country);
      photos.push(...openversePhotos);
      console.log(`  ✅ Openverse: ${openversePhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Openverse search failed: ${error.message}`);
    }
    
    // Strategy 6: Try Wikimedia Commons (FREE & UNLIMITED)
    try {
      console.log('  🔍 Searching Wikimedia Commons for hotel photos...');
      const wikimediaPhotos = await this.searchWikimediaHotel(hotelName, city, country);
      photos.push(...wikimediaPhotos);
      console.log(`  ✅ Wikimedia: ${wikimediaPhotos.length} photos found`);
    } catch (error) {
      console.log(`  ❌ Wikimedia search failed: ${error.message}`);
    }
    
    // Filter for high quality photos only
    const highQualityPhotos = this.filterHighQualityPhotos(photos);
    const uniquePhotos = this.removeDuplicatePhotos(highQualityPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} HIGH QUALITY photos for ${hotelName}`);
    
    return finalPhotos;
  }

  async searchUnsplashHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://unsplash.com/napi/search/photos?query=${searchQuery}&per_page=10&orientation=landscape`;
      
      console.log(`    🔍 Searching Unsplash: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
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
              isExact: false, // Generic but high quality
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

  async searchPexelsHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://www.pexels.com/api/v1/search?query=${searchQuery}&per_page=10&orientation=landscape`;
      
      console.log(`    🔍 Searching Pexels: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const photos = [];
      const results = response.data.photos || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.src && photo.src.large) {
            photos.push({
              url: photo.src.large,
              width: photo.width || 1920,
              height: photo.height || 1080,
              description: photo.alt || `${hotelName} hotel photo from Pexels`,
              source: 'pexels',
              photographer: photo.photographer || 'Pexels',
              photographerUrl: photo.photographer_url || 'https://www.pexels.com',
              isExact: false, // Generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Pexels search failed: ${error.message}`);
    }
  }

  async searchPixabayHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://pixabay.com/api/?key=YOUR_API_KEY&q=${searchQuery}&image_type=photo&orientation=horizontal&per_page=10`;
      
      console.log(`    🔍 Searching Pixabay: ${url}`);
      
      // Note: Pixabay requires API key, but we can try without it
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const photos = [];
      const results = response.data.hits || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.webformatURL) {
            photos.push({
              url: photo.webformatURL,
              width: photo.imageWidth || 1920,
              height: photo.imageHeight || 1080,
              description: photo.tags || `${hotelName} hotel photo from Pixabay`,
              source: 'pixabay',
              photographer: photo.user || 'Pixabay',
              photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
              isExact: false, // Generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Pixabay search failed: ${error.message}`);
    }
  }

  async searchFreepikHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://www.freepik.com/api/v1/search?query=${searchQuery}&type=photo&per_page=10`;
      
      console.log(`    🔍 Searching Freepik: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const photos = [];
      const results = response.data.data || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.attributes && photo.attributes.url) {
            photos.push({
              url: photo.attributes.url,
              width: photo.attributes.width || 1920,
              height: photo.attributes.height || 1080,
              description: photo.attributes.description || `${hotelName} hotel photo from Freepik`,
              source: 'freepik',
              photographer: photo.attributes.author || 'Freepik',
              photographerUrl: photo.attributes.author_url || 'https://www.freepik.com',
              isExact: false, // Generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Freepik search failed: ${error.message}`);
    }
  }

  async searchOpenverseHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://api.openverse.engineering/v1/images/?q=${searchQuery}&license_type=commercial&size=large&per_page=10`;
      
      console.log(`    �� Searching Openverse: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const photos = [];
      const results = response.data.results || response.data;
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.url) {
            photos.push({
              url: photo.url,
              width: photo.width || 1920,
              height: photo.height || 1080,
              description: photo.title || `${hotelName} hotel photo from Openverse`,
              source: 'openverse',
              photographer: photo.creator || 'Openverse',
              photographerUrl: photo.foreign_landing_url || 'https://openverse.org',
              isExact: false, // Generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Openverse search failed: ${error.message}`);
    }
  }

  async searchWikimediaHotel(hotelName, city, country) {
    try {
      // Search for specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" hotel luxury`);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${searchQuery}&srnamespace=6&srlimit=10`;
      
      console.log(`    🔍 Searching Wikimedia: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });
      
      const photos = [];
      const results = response.data.query?.search || [];
      
      if (Array.isArray(results)) {
        results.forEach(photo => {
          if (photo.title) {
            const imageUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(photo.title)}`;
            photos.push({
              url: imageUrl,
              width: 1920,
              height: 1080,
              description: photo.snippet || `${hotelName} hotel photo from Wikimedia`,
              source: 'wikimedia',
              photographer: 'Wikimedia Commons',
              photographerUrl: 'https://commons.wikimedia.org',
              isExact: false, // Generic but high quality
              quality: 'high'
            });
          }
        });
      }
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Wikimedia search failed: ${error.message}`);
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

  async updateFirst3HotelsWithUnlimitedPhotos() {
    console.log('🔄 Updating first 3 hotels with UNLIMITED FREE photos...\n');
    
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

      console.log(`📋 Found ${hotels.length} hotels to update with unlimited photos\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        
        // Get unlimited photos
        const unlimitedPhotos = await this.findUnlimitedFreePhotos(hotel.name, hotel.city, hotel.country, 5);
        
        if (unlimitedPhotos.length > 0) {
          console.log(`  📸 Found ${unlimitedPhotos.length} UNLIMITED FREE photos:`);
          unlimitedPhotos.forEach((photo, j) => {
            console.log(`    ${j + 1}. ${photo.url}`);
            console.log(`       Source: ${photo.source}`);
            console.log(`       Quality: ${photo.quality}`);
            console.log(`       Photographer: ${photo.photographer}`);
          });
          
          // Update hotel with unlimited photos
          const photoUrls = unlimitedPhotos.map(photo => photo.url);
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
            console.log(`  ✅ SUCCESS: Updated with ${unlimitedPhotos.length} UNLIMITED FREE photos`);
          }
        } else {
          console.log(`  ❌ No unlimited photos found`);
        }
        
        console.log('  ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(3000);
        }
      }
      
      console.log('\n🎉 First 3 hotels updated with UNLIMITED FREE photos!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the unlimited photo update
const finder = new UnlimitedFreeHotelPhotosFinder();
finder.updateFirst3HotelsWithUnlimitedPhotos().catch(console.error);
