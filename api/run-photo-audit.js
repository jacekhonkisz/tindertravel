const axios = require('axios');

class SimplePhotoAuditor {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.minPhotos = 4;
    this.minWidth = 1200;
    this.minHeight = 800;
  }

  async auditAllHotels() {
    console.log('🔍 Starting photo quality audit...');
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBase}/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to audit`);
      
      let hotelsKept = 0;
      let hotelsDropped = 0;
      let totalPhotosAudited = 0;
      let photosKept = 0;
      let photosDropped = 0;
      
      const auditResults = [];
      
      for (const hotel of hotels) {
        const audit = await this.auditHotel(hotel);
        auditResults.push(audit);
        
        totalPhotosAudited += audit.totalPhotos;
        photosKept += audit.qualityPhotos;
        photosDropped += audit.droppedPhotos;
        
        if (audit.finalStatus === 'kept') {
          hotelsKept++;
        } else {
          hotelsDropped++;
        }
        
        console.log(`${audit.finalStatus === 'kept' ? '✅' : '❌'} ${hotel.name}: ${audit.qualityPhotos}/${audit.totalPhotos} photos`);
      }
      
      console.log('\n📊 Photo Quality Audit Results:');
      console.log(`Total Hotels Audited: ${hotels.length}`);
      console.log(`Hotels Kept: ${hotelsKept} (${Math.round(hotelsKept / hotels.length * 100)}%)`);
      console.log(`Hotels Dropped: ${hotelsDropped} (${Math.round(hotelsDropped / hotels.length * 100)}%)`);
      console.log(`Total Photos Audited: ${totalPhotosAudited}`);
      console.log(`Photos Kept: ${photosKept} (${Math.round(photosKept / totalPhotosAudited * 100)}%)`);
      console.log(`Photos Dropped: ${photosDropped} (${Math.round(photosDropped / totalPhotosAudited * 100)}%)`);
      
      // Show dropped hotels
      const droppedHotels = auditResults.filter(a => a.finalStatus === 'dropped');
      if (droppedHotels.length > 0) {
        console.log('\n❌ Hotels that will be dropped:');
        droppedHotels.forEach(hotel => {
          console.log(`  - ${hotel.hotelName} (${hotel.city}): ${hotel.reason}`);
        });
      }
      
      return {
        totalHotelsAudited: hotels.length,
        hotelsKept,
        hotelsDropped,
        totalPhotosAudited,
        photosKept,
        photosDropped,
        auditResults
      };
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      throw error;
    }
  }

  async auditHotel(hotel) {
    const photos = hotel.photos || [];
    let qualityPhotos = 0;
    let droppedPhotos = 0;
    
    for (const photoUrl of photos) {
      try {
        const isQuality = await this.checkPhotoQuality(photoUrl);
        if (isQuality) {
          qualityPhotos++;
        } else {
          droppedPhotos++;
        }
      } catch (error) {
        console.error(`❌ Failed to check photo ${photoUrl}:`, error.message);
        droppedPhotos++;
      }
    }
    
    const finalStatus = qualityPhotos >= this.minPhotos ? 'kept' : 'dropped';
    const reason = finalStatus === 'dropped' ? `Only ${qualityPhotos}/${this.minPhotos} quality photos` : undefined;
    
    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      city: hotel.city,
      country: hotel.country,
      totalPhotos: photos.length,
      qualityPhotos,
      droppedPhotos,
      finalStatus,
      reason
    };
  }

  async checkPhotoQuality(photoUrl) {
    try {
      // For Google Places photos, check URL parameters
      if (photoUrl.includes('maps.googleapis.com')) {
        const sizeMatch = photoUrl.match(/=(\d+)x(\d+)/);
        if (sizeMatch) {
          const width = parseInt(sizeMatch[1]);
          const height = parseInt(sizeMatch[2]);
          
          // Check if dimensions meet minimum requirements
          if (width >= this.minWidth && height >= this.minHeight) {
            return true;
          }
        }
      }
      
      // For other photos, try to get headers
      try {
        const response = await axios.head(photoUrl, { timeout: 5000 });
        const contentType = response.headers['content-type'];
        
        if (!contentType || !contentType.startsWith('image/')) {
          return false;
        }
        
        // If we can't determine size from URL, assume it's good for now
        // In a real implementation, you'd download and analyze the image
        return true;
        
      } catch (error) {
        return false;
      }
      
    } catch (error) {
      return false;
    }
  }
}

// Run the audit
async function runAudit() {
  const auditor = new SimplePhotoAuditor();
  try {
    const results = await auditor.auditAllHotels();
    console.log('\n🎉 Photo quality audit completed successfully!');
    return results;
  } catch (error) {
    console.error('❌ Photo audit failed:', error.message);
    process.exit(1);
  }
}

runAudit();
