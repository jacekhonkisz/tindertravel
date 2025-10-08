require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * Photo Quality Audit Script
 * 
 * This script will:
 * 1. Check all hotel photos for resolution compliance
 * 2. Identify photos below 1600x1067 minimum
 * 3. Generate a detailed audit report
 * 4. Show where these low-quality photos came from
 */

class PhotoQualityAuditor {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.MIN_WIDTH = 1600;
    this.MIN_HEIGHT = 1067;
    
    this.stats = {
      totalHotelsChecked: 0,
      totalPhotosChecked: 0,
      photosBelowMinimum: 0,
      hotelsWithLowQualityPhotos: 0,
      resolutionBreakdown: {},
      lowQualityPhotos: [],
      errors: []
    };
  }

  /**
   * Get all hotels with photos
   */
  async getAllHotelsWithPhotos() {
    console.log('\n📊 Querying database for hotels with photos...\n');
    
    const { data, error } = await this.supabase
      .from('hotels')
      .select('*')
      .not('photos', 'is', null)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    const hotelsWithPhotos = data.filter(hotel => 
      hotel.photos && hotel.photos.length > 0
    );
    
    console.log(`✅ Found ${hotelsWithPhotos.length} hotels with photos`);
    
    return hotelsWithPhotos;
  }

  /**
   * Analyze photo resolution more accurately
   */
  async analyzePhotoResolution(photoUrl) {
    try {
      // First, try to get actual image dimensions
      const response = await axios.get(photoUrl, {
        responseType: 'stream',
        timeout: 15000,
        maxRedirects: 5
      });
      
      return new Promise((resolve) => {
        let chunks = [];
        let totalLength = 0;
        
        response.data.on('data', (chunk) => {
          chunks.push(chunk);
          totalLength += chunk.length;
          
          // Stop after getting enough data to analyze
          if (totalLength > 100000) { // 100KB should be enough
            response.data.destroy();
            analyzeImageBuffer(Buffer.concat(chunks));
          }
        });
        
        response.data.on('end', () => {
          analyzeImageBuffer(Buffer.concat(chunks));
        });
        
        response.data.on('error', () => {
          resolve({ width: 'unknown', height: 'unknown', method: 'error' });
        });
        
        function analyzeImageBuffer(buffer) {
          try {
            // Try to extract dimensions from image headers
            const dimensions = extractImageDimensions(buffer);
            resolve({
              width: dimensions.width,
              height: dimensions.height,
              method: 'buffer_analysis',
              fileSize: buffer.length
            });
          } catch (error) {
            // Fallback to URL analysis
            const urlDimensions = analyzeUrlForDimensions(photoUrl);
            resolve({
              width: urlDimensions.width,
              height: urlDimensions.height,
              method: 'url_analysis',
              fileSize: buffer.length
            });
          }
        }
      });
      
    } catch (error) {
      // Fallback to URL analysis
      const urlDimensions = analyzeUrlForDimensions(photoUrl);
      return {
        width: urlDimensions.width,
        height: urlDimensions.height,
        method: 'url_fallback',
        fileSize: 0
      };
    }
  }

  /**
   * Extract image dimensions from buffer
   */
  extractImageDimensions(buffer) {
    // Check for JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let i = 2;
      while (i < buffer.length - 1) {
        if (buffer[i] === 0xFF) {
          const marker = buffer[i + 1];
          if (marker === 0xC0 || marker === 0xC2) { // SOF markers
            const height = (buffer[i + 5] << 8) | buffer[i + 6];
            const width = (buffer[i + 7] << 8) | buffer[i + 8];
            return { width, height };
          }
        }
        i++;
      }
    }
    
    // Check for PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      return { width, height };
    }
    
    // Check for WebP
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      const width = buffer[26] | (buffer[27] << 8);
      const height = buffer[28] | (buffer[29] << 8);
      return { width, height };
    }
    
    throw new Error('Unknown image format');
  }

  /**
   * Analyze URL for dimensions
   */
  analyzeUrlForDimensions(url) {
    // Check for Google Places API patterns
    if (url.includes('maps.googleapis.com')) {
      if (url.includes('maxwidth=4800')) return { width: 4800, height: 3200 };
      if (url.includes('maxwidth=3200')) return { width: 3200, height: 2133 };
      if (url.includes('maxwidth=1600')) return { width: 1600, height: 1067 };
      if (url.includes('maxwidth=1200')) return { width: 1200, height: 800 };
      if (url.includes('maxwidth=800')) return { width: 800, height: 600 };
    }
    
    // Check for Unsplash patterns
    if (url.includes('unsplash.com')) {
      if (url.includes('w=1600')) return { width: 1600, height: 1067 };
      if (url.includes('w=1200')) return { width: 1200, height: 800 };
      if (url.includes('w=800')) return { width: 800, height: 600 };
    }
    
    // Check for direct dimension patterns
    const dimensionMatch = url.match(/(\d+)x(\d+)/);
    if (dimensionMatch) {
      return {
        width: parseInt(dimensionMatch[1]),
        height: parseInt(dimensionMatch[2])
      };
    }
    
    return { width: 'unknown', height: 'unknown' };
  }

  /**
   * Check if photo meets minimum requirements
   */
  meetsMinimumRequirements(width, height) {
    if (width === 'unknown' || height === 'unknown') {
      return false;
    }
    
    return width >= this.MIN_WIDTH && height >= this.MIN_HEIGHT;
  }

  /**
   * Process a single hotel
   */
  async processHotel(hotel) {
    const photos = hotel.photos || [];
    if (photos.length === 0) return;
    
    console.log(`\n🏨 Auditing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Photos to check: ${photos.length}`);
    
    let hotelHasLowQuality = false;
    
    for (let i = 0; i < photos.length; i++) {
      const photoUrl = photos[i];
      console.log(`   [${i + 1}/${photos.length}] Analyzing resolution...`);
      
      try {
        const analysis = await this.analyzePhotoResolution(photoUrl);
        this.stats.totalPhotosChecked++;
        
        const resolution = `${analysis.width}x${analysis.height}`;
        
        // Track resolution breakdown
        if (!this.stats.resolutionBreakdown[resolution]) {
          this.stats.resolutionBreakdown[resolution] = 0;
        }
        this.stats.resolutionBreakdown[resolution]++;
        
        const meetsMinimum = this.meetsMinimumRequirements(analysis.width, analysis.height);
        
        if (!meetsMinimum) {
          console.log(`   ❌ Below minimum: ${resolution} (${analysis.method})`);
          this.stats.photosBelowMinimum++;
          hotelHasLowQuality = true;
          
          this.stats.lowQualityPhotos.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoIndex: i,
            photoUrl: photoUrl,
            width: analysis.width,
            height: analysis.height,
            resolution: resolution,
            method: analysis.method,
            fileSize: analysis.fileSize
          });
        } else {
          console.log(`   ✅ Meets minimum: ${resolution} (${analysis.method})`);
        }
        
        // Small delay to avoid overwhelming servers
        await this.sleep(200);
        
      } catch (error) {
        console.log(`   ⚠️  Error analyzing: ${error.message}`);
        this.stats.errors.push({
          hotelId: hotel.id,
          hotelName: hotel.name,
          photoUrl: photoUrl,
          error: error.message
        });
      }
    }
    
    if (hotelHasLowQuality) {
      this.stats.hotelsWithLowQualityPhotos++;
    }
    
    this.stats.totalHotelsChecked++;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive audit report
   */
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `/Users/ala/tindertravel/api/photo-quality-audit-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/PHOTO_QUALITY_AUDIT_REPORT.md`;
    
    const report = {
      timestamp: new Date().toISOString(),
      minimumRequirements: {
        minWidth: this.MIN_WIDTH,
        minHeight: this.MIN_HEIGHT,
        minResolution: `${this.MIN_WIDTH}x${this.MIN_HEIGHT}`
      },
      summary: {
        totalHotelsChecked: this.stats.totalHotelsChecked,
        totalPhotosChecked: this.stats.totalPhotosChecked,
        photosBelowMinimum: this.stats.photosBelowMinimum,
        hotelsWithLowQualityPhotos: this.stats.hotelsWithLowQualityPhotos,
        complianceRate: ((this.stats.totalPhotosChecked - this.stats.photosBelowMinimum) / this.stats.totalPhotosChecked * 100).toFixed(2) + '%',
        errorCount: this.stats.errors.length
      },
      resolutionBreakdown: this.stats.resolutionBreakdown,
      lowQualityPhotos: this.stats.lowQualityPhotos,
      errors: this.stats.errors
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 🔍 Photo Quality Audit Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## ⚙️ Minimum Requirements\n\n`;
    markdown += `- **Minimum Width:** ${this.MIN_WIDTH}px\n`;
    markdown += `- **Minimum Height:** ${this.MIN_HEIGHT}px\n`;
    markdown += `- **Minimum Resolution:** ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Checked | ${this.stats.totalHotelsChecked} |\n`;
    markdown += `| Total Photos Checked | ${this.stats.totalPhotosChecked} |\n`;
    markdown += `| Photos Below Minimum | ${this.stats.photosBelowMinimum} |\n`;
    markdown += `| Hotels with Low Quality Photos | ${this.stats.hotelsWithLowQualityPhotos} |\n`;
    markdown += `| Compliance Rate | ${report.summary.complianceRate} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    // Resolution breakdown
    markdown += `## 📈 Resolution Breakdown\n\n`;
    markdown += `| Resolution | Count | Percentage | Status |\n`;
    markdown += `|------------|-------|------------|--------|\n`;
    
    const sortedResolutions = Object.entries(this.stats.resolutionBreakdown)
      .sort((a, b) => b[1] - a[1]);
    
    sortedResolutions.forEach(([resolution, count]) => {
      const percentage = ((count / this.stats.totalPhotosChecked) * 100).toFixed(1);
      const meetsMinimum = this.meetsMinimumRequirements(
        parseInt(resolution.split('x')[0]),
        parseInt(resolution.split('x')[1])
      );
      const status = meetsMinimum ? '✅ Compliant' : '❌ Below Minimum';
      markdown += `| ${resolution} | ${count} | ${percentage}% | ${status} |\n`;
    });
    markdown += `\n`;
    
    // Low quality photos
    if (this.stats.lowQualityPhotos.length > 0) {
      markdown += `## ❌ Photos Below Minimum (${this.stats.lowQualityPhotos.length})\n\n`;
      markdown += `| Hotel Name | Location | Resolution | Method |\n`;
      markdown += `|------------|----------|------------|--------|\n`;
      this.stats.lowQualityPhotos.slice(0, 50).forEach(photo => {
        markdown += `| ${photo.hotelName} | ${photo.city}, ${photo.country} | ${photo.resolution} | ${photo.method} |\n`;
      });
      if (this.stats.lowQualityPhotos.length > 50) {
        markdown += `\n*...and ${this.stats.lowQualityPhotos.length - 50} more*\n`;
      }
      markdown += `\n`;
    }
    
    markdown += `## 🔍 Analysis\n\n`;
    markdown += `### Why are there low-quality photos?\n\n`;
    markdown += `1. **Legacy photos** - Photos added before quality standards were enforced\n`;
    markdown += `2. **Different sources** - Photos from sources other than Google Places API\n`;
    markdown += `3. **API limitations** - Some photo sources don't provide high-resolution images\n`;
    markdown += `4. **Manual additions** - Photos added manually without quality checks\n\n`;
    
    markdown += `### Recommendations\n\n`;
    markdown += `1. **Remove low-quality photos** - Delete photos below 1600x1067\n`;
    markdown += `2. **Replace with high-quality** - Use Google Places API to find better photos\n`;
    markdown += `3. **Enforce quality checks** - Add validation for all new photos\n`;
    markdown += `4. **Regular audits** - Run this audit monthly to maintain quality\n\n`;
    
    markdown += `---\n\n`;
    markdown += `*Full detailed report: ${reportPath}*\n`;
    
    await fs.writeFile(summaryPath, markdown);
    
    return { reportPath, summaryPath };
  }

  /**
   * Main execution
   */
  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Photo Quality Audit - Compliance Check');
    console.log('='.repeat(80));
    console.log(`\n⚙️  Minimum Requirements:`);
    console.log(`   Width: ${this.MIN_WIDTH}px`);
    console.log(`   Height: ${this.MIN_HEIGHT}px`);
    console.log(`   Resolution: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px`);
    console.log('\n' + '='.repeat(80) + '\n');
    
    try {
      // Get all hotels with photos
      const hotels = await this.getAllHotelsWithPhotos();
      
      if (hotels.length === 0) {
        console.log('\n✅ No hotels with photos found!\n');
        return;
      }
      
      console.log(`🔄 Auditing ${hotels.length} hotels...\n`);
      
      // Process each hotel
      for (let i = 0; i < hotels.length; i++) {
        console.log(`\n[${i + 1}/${hotels.length}]`);
        await this.processHotel(hotels[i]);
        
        // Delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(300);
        }
      }
      
      // Generate report
      console.log('\n' + '='.repeat(80));
      console.log('📊 GENERATING AUDIT REPORT');
      console.log('='.repeat(80) + '\n');
      
      const { reportPath, summaryPath } = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🎉 AUDIT COMPLETE!');
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Hotels Checked: ${this.stats.totalHotelsChecked}`);
      console.log(`   Photos Checked: ${this.stats.totalPhotosChecked}`);
      console.log(`   Photos Below Minimum: ${this.stats.photosBelowMinimum}`);
      console.log(`   Compliance Rate: ${((this.stats.totalPhotosChecked - this.stats.photosBelowMinimum) / this.stats.totalPhotosChecked * 100).toFixed(2)}%`);
      console.log(`   Errors: ${this.stats.errors.length}`);
      console.log(`\n📁 Reports:`);
      console.log(`   - Summary: ${summaryPath}`);
      console.log(`   - Full Report: ${reportPath}`);
      console.log('\n');
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the script
const auditor = new PhotoQualityAuditor();
auditor.run().catch(console.error);
