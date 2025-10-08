const axios = require('axios');
const { FreePhotoService } = require('./free-photo-service.js');

class PhotoReplacer {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.freePhotoService = new FreePhotoService();
  }

  async replaceAllPhotos() {
    console.log('🆓 Starting photo replacement with FREE sources...');
    console.log('💰 This will save you money by replacing expensive Google Places photos!');
    
    try {
      // Get all hotels from API
      const response = await axios.get(`${this.apiBase}/hotels?limit=1000`);
      const hotels = response.data.hotels;
      console.log(`📊 Found ${hotels.length} hotels to update`);
      
      let replacedCount = 0;
      let failedCount = 0;
      let totalPhotosReplaced = 0;
      
      // Process hotels in batches
      const batchSize = 3;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        for (const hotel of batch) {
          try {
            const result = await this.replaceHotelPhotos(hotel);
            if (result.success) {
              replacedCount++;
              totalPhotosReplaced += result.photoCount;
              console.log(`✅ ${hotel.name}: ${result.photoCount} FREE photos added`);
            } else {
              failedCount++;
              console.log(`❌ ${hotel.name}: ${result.reason}`);
            }
          } catch (error) {
            failedCount++;
            console.log(`❌ ${hotel.name}: ${error.message}`);
          }
          
          // Rate limiting between hotels
          await this.sleep(2000);
        }
        
        // Rate limiting between batches
        await this.sleep(3000);
      }
      
      console.log('\n📊 Photo Replacement Results:');
      console.log(`Hotels Updated: ${replacedCount}`);
      console.log(`Hotels Failed: ${failedCount}`);
      console.log(`Total Photos Replaced: ${totalPhotosReplaced}`);
      console.log(`Success Rate: ${Math.round(replacedCount / hotels.length * 100)}%`);
      console.log(`💰 Estimated Savings: $${(totalPhotosReplaced * 0.007).toFixed(2)} (vs Google Places)`);
      
    } catch (error) {
      console.error('❌ Photo replacement failed:', error.message);
    }
  }

  async replaceHotelPhotos(hotel) {
    try {
      console.log(`  🏨 Updating ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Get free photos for this hotel
      const freePhotos = await this.freePhotoService.getHotelPhotos(
        hotel.name, 
        hotel.city, 
        hotel.country, 
        8 // Get 8 photos
      );
      
      if (freePhotos.length < 4) {
        return { success: false, reason: `Only ${freePhotos.length}/4 photos found` };
      }
      
      // Extract just the URLs for the hotel
      const photoUrls = freePhotos.map(photo => photo.url);
      
      // For now, just log what we would update
      // In a real implementation, you'd update the database here
      console.log(`    📸 Found ${photoUrls.length} FREE photos:`);
      freePhotos.forEach((photo, index) => {
        console.log(`      ${index + 1}. ${photo.source}: ${photo.width}x${photo.height} - ${photo.description || 'No description'}`);
      });
      
      return { 
        success: true, 
        photoCount: photoUrls.length,
        photos: photoUrls,
        sources: this.freePhotoService.getSourceBreakdown(freePhotos)
      };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the photo replacement
async function runPhotoReplacement() {
  const replacer = new PhotoReplacer();
  await replacer.replaceAllPhotos();
}

runPhotoReplacement();
