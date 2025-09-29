const axios = require('axios');

class DetailedPhotoAuditor {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    this.minPhotos = 4;
    this.minWidth = 1200;
    this.minHeight = 800;
    this.minFileSize = 50000; // 50KB
    this.maxFileSize = 5000000; // 5MB
  }

  async auditAllHotels() {
    console.log('🔍 Starting DETAILED photo quality audit...');
    console.log(`📏 Quality Standards:`);
    console.log(`   Min Photos: ${this.minPhotos}`);
    console.log(`   Min Resolution: ${this.minWidth}x${this.minHeight}`);
    console.log(`   File Size: ${this.minFileSize/1024}KB - ${this.maxFileSize/1024/1024}MB`);
    console.log('');
    
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
      
      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`📸 Auditing ${i + 1}/${hotels.length}: ${hotel.name}`);
        
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
        
        // Rate limiting
        await this.sleep(100);
      }
      
      console.log('\n📊 DETAILED Photo Quality Audit Results:');
      console.log(`Total Hotels Audited: ${hotels.length}`);
      console.log(`Hotels Kept: ${hotelsKept} (${Math.round(hotelsKept / hotels.length * 100)}%)`);
      console.log(`Hotels Dropped: ${hotelsDropped} (${Math.round(hotelsDropped / hotels.length * 100)}%)`);
      console.log(`Total Photos Audited: ${totalPhotosAudited}`);
      console.log(`Photos Kept: ${photosKept} (${Math.round(photosKept / totalPhotosAudited * 100)}%)`);
      console.log(`Photos Dropped: ${photosDropped} (${Math.round(photosDropped / totalPhotosAudited * 100)}%)`);
      
      // Show dropped hotels
      const droppedHotels = auditResults.filter(a => a.finalStatus === 'dropped');
      if (droppedHotels.length > 0) {
        console.log('\n❌ Hotels that will be DROPPED from database:');
        droppedHotels.forEach(hotel => {
          console.log(`  - ${hotel.hotelName} (${hotel.city}): ${hotel.reason}`);
          if (hotel.photoDetails) {
            hotel.photoDetails.forEach(photo => {
              if (photo.status === 'dropped') {
                console.log(`    📷 ${photo.url}: ${photo.reason}`);
              }
            });
          }
        });
      }
      
      // Show quality statistics
      const qualityStats = this.calculateQualityStats(auditResults);
      console.log('\n📈 Photo Quality Statistics:');
      console.log(`Average Photos per Hotel: ${qualityStats.avgPhotos.toFixed(1)}`);
      console.log(`Average Resolution: ${qualityStats.avgWidth}x${qualityStats.avgHeight}`);
      console.log(`High Resolution Photos (>1600x1200): ${qualityStats.highResPhotos} (${Math.round(qualityStats.highResPhotos / totalPhotosAudited * 100)}%)`);
      
      return {
        totalHotelsAudited: hotels.length,
        hotelsKept,
        hotelsDropped,
        totalPhotosAudited,
        photosKept,
        photosDropped,
        auditResults,
        qualityStats
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
    const photoDetails = [];
    
    for (const photoUrl of photos) {
      try {
        const photoAnalysis = await this.analyzePhotoQuality(photoUrl);
        photoDetails.push(photoAnalysis);
        
        if (photoAnalysis.status === 'accepted') {
          qualityPhotos++;
        } else {
          droppedPhotos++;
        }
      } catch (error) {
        console.error(`❌ Failed to analyze photo ${photoUrl}:`, error.message);
        photoDetails.push({
          url: photoUrl,
          status: 'dropped',
          reason: 'Analysis failed',
          width: 0,
          height: 0,
          fileSize: 0
        });
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
      reason,
      photoDetails
    };
  }

  async analyzePhotoQuality(photoUrl) {
    try {
      // For Google Places photos, extract dimensions from URL
      let width = 0;
      let height = 0;
      let fileSize = 0;
      
      if (photoUrl.includes('maps.googleapis.com')) {
        const sizeMatch = photoUrl.match(/=(\d+)x(\d+)/);
        if (sizeMatch) {
          width = parseInt(sizeMatch[1]);
          height = parseInt(sizeMatch[2]);
        }
        
        // Try to get file size
        try {
          const response = await axios.head(photoUrl, { timeout: 5000 });
          fileSize = parseInt(response.headers['content-length'] || '0');
        } catch (error) {
          fileSize = 0;
        }
      } else {
        // For other photos, try to get headers
        try {
          const response = await axios.head(photoUrl, { timeout: 5000 });
          const contentType = response.headers['content-type'];
          fileSize = parseInt(response.headers['content-length'] || '0');
          
          if (!contentType || !contentType.startsWith('image/')) {
            return {
              url: photoUrl,
              status: 'dropped',
              reason: 'Not an image',
              width: 0,
              height: 0,
              fileSize: 0
            };
          }
          
          // Default dimensions for non-Google photos
          width = 1200;
          height = 800;
          
        } catch (error) {
          return {
            url: photoUrl,
            status: 'dropped',
            reason: 'Cannot access photo',
            width: 0,
            height: 0,
            fileSize: 0
          };
        }
      }
      
      // Evaluate quality
      const status = this.evaluatePhotoQuality(width, height, fileSize);
      const reason = status === 'dropped' ? this.getDropReason(width, height, fileSize) : undefined;
      
      return {
        url: photoUrl,
        status,
        reason,
        width,
        height,
        fileSize
      };
      
    } catch (error) {
      return {
        url: photoUrl,
        status: 'dropped',
        reason: 'Analysis failed',
        width: 0,
        height: 0,
        fileSize: 0
      };
    }
  }

  evaluatePhotoQuality(width, height, fileSize) {
    // Check resolution
    if (width < this.minWidth || height < this.minHeight) {
      return 'dropped';
    }
    
    // Check file size
    if (fileSize > 0 && (fileSize < this.minFileSize || fileSize > this.maxFileSize)) {
      return 'dropped';
    }
    
    return 'accepted';
  }

  getDropReason(width, height, fileSize) {
    if (width < this.minWidth || height < this.minHeight) {
      return `Resolution too low: ${width}x${height}`;
    }
    
    if (fileSize > 0) {
      if (fileSize < this.minFileSize) {
        return `File too small: ${Math.round(fileSize / 1024)}KB`;
      }
      if (fileSize > this.maxFileSize) {
        return `File too large: ${Math.round(fileSize / 1024 / 1024)}MB`;
      }
    }
    
    return 'Unknown reason';
  }

  calculateQualityStats(auditResults) {
    let totalPhotos = 0;
    let totalWidth = 0;
    let totalHeight = 0;
    let highResPhotos = 0;
    
    auditResults.forEach(audit => {
      totalPhotos += audit.totalPhotos;
      
      if (audit.photoDetails) {
        audit.photoDetails.forEach(photo => {
          if (photo.status === 'accepted') {
            totalWidth += photo.width;
            totalHeight += photo.height;
            
            if (photo.width >= 1600 && photo.height >= 1200) {
              highResPhotos++;
            }
          }
        });
      }
    });
    
    return {
      avgPhotos: totalPhotos / auditResults.length,
      avgWidth: Math.round(totalWidth / totalPhotos),
      avgHeight: Math.round(totalHeight / totalPhotos),
      highResPhotos
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the detailed audit
async function runDetailedAudit() {
  const auditor = new DetailedPhotoAuditor();
  try {
    const results = await auditor.auditAllHotels();
    console.log('\n🎉 Detailed photo quality audit completed successfully!');
    return results;
  } catch (error) {
    console.error('❌ Detailed photo audit failed:', error.message);
    process.exit(1);
  }
}

runDetailedAudit();
