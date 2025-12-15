require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * Google Places Photo Fetcher - Optimized for High Quality
 * 
 * Requirements:
 * - Max 6 photos per hotel
 * - Min resolution: 1600x1067 (width x height)
 * - Prioritize highest resolution photos
 * - Only for hotels with < 4 photos
 */

class GooglePlacesPhotoFetcherOptimized {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    if (!this.googleApiKey) {
      throw new Error('Missing GOOGLE_PLACES_API_KEY in .env file');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    
    // Configuration
    this.MAX_PHOTOS_PER_HOTEL = 6;
    this.MIN_WIDTH = 1600;
    this.MIN_HEIGHT = 1067;
    this.PRIORITY_RESOLUTIONS = [
      { width: 4800, height: 3200 }, // Ultra high
      { width: 4096, height: 2731 }, // 4K landscape
      { width: 3840, height: 2560 }, // 4K
      { width: 3200, height: 2133 }, // High
      { width: 2048, height: 1365 }, // Medium-high
      { width: 1920, height: 1280 }, // Full HD
      { width: 1600, height: 1067 }  // Minimum acceptable
    ];
    
    this.stats = {
      totalHotelsProcessed: 0,
      hotelsWithNewPhotos: 0,
      hotelsNotFound: 0,
      hotelsNoPhotos: 0,
      totalPhotosAdded: 0,
      totalApiCalls: 0,
      estimatedCost: 0,
      detailedResults: [],
      errors: []
    };
  }

  /**
   * Get all hotels with fewer than 4 photos
   */
  async getHotelsNeedingPhotos() {
    console.log('\n📊 Querying database for hotels with < 4 photos...\n');
    
    const { data, error } = await this.supabase
      .from('hotels')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    // Filter hotels with < 4 photos
    const hotelsNeedingPhotos = data.filter(hotel => {
      const photoCount = hotel.photos ? hotel.photos.length : 0;
      return photoCount < 4;
    });
    
    console.log(`✅ Found ${hotelsNeedingPhotos.length} hotels needing photos`);
    
    // Show distribution
    const with0 = hotelsNeedingPhotos.filter(h => !h.photos || h.photos.length === 0).length;
    const with1 = hotelsNeedingPhotos.filter(h => h.photos && h.photos.length === 1).length;
    const with2 = hotelsNeedingPhotos.filter(h => h.photos && h.photos.length === 2).length;
    const with3 = hotelsNeedingPhotos.filter(h => h.photos && h.photos.length === 3).length;
    
    console.log(`\n📈 Distribution:`);
    console.log(`   0 photos: ${with0} hotels (CRITICAL)`);
    console.log(`   1 photo:  ${with1} hotels (HIGH)`);
    console.log(`   2 photos: ${with2} hotels (MEDIUM)`);
    console.log(`   3 photos: ${with3} hotels (LOW)`);
    console.log(`\n`);
    
    return hotelsNeedingPhotos;
  }

  /**
   * Find exact hotel place in Google Places
   */
  async findHotelPlace(hotel) {
    try {
      // Use text search with hotel name and location
      const query = `${hotel.name} ${hotel.city} ${hotel.country}`;
      const url = `${this.baseUrl}/textsearch/json`;
      
      const params = {
        query: query,
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.032; // Text Search cost
      
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        return null;
      }
      
      // Find best match
      const results = response.data.results;
      let bestMatch = null;
      let bestScore = 0;
      
      for (const result of results) {
        let score = 0;
        const resultName = result.name.toLowerCase();
        const hotelName = hotel.name.toLowerCase();
        
        // Exact match
        if (resultName === hotelName) {
          score = 100;
        }
        // Contains match
        else if (resultName.includes(hotelName) || hotelName.includes(resultName)) {
          score = 80;
        }
        // Word match
        else {
          const hotelWords = hotelName.split(/\s+/);
          const resultWords = resultName.split(/\s+/);
          const matchedWords = hotelWords.filter(word => resultWords.some(rw => rw.includes(word)));
          score = (matchedWords.length / hotelWords.length) * 60;
        }
        
        // Boost score if location matches
        if (result.formatted_address && 
            (result.formatted_address.toLowerCase().includes(hotel.city.toLowerCase()) ||
             result.formatted_address.toLowerCase().includes(hotel.country.toLowerCase()))) {
          score += 20;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = result;
        }
      }
      
      // Only accept matches with score > 50
      if (bestScore > 50) {
        return bestMatch;
      }
      
      return null;
      
    } catch (error) {
      console.error(`   ❌ Error searching: ${error.message}`);
      this.stats.errors.push({
        hotel: hotel.name,
        error: error.message,
        type: 'search'
      });
      return null;
    }
  }

