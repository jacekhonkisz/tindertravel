require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * Photo Resolution Prioritizer
 * 
 * This script will:
 * 1. Analyze all hotel photos and their resolutions
 * 2. Reorder photos so highest resolution comes first
 * 3. Update the database with the new photo order
 * 4. Generate a report of changes
 */

class PhotoResolutionPrioritizer {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      totalHotelsProcessed: 0,
      hotelsWithReorderedPhotos: 0,
      totalPhotosAnalyzed: 0,
      photosReordered: 0,
      errors: [],
      detailedResults: []
    };
    
    // Resolution priority mapping (higher number = better quality)
    this.resolutionScores = {
      '4800x3200': 100, // Ultra High
      '4096x2731': 95,  // 4K Landscape
      '3840x2560': 90,  // 4K
      '3200x2133': 85,  // High
      '2048x1365': 80,  // Medium-High
      '1920x1280': 75,  // Full HD
      '1600x1067': 70,  // Minimum acceptable
      '1600x1200': 72,  // Minimum acceptable (portrait)
      '1200x1600': 65,  // Below minimum (portrait)
      '1200x800': 60,   // Below minimum
      '1024x768': 50,   // Low
      '800x600': 40,    // Very low
      '640x480': 30     // Very low
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
    
    // Filter hotels that actually have photos
    const hotelsWithPhotos = data.filter(hotel => 
      hotel.photos && hotel.photos.length > 0
    );
    
    console.log(`✅ Found ${hotelsWithPhotos.length} hotels with photos`);
    
    return hotelsWithPhotos;
  }

  /**
   * Get photo resolution from URL
   */
  async getPhotoResolution(photoUrl) {
    try {
      // Try to get image dimensions without downloading the full image
      const response = await axios.head(photoUrl, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      // Check if we can get dimensions from headers
      const contentType = response.headers['content-type'];
      if (contentType && contentType.startsWith('image/')) {
        // For some image services, we might get dimensions from headers
        const contentLength = parseInt(response.headers['content-length'] || '0');
        
        // Estimate resolution based on file size
        if (contentLength > 2000000) return '4800x3200'; // Very large file
        if (contentLength > 1000000) return '3200x2133'; // Large file
        if (contentLength > 500000) return '1600x1067';  // Medium file
        if (contentLength > 200000) return '1200x800';   // Small file
        return '800x600'; // Very small file
      }
      
      return 'unknown';
    } catch (error) {
      // If HEAD request fails, try to estimate from URL patterns
      if (photoUrl.includes('4800x3200') || photoUrl.includes('maxwidth=4800')) {
        return '4800x3200';
      }
      if (photoUrl.includes('3200x2133') || photoUrl.includes('maxwidth=3200')) {
        return '3200x2133';
      }
      if (photoUrl.includes('1600x1067') || photoUrl.includes('maxwidth=1600')) {
        return '1600x1067';
      }
      if (photoUrl.includes('1200x800') || photoUrl.includes('maxwidth=1200')) {
        return '1200x800';
      }
      
      return 'unknown';
    }
  }

  /**
   * Calculate resolution score for a photo
   */
  getResolutionScore(resolution) {
    // Try exact match first
    if (this.resolutionScores[resolution]) {
      return this.resolutionScores[resolution];
    }
    
    // Try to parse dimensions from string like "1600x1067"
    const match = resolution.match(/(\d+)x(\d+)/);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      const pixels = width * height;
      
      // Calculate score based on total pixels
      if (pixels >= 15000000) return 100; // 4K+ (4800x3200+)
      if (pixels >= 8000000) return 90;   // 4K (3840x2560)
      if (pixels >= 6000000) return 85;  // High (3200x2133)
      if (pixels >= 2000000) return 80;  // Medium-High (2048x1365)
      if (pixels >= 1500000) return 75;  // Full HD (1920x1280)
      if (pixels >= 1000000) return 70;  // Minimum (1600x1067)
      if (pixels >= 500000) return 60;   // Below minimum
      if (pixels >= 200000) return 50;   // Low
      return 30; // Very low
    }
    
    return 50; // Default score for unknown resolutions
  }

  /**
   * Analyze and reorder photos for a hotel
   */
  async analyzeAndReorderPhotos(hotel) {
    const photos = hotel.photos || [];
    if (photos.length <= 1) {
      return { reordered: false, reason: 'Only one photo or no photos' };
    }
    
    console.log(`   📸 Analyzing ${photos.length} photos...`);
    
    // Analyze each photo
    const photoAnalysis = [];
    for (let i = 0; i < photos.length; i++) {
      const photoUrl = photos[i];
      console.log(`      [${i + 1}/${photos.length}] Checking resolution...`);
      
      const resolution = await this.getPhotoResolution(photoUrl);
      const score = this.getResolutionScore(resolution);
      
      photoAnalysis.push({
        url: photoUrl,
        resolution: resolution,
        score: score,
        originalIndex: i
      });
      
      // Small delay to avoid overwhelming the server
      await this.sleep(100);
    }
    
    // Sort by resolution score (highest first)
    const sortedPhotos = photoAnalysis.sort((a, b) => b.score - a.score);
    
    // Check if reordering is needed
    const needsReordering = sortedPhotos.some((photo, index) => 
      photo.originalIndex !== index
    );
    
    if (!needsReordering) {
      return { reordered: false, reason: 'Photos already in correct order' };
    }
    
    // Create new photo order
    const newPhotoOrder = sortedPhotos.map(photo => photo.url);
    
    console.log(`   ✅ Reordered photos by resolution quality`);
    console.log(`      Best: ${sortedPhotos[0].resolution} (score: ${sortedPhotos[0].score})`);
    console.log(`      Worst: ${sortedPhotos[sortedPhotos.length - 1].resolution} (score: ${sortedPhotos[sortedPhotos.length - 1].score})`);
    
    return {
      reordered: true,
      newOrder: newPhotoOrder,
      analysis: sortedPhotos
    };
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
          hero_photo: newPhotoOrder[0], // First photo becomes hero
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
   * Process a single hotel
   */
  async processHotel(hotel) {
    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Current photos: ${hotel.photos.length}`);
    
    try {
      const result = await this.analyzeAndReorderPhotos(hotel);
      
      if (!result.reordered) {
        console.log(`   ⏭️  ${result.reason}`);
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: hotel.photos.length,
          reordered: false,
          reason: result.reason
        });
        return;
      }
      
      // Update database
      console.log(`   💾 Updating database...`);
      const updateResult = await this.updateHotelPhotos(hotel.id, result.newOrder);
      
      if (updateResult.success) {
        console.log(`   ✅ SUCCESS! Photos reordered by resolution quality`);
        this.stats.hotelsWithReorderedPhotos++;
        this.stats.photosReordered += hotel.photos.length;
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: hotel.photos.length,
          reordered: true,
          bestResolution: result.analysis[0].resolution,
          worstResolution: result.analysis[result.analysis.length - 1].resolution,
          analysis: result.analysis
        });
      } else {
        console.log(`   ❌ Failed to update: ${updateResult.error}`);
        this.stats.errors.push({
          hotelId: hotel.id,
          name: hotel.name,
          error: updateResult.error
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.stats.errors.push({
        hotelId: hotel.id,
        name: hotel.name,
        error: error.message
      });
    }
    
    this.stats.totalHotelsProcessed++;
    this.stats.totalPhotosAnalyzed += hotel.photos.length;
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
    const reportPath = `/Users/ala/tindertravel/api/photo-resolution-report-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/PHOTO_RESOLUTION_REPORT.md`;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalHotelsProcessed: this.stats.totalHotelsProcessed,
        hotelsWithReorderedPhotos: this.stats.hotelsWithReorderedPhotos,
        totalPhotosAnalyzed: this.stats.totalPhotosAnalyzed,
        photosReordered: this.stats.photosReordered,
        errorCount: this.stats.errors.length
      },
      results: this.stats.detailedResults,
      errors: this.stats.errors
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 📸 Photo Resolution Prioritization Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Processed | ${this.stats.totalHotelsProcessed} |\n`;
    markdown += `| Hotels with Reordered Photos | ${this.stats.hotelsWithReorderedPhotos} |\n`;
    markdown += `| Total Photos Analyzed | ${this.stats.totalPhotosAnalyzed} |\n`;
    markdown += `| Photos Reordered | ${this.stats.photosReordered} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    // Hotels with reordered photos
    const reorderedHotels = this.stats.detailedResults.filter(r => r.reordered);
    if (reorderedHotels.length > 0) {
      markdown += `## ✅ Hotels with Reordered Photos (${reorderedHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Photos | Best Resolution | Worst Resolution |\n`;
      markdown += `|------------|----------|--------|-----------------|------------------|\n`;
      reorderedHotels.forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.photoCount} | ${h.bestResolution} | ${h.worstResolution} |\n`;
      });
      markdown += `\n`;
    }
    
    // Hotels that didn't need reordering
    const notReorderedHotels = this.stats.detailedResults.filter(r => !r.reordered);
    if (notReorderedHotels.length > 0) {
      markdown += `## ⏭️ Hotels Already Optimized (${notReorderedHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Photos | Reason |\n`;
      markdown += `|------------|----------|--------|--------|\n`;
      notReorderedHotels.slice(0, 20).forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.photoCount} | ${h.reason} |\n`;
      });
      if (notReorderedHotels.length > 20) {
        markdown += `\n*...and ${notReorderedHotels.length - 20} more*\n`;
      }
      markdown += `\n`;
    }
    
    markdown += `## 📝 Notes\n\n`;
    markdown += `- Photos are now ordered by resolution quality (highest first)\n`;
    markdown += `- First photo becomes the hero photo\n`;
    markdown += `- Resolution scoring: 4800x3200 (100) → 1600x1067 (70) → 800x600 (30)\n`;
    markdown += `- Users will now see the best quality photos first\n\n`;
    
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
    console.log('📸 Photo Resolution Prioritizer - Order by Quality');
    console.log('='.repeat(80));
    console.log(`\n⚙️  Configuration:`);
    console.log(`   Priority: Highest resolution first`);
    console.log(`   Scoring: 4800x3200 (100) → 1600x1067 (70) → 800x600 (30)`);
    console.log(`   Hero photo: First photo (best quality)`);
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
        
        // Delay between hotels to avoid overwhelming servers
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
      console.log('🎉 PROCESS COMPLETE!');
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Hotels Processed: ${this.stats.totalHotelsProcessed}`);
      console.log(`   Hotels with Reordered Photos: ${this.stats.hotelsWithReorderedPhotos}`);
      console.log(`   Total Photos Analyzed: ${this.stats.totalPhotosAnalyzed}`);
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
const prioritizer = new PhotoResolutionPrioritizer();
prioritizer.run().catch(console.error);
