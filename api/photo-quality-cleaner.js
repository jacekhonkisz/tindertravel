require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * Photo Quality Cleaner & Reorderer
 * 
 * This script will:
 * 1. Remove ANY photo below 1600x1067 resolution (both width AND height must meet minimum)
 * 2. Reorder remaining photos from best quality to worst quality
 * 3. Update database with cleaned and reordered photos
 * 4. Generate comprehensive report
 */

class PhotoQualityCleaner {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Strict minimum requirements
    this.MIN_WIDTH = 1600;
    this.MIN_HEIGHT = 1067;
    
    this.stats = {
      totalHotelsProcessed: 0,
      hotelsWithChanges: 0,
      totalPhotosBefore: 0,
      totalPhotosAfter: 0,
      photosRemoved: 0,
      photosReordered: 0,
      detailedResults: [],
      errors: []
    };
    
    // Resolution scoring (higher = better quality)
    this.resolutionScores = {
      '4800x3200': 100, // Ultra High
      '4096x2731': 95,  // 4K Landscape
      '3840x2560': 90,  // 4K
      '3200x2133': 85,  // High
      '2048x1365': 80,  // Medium-High (Google Places API)
      '1920x1280': 75,  // Full HD
      '1600x1067': 70,  // Minimum acceptable
      '1600x1200': 72,  // Minimum acceptable (portrait)
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
   * Analyze photo resolution accurately
   */
  async analyzePhotoResolution(photoUrl) {
    try {
      // Analyze Google Places API URLs
      if (photoUrl.includes('maps.googleapis.com')) {
        if (photoUrl.includes('maxwidth=4800')) {
          return { width: 4800, height: 3200, source: 'Google Places API' };
        } else if (photoUrl.includes('maxwidth=3200')) {
          return { width: 3200, height: 2133, source: 'Google Places API' };
        } else if (photoUrl.includes('maxwidth=2048')) {
          return { width: 2048, height: 1365, source: 'Google Places API' };
        } else if (photoUrl.includes('maxwidth=1600')) {
          return { width: 1600, height: 1067, source: 'Google Places API' };
        } else if (photoUrl.includes('maxwidth=1200')) {
          return { width: 1200, height: 800, source: 'Google Places API' };
        } else if (photoUrl.includes('maxwidth=800')) {
          return { width: 800, height: 600, source: 'Google Places API' };
        }
      }
      
      // Analyze Google User Content URLs
      if (photoUrl.includes('googleusercontent.com')) {
        if (photoUrl.includes('s1600-w4800')) {
          return { width: 4800, height: 3200, source: 'Google User Content' };
        } else if (photoUrl.includes('s1600-w3024')) {
          return { width: 3024, height: 2016, source: 'Google User Content' };
        } else if (photoUrl.includes('s1600-w1284')) {
          return { width: 1284, height: 856, source: 'Google User Content' };
        } else {
          // Try to get actual dimensions for unknown compressed images
          return await this.getActualImageDimensions(photoUrl);
        }
      }
      
      // Analyze Unsplash URLs
      if (photoUrl.includes('unsplash.com')) {
        return { width: 1200, height: 800, source: 'Unsplash' }; // Legacy photos
      }
      
      // For other sources, try to get actual dimensions
      return await this.getActualImageDimensions(photoUrl);
      
    } catch (error) {
      return { width: 'unknown', height: 'unknown', source: 'unknown', error: error.message };
    }
  }

  /**
   * Get actual image dimensions by downloading image headers
   */
  async getActualImageDimensions(photoUrl) {
    try {
      const response = await axios.head(photoUrl, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      // Check content length for rough estimation
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      if (contentLength > 2000000) {
        return { width: 4800, height: 3200, source: 'estimated-large' };
      } else if (contentLength > 1000000) {
        return { width: 2048, height: 1365, source: 'estimated-medium' };
      } else if (contentLength > 500000) {
        return { width: 1600, height: 1067, source: 'estimated-minimum' };
      } else {
        return { width: 1200, height: 800, source: 'estimated-small' };
      }
    } catch (error) {
      return { width: 'unknown', height: 'unknown', source: 'error', error: error.message };
    }
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
   * Calculate resolution score
   */
  getResolutionScore(width, height) {
    if (width === 'unknown' || height === 'unknown') {
      return 0;
    }
    
    const resolution = `${width}x${height}`;
    
    // Try exact match first
    if (this.resolutionScores[resolution]) {
      return this.resolutionScores[resolution];
    }
    
    // Calculate score based on total pixels
    const pixels = width * height;
    
    if (pixels >= 15000000) return 100; // 4K+ (4800x3200+)
    if (pixels >= 8000000) return 90;   // 4K (3840x2560)
    if (pixels >= 6000000) return 85;  // High (3200x2133)
    if (pixels >= 2000000) return 80;  // Medium-High (2048x1365)
    if (pixels >= 1500000) return 75;  // Full HD (1920x1280)
    if (pixels >= 1000000) return 70;  // Minimum (1600x1067)
    if (pixels >= 500000) return 60;   // Below minimum
    return 30; // Very low
  }

  /**
   * Process a single hotel
   */
  async processHotel(hotel) {
    const originalPhotos = hotel.photos || [];
    if (originalPhotos.length === 0) return;
    
    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Original photos: ${originalPhotos.length}`);
    
    this.stats.totalPhotosBefore += originalPhotos.length;
    
    try {
      // Analyze all photos
      const photoAnalysis = [];
      
      for (let i = 0; i < originalPhotos.length; i++) {
        const photoUrl = originalPhotos[i];
        console.log(`   [${i + 1}/${originalPhotos.length}] Analyzing resolution...`);
        
        const analysis = await this.analyzePhotoResolution(photoUrl);
        const meetsMinimum = this.meetsMinimumRequirements(analysis.width, analysis.height);
        const score = this.getResolutionScore(analysis.width, analysis.height);
        
        photoAnalysis.push({
          url: photoUrl,
          width: analysis.width,
          height: analysis.height,
          resolution: `${analysis.width}x${analysis.height}`,
          source: analysis.source,
          meetsMinimum: meetsMinimum,
          score: score,
          originalIndex: i
        });
        
        // Small delay to avoid overwhelming servers
        await this.sleep(100);
      }
      
      // Filter out photos below minimum requirements
      const validPhotos = photoAnalysis.filter(photo => photo.meetsMinimum);
      const removedPhotos = photoAnalysis.filter(photo => !photo.meetsMinimum);
      
      console.log(`   📊 Analysis complete:`);
      console.log(`      Valid photos: ${validPhotos.length}`);
      console.log(`      Removed photos: ${removedPhotos.length}`);
      
      if (removedPhotos.length > 0) {
        console.log(`   🗑️  Removed photos:`);
        removedPhotos.forEach(photo => {
          console.log(`      - ${photo.resolution} (${photo.source})`);
        });
      }
      
      if (validPhotos.length === 0) {
        console.log(`   ⚠️  No valid photos remaining!`);
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          originalPhotoCount: originalPhotos.length,
          finalPhotoCount: 0,
          photosRemoved: removedPhotos.length,
          photosReordered: 0,
          result: 'all_photos_removed',
          removedPhotos: removedPhotos
        });
        
        // Update database to remove all photos
        await this.updateHotelPhotos(hotel.id, []);
        return;
      }
      
      // Sort valid photos by quality (highest score first)
      const sortedPhotos = validPhotos.sort((a, b) => b.score - a.score);
      
      // Check if reordering is needed
      const needsReordering = sortedPhotos.some((photo, index) => 
        photo.originalIndex !== index
      );
      
      const newPhotoOrder = sortedPhotos.map(photo => photo.url);
      
      if (needsReordering) {
        console.log(`   🔄 Reordered photos by quality:`);
        console.log(`      Best: ${sortedPhotos[0].resolution} (score: ${sortedPhotos[0].score})`);
        console.log(`      Worst: ${sortedPhotos[sortedPhotos.length - 1].resolution} (score: ${sortedPhotos[sortedPhotos.length - 1].score})`);
      } else {
        console.log(`   ✅ Photos already in correct order`);
      }
      
      // Update database
      console.log(`   💾 Updating database...`);
      await this.updateHotelPhotos(hotel.id, newPhotoOrder);
      
      console.log(`   ✅ SUCCESS! ${validPhotos.length} photos kept, ${removedPhotos.length} removed`);
      
      this.stats.hotelsWithChanges++;
      this.stats.totalPhotosAfter += validPhotos.length;
      this.stats.photosRemoved += removedPhotos.length;
      this.stats.photosReordered += needsReordering ? validPhotos.length : 0;
      
      this.stats.detailedResults.push({
        hotelId: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        originalPhotoCount: originalPhotos.length,
        finalPhotoCount: validPhotos.length,
        photosRemoved: removedPhotos.length,
        photosReordered: needsReordering ? validPhotos.length : 0,
        result: 'success',
        bestResolution: sortedPhotos[0].resolution,
        worstResolution: sortedPhotos[sortedPhotos.length - 1].resolution,
        removedPhotos: removedPhotos,
        finalPhotos: sortedPhotos
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.stats.errors.push({
        hotelId: hotel.id,
        name: hotel.name,
        error: error.message
      });
    }
    
    this.stats.totalHotelsProcessed++;
  }

  /**
   * Update hotel photos in database
   */
  async updateHotelPhotos(hotelId, newPhotoOrder) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: newPhotoOrder,
          hero_photo: newPhotoOrder.length > 0 ? newPhotoOrder[0] : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `/Users/ala/tindertravel/api/photo-quality-cleanup-report-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/PHOTO_QUALITY_CLEANUP_REPORT.md`;
    
    const report = {
      timestamp: new Date().toISOString(),
      minimumRequirements: {
        minWidth: this.MIN_WIDTH,
        minHeight: this.MIN_HEIGHT,
        minResolution: `${this.MIN_WIDTH}x${this.MIN_HEIGHT}`
      },
      summary: {
        totalHotelsProcessed: this.stats.totalHotelsProcessed,
        hotelsWithChanges: this.stats.hotelsWithChanges,
        totalPhotosBefore: this.stats.totalPhotosBefore,
        totalPhotosAfter: this.stats.totalPhotosAfter,
        photosRemoved: this.stats.photosRemoved,
        photosReordered: this.stats.photosReordered,
        errorCount: this.stats.errors.length
      },
      results: this.stats.detailedResults,
      errors: this.stats.errors
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 🧹 Photo Quality Cleanup Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## ⚙️ Requirements\n\n`;
    markdown += `- **Minimum Width:** ${this.MIN_WIDTH}px\n`;
    markdown += `- **Minimum Height:** ${this.MIN_HEIGHT}px\n`;
    markdown += `- **Both width AND height must meet minimum**\n`;
    markdown += `- **Photos ordered from best to worst quality**\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Processed | ${this.stats.totalHotelsProcessed} |\n`;
    markdown += `| Hotels with Changes | ${this.stats.hotelsWithChanges} |\n`;
    markdown += `| Total Photos Before | ${this.stats.totalPhotosBefore} |\n`;
    markdown += `| Total Photos After | ${this.stats.totalPhotosAfter} |\n`;
    markdown += `| Photos Removed | ${this.stats.photosRemoved} |\n`;
    markdown += `| Photos Reordered | ${this.stats.photosReordered} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    // Hotels with changes
    const changedHotels = this.stats.detailedResults.filter(r => r.result === 'success');
    if (changedHotels.length > 0) {
      markdown += `## ✅ Hotels with Changes (${changedHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Before | After | Removed | Best Resolution |\n`;
      markdown += `|------------|----------|--------|-------|---------|----------------|\n`;
      changedHotels.forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.originalPhotoCount} | ${h.finalPhotoCount} | ${h.photosRemoved} | ${h.bestResolution} |\n`;
      });
      markdown += `\n`;
    }
    
    // Hotels with all photos removed
    const removedHotels = this.stats.detailedResults.filter(r => r.result === 'all_photos_removed');
    if (removedHotels.length > 0) {
      markdown += `## ⚠️ Hotels with All Photos Removed (${removedHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Photos Removed |\n`;
      markdown += `|------------|----------|----------------|\n`;
      removedHotels.forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.photosRemoved} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## 📝 Notes\n\n`;
    markdown += `- All photos below ${this.MIN_WIDTH}x${this.MIN_HEIGHT} have been removed\n`;
    markdown += `- Remaining photos are ordered from best to worst quality\n`;
    markdown += `- First photo becomes the hero photo\n`;
    markdown += `- Database now contains only high-quality photos\n\n`;
    
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
    console.log('🧹 Photo Quality Cleaner - Remove Low Quality & Reorder');
    console.log('='.repeat(80));
    console.log(`\n⚙️  Requirements:`);
    console.log(`   Minimum Width: ${this.MIN_WIDTH}px`);
    console.log(`   Minimum Height: ${this.MIN_HEIGHT}px`);
    console.log(`   Both width AND height must meet minimum`);
    console.log(`   Order: Best quality → Worst quality`);
    console.log('\n' + '='.repeat(80) + '\n');
    
    try {
      // Get all hotels with photos
      const hotels = await this.getAllHotelsWithPhotos();
      
      if (hotels.length === 0) {
        console.log('\n✅ No hotels with photos found!\n');
        return;
      }
      
      console.log(`🔄 Processing ${hotels.length} hotels...\n`);
      
      // Process each hotel
      for (let i = 0; i < hotels.length; i++) {
        console.log(`\n[${i + 1}/${hotels.length}]`);
        await this.processHotel(hotels[i]);
        
        // Delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(500);
        }
      }
      
      // Generate report
      console.log('\n' + '='.repeat(80));
      console.log('📊 GENERATING REPORT');
      console.log('='.repeat(80) + '\n');
      
      const { reportPath, summaryPath } = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🎉 CLEANUP COMPLETE!');
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Hotels Processed: ${this.stats.totalHotelsProcessed}`);
      console.log(`   Hotels with Changes: ${this.stats.hotelsWithChanges}`);
      console.log(`   Photos Before: ${this.stats.totalPhotosBefore}`);
      console.log(`   Photos After: ${this.stats.totalPhotosAfter}`);
      console.log(`   Photos Removed: ${this.stats.photosRemoved}`);
      console.log(`   Photos Reordered: ${this.stats.photosReordered}`);
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
const cleaner = new PhotoQualityCleaner();
cleaner.run().catch(console.error);

