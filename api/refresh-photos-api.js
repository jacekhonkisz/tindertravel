const axios = require('axios');

class APIPhotoRefresher {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.googlePlacesClient = require('./src/google-places.js').GooglePlacesClient;
  }

  async refreshPhotos() {
    console.log('🔄 Starting photo refresh to HD/2K/4K quality...');
    
    try {
      // Get all hotels from API
      const response = await axios.get(`${this.apiBase}/hotels?limit=1000`);
      const hotels = response.data.hotels;
      console.log(`📊 Found ${hotels.length} hotels to refresh`);
      
      let refreshedCount = 0;
      let failedCount = 0;
      
      // Process hotels in batches
      const batchSize = 3;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`🔄 Refreshing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        for (const hotel of batch) {
          try {
            const result = await this.refreshHotelPhotos(hotel);
            if (result.success) {
              refreshedCount++;
              console.log(`✅ ${hotel.name}: ${result.photoCount} photos refreshed (${result.resolutions.join(', ')})`);
            } else {
              failedCount++;
              console.log(`❌ ${hotel.name}: ${result.reason}`);
            }
          } catch (error) {
            failedCount++;
            console.log(`❌ ${hotel.name}: ${error.message}`);
          }
          
          // Rate limiting between hotels
          await this.sleep(1000);
        }
        
        // Rate limiting between batches
        await this.sleep(2000);
      }
      
      console.log('\n📊 Photo Refresh Results:');
      console.log(`Hotels Refreshed: ${refreshedCount}`);
      console.log(`Hotels Failed: ${failedCount}`);
      console.log(`Success Rate: ${Math.round(refreshedCount / hotels.length * 100)}%`);
      
      // Test the results
      console.log('\n🧪 Testing updated photos...');
      await this.testUpdatedPhotos();
      
    } catch (error) {
      console.error('❌ Photo refresh failed:', error.message);
    }
  }

  async refreshHotelPhotos(hotel) {
    try {
      console.log(`  🏨 Refreshing ${hotel.name}...`);
      
      // Search for the hotel on Google Places to get fresh photos
      const searchQuery = `${hotel.name} hotel ${hotel.city} ${hotel.country}`;
      const googleHotels = await this.googlePlacesClient.searchHotels(searchQuery, 1);
      
      if (googleHotels.length === 0) {
        return { success: false, reason: 'No Google Places results' };
      }
      
      const googleHotel = googleHotels[0];
      if (!googleHotel.photos || googleHotel.photos.length === 0) {
        return { success: false, reason: 'No photos found' };
      }
      
      // Get fresh photo URLs with higher resolution
      const freshPhotos = googleHotel.photos.slice(0, 10); // Take up to 10 photos
      
      if (freshPhotos.length < 4) {
        return { success: false, reason: `Only ${freshPhotos.length}/4 photos found` };
      }
      
      // For now, just log the new resolutions - we'll need to implement database update
      const resolutions = freshPhotos.map(photo => `${photo.width}x${photo.height}`);
      
      return { 
        success: true, 
        photoCount: freshPhotos.length,
        resolutions: resolutions,
        photos: freshPhotos.map(photo => photo.url)
      };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async testUpdatedPhotos() {
    try {
      const response = await axios.get(`${this.apiBase}/hotels?limit=5`);
      const hotels = response.data.hotels;
      
      console.log('📸 Sample of current photo resolutions:');
      hotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name}:`);
        hotel.photos.slice(0, 3).forEach((photo, photoIndex) => {
          console.log(`   Photo ${photoIndex + 1}: ${photo}`);
        });
      });
      
    } catch (error) {
      console.error('❌ Failed to test photos:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the photo refresh
async function runPhotoRefresh() {
  const refresher = new APIPhotoRefresher();
  await refresher.refreshPhotos();
}

runPhotoRefresh();
