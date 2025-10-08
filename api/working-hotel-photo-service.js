const axios = require('axios');

class WorkingHotelPhotoService {
  constructor() {
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    this.pexelsApiKey = process.env.PEXELS_API_KEY;
    this.pixabayApiKey = process.env.PIXABAY_API_KEY;
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    console.log('🔧 Working Hotel Photo Service Initialized');
    console.log('📸 Available APIs:');
    console.log(`   Unsplash: ${this.unsplashAccessKey ? '✅' : '❌'}`);
    console.log(`   Pexels: ${this.pexelsApiKey ? '✅' : '❌'}`);
    console.log(`   Pixabay: ${this.pixabayApiKey ? '✅' : '❌'}`);
    console.log(`   Google Places: ${this.googlePlacesApiKey ? '✅' : '❌'}`);
  }

  async getUnsplashPhotos(query, count = 5) {
    if (!this.unsplashAccessKey) {
      console.log('⚠️ Unsplash API key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: query,
          per_page: count,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        },
        timeout: 10000
      });

      return response.data.results.map(photo => ({
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        width: photo.width,
        height: photo.height,
        source: 'unsplash',
        photographer: photo.user.name,
        description: photo.description || photo.alt_description
      }));
    } catch (error) {
      console.log(`❌ Unsplash API failed: ${error.message}`);
      return [];
    }
  }

  async getPexelsPhotos(query, count = 5) {
    if (!this.pexelsApiKey) {
      console.log('⚠️ Pexels API key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: query,
          per_page: count,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': this.pexelsApiKey
        },
        timeout: 10000
      });

      return response.data.photos.map(photo => ({
        url: photo.src.large,
        thumbnail: photo.src.medium,
        width: photo.width,
        height: photo.height,
        source: 'pexels',
        photographer: photo.photographer,
        description: photo.alt
      }));
    } catch (error) {
      console.log(`❌ Pexels API failed: ${error.message}`);
      return [];
    }
  }

  async getPixabayPhotos(query, count = 5) {
    if (!this.pixabayApiKey) {
      console.log('⚠️ Pixabay API key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: this.pixabayApiKey,
          q: query,
          per_page: count,
          image_type: 'photo',
          orientation: 'horizontal',
          min_width: 1920,
          min_height: 1080
        },
        timeout: 10000
      });

      return response.data.hits.map(photo => ({
        url: photo.largeImageURL,
        thumbnail: photo.previewURL,
        width: photo.imageWidth,
        height: photo.imageHeight,
        source: 'pixabay',
        photographer: photo.user,
        description: photo.tags
      }));
    } catch (error) {
      console.log(`❌ Pixabay API failed: ${error.message}`);
      return [];
    }
  }

  async getGooglePlacesPhotos(hotelName, city, country) {
    if (!this.googlePlacesApiKey) {
      console.log('⚠️ Google Places API key not configured');
      return [];
    }

    try {
      // First, search for the hotel
      const searchResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `${hotelName} ${city} ${country}`,
          key: this.googlePlacesApiKey,
          type: 'lodging'
        },
        timeout: 10000
      });

      if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
        return [];
      }

      const place = searchResponse.data.results[0];
      const photos = [];

      if (place.photos && place.photos.length > 0) {
        for (const photo of place.photos.slice(0, 5)) {
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1920&photoreference=${photo.photo_reference}&key=${this.googlePlacesApiKey}`;
          
          photos.push({
            url: photoUrl,
            thumbnail: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.googlePlacesApiKey}`,
            width: photo.width || 1920,
            height: photo.height || 1080,
            source: 'google_places',
            photographer: 'Google Places',
            description: `${hotelName} - Real hotel photo`
          });
        }
      }

      return photos;
    } catch (error) {
      console.log(`❌ Google Places API failed: ${error.message}`);
      return [];
    }
  }

  async getHotelPhotos(hotelName, city, country, count = 10) {
    console.log(`\n📸 Getting photos for: ${hotelName} in ${city}, ${country}`);
    
    const allPhotos = [];
    
    // Try Google Places first (real hotel photos)
    console.log('🔍 Searching Google Places for real hotel photos...');
    const googlePhotos = await this.getGooglePlacesPhotos(hotelName, city, country);
    allPhotos.push(...googlePhotos);
    console.log(`✅ Found ${googlePhotos.length} real hotel photos`);
    
    // If we need more photos, try generic APIs
    const remainingCount = count - allPhotos.length;
    if (remainingCount > 0) {
      const searchQueries = [
        `${hotelName} hotel ${city}`,
        `luxury hotel ${city}`,
        `hotel ${city} ${country}`,
        `${city} accommodation`
      ];
      
      for (const query of searchQueries) {
        if (allPhotos.length >= count) break;
        
        console.log(`🔍 Searching for: ${query}`);
        
        // Try Unsplash
        if (this.unsplashAccessKey && allPhotos.length < count) {
          const unsplashPhotos = await this.getUnsplashPhotos(query, Math.min(3, count - allPhotos.length));
          allPhotos.push(...unsplashPhotos);
        }
        
        // Try Pexels
        if (this.pexelsApiKey && allPhotos.length < count) {
          const pexelsPhotos = await this.getPexelsPhotos(query, Math.min(3, count - allPhotos.length));
          allPhotos.push(...pexelsPhotos);
        }
        
        // Try Pixabay
        if (this.pixabayApiKey && allPhotos.length < count) {
          const pixabayPhotos = await this.getPixabayPhotos(query, Math.min(3, count - allPhotos.length));
          allPhotos.push(...pixabayPhotos);
        }
      }
    }
    
    // Remove duplicates and limit to requested count
    const uniquePhotos = allPhotos.filter((photo, index, self) => 
      index === self.findIndex(p => p.url === photo.url)
    ).slice(0, count);
    
    console.log(`✅ Total photos found: ${uniquePhotos.length}`);
    
    return uniquePhotos;
  }

  async testService() {
    console.log('🚀 Testing Hotel Photo Service\n');
    
    const testHotels = [
      { name: 'Hotel de Russie', city: 'Rome', country: 'Italy' },
      { name: 'The Ritz-Carlton', city: 'Paris', country: 'France' },
      { name: 'Four Seasons', city: 'New York', country: 'USA' }
    ];
    
    for (const hotel of testHotels) {
      console.log(`\n🏨 Testing: ${hotel.name}`);
      const photos = await this.getHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
      
      if (photos.length > 0) {
        console.log(`✅ Found ${photos.length} photos`);
        photos.forEach((photo, index) => {
          console.log(`   ${index + 1}. ${photo.source} - ${photo.width}x${photo.height}`);
        });
      } else {
        console.log('❌ No photos found');
      }
    }
    
    console.log('\n✅ Hotel Photo Service test completed!');
  }
}

// Export for use in other modules
module.exports = WorkingHotelPhotoService;

// Run test if this file is executed directly
if (require.main === module) {
  const service = new WorkingHotelPhotoService();
  service.testService().catch(console.error);
}
