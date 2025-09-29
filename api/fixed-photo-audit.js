const axios = require('axios');

class FixedPhotoAuditor {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.minPhotos = 4;
    this.minWidth = 1200;
    this.minHeight = 800;
  }

  async auditAllHotels() {
    console.log('🔍 Starting FIXED photo quality audit...');
    console.log(`📏 Quality Standards:`);
    console.log(`   Min Photos: ${this.minPhotos}`);
    console.log(`   Min Resolution: ${this.minWidth}x${this.minHeight}`);
    console.log('');
    
    try {
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
          console.log(`✅ ${hotel.name}: ${audit.qualityPhotos}/${audit.totalPhotos} photos PASS`);
        } else {
          hotelsDropped++;
          console.log(`❌ ${hotel.name}: ${audit.qualityPhotos}/${audit.totalPhotos} photos FAIL - ${audit.reason}`);
        }
      }
      
      console.log('\n📊 FIXED Photo Quality Audit Results:');
      console.log(`Total Hotels Audited: ${hotels.length}`);
      console.log(`Hotels Kept: ${hotelsKept} (${Math.round(hotelsKept / hotels.length * 100)}%)`);
      console.log(`Hotels Dropped: ${hotelsDropped} (${Math.round(hotelsDropped / hotels.length * 100)}%)`);
      console.log(`Total Photos Audited: ${totalPhotosAudited}`);
      console.log(`Photos Kept: ${photosKept} (${Math.round(photosKept / totalPhotosAudited * 100)}%)`);
      console.log(`Photos Dropped: ${photosDropped} (${Math.round(photosDropped / totalPhotosAudited * 100)}%)`);
      
      // Show dropped hotels if any
      const droppedHotels = auditResults.filter(a => a.finalStatus === 'dropped');
      if (droppedHotels.length > 0) {
        console.log('\n❌ Hotels that would be dropped:');
        droppedHotels.forEach(hotel => {
          console.log(`  - ${hotel.hotelName} (${hotel.city}): ${hotel.reason}`);
        });
      } else {
        console.log('\n🎉 ALL HOTELS PASS THE QUALITY CHECK!');
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
      const isQuality = this.checkPhotoQuality(photoUrl);
      if (isQuality) {
        qualityPhotos++;
      } else {
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

  checkPhotoQuality(photoUrl) {
    let width = 0;
    let height = 0;
    
    if (photoUrl.includes('maps.googleapis.com')) {
      // FIXED REGEX: Extract dimensions from Google Places URL
      const sizeMatch = photoUrl.match(/maxwidth=(\d+).*maxheight=(\d+)/);
      if (sizeMatch) {
        width = parseInt(sizeMatch[1]);
        height = parseInt(sizeMatch[2]);
      }
    } else {
      // Default for non-Google photos
      width = 1200;
      height = 800;
    }
    
    // Check if dimensions meet minimum requirements
    return width >= this.minWidth && height >= this.minHeight;
  }
}

// Run the fixed audit
async function runFixedAudit() {
  const auditor = new FixedPhotoAuditor();
  try {
    const results = await auditor.auditAllHotels();
    console.log('\n🎉 Fixed photo quality audit completed successfully!');
    return results;
  } catch (error) {
    console.error('❌ Fixed photo audit failed:', error.message);
    process.exit(1);
  }
}

runFixedAudit();
