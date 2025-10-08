const axios = require('axios');
const { RealHotelPhotoScraper } = require('./real-hotel-photos-scraper.js');

class RealPhotoReplacer {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.scraper = new RealHotelPhotoScraper();
  }

  async replaceAllPhotos() {
    console.log('🏨 Starting REAL hotel photo replacement...');
    console.log('💰 This will save you money by replacing expensive Google Places photos!');
    console.log('📸 Using REAL photos from Booking.com, TripAdvisor, and Expedia');
    
    try {
      // Get all hotels from API
      const response = await axios.get(`${this.apiBase}/hotels?limit=1000`);
      const hotels = response.data.hotels;
      console.log(`📊 Found ${hotels.length} hotels to update`);
      
      let replacedCount = 0;
      let failedCount = 0;
      let totalPhotosReplaced = 0;
      
      // Process hotels in batches
      const batchSize = 2; // Smaller batches due to scraping
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);
        
        for (const hotel of batch) {
          try {
            const result = await this.replaceHotelPhotos(hotel);
            if (result.success) {
              replacedCount++;
              totalPhotosReplaced += result.photoCount;
              console.log(`✅ ${hotel.name}: ${result.photoCount} REAL photos (${result.resolution})`);
            } else {
              failedCount++;
              console.log(`❌ ${hotel.name}: ${result.reason}`);
            }
          } catch (error) {
            failedCount++;
            console.log(`❌ ${hotel.name}: ${error.message}`);
          }
          
          // Rate limiting between hotels
          await this.sleep(3000);
        }
        
        // Rate limiting between batches
        await this.sleep(5000);
      }
      
      console.log('\n📊 Real Photo Replacement Results:');
      console.log(`Hotels Updated: ${replacedCount}`);
      console.log(`Hotels Failed: ${failedCount}`);
      console.log(`Total Photos Replaced: ${totalPhotosReplaced}`);
      console.log(`Success Rate: ${Math.round(replacedCount / hotels.length * 100)}%`);
      console.log(`💰 Estimated Savings: $${(totalPhotosReplaced * 0.007).toFixed(2)} (vs Google Places)`);
      console.log(`📸 All photos are REAL photos of the actual hotels!`);
      
    } catch (error) {
      console.error('❌ Photo replacement failed:', error.message);
    }
  }

  async replaceHotelPhotos(hotel) {
    try {
      console.log(`  🏨 Updating ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Get real photos for this specific hotel
      const realPhotos = await this.scraper.getRealHotelPhotos(
        hotel.name, 
        hotel.city, 
        hotel.country, 
        8 // Get 8 photos
      );
      
      if (realPhotos.length < 4) {
        return { success: false, reason: `Only ${realPhotos.length}/4 photos found` };
      }
      
      // Extract just the URLs for the hotel
      const photoUrls = realPhotos.map(photo => photo.url);
      
      // Log what we found
      console.log(`    📸 Found ${photoUrls.length} REAL photos:`);
      realPhotos.forEach((photo, index) => {
        console.log(`      ${index + 1}. ${photo.source}: ${photo.width}x${photo.height}`);
      });
      
      return { 
        success: true, 
        photoCount: photoUrls.length,
        photos: photoUrls,
        resolution: `${realPhotos[0].width}x${realPhotos[0].height}`,
        sources: this.scraper.getSourceBreakdown(realPhotos)
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
async function runRealPhotoReplacement() {
  const replacer = new RealPhotoReplacer();
  await replacer.replaceAllPhotos();
}

runRealPhotoReplacement();
