const axios = require('axios');

class FreePhotoService {
  constructor() {
    // Unsplash API - completely free with high-quality photos
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
    this.unsplashBaseUrl = 'https://api.unsplash.com';
    
    // Pexels API - also free with good hotel photos
    this.pexelsApiKey = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY';
    this.pexelsBaseUrl = 'https://api.pexels.com/v1';
    
    // Pixabay API - free with decent hotel photos
    this.pixabayApiKey = process.env.PIXABAY_API_KEY || 'YOUR_PIXABAY_API_KEY';
    this.pixabayBaseUrl = 'https://pixabay.com/api';
  }

  /**
   * Get hotel photos from Unsplash (FREE - no cost)
   */
  async getUnsplashPhotos(query, count = 8) {
    try {
      const response = await axios.get(`${this.unsplashBaseUrl}/search/photos`, {
        params: {
          query: query,
          per_page: count,
          orientation: 'landscape',
          w: 1920, // Full HD width
          h: 1080  // Full HD height
        },
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        }
      });

      return response.data.results.map(photo => ({
        url: photo.urls.regular, // Full HD quality
        width: photo.width,
        height: photo.height,
        description: photo.description || photo.alt_description,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html
      }));
    } catch (error) {
      console.error('Unsplash API error:', error.message);
      return [];
    }
  }

  /**
   * Get hotel photos from Pexels (FREE - no cost)
   */
  async getPexelsPhotos(query, count = 8) {
    try {
      const response = await axios.get(`${this.pexelsBaseUrl}/search`, {
        params: {
          query: query,
          per_page: count,
          orientation: 'landscape',
          size: 'large' // High quality
        },
        headers: {
          'Authorization': this.pexelsApiKey
        }
      });

      return response.data.photos.map(photo => ({
        url: photo.src.large2x, // High quality
        width: photo.width,
        height: photo.height,
        description: photo.alt,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
      }));
    } catch (error) {
      console.error('Pexels API error:', error.message);
      return [];
    }
  }

  /**
   * Get hotel photos from Pixabay (FREE - no cost)
   */
  async getPixabayPhotos(query, count = 8) {
    try {
      const response = await axios.get(this.pixabayBaseUrl, {
        params: {
          key: this.pixabayApiKey,
          q: query,
          per_page: count,
          orientation: 'horizontal',
          image_type: 'photo',
          min_width: 1920, // Full HD minimum
          min_height: 1080,
          category: 'travel' // Hotel/travel category
        }
      });

      return response.data.hits.map(photo => ({
        url: photo.largeImageURL, // High quality
        width: photo.imageWidth,
        height: photo.imageHeight,
        description: photo.tags,
        source: 'pixabay',
        photographer: photo.user,
        photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`
      }));
    } catch (error) {
      console.error('Pixabay API error:', error.message);
      return [];
    }
  }

  /**
   * Get hotel photos from multiple free sources
   */
  async getHotelPhotos(hotelName, city, country, count = 10) {
    console.log(`🆓 Fetching FREE photos for ${hotelName}...`);
    
    // Create search queries
    const queries = [
      `${hotelName} hotel`,
      `luxury hotel ${city}`,
      `hotel room ${city}`,
      `resort ${city}`,
      `hotel interior`,
      `luxury hotel room`
    ];

    let allPhotos = [];
    
    // Try Unsplash first (best quality)
    try {
      console.log('  📸 Trying Unsplash...');
      for (const query of queries.slice(0, 2)) {
        const photos = await this.getUnsplashPhotos(query, Math.ceil(count / 3));
        allPhotos = allPhotos.concat(photos);
        if (allPhotos.length >= count) break;
      }
    } catch (error) {
      console.log('  ❌ Unsplash failed:', error.message);
    }

    // Try Pexels if we need more photos
    if (allPhotos.length < count) {
      try {
        console.log('  📸 Trying Pexels...');
        for (const query of queries.slice(2, 4)) {
          const photos = await this.getPexelsPhotos(query, Math.ceil((count - allPhotos.length) / 2));
          allPhotos = allPhotos.concat(photos);
          if (allPhotos.length >= count) break;
        }
      } catch (error) {
        console.log('  ❌ Pexels failed:', error.message);
      }
    }

    // Try Pixabay if we still need more photos
    if (allPhotos.length < count) {
      try {
        console.log('  📸 Trying Pixabay...');
        for (const query of queries.slice(4, 6)) {
          const photos = await this.getPixabayPhotos(query, count - allPhotos.length);
          allPhotos = allPhotos.concat(photos);
          if (allPhotos.length >= count) break;
        }
      } catch (error) {
        console.log('  ❌ Pixabay failed:', error.message);
      }
    }

    // Remove duplicates and limit to requested count
    const uniquePhotos = this.removeDuplicatePhotos(allPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);

    console.log(`  ✅ Found ${finalPhotos.length} FREE photos from ${this.getSourceBreakdown(finalPhotos)}`);
    
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
   * Test the free photo services
   */
  async testServices() {
    console.log('🧪 Testing FREE photo services...');
    
    const testQueries = ['luxury hotel', 'hotel room', 'resort'];
    
    for (const query of testQueries) {
      console.log(`\n📸 Testing query: "${query}"`);
      
      // Test Unsplash
      try {
        const unsplashPhotos = await this.getUnsplashPhotos(query, 3);
        console.log(`  Unsplash: ${unsplashPhotos.length} photos`);
        if (unsplashPhotos.length > 0) {
          console.log(`    Sample: ${unsplashPhotos[0].url}`);
        }
      } catch (error) {
        console.log(`  Unsplash: Failed - ${error.message}`);
      }
      
      // Test Pexels
      try {
        const pexelsPhotos = await this.getPexelsPhotos(query, 3);
        console.log(`  Pexels: ${pexelsPhotos.length} photos`);
        if (pexelsPhotos.length > 0) {
          console.log(`    Sample: ${pexelsPhotos[0].url}`);
        }
      } catch (error) {
        console.log(`  Pexels: Failed - ${error.message}`);
      }
      
      // Test Pixabay
      try {
        const pixabayPhotos = await this.getPixabayPhotos(query, 3);
        console.log(`  Pixabay: ${pixabayPhotos.length} photos`);
        if (pixabayPhotos.length > 0) {
          console.log(`    Sample: ${pixabayPhotos[0].url}`);
        }
      } catch (error) {
        console.log(`  Pixabay: Failed - ${error.message}`);
      }
    }
  }
}

// Export the service
module.exports = { FreePhotoService };

// Test the service if run directly
if (require.main === module) {
  const service = new FreePhotoService();
  service.testServices().catch(console.error);
}