  /**
   * Get place details with photos
   */
  async getPlacePhotos(placeId) {
    try {
      const url = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        fields: 'photos',
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.017; // Place Details cost
      
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' || !response.data.result || !response.data.result.photos) {
        return [];
      }
      
      return response.data.result.photos;
      
    } catch (error) {
      console.error(`   ❌ Error getting photos: ${error.message}`);
      return [];
    }
  }

  /**
   * Get best resolution for a photo
   * Try multiple resolutions starting from highest
   */
  async getBestPhotoUrl(photoReference) {
    for (const resolution of this.PRIORITY_RESOLUTIONS) {
      const url = `${this.baseUrl}/photo`;
      const params = {
        photoreference: photoReference,
        maxwidth: resolution.width,
        key: this.googleApiKey
      };
      
      try {
        // Make HEAD request to check if photo exists at this resolution
        const response = await axios.head(url, { 
          params,
          maxRedirects: 0,
          validateStatus: (status) => status === 302 || status === 200
        });
        
        // If we get a redirect, the photo exists at this resolution
        if (response.status === 302 && response.headers.location) {
          this.stats.totalApiCalls++;
          this.stats.estimatedCost += 0.007; // Photo request cost
          return {
            url: response.headers.location,
            width: resolution.width,
            height: resolution.height
          };
        }
      } catch (error) {
        // Try next resolution
        continue;
      }
    }
    
    // Fallback to default maxwidth
    const url = `${this.baseUrl}/photo`;
    const params = {
      photoreference: photoReference,
      maxwidth: this.MIN_WIDTH,
      key: this.googleApiKey
    };
    
    try {
      const response = await axios.get(url, { 
        params,
        maxRedirects: 5
      });
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.007;
      
      return {
        url: response.request.res.responseUrl || response.config.url,
        width: this.MIN_WIDTH,
        height: this.MIN_HEIGHT
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify photo resolution meets minimum requirements
   */
  async verifyPhotoResolution(photoUrl) {
    try {
      const response = await axios.head(photoUrl);
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      // Rough estimation: if file is too small, it's probably low resolution
      // Minimum ~500KB for 1600x1067 image
      if (contentLength < 500000) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process a single hotel
   */
  async processHotel(hotel) {
    const currentPhotoCount = hotel.photos ? hotel.photos.length : 0;
    const photosNeeded = Math.max(0, 4 - currentPhotoCount);
    
    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Current photos: ${currentPhotoCount}`);
    console.log(`   Photos needed: ${photosNeeded}`);
    
    try {
      // Find hotel in Google Places
      console.log(`   🔍 Searching Google Places...`);
      const place = await this.findHotelPlace(hotel);
      
      if (!place) {
        console.log(`   ❌ Hotel not found in Google Places`);
        this.stats.hotelsNotFound++;
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          currentPhotos: currentPhotoCount,
          result: 'not_found',
          photosAdded: 0
        });
        return;
      }
      
      console.log(`   ✅ Found: ${place.name}`);
      
      // Get photos
      console.log(`   📸 Fetching photos...`);
      const photoReferences = await this.getPlacePhotos(place.place_id);
      
      if (!photoReferences || photoReferences.length === 0) {
        console.log(`   ⚠️  No photos available`);
        this.stats.hotelsNoPhotos++;
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          currentPhotos: currentPhotoCount,
          result: 'no_photos',
          photosAdded: 0
        });
        return;
      }
      
      console.log(`   ✅ Found ${photoReferences.length} photo references`);
      console.log(`   🎯 Fetching best resolutions (prioritizing 4K → HD → minimum 1600x1067)...`);
      
      // Get high-resolution photo URLs
      const newPhotos = [];
      const maxPhotosToFetch = Math.min(photoReferences.length, this.MAX_PHOTOS_PER_HOTEL);
      
      for (let i = 0; i < maxPhotosToFetch && newPhotos.length < this.MAX_PHOTOS_PER_HOTEL; i++) {
        const photoRef = photoReferences[i];
        console.log(`      [${i + 1}/${maxPhotosToFetch}] Checking resolution...`);
        
        const photoData = await this.getBestPhotoUrl(photoRef.photo_reference);
        
        if (photoData && photoData.url) {
          const meetsMinimum = await this.verifyPhotoResolution(photoData.url);
          
          if (meetsMinimum) {
            newPhotos.push(photoData.url);
            console.log(`      ✅ ${photoData.width}x${photoData.height} (KEEP)`);
          } else {
            console.log(`      ❌ Below minimum quality (SKIP)`);
          }
        }
        
        // Small delay to avoid rate limits
        await this.sleep(200);
      }
      
      if (newPhotos.length === 0) {
        console.log(`   ⚠️  No photos met minimum quality requirements`);
        this.stats.hotelsNoPhotos++;
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          currentPhotos: currentPhotoCount,
          result: 'low_quality',
          photosAdded: 0
        });
        return;
      }
      
      // Combine with existing photos
      const existingPhotos = hotel.photos || [];
      const combinedPhotos = [...existingPhotos, ...newPhotos];
      
      // Limit to 6 total
      const finalPhotos = combinedPhotos.slice(0, this.MAX_PHOTOS_PER_HOTEL);
      
      // Update database
      console.log(`   💾 Updating database...`);
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: finalPhotos,
          hero_photo: finalPhotos[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', hotel.id);
      
      if (error) throw error;
      
      console.log(`   ✅ SUCCESS! Added ${newPhotos.length} photos (${currentPhotoCount} → ${finalPhotos.length})`);
      
      this.stats.hotelsWithNewPhotos++;
      this.stats.totalPhotosAdded += newPhotos.length;
      this.stats.detailedResults.push({
        hotelId: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        currentPhotos: currentPhotoCount,
        photosAdded: newPhotos.length,
        newTotal: finalPhotos.length,
        result: 'success'
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.stats.errors.push({
        hotel: hotel.name,
        error: error.message
      });
      this.stats.detailedResults.push({
        hotelId: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        currentPhotos: currentPhotoCount,
        result: 'error',
        error: error.message
      });
    }
    
    this.stats.totalHotelsProcessed++;
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
    const reportPath = `/Users/ala/tindertravel/api/google-places-report-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/GOOGLE_PLACES_PHOTO_REPORT.md`;
    
    const report = {
      timestamp: new Date().toISOString(),
      configuration: {
        maxPhotosPerHotel: this.MAX_PHOTOS_PER_HOTEL,
        minWidth: this.MIN_WIDTH,
        minHeight: this.MIN_HEIGHT,
        priorityResolutions: this.PRIORITY_RESOLUTIONS
      },
      summary: {
        totalHotelsProcessed: this.stats.totalHotelsProcessed,
        hotelsWithNewPhotos: this.stats.hotelsWithNewPhotos,
        totalPhotosAdded: this.stats.totalPhotosAdded,
        hotelsNotFound: this.stats.hotelsNotFound,
        hotelsNoPhotos: this.stats.hotelsNoPhotos,
        totalApiCalls: this.stats.totalApiCalls,
        estimatedCost: `$${this.stats.estimatedCost.toFixed(2)}`,
        errorCount: this.stats.errors.length
      },
      results: this.stats.detailedResults,
      errors: this.stats.errors
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 📸 Google Places Photo Fetcher Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## ⚙️ Configuration\n\n`;
    markdown += `- **Max Photos per Hotel:** ${this.MAX_PHOTOS_PER_HOTEL}\n`;
    markdown += `- **Min Resolution:** ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px\n`;
    markdown += `- **Priority:** Highest resolution first (4K → Full HD → Minimum)\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Processed | ${this.stats.totalHotelsProcessed} |\n`;
    markdown += `| Hotels with New Photos | ${this.stats.hotelsWithNewPhotos} |\n`;
    markdown += `| Total Photos Added | ${this.stats.totalPhotosAdded} |\n`;
    markdown += `| Hotels Not Found | ${this.stats.hotelsNotFound} |\n`;
    markdown += `| Hotels with No Photos | ${this.stats.hotelsNoPhotos} |\n`;
    markdown += `| Total API Calls | ${this.stats.totalApiCalls} |\n`;
    markdown += `| Estimated Cost | $${this.stats.estimatedCost.toFixed(2)} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    // Success stories
    const successHotels = this.stats.detailedResults.filter(r => r.result === 'success');
    if (successHotels.length > 0) {
      markdown += `## ✅ Hotels with New Photos (${successHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Before | Added | After |\n`;
      markdown += `|------------|----------|--------|-------|-------|\n`;
      successHotels.forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.currentPhotos} | +${h.photosAdded} | ${h.newTotal} |\n`;
      });
      markdown += `\n`;
    }
    
    // Hotels not found
    const notFound = this.stats.detailedResults.filter(r => r.result === 'not_found');
    if (notFound.length > 0) {
      markdown += `## ❌ Hotels Not Found (${notFound.length})\n\n`;
      markdown += `| Hotel Name | Location | Current Photos |\n`;
      markdown += `|------------|----------|---------------|\n`;
      notFound.slice(0, 30).forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.currentPhotos} |\n`;
      });
      if (notFound.length > 30) {
        markdown += `\n*...and ${notFound.length - 30} more*\n`;
      }
      markdown += `\n`;
    }
    
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
    console.log('📸 Google Places Photo Fetcher - Optimized for Quality');
    console.log('='.repeat(80));
    console.log(`\n⚙️  Configuration:`);
    console.log(`   Max photos per hotel: ${this.MAX_PHOTOS_PER_HOTEL}`);
    console.log(`   Min resolution: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px`);
    console.log(`   Priority: Highest resolution first (4K → Full HD → Minimum)`);
    console.log('\n' + '='.repeat(80) + '\n');
    
    try {
      // Get hotels needing photos
      const hotels = await this.getHotelsNeedingPhotos();
      
      if (hotels.length === 0) {
        console.log('\n✅ All hotels have 4+ photos!\n');
        return;
      }
      
      console.log(`🔄 Processing ${hotels.length} hotels...\n`);
      
      // Process each hotel
      for (let i = 0; i < hotels.length; i++) {
        console.log(`\n[${ i + 1}/${hotels.length}]`);
        await this.processHotel(hotels[i]);
        
        // Delay between hotels to respect rate limits
        if (i < hotels.length - 1) {
          await this.sleep(1000);
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
      console.log(`   Hotels with New Photos: ${this.stats.hotelsWithNewPhotos}`);
      console.log(`   Total Photos Added: ${this.stats.totalPhotosAdded}`);
      console.log(`   Hotels Not Found: ${this.stats.hotelsNotFound}`);
      console.log(`   Total API Calls: ${this.stats.totalApiCalls}`);
      console.log(`   Estimated Cost: $${this.stats.estimatedCost.toFixed(2)}`);
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
const fetcher = new GooglePlacesPhotoFetcherOptimized();
fetcher.run().catch(console.error);


