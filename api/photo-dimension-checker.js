const { createClient } = require('@supabase/supabase-js');
const probe = require('probe-image-size');
require('dotenv').config();

/**
 * Photo Dimension Checker
 * Downloads actual images and checks their real dimensions
 */
class PhotoDimensionChecker {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.stats = {
      totalHotels: 0,
      hotelsChecked: 0,
      totalPhotos: 0,
      highQualityPhotos: 0,
      lowQualityPhotos: 0,
      errorPhotos: 0,
      hotelsWithLowQuality: [],
      samplePhotoDimensions: []
    };
  }

  /**
   * Get image dimensions without downloading full file
   */
  async getImageDimensions(photoUrl) {
    try {
      const dimensions = await probe(photoUrl, {
        timeout: 10000
      });
      
      return {
        width: dimensions.width,
        height: dimensions.height,
        minDimension: Math.min(dimensions.width, dimensions.height)
      };
      
    } catch (error) {
      console.log(`     ⚠️  Error checking photo: ${error.message}`);
      return null;
    }
  }

  /**
   * Check hotel photos
   */
  async checkHotel(hotel) {
    console.log(`\n📸 Checking: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    this.stats.hotelsChecked++;
    
    const photos = hotel.photos || [];
    
    if (photos.length === 0) {
      console.log(`   ⚠️  No photos`);
      return;
    }
    
    console.log(`   📊 Checking ${photos.length} photos...`);
    
    const photoResults = [];
    let lowQualityCount = 0;
    
    for (let i = 0; i < photos.length; i++) {
      const photoUrl = photos[i];
      console.log(`     [${i+1}/${photos.length}] Downloading...`);
      
      const dimensions = await this.getImageDimensions(photoUrl);
      
      if (!dimensions) {
        this.stats.errorPhotos++;
        photoResults.push({
          index: i + 1,
          status: 'ERROR',
          url: photoUrl.substring(0, 100) + '...'
        });
        continue;
      }
      
      this.stats.totalPhotos++;
      const isHighQuality = dimensions.minDimension >= 2048;
      
      if (isHighQuality) {
        this.stats.highQualityPhotos++;
        console.log(`     ✅ ${dimensions.width}x${dimensions.height} (HIGH QUALITY)`);
      } else {
        this.stats.lowQualityPhotos++;
        lowQualityCount++;
        console.log(`     ❌ ${dimensions.width}x${dimensions.height} (LOW QUALITY - min ${dimensions.minDimension}px < 2048px)`);
      }
      
      photoResults.push({
        index: i + 1,
        status: isHighQuality ? 'HIGH' : 'LOW',
        dimensions: dimensions,
        url: photoUrl.substring(0, 100) + '...'
      });
      
      // Sample first few photos for report
      if (this.stats.samplePhotoDimensions.length < 20) {
        this.stats.samplePhotoDimensions.push({
          hotel: hotel.name,
          ...dimensions
        });
      }
      
      await this.delay(500); // Don't hammer the server
    }
    
    if (lowQualityCount > 0) {
      console.log(`   ⚠️  WARNING: ${lowQualityCount} low-quality photos found`);
      this.stats.hotelsWithLowQuality.push({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        totalPhotos: photos.length,
        lowQualityCount: lowQualityCount,
        photoResults: photoResults
      });
    } else {
      console.log(`   ✅ All photos are high quality!`);
    }
    
    console.log(`   📊 Progress: ${this.stats.hotelsChecked}/${this.stats.totalHotels}`);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PHOTO DIMENSION CHECK - FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`Completed: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    
    console.log('\n📈 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Hotels Checked:                    ${this.stats.hotelsChecked}`);
    console.log(`Total Photos Analyzed:             ${this.stats.totalPhotos}`);
    console.log(`High Quality (≥2048px):            ${this.stats.highQualityPhotos} (${this.percentage(this.stats.highQualityPhotos, this.stats.totalPhotos)}%)`);
    console.log(`Low Quality (<2048px):             ${this.stats.lowQualityPhotos} (${this.percentage(this.stats.lowQualityPhotos, this.stats.totalPhotos)}%)`);
    console.log(`Errors:                            ${this.stats.errorPhotos}`);
    
    console.log('\n🏨 HOTEL BREAKDOWN');
    console.log('-'.repeat(80));
    console.log(`Hotels with ALL high-quality:      ${this.stats.hotelsChecked - this.stats.hotelsWithLowQuality.length}`);
    console.log(`Hotels with SOME low-quality:      ${this.stats.hotelsWithLowQuality.length}`);
    
    if (this.stats.samplePhotoDimensions.length > 0) {
      console.log('\n📸 SAMPLE PHOTO DIMENSIONS');
      console.log('-'.repeat(80));
      this.stats.samplePhotoDimensions.slice(0, 10).forEach((photo, i) => {
        console.log(`${i+1}. ${photo.hotel}`);
        console.log(`   ${photo.width}x${photo.height} (min: ${photo.minDimension}px) ${photo.minDimension >= 2048 ? '✅' : '❌'}`);
      });
    }
    
    if (this.stats.hotelsWithLowQuality.length > 0) {
      console.log('\n❌ HOTELS WITH LOW-QUALITY PHOTOS');
      console.log('='.repeat(80));
      
      this.stats.hotelsWithLowQuality.forEach((hotel, index) => {
        console.log(`\n${(index + 1).toString().padStart(3)}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
        console.log(`     Total: ${hotel.totalPhotos} photos | Low quality: ${hotel.lowQualityCount}`);
        
        hotel.photoResults.filter(p => p.status === 'LOW').forEach(photo => {
          console.log(`       Photo ${photo.index}: ${photo.dimensions.width}x${photo.dimensions.height} (min: ${photo.dimensions.minDimension}px)`);
        });
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`Total hotels with low-quality photos: ${this.stats.hotelsWithLowQuality.length}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('Report Complete');
    console.log('='.repeat(80) + '\n');
    
    return this.stats;
  }

  /**
   * Helper: Calculate percentage
   */
  percentage(part, total) {
    if (total === 0) return '0.0';
    return ((part / total) * 100).toFixed(1);
  }

  /**
   * Main execution
   */
  async run(sampleSize = 50) {
    try {
      console.log('🔍 Photo Dimension Checker');
      console.log('='.repeat(80));
      console.log('Downloads actual images and checks their real dimensions');
      console.log(`Sample size: ${sampleSize} hotels`);
      console.log('='.repeat(80) + '\n');
      
      // Fetch sample of hotels
      console.log(`📥 Fetching ${sampleSize} random hotels from database...`);
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, photos')
        .limit(sampleSize);
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        throw new Error('No hotels found in database');
      }
      
      this.stats.totalHotels = hotels.length;
      console.log(`✅ Found ${hotels.length} hotels\n`);
      
      // Check each hotel
      for (const hotel of hotels) {
        await this.checkHotel(hotel);
      }
      
      // Generate report
      const stats = this.generateReport();
      
      // Save report
      const fs = require('fs');
      const reportPath = './photo-dimension-check-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        sampleSize: sampleSize,
        stats: stats,
        lowQualityHotels: stats.hotelsWithLowQuality
      }, null, 2));
      
      console.log(`💾 Detailed report saved to: ${reportPath}\n`);
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the checker
async function main() {
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 50;
  const checker = new PhotoDimensionChecker();
  await checker.run(sampleSize);
}

main();
