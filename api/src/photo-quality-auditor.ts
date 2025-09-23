import { DatabaseService } from './database';
import { GooglePlacesClient } from './google-places';
import axios from 'axios';

interface PhotoQualityMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  fileSize: number;
  isHighRes: boolean;
  isMobileOptimized: boolean;
  qualityScore: number; // 0-100
}

interface HotelPhotoAudit {
  hotelId: string;
  hotelName: string;
  city: string;
  country: string;
  totalPhotos: number;
  qualityPhotos: number;
  droppedPhotos: number;
  photos: {
    url: string;
    quality: PhotoQualityMetrics;
    status: 'accepted' | 'dropped';
    reason?: string;
  }[];
  finalStatus: 'kept' | 'dropped';
  reason?: string;
}

interface AuditResults {
  totalHotelsAudited: number;
  hotelsKept: number;
  hotelsDropped: number;
  totalPhotosAudited: number;
  photosKept: number;
  photosDropped: number;
  auditDetails: HotelPhotoAudit[];
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
}

export class PhotoQualityAuditor {
  private databaseService: DatabaseService;
  private googlePlacesClient: GooglePlacesClient;
  
  // Quality thresholds
  private readonly MIN_PHOTOS = 4;
  private readonly MIN_WIDTH = 1200;
  private readonly MIN_HEIGHT = 800;
  private readonly MIN_FILE_SIZE = 50000; // 50KB
  private readonly MAX_FILE_SIZE = 5000000; // 5MB
  private readonly MIN_QUALITY_SCORE = 70;
  private readonly IDEAL_ASPECT_RATIO = 1.5; // 3:2 ratio
  private readonly ASPECT_RATIO_TOLERANCE = 0.3;

  constructor() {
    this.databaseService = new DatabaseService();
    this.googlePlacesClient = new GooglePlacesClient();
  }

  /**
   * Run comprehensive photo quality audit on all hotels
   */
  async auditAllHotels(): Promise<AuditResults> {
    console.log('🔍 Starting comprehensive photo quality audit...');
    const startTime = new Date();

    try {
      // Get all hotels from database
      const hotels = await this.getAllHotels();
      console.log(`📊 Found ${hotels.length} hotels to audit`);

      const auditDetails: HotelPhotoAudit[] = [];
      let hotelsKept = 0;
      let hotelsDropped = 0;
      let totalPhotosAudited = 0;
      let photosKept = 0;
      let photosDropped = 0;

      // Process hotels in batches
      const batchSize = 10;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        console.log(`📸 Auditing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hotels.length/batchSize)}`);

        const batchPromises = batch.map(hotel => this.auditHotelPhotos(hotel));
        const batchResults = await Promise.allSettled(batchPromises);

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const audit = result.value;
            auditDetails.push(audit);
            
            totalPhotosAudited += audit.totalPhotos;
            photosKept += audit.qualityPhotos;
            photosDropped += audit.droppedPhotos;

            if (audit.finalStatus === 'kept') {
              hotelsKept++;
            } else {
              hotelsDropped++;
            }

            console.log(`${audit.finalStatus === 'kept' ? '✅' : '❌'} ${audit.hotelName}: ${audit.qualityPhotos}/${audit.totalPhotos} photos`);
          } else {
            console.error('❌ Audit failed:', result.reason);
          }
        }

        // Rate limiting between batches
        await this.sleep(1000);
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000 / 60;

      const results: AuditResults = {
        totalHotelsAudited: hotels.length,
        hotelsKept,
        hotelsDropped,
        totalPhotosAudited,
        photosKept,
        photosDropped,
        auditDetails,
        startTime,
        endTime,
        duration
      };

      console.log('🎉 Photo quality audit completed!');
      this.logAuditResults(results);

