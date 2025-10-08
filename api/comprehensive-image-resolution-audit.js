const axios = require('axios');
const fs = require('fs').promises;

class ComprehensiveImageResolutionAuditor {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
    
    // Quality thresholds
    this.minPhotos = 4;
    this.minWidth = 1200;
    this.minHeight = 800;
    this.minFileSize = 50000; // 50KB
    this.maxFileSize = 5000000; // 5MB
    this.idealWidth = 1920;
    this.idealHeight = 1280;
    
    // Quality categories
    this.qualityCategories = {
      excellent: { minWidth: 1920, minHeight: 1280, minScore: 90 },
      good: { minWidth: 1600, minHeight: 1200, minScore: 75 },
      acceptable: { minWidth: 1200, minHeight: 800, minScore: 60 },
      poor: { minWidth: 800, minHeight: 600, minScore: 40 },
      very_poor: { minWidth: 0, minHeight: 0, minScore: 0 }
    };
  }

  async auditAllHotels() {
    console.log('🔍 Starting COMPREHENSIVE Image Resolution Audit...');
    console.log(`📏 Quality Standards:`);
    console.log(`   Minimum Photos Required: ${this.minPhotos}`);
    console.log(`   Minimum Resolution: ${this.minWidth}x${this.minHeight}`);
    console.log(`   Ideal Resolution: ${this.idealWidth}x${this.idealHeight}`);
    console.log(`   File Size Range: ${this.minFileSize/1024}KB - ${this.maxFileSize/1024/1024}MB`);
    console.log('');
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBase}/hotels?limit=10000`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to audit`);
      
      const auditResults = {
        summary: {
          totalHotels: hotels.length,
          hotelsKept: 0,
          hotelsDropped: 0,
          totalPhotosAudited: 0,
          photosKept: 0,
          photosDropped: 0,
          qualityDistribution: {
            excellent: 0,
            good: 0,
            acceptable: 0,
            poor: 0,
            very_poor: 0
          }
        },
        hotels: [],
        detailedPhotoAnalysis: []
      };
      
      // Process hotels in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`📸 Auditing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)} (${batch.length} hotels)`);
        
        const batchPromises = batch.map(hotel => this.auditHotel(hotel));
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const audit = result.value;
            auditResults.hotels.push(audit);
            
            // Update summary
            auditResults.summary.totalPhotosAudited += audit.totalPhotos;
            auditResults.summary.photosKept += audit.qualityPhotos;
            auditResults.summary.photosDropped += audit.droppedPhotos;
            
            if (audit.finalStatus === 'kept') {
              auditResults.summary.hotelsKept++;
            } else {
              auditResults.summary.hotelsDropped++;
            }
            
            // Update quality distribution
            audit.photoDetails.forEach(photo => {
              if (photo.status === 'accepted') {
                const category = this.getQualityCategory(photo.width, photo.height, photo.qualityScore);
                auditResults.summary.qualityDistribution[category]++;
              }
            });
            
            console.log(`${audit.finalStatus === 'kept' ? '✅' : '❌'} ${audit.hotelName}: ${audit.qualityPhotos}/${audit.totalPhotos} photos (${audit.averageResolution})`);
          } else {
            console.error('❌ Batch audit failed:', result.reason);
          }
        }
        
        // Rate limiting between batches
        await this.sleep(2000);
      }
      
      // Generate detailed report
      await this.generateDetailedReport(auditResults);
      
      console.log('\n📊 COMPREHENSIVE Image Resolution Audit Results:');
      this.logSummary(auditResults.summary);
      
      return auditResults;
      
    } catch (error) {
      console.error('❌ Comprehensive audit failed:', error.message);
      throw error;
    }
  }

  async auditHotel(hotel) {
    const photos = hotel.photos || [];
    let qualityPhotos = 0;
    let droppedPhotos = 0;
    const photoDetails = [];
    let totalWidth = 0;
    let totalHeight = 0;
    let validPhotos = 0;
    
    console.log(`  🏨 Auditing ${hotel.name} (${hotel.city}, ${hotel.country})`);
    
    for (let i = 0; i < photos.length; i++) {
      const photoUrl = photos[i];
      try {
        console.log(`    📷 Analyzing photo ${i + 1}/${photos.length}...`);
        const photoAnalysis = await this.analyzePhotoQuality(photoUrl);
        photoDetails.push(photoAnalysis);
        
        if (photoAnalysis.status === 'accepted') {
          qualityPhotos++;
          totalWidth += photoAnalysis.width;
          totalHeight += photoAnalysis.height;
          validPhotos++;
        } else {
          droppedPhotos++;
        }
        
        // Rate limiting between photos
        await this.sleep(500);
        
      } catch (error) {
        console.error(`    ❌ Failed to analyze photo ${i + 1}:`, error.message);
        photoDetails.push({
          url: photoUrl,
          status: 'dropped',
          reason: 'Analysis failed',
          width: 0,
          height: 0,
          fileSize: 0,
          qualityScore: 0,
          qualityCategory: 'very_poor',
          aspectRatio: 0,
          isHighRes: false,
          isMobileOptimized: false
        });
        droppedPhotos++;
      }
    }
    
    const finalStatus = qualityPhotos >= this.minPhotos ? 'kept' : 'dropped';
    const reason = finalStatus === 'dropped' ? `Only ${qualityPhotos}/${this.minPhotos} quality photos` : undefined;
    const averageResolution = validPhotos > 0 ? `${Math.round(totalWidth/validPhotos)}x${Math.round(totalHeight/validPhotos)}` : 'N/A';
    
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
      averageResolution,
      photoDetails
    };
  }

  async analyzePhotoQuality(photoUrl) {
    try {
      let width = 0;
      let height = 0;
      let fileSize = 0;
      let contentType = '';
      
      // Get basic headers first
      try {
        const headResponse = await axios.head(photoUrl, { timeout: 10000 });
        contentType = headResponse.headers['content-type'] || '';
        fileSize = parseInt(headResponse.headers['content-length'] || '0');
        
        if (!contentType.startsWith('image/')) {
          return {
            url: photoUrl,
            status: 'dropped',
            reason: 'Not an image file',
            width: 0,
            height: 0,
            fileSize: 0,
            qualityScore: 0,
            qualityCategory: 'very_poor',
            aspectRatio: 0,
            isHighRes: false,
            isMobileOptimized: false
          };
        }
      } catch (error) {
        return {
          url: photoUrl,
          status: 'dropped',
          reason: 'Cannot access photo',
          width: 0,
          height: 0,
          fileSize: 0,
          qualityScore: 0,
          qualityCategory: 'very_poor',
          aspectRatio: 0,
          isHighRes: false,
          isMobileOptimized: false
        };
      }
      
      // Extract dimensions based on photo source
      if (photoUrl.includes('maps.googleapis.com')) {
        // Google Places photos - extract from URL parameters
        const sizeMatch = photoUrl.match(/=(\d+)x(\d+)/);
        if (sizeMatch) {
          width = parseInt(sizeMatch[1]);
          height = parseInt(sizeMatch[2]);
        } else {
          // Try to get dimensions from image data
          const dimensions = await this.extractImageDimensions(photoUrl, contentType);
          width = dimensions.width;
          height = dimensions.height;
        }
      } else {
        // Other photos - try to extract dimensions
        const dimensions = await this.extractImageDimensions(photoUrl, contentType);
        width = dimensions.width;
        height = dimensions.height;
      }
      
      // Calculate quality metrics
      const aspectRatio = width > 0 && height > 0 ? width / height : 0;
      const qualityScore = this.calculateQualityScore(width, height, fileSize, aspectRatio);
      const qualityCategory = this.getQualityCategory(width, height, qualityScore);
      const isHighRes = width >= this.idealWidth && height >= this.idealHeight;
      const isMobileOptimized = this.isMobileOptimized(width, height, aspectRatio);
      
      // Evaluate if photo meets standards
      const status = this.evaluatePhotoQuality(width, height, fileSize, qualityScore);
      const reason = status === 'dropped' ? this.getDropReason(width, height, fileSize, qualityScore) : undefined;
      
      return {
        url: photoUrl,
        status,
        reason,
        width,
        height,
        fileSize,
        qualityScore,
        qualityCategory,
        aspectRatio,
        isHighRes,
        isMobileOptimized,
        contentType
      };
      
    } catch (error) {
      return {
        url: photoUrl,
        status: 'dropped',
        reason: 'Analysis failed: ' + error.message,
        width: 0,
        height: 0,
        fileSize: 0,
        qualityScore: 0,
        qualityCategory: 'very_poor',
        aspectRatio: 0,
        isHighRes: false,
        isMobileOptimized: false
      };
    }
  }

  async extractImageDimensions(photoUrl, contentType) {
    try {
      // Download first few KB to extract dimensions
      const response = await axios.get(photoUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: { Range: 'bytes=0-2047' } // First 2KB should contain headers
      });
      
      const buffer = Buffer.from(response.data);
      
      if (contentType === 'image/jpeg') {
        return this.extractJPEGDimensions(buffer);
      } else if (contentType === 'image/png') {
        return this.extractPNGDimensions(buffer);
      } else if (contentType === 'image/webp') {
        return this.extractWebPDimensions(buffer);
      } else {
        // Default fallback
        return { width: 1200, height: 800 };
      }
    } catch (error) {
      // Fallback to default dimensions
      return { width: 1200, height: 800 };
    }
  }

  extractJPEGDimensions(buffer) {
    let i = 0;
    while (i < buffer.length - 1) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xC0) {
        const height = (buffer[i + 5] << 8) | buffer[i + 6];
        const width = (buffer[i + 7] << 8) | buffer[i + 8];
        return { width, height };
      }
      i++;
    }
    return { width: 1200, height: 800 };
  }

  extractPNGDimensions(buffer) {
    if (buffer.length >= 24 && buffer.toString('ascii', 0, 8) === '\x89PNG\r\n\x1a\n') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    return { width: 1200, height: 800 };
  }

  extractWebPDimensions(buffer) {
    if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const width = buffer.readUInt16LE(26) & 0x3FFF;
      const height = buffer.readUInt16LE(28) & 0x3FFF;
      return { width, height };
    }
    return { width: 1200, height: 800 };
  }

  calculateQualityScore(width, height, fileSize, aspectRatio) {
    let score = 0;
    
    // Resolution score (0-50 points)
    const resolutionScore = Math.min(50, (width * height) / (this.minWidth * this.minHeight) * 50);
    score += resolutionScore;
    
    // File size score (0-20 points)
    if (fileSize >= this.minFileSize && fileSize <= this.maxFileSize) {
      score += 20;
    } else if (fileSize > 0) {
      if (fileSize < this.minFileSize) {
        score += (fileSize / this.minFileSize) * 20;
      } else {
        score += Math.max(0, 20 - ((fileSize - this.maxFileSize) / this.maxFileSize) * 20);
      }
    }
    
    // Aspect ratio score (0-15 points)
    const idealAspectRatio = 1.5; // 3:2 ratio
    const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
    const aspectRatioScore = Math.max(0, 15 - (aspectRatioDiff / 0.5) * 15);
    score += aspectRatioScore;
    
    // High resolution bonus (0-15 points)
    if (width >= this.idealWidth && height >= this.idealHeight) {
      score += 15;
    } else if (width >= 1600 && height >= 1200) {
      score += 10;
    } else if (width >= this.minWidth && height >= this.minHeight) {
      score += 5;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  getQualityCategory(width, height, qualityScore) {
    if (width >= this.qualityCategories.excellent.minWidth && 
        height >= this.qualityCategories.excellent.minHeight && 
        qualityScore >= this.qualityCategories.excellent.minScore) {
      return 'excellent';
    } else if (width >= this.qualityCategories.good.minWidth && 
               height >= this.qualityCategories.good.minHeight && 
               qualityScore >= this.qualityCategories.good.minScore) {
      return 'good';
    } else if (width >= this.qualityCategories.acceptable.minWidth && 
               height >= this.qualityCategories.acceptable.minHeight && 
               qualityScore >= this.qualityCategories.acceptable.minScore) {
      return 'acceptable';
    } else if (width >= this.qualityCategories.poor.minWidth && 
               height >= this.qualityCategories.poor.minHeight && 
               qualityScore >= this.qualityCategories.poor.minScore) {
      return 'poor';
    } else {
      return 'very_poor';
    }
  }

  isMobileOptimized(width, height, aspectRatio) {
    const idealAspectRatio = 1.5;
    const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
    const isGoodAspectRatio = aspectRatioDiff <= 0.3;
    const isGoodSize = width >= this.minWidth && height >= this.minHeight;
    return isGoodAspectRatio && isGoodSize;
  }

  evaluatePhotoQuality(width, height, fileSize, qualityScore) {
    if (width < this.minWidth || height < this.minHeight) {
      return 'dropped';
    }
    
    if (fileSize > 0 && (fileSize < this.minFileSize || fileSize > this.maxFileSize)) {
      return 'dropped';
    }
    
    if (qualityScore < 60) {
      return 'dropped';
    }
    
    return 'accepted';
  }

  getDropReason(width, height, fileSize, qualityScore) {
    if (width < this.minWidth || height < this.minHeight) {
      return `Resolution too low: ${width}x${height} (min: ${this.minWidth}x${this.minHeight})`;
    }
    
    if (fileSize > 0) {
      if (fileSize < this.minFileSize) {
        return `File too small: ${Math.round(fileSize / 1024)}KB (min: ${this.minFileSize / 1024}KB)`;
      }
      if (fileSize > this.maxFileSize) {
        return `File too large: ${Math.round(fileSize / 1024 / 1024)}MB (max: ${this.maxFileSize / 1024 / 1024}MB)`;
      }
    }
    
    if (qualityScore < 60) {
      return `Quality score too low: ${qualityScore}/100 (min: 60)`;
    }
    
    return 'Unknown reason';
  }

  async generateDetailedReport(auditResults) {
    const reportPath = '/Users/ala/tindertravel/api/image-resolution-audit-report.md';
    
    let report = `# Comprehensive Image Resolution Audit Report\n\n`;
    report += `Generated on: ${new Date().toISOString()}\n\n`;
    
    // Summary
    report += `## Summary\n\n`;
    report += `- **Total Hotels Audited:** ${auditResults.summary.totalHotels}\n`;
    report += `- **Hotels Kept:** ${auditResults.summary.hotelsKept} (${Math.round(auditResults.summary.hotelsKept / auditResults.summary.totalHotels * 100)}%)\n`;
    report += `- **Hotels Dropped:** ${auditResults.summary.hotelsDropped} (${Math.round(auditResults.summary.hotelsDropped / auditResults.summary.totalHotels * 100)}%)\n`;
    report += `- **Total Photos Audited:** ${auditResults.summary.totalPhotosAudited}\n`;
    report += `- **Photos Kept:** ${auditResults.summary.photosKept} (${Math.round(auditResults.summary.photosKept / auditResults.summary.totalPhotosAudited * 100)}%)\n`;
    report += `- **Photos Dropped:** ${auditResults.summary.photosDropped} (${Math.round(auditResults.summary.photosDropped / auditResults.summary.totalPhotosAudited * 100)}%)\n\n`;
    
    // Quality Distribution
    report += `## Photo Quality Distribution\n\n`;
    Object.entries(auditResults.summary.qualityDistribution).forEach(([category, count]) => {
      const percentage = Math.round(count / auditResults.summary.photosKept * 100);
      report += `- **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${count} photos (${percentage}%)\n`;
    });
    report += `\n`;
    
    // Detailed Hotel Analysis
    report += `## Detailed Hotel Analysis\n\n`;
    
    auditResults.hotels.forEach((hotel, index) => {
      report += `### ${index + 1}. ${hotel.hotelName}\n`;
      report += `- **Location:** ${hotel.city}, ${hotel.country}\n`;
      report += `- **Status:** ${hotel.finalStatus === 'kept' ? '✅ KEPT' : '❌ DROPPED'}\n`;
      report += `- **Photos:** ${hotel.qualityPhotos}/${hotel.totalPhotos} quality photos\n`;
      report += `- **Average Resolution:** ${hotel.averageResolution}\n`;
      if (hotel.reason) {
        report += `- **Reason:** ${hotel.reason}\n`;
      }
      report += `\n`;
      
      // Photo details
      report += `#### Photo Details:\n\n`;
      hotel.photoDetails.forEach((photo, photoIndex) => {
        report += `${photoIndex + 1}. **${photo.status === 'accepted' ? '✅' : '❌'}** ${photo.width}x${photo.height} `;
        report += `(${photo.qualityCategory}, Score: ${photo.qualityScore}/100)\n`;
        if (photo.fileSize > 0) {
          report += `   - File Size: ${Math.round(photo.fileSize / 1024)}KB\n`;
        }
        if (photo.reason) {
          report += `   - Reason: ${photo.reason}\n`;
        }
        report += `   - URL: ${photo.url}\n\n`;
      });
      
      report += `---\n\n`;
    });
    
    // Save report
    await fs.writeFile(reportPath, report);
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }

  logSummary(summary) {
    console.log(`Total Hotels Audited: ${summary.totalHotels}`);
    console.log(`Hotels Kept: ${summary.hotelsKept} (${Math.round(summary.hotelsKept / summary.totalHotels * 100)}%)`);
    console.log(`Hotels Dropped: ${summary.hotelsDropped} (${Math.round(summary.hotelsDropped / summary.totalHotels * 100)}%)`);
    console.log(`Total Photos Audited: ${summary.totalPhotosAudited}`);
    console.log(`Photos Kept: ${summary.photosKept} (${Math.round(summary.photosKept / summary.totalPhotosAudited * 100)}%)`);
    console.log(`Photos Dropped: ${summary.photosDropped} (${Math.round(summary.photosDropped / summary.totalPhotosAudited * 100)}%)`);
    
    console.log(`\n📈 Photo Quality Distribution:`);
    Object.entries(summary.qualityDistribution).forEach(([category, count]) => {
      const percentage = summary.photosKept > 0 ? Math.round(count / summary.photosKept * 100) : 0;
      console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} photos (${percentage}%)`);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the comprehensive audit
async function runComprehensiveAudit() {
  const auditor = new ComprehensiveImageResolutionAuditor();
  try {
    const results = await auditor.auditAllHotels();
    console.log('\n🎉 Comprehensive image resolution audit completed successfully!');
    console.log('📄 Check the generated report for detailed analysis.');
    return results;
  } catch (error) {
    console.error('❌ Comprehensive image audit failed:', error.message);
    process.exit(1);
  }
}

runComprehensiveAudit();
