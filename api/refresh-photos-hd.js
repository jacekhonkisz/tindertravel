const axios = require('axios');

class PhotoRefresher {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.googlePlacesClient = require('./src/google-places.js').GooglePlacesClient;
  }

  async refreshAllPhotos() {
    console.log('�� Starting photo refresh to HD/2K/4K quality...');
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBase}/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to refresh`);
      
      let refreshedCount = 0;
      let failedCount = 0;
      
      // Process hotels in batches
      const batchSize = 5;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`🔄 Refreshing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        const batchPromises = batch.map(hotel => this.refreshHotelPhotos(hotel));
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.success) {
            refreshedCount++;
            console.log(`✅ ${result.value.hotelName}: Photos refreshed`);
          } else {
            failedCount++;
            console.log(`❌ Failed to refresh photos`);
          }
        }
        
        // Rate limiting between batches
        await this.sleep(2000);
      }
      
      console.log('\n📊 Photo Refresh Results:');
      console.log(`Hotels Refreshed: ${refreshedCount}`);
      console.log(`Hotels Failed: ${failedCount}`);
      console.log(`Success Rate: ${Math.round(refreshedCount / hotels.length * 100)}%`);
      
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
      
      // Update hotel with fresh photos
      const updatedHotel = {
        ...hotel,
        photos: freshPhotos.map(photo => photo.url),
        heroPhoto: freshPhotos[0].url
      };
      
      // Update in database via API
      await axios.put(`${this.apiBase}/hotels/${hotel.id}`, updatedHotel);
      
      return { 
        success: true, 
        hotelName: hotel.name,
        photoCount: freshPhotos.length,
        resolutions: freshPhotos.map(photo => `${photo.width}x${photo.height}`)
      };
      
    } catch (error) {
      console.error(`❌ Error refreshing ${hotel.name}:`, error.message);
      return { success: false, reason: error.message };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the photo refresh
async function runPhotoRefresh() {
  const refresher = new PhotoRefresher();
  await refresher.refreshAllPhotos();
}

runPhotoRefresh();
