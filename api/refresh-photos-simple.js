const { GooglePlacesClient } = require('./src/google-places.js');
const { SupabaseService } = require('./src/supabase.js');

class SimplePhotoRefresher {
  constructor() {
    this.googlePlacesClient = new GooglePlacesClient();
    this.supabaseService = new SupabaseService();
  }

  async refreshPhotos() {
    console.log('🔄 Starting photo refresh to HD/2K/4K quality...');
    
    try {
      // Get all hotels from database
      const hotels = await this.supabaseService.getHotels(1000, 0);
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
              console.log(`✅ ${hotel.name}: ${result.photoCount} photos refreshed`);
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
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        coords: hotel.coords,
        price: hotel.price,
        description: hotel.description,
        amenity_tags: hotel.amenity_tags,
        photos: freshPhotos.map(photo => photo.url),
        hero_photo: freshPhotos[0].url,
        booking_url: hotel.booking_url,
        rating: hotel.rating,
        created_at: hotel.created_at,
        updated_at: new Date().toISOString()
      };
      
      // Update in database using upsert
      await this.supabaseService.insertHotels([updatedHotel]);
      
      return { 
        success: true, 
        photoCount: freshPhotos.length,
        resolutions: freshPhotos.map(photo => `${photo.width}x${photo.height}`)
      };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the photo refresh
async function runPhotoRefresh() {
  const refresher = new SimplePhotoRefresher();
  await refresher.refreshPhotos();
}

runPhotoRefresh();
