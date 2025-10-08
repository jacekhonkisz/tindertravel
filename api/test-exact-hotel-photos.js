require('dotenv').config();
const axios = require('axios');

class ExactHotelPhotoService {
  constructor() {
    // We'll use Unsplash API with better search strategies
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
    this.unsplashBaseUrl = 'https://api.unsplash.com';
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      photosFound: 0
    };
  }

  async getExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    this.stats.total++;
    
    const photos = [];
    
    // Strategy 1: Try exact hotel name searches
    const exactQueries = [
      `${hotelName} hotel ${city}`,
      `${hotelName} ${city}`,
      `${hotelName} hotel`,
      `${hotelName} resort ${city}`,
      `${hotelName} luxury hotel ${city}`,
      `${hotelName} boutique hotel ${city}`,
      `${hotelName} ${city} ${country}`,
      `${hotelName} hotel ${city} ${country}`
    ];
    
    // Try each query until we get enough photos
    for (const query of exactQueries) {
      if (photos.length >= count) break;
      
      try {
        console.log(`  📸 Searching: "${query}"`);
        const queryPhotos = await this.searchUnsplash(query, count - photos.length);
        photos.push(...queryPhotos);
        
        if (queryPhotos.length > 0) {
          console.log(`    ✅ Found ${queryPhotos.length} photos`);
        }
        
      } catch (error) {
        console.log(`    ❌ Search failed: ${error.message}`);
      }
    }
    
    // Strategy 2: If we don't have enough, try generic luxury hotel photos for the city
    if (photos.length < count) {
      console.log(`  🔄 Only ${photos.length}/${count} photos found, trying luxury hotel photos for ${city}...`);
      
      const genericQueries = [
        `luxury hotel ${city}`,
        `boutique hotel ${city}`,
        `resort ${city}`,
        `hotel room ${city}`,
        `luxury hotel room ${city}`,
        `hotel interior ${city}`,
        `luxury resort ${city}`
      ];
      
      for (const query of genericQueries) {
        if (photos.length >= count) break;
        
        try {
          const genericPhotos = await this.searchUnsplash(query, count - photos.length);
          photos.push(...genericPhotos);
          
          if (genericPhotos.length > 0) {
            console.log(`    ✅ Found ${genericPhotos.length} luxury hotel photos`);
          }
          
        } catch (error) {
          console.log(`    ❌ Generic search failed: ${error.message}`);
        }
      }
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(photos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    if (finalPhotos.length > 0) {
      this.stats.successful++;
      this.stats.photosFound += finalPhotos.length;
      console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} photos for ${hotelName}`);
    } else {
      this.stats.failed++;
      console.log(`  ❌ FAILED: No photos found for ${hotelName}`);
    }
    
    return finalPhotos;
  }

  async searchUnsplash(query, count = 5) {
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
        photographerUrl: photo.user.links.html,
        searchQuery: query
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Unsplash API key');
      } else if (error.response?.status === 403) {
        throw new Error('Unsplash API rate limit exceeded');
      } else {
        throw new Error(`Unsplash API error: ${error.message}`);
      }
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

  async testWithRealHotels() {
    console.log('🧪 Testing EXACT Hotel Photo Service with your real hotels...\n');
    
    // Test with your actual hotels
    const testHotels = [
      { name: 'Long Bay Beach Club', city: 'Turks and Caicos', country: 'Turks and Caicos Islands' },
      { name: 'Hotel das Cataratas', city: 'Iguazu Falls', country: 'Argentina' },
      { name: 'Villa Spalletti Trivelli', city: 'Rome', country: 'Italy' },
      { name: 'La Valise Tulum', city: 'Tulum', country: 'Mexico' },
      { name: 'Borgo Pignano', city: 'Tuscany', country: 'Italy' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name} in ${hotel.city}`);
      const photos = await this.getExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`  📸 Sample photos:`);
        photos.slice(0, 3).forEach((photo, i) => {
          console.log(`    ${i + 1}. ${photo.url}`);
          console.log(`       Description: ${photo.description}`);
          console.log(`       Search query: ${photo.searchQuery}`);
        });
      }
      
      // Add delay between hotels
      await this.sleep(2000);
    }
    
    this.printStats();
  }

  printStats() {
    console.log('\n📊 EXACT HOTEL PHOTO STATISTICS:');
    console.log(`Total hotels tested: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total photos found: ${this.stats.photosFound}`);
    
    if (this.stats.total > 0) {
      const successRate = ((this.stats.successful / this.stats.total) * 100).toFixed(1);
      console.log(`Success rate: ${successRate}%`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Check if API key is available
if (process.env.UNSPLASH_ACCESS_KEY && process.env.UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY') {
  const service = new ExactHotelPhotoService();
  service.testWithRealHotels().catch(console.error);
} else {
  console.log('❌ Unsplash API key not configured');
  console.log('🔑 To test exact hotel photos:');
  console.log('1. Go to: https://unsplash.com/developers');
  console.log('2. Register → Create App → Copy Access Key');
  console.log('3. Add to .env: UNSPLASH_ACCESS_KEY=your_key_here');
  console.log('4. Run: node test-exact-hotel-photos.js');
}