      return results;

    } catch (error) {
      console.error('❌ Photo audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit photos for a single hotel
   */
  private async auditHotelPhotos(hotel: any): Promise<HotelPhotoAudit> {
    const photos = hotel.photos || [];
    const photoAudits: HotelPhotoAudit['photos'] = [];
    let qualityPhotos = 0;
    let droppedPhotos = 0;

    // Audit each photo
    for (const photoUrl of photos) {
      try {
        const quality = await this.analyzePhotoQuality(photoUrl);
        const status = this.evaluatePhotoQuality(quality);

        photoAudits.push({
          url: photoUrl,
          quality,
          status,
          reason: status === 'dropped' ? this.getDropReason(quality) : undefined
        });

        if (status === 'accepted') {
          qualityPhotos++;
        } else {
          droppedPhotos++;
        }

        // Rate limiting
        await this.sleep(200);

      } catch (error) {
        console.error(`❌ Failed to analyze photo ${photoUrl}:`, error);
        photoAudits.push({
          url: photoUrl,
          quality: this.getDefaultQuality(),
          status: 'dropped',
          reason: 'Analysis failed'
        });
        droppedPhotos++;
      }
    }

    // Determine final status
    const finalStatus = qualityPhotos >= this.MIN_PHOTOS ? 'kept' : 'dropped';
    const reason = finalStatus === 'dropped' ? `Only ${qualityPhotos}/${this.MIN_PHOTOS} quality photos` : undefined;

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      city: hotel.city,
      country: hotel.country,
      totalPhotos: photos.length,
      qualityPhotos,
      droppedPhotos,
      photos: photoAudits,
      finalStatus,
      reason
    };
  }

  /**
   * Analyze photo quality metrics
   */
  private async analyzePhotoQuality(photoUrl: string): Promise<PhotoQualityMetrics> {
    try {
      // Get image metadata without downloading full image
      const response = await axios.head(photoUrl, { timeout: 10000 });
      const contentType = response.headers['content-type'];
      
      if (!contentType || !contentType.startsWith('image/')) {
        return this.getDefaultQuality();
      }

      // Get image dimensions and file size
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      // For Google Places photos, we can get dimensions from URL parameters
      let width = 0;
      let height = 0;
      
      if (photoUrl.includes('maps.googleapis.com')) {
        // Extract dimensions from Google Places URL
        const sizeMatch = photoUrl.match(/=(\d+)x(\d+)/);
        if (sizeMatch) {
          width = parseInt(sizeMatch[1]);
          height = parseInt(sizeMatch[2]);
        }
      } else {
        // Try to get dimensions from image headers
        try {
          const imgResponse = await axios.get(photoUrl, { 
            responseType: 'arraybuffer',
            timeout: 5000,
            headers: { Range: 'bytes=0-1023' } // Only get first 1KB
          });
          
          // Parse image headers to get dimensions (simplified)
          const buffer = Buffer.from(imgResponse.data);
          const dimensions = this.extractImageDimensions(buffer, contentType);
          width = dimensions.width;
          height = dimensions.height;
        } catch (error) {
          // Fallback to default dimensions
          width = 800;
          height = 600;
        }
      }

      const aspectRatio = width / height;
      const isHighRes = width >= this.MIN_WIDTH && height >= this.MIN_HEIGHT;
      const isMobileOptimized = this.isMobileOptimized(width, height, aspectRatio);
      const qualityScore = this.calculateQualityScore(width, height, contentLength, aspectRatio);

      return {
        width,
        height,
        aspectRatio,
        fileSize: contentLength,
        isHighRes,
        isMobileOptimized,
        qualityScore
      };

    } catch (error) {
      console.error(`Failed to analyze photo ${photoUrl}:`, error);
      return this.getDefaultQuality();
    }
  }

  /**
   * Extract image dimensions from image headers
   */
  private extractImageDimensions(buffer: Buffer, contentType: string): { width: number; height: number } {
    try {
      if (contentType === 'image/jpeg') {
        return this.extractJPEGDimensions(buffer);
      } else if (contentType === 'image/png') {
        return this.extractPNGDimensions(buffer);
      } else if (contentType === 'image/webp') {
        return this.extractWebPDimensions(buffer);
      }
    } catch (error) {
      console.error('Failed to extract dimensions:', error);
    }
    
    return { width: 800, height: 600 }; // Default fallback
  }

  /**
   * Extract JPEG dimensions
   */
  private extractJPEGDimensions(buffer: Buffer): { width: number; height: number } {
    let i = 0;
    while (i < buffer.length - 1) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xC0) {
        const height = (buffer[i + 5] << 8) | buffer[i + 6];
        const width = (buffer[i + 7] << 8) | buffer[i + 8];
        return { width, height };
      }
      i++;
    }
    return { width: 800, height: 600 };
  }

  /**
   * Extract PNG dimensions
   */
  private extractPNGDimensions(buffer: Buffer): { width: number; height: number } {
    if (buffer.length >= 24 && buffer.toString('ascii', 0, 8) === '\x89PNG\r\n\x1a\n') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    return { width: 800, height: 600 };
  }

  /**
   * Extract WebP dimensions
   */
  private extractWebPDimensions(buffer: Buffer): { width: number; height: number } {
    if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const width = buffer.readUInt16LE(26) & 0x3FFF;
      const height = buffer.readUInt16LE(28) & 0x3FFF;
      return { width, height };
    }
    return { width: 800, height: 600 };
  }

  /**
   * Check if photo is mobile optimized
   */
  private isMobileOptimized(width: number, height: number, aspectRatio: number): boolean {
    // Check if aspect ratio is suitable for mobile (not too wide or too tall)
    const aspectRatioDiff = Math.abs(aspectRatio - this.IDEAL_ASPECT_RATIO);
    const isGoodAspectRatio = aspectRatioDiff <= this.ASPECT_RATIO_TOLERANCE;
    
    // Check if dimensions are suitable for mobile screens
    const isGoodSize = width >= this.MIN_WIDTH && height >= this.MIN_HEIGHT;
    
    return isGoodAspectRatio && isGoodSize;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(width: number, height: number, fileSize: number, aspectRatio: number): number {
    let score = 0;

    // Resolution score (0-40 points)
    const resolutionScore = Math.min(40, (width * height) / (this.MIN_WIDTH * this.MIN_HEIGHT) * 40);
    score += resolutionScore;

    // File size score (0-20 points)
    if (fileSize >= this.MIN_FILE_SIZE && fileSize <= this.MAX_FILE_SIZE) {
      score += 20;
    } else if (fileSize < this.MIN_FILE_SIZE) {
      score += fileSize / this.MIN_FILE_SIZE * 20;
    }

    // Aspect ratio score (0-20 points)
    const aspectRatioDiff = Math.abs(aspectRatio - this.IDEAL_ASPECT_RATIO);
    const aspectRatioScore = Math.max(0, 20 - (aspectRatioDiff / this.ASPECT_RATIO_TOLERANCE) * 20);
    score += aspectRatioScore;

    // High resolution bonus (0-20 points)
    if (width >= 1600 && height >= 1200) {
      score += 20;
    } else if (width >= this.MIN_WIDTH && height >= this.MIN_HEIGHT) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Evaluate if photo meets quality standards
   */
  private evaluatePhotoQuality(quality: PhotoQualityMetrics): 'accepted' | 'dropped' {
    // Must meet minimum requirements
    if (quality.width < this.MIN_WIDTH || quality.height < this.MIN_HEIGHT) {
      return 'dropped';
    }

    if (quality.fileSize < this.MIN_FILE_SIZE || quality.fileSize > this.MAX_FILE_SIZE) {
      return 'dropped';
    }

    if (quality.qualityScore < this.MIN_QUALITY_SCORE) {
      return 'dropped';
    }

    if (!quality.isMobileOptimized) {
      return 'dropped';
    }

    return 'accepted';
  }

  /**
   * Get reason for dropping a photo
   */
  private getDropReason(quality: PhotoQualityMetrics): string {
    if (quality.width < this.MIN_WIDTH || quality.height < this.MIN_HEIGHT) {
      return `Resolution too low: ${quality.width}x${quality.height}`;
    }

    if (quality.fileSize < this.MIN_FILE_SIZE) {
      return `File too small: ${Math.round(quality.fileSize / 1024)}KB`;
    }

    if (quality.fileSize > this.MAX_FILE_SIZE) {
      return `File too large: ${Math.round(quality.fileSize / 1024 / 1024)}MB`;
    }

    if (quality.qualityScore < this.MIN_QUALITY_SCORE) {
      return `Quality score too low: ${quality.qualityScore}/100`;
    }

    if (!quality.isMobileOptimized) {
      return 'Not mobile optimized';
    }

    return 'Unknown reason';
  }

  /**
   * Get default quality metrics for failed analysis
   */
  private getDefaultQuality(): PhotoQualityMetrics {
    return {
      width: 0,
      height: 0,
      aspectRatio: 0,
      fileSize: 0,
      isHighRes: false,
      isMobileOptimized: false,
      qualityScore: 0
    };
  }

  /**
   * Get all hotels from database
   */
  private async getAllHotels(): Promise<any[]> {
    try {
      const result = await this.databaseService.getHotels({ limit: 10000 });
      return result.hotels;
    } catch (error) {
      console.error('Failed to get hotels:', error);
      return [];
    }
  }

  /**
   * Log audit results
   */
  private logAuditResults(results: AuditResults): void {
    console.log(`
�� Photo Quality Audit Results:
   
📈 Summary:
   Total Hotels Audited: ${results.totalHotelsAudited}
   Hotels Kept: ${results.hotelsKept} (${Math.round(results.hotelsKept / results.totalHotelsAudited * 100)}%)
   Hotels Dropped: ${results.hotelsDropped} (${Math.round(results.hotelsDropped / results.totalHotelsAudited * 100)}%)
   
📸 Photos:
   Total Photos Audited: ${results.totalPhotosAudited}
   Photos Kept: ${results.photosKept} (${Math.round(results.photosKept / results.totalPhotosAudited * 100)}%)
   Photos Dropped: ${results.photosDropped} (${Math.round(results.photosDropped / results.totalPhotosAudited * 100)}%)
   
⏱️ Performance:
   Duration: ${results.duration.toFixed(1)} minutes
   Rate: ${(results.totalHotelsAudited / results.duration).toFixed(1)} hotels/min
    `);
  }

  /**
   * Utility method
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
