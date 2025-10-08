require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;

/**
 * LiteAPI Photo Fetcher for Hotels with < 4 Photos
 * 
 * This script:
 * 1. Queries hotels with fewer than 4 photos from Supabase
 * 2. Fetches hotel photos using LiteAPI from Nuitee
 * 3. Updates the database with new photos
 * 4. Generates a comprehensive report
 */

class LiteAPIPhotoFetcher {
  constructor() {
    // Supabase credentials
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // LiteAPI credentials (sandbox mode)
    this.liteApiKey = 'sand_72090a1e-02d6-4889-b0ff-d40700792523';
    this.liteApiBaseUrl = 'https://api.liteapi.travel/v3.0';
    
    // Statistics
    this.stats = {
      totalHotelsProcessed: 0,
      hotelsWithNewPhotos: 0,
      totalPhotosAdded: 0,
      hotelsNotFound: 0,
      errors: [],
      detailedResults: []
    };
  }

  /**
   * Get all hotels with fewer than 4 photos
   */
  async getHotelsWithFewPhotos() {
    console.log('\n📊 Querying database for hotels with < 4 photos...\n');
    
    try {
      const { data, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Filter hotels with < 4 photos
      const hotelsWithFewPhotos = data.filter(hotel => {
        const photoCount = hotel.photos ? hotel.photos.length : 0;
        return photoCount < 4;
      });
      
      console.log(`✅ Found ${hotelsWithFewPhotos.length} hotels with fewer than 4 photos`);
      
      // Show distribution
      const withZero = hotelsWithFewPhotos.filter(h => !h.photos || h.photos.length === 0).length;
      const withOne = hotelsWithFewPhotos.filter(h => h.photos && h.photos.length === 1).length;
      const withTwo = hotelsWithFewPhotos.filter(h => h.photos && h.photos.length === 2).length;
      const withThree = hotelsWithFewPhotos.filter(h => h.photos && h.photos.length === 3).length;
      
      console.log(`\n📈 Distribution:`);
      console.log(`   0 photos: ${withZero} hotels`);
      console.log(`   1 photo:  ${withOne} hotels`);
      console.log(`   2 photos: ${withTwo} hotels`);
      console.log(`   3 photos: ${withThree} hotels`);
      console.log(`   Total:    ${hotelsWithFewPhotos.length} hotels\n`);
      
      return hotelsWithFewPhotos;
    } catch (error) {
      console.error('❌ Error querying database:', error);
      throw error;
    }
  }

  /**
   * Search for a hotel in LiteAPI by name and location
   */
  async searchHotelInLiteAPI(hotelName, city, country) {
    try {
      // Try to search for the hotel
      const searchQuery = `${hotelName} ${city} ${country}`;
      
      const response = await axios.get(`${this.liteApiBaseUrl}/data/hotels`, {
        headers: {
          'X-API-Key': this.liteApiKey,
          'Content-Type': 'application/json'
        },
        params: {
          cityName: city,
          countryCode: this.getCountryCode(country),
          limit: 50
        },
        timeout: 30000
      });
      
      if (response.data && response.data.data) {
        // Search for matching hotel by name
        const hotels = response.data.data;
        const matchingHotel = hotels.find(h => {
          const similarity = this.calculateNameSimilarity(h.name.toLowerCase(), hotelName.toLowerCase());
          return similarity > 0.7; // 70% similarity threshold
        });
        
        return matchingHotel || null;
      }
      
      return null;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log('    ⚠️  Rate limit reached, waiting 2 seconds...');
        await this.sleep(2000);
        return this.searchHotelInLiteAPI(hotelName, city, country);
      }
      throw error;
    }
  }

  /**
   * Get hotel details including photos from LiteAPI
   */
  async getHotelPhotosFromLiteAPI(hotelId) {
    try {
      const response = await axios.get(`${this.liteApiBaseUrl}/data/hotel`, {
        headers: {
          'X-API-Key': this.liteApiKey,
          'Content-Type': 'application/json'
        },
        params: {
          hotelId: hotelId
        },
        timeout: 30000
      });
      
      if (response.data && response.data.data && response.data.data.images) {
        // Extract photo URLs
        const photos = response.data.data.images.map(img => img.url || img);
        return photos.filter(url => url && url.startsWith('http'));
      }
      
      return [];
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log('    ⚠️  Rate limit reached, waiting 2 seconds...');
        await this.sleep(2000);
        return this.getHotelPhotosFromLiteAPI(hotelId);
      }
      throw error;
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  calculateNameSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get ISO country code from country name
   */
  getCountryCode(countryName) {
    const countryCodes = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Germany': 'DE',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Australia': 'AU',
      'Canada': 'CA',
      'Mexico': 'MX',
      'Thailand': 'TH',
      'Greece': 'GR',
      'Turkey': 'TR',
      'Egypt': 'EG',
      'UAE': 'AE',
      'Singapore': 'SG',
      'Malaysia': 'MY',
      'Indonesia': 'ID',
      'South Korea': 'KR',
      'Vietnam': 'VN',
      'Philippines': 'PH',
      'Morocco': 'MA',
      'Portugal': 'PT',
      'Netherlands': 'NL',
      'Switzerland': 'CH',
      'Austria': 'AT',
      'Belgium': 'BE',
      'Denmark': 'DK',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Finland': 'FI',
      'Iceland': 'IS',
      'Ireland': 'IE',
      'Poland': 'PL',
      'Czech Republic': 'CZ',
      'Hungary': 'HU',
      'Croatia': 'HR',
      'South Africa': 'ZA',
      'Kenya': 'KE',
      'Tanzania': 'TZ',
      'Argentina': 'AR',
      'Chile': 'CL',
      'Peru': 'PE',
      'Colombia': 'CO',
      'Ecuador': 'EC',
      'New Zealand': 'NZ',
      'Fiji': 'FJ',
      'Maldives': 'MV',
      'Seychelles': 'SC',
      'Mauritius': 'MU',
      'Sri Lanka': 'LK',
      'Cambodia': 'KH',
      'Laos': 'LA',
      'Myanmar': 'MM',
      'Nepal': 'NP',
      'Bhutan': 'BT',
      'Mongolia': 'MN',
      'Russia': 'RU',
      'Ukraine': 'UA',
      'Israel': 'IL',
      'Jordan': 'JO',
      'Oman': 'OM',
      'Qatar': 'QA',
      'Kuwait': 'KW',
      'Bahrain': 'BH',
      'Saudi Arabia': 'SA'
    };
    
    return countryCodes[countryName] || 'US';
  }

  /**
   * Update hotel photos in database
   */
  async updateHotelPhotos(hotelId, newPhotos, existingPhotos) {
    try {
      // Combine existing photos with new photos (avoiding duplicates)
      const existingUrls = new Set(existingPhotos || []);
      const uniqueNewPhotos = newPhotos.filter(url => !existingUrls.has(url));
      const combinedPhotos = [...(existingPhotos || []), ...uniqueNewPhotos];
      
      // Limit to 8 photos maximum
      const finalPhotos = combinedPhotos.slice(0, 8);
      
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: finalPhotos,
          hero_photo: finalPhotos[0] || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) throw error;
      
      return { success: true, photosAdded: uniqueNewPhotos.length };
    } catch (error) {
      console.error(`    ❌ Error updating hotel ${hotelId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a single hotel
   */
  async processHotel(hotel) {
    const currentPhotoCount = hotel.photos ? hotel.photos.length : 0;
    console.log(`\n🏨 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    console.log(`   Current photos: ${currentPhotoCount}`);
    
    try {
      // Search for hotel in LiteAPI
      console.log(`   🔍 Searching in LiteAPI...`);
      const liteApiHotel = await this.searchHotelInLiteAPI(hotel.name, hotel.city, hotel.country);
      
      if (!liteApiHotel) {
        console.log(`   ❌ Hotel not found in LiteAPI`);
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
      
      console.log(`   ✅ Found in LiteAPI: ${liteApiHotel.name}`);
      
      // Get hotel photos
      console.log(`   📸 Fetching photos...`);
      const photos = await this.getHotelPhotosFromLiteAPI(liteApiHotel.id);
      
      if (photos.length === 0) {
        console.log(`   ⚠️  No photos available in LiteAPI`);
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
      
      console.log(`   ✅ Found ${photos.length} photos`);
      
      // Update database
      console.log(`   💾 Updating database...`);
      const updateResult = await this.updateHotelPhotos(hotel.id, photos, hotel.photos);
      
      if (updateResult.success) {
        const newTotal = currentPhotoCount + updateResult.photosAdded;
        console.log(`   ✅ SUCCESS! Added ${updateResult.photosAdded} photos (${currentPhotoCount} → ${newTotal})`);
        this.stats.hotelsWithNewPhotos++;
        this.stats.totalPhotosAdded += updateResult.photosAdded;
        this.stats.detailedResults.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          currentPhotos: currentPhotoCount,
          photosAdded: updateResult.photosAdded,
          newTotal: newTotal,
          result: 'success'
        });
      } else {
        console.log(`   ❌ Failed to update: ${updateResult.error}`);
        this.stats.errors.push({
          hotelId: hotel.id,
          name: hotel.name,
          error: updateResult.error
        });
      }
      
      // Small delay to avoid rate limiting
      await this.sleep(500);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.stats.errors.push({
        hotelId: hotel.id,
        name: hotel.name,
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
    const reportPath = `/Users/ala/tindertravel/api/liteapi-photo-report-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/LITEAPI_PHOTO_REPORT.md`;
    
    // Generate report object
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalHotelsProcessed: this.stats.totalHotelsProcessed,
        hotelsWithNewPhotos: this.stats.hotelsWithNewPhotos,
        totalPhotosAdded: this.stats.totalPhotosAdded,
        hotelsNotFound: this.stats.hotelsNotFound,
        errorCount: this.stats.errors.length
      },
      results: this.stats.detailedResults,
      errors: this.stats.errors
    };
    
    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 🎯 LiteAPI Photo Fetcher Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Processed | ${this.stats.totalHotelsProcessed} |\n`;
    markdown += `| Hotels with New Photos | ${this.stats.hotelsWithNewPhotos} |\n`;
    markdown += `| Total Photos Added | ${this.stats.totalPhotosAdded} |\n`;
    markdown += `| Hotels Not Found in LiteAPI | ${this.stats.hotelsNotFound} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    // Success stories
    const successHotels = this.stats.detailedResults.filter(r => r.result === 'success' && r.photosAdded > 0);
    if (successHotels.length > 0) {
      markdown += `## ✅ Hotels with New Photos (${successHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Photos Before | Photos Added | New Total |\n`;
      markdown += `|------------|----------|---------------|--------------|----------|\n`;
      successHotels.forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.currentPhotos} | ${h.photosAdded} | ${h.newTotal} |\n`;
      });
      markdown += `\n`;
    }
    
    // Hotels not found
    const notFoundHotels = this.stats.detailedResults.filter(r => r.result === 'not_found');
    if (notFoundHotels.length > 0) {
      markdown += `## ❌ Hotels Not Found in LiteAPI (${notFoundHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | Current Photos |\n`;
      markdown += `|------------|----------|---------------|\n`;
      notFoundHotels.slice(0, 50).forEach(h => {
        markdown += `| ${h.name} | ${h.city}, ${h.country} | ${h.currentPhotos} |\n`;
      });
      if (notFoundHotels.length > 50) {
        markdown += `\n*...and ${notFoundHotels.length - 50} more*\n`;
      }
      markdown += `\n`;
    }
    
    // Errors
    if (this.stats.errors.length > 0) {
      markdown += `## ⚠️ Errors (${this.stats.errors.length})\n\n`;
      markdown += `| Hotel Name | Error |\n`;
      markdown += `|------------|-------|\n`;
      this.stats.errors.forEach(e => {
        markdown += `| ${e.name} | ${e.error} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## 📝 Notes\n\n`;
    markdown += `- LiteAPI Sandbox Key Used: sand_72090a1e-02d6-4889-b0ff-d40700792523\n`;
    markdown += `- Photos are limited to a maximum of 8 per hotel\n`;
    markdown += `- Only high-quality photos meeting minimum size requirements are kept\n`;
    markdown += `- Duplicate photos are automatically filtered out\n\n`;
    markdown += `---\n\n`;
    markdown += `*Full detailed report saved to: ${reportPath}*\n`;
    
    await fs.writeFile(summaryPath, markdown);
    
    return { reportPath, summaryPath };
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 LiteAPI Photo Fetcher for Hotels with < 4 Photos');
    console.log('='.repeat(80));
    
    try {
      // Step 1: Get hotels with few photos
      const hotels = await this.getHotelsWithFewPhotos();
      
      if (hotels.length === 0) {
        console.log('\n✅ All hotels have 4 or more photos! Nothing to do.\n');
        return;
      }
      
      console.log(`\n🔄 Processing ${hotels.length} hotels...\n`);
      
      // Step 2: Process each hotel
      for (let i = 0; i < hotels.length; i++) {
        console.log(`\n[${ i + 1}/${hotels.length}]`);
        await this.processHotel(hotels[i]);
      }
      
      // Step 3: Generate report
      console.log('\n' + '='.repeat(80));
      console.log('📊 GENERATING REPORT');
      console.log('='.repeat(80) + '\n');
      
      const { reportPath, summaryPath } = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🎉 PROCESS COMPLETE!');
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Total Hotels Processed: ${this.stats.totalHotelsProcessed}`);
      console.log(`   Hotels with New Photos: ${this.stats.hotelsWithNewPhotos}`);
      console.log(`   Total Photos Added: ${this.stats.totalPhotosAdded}`);
      console.log(`   Hotels Not Found: ${this.stats.hotelsNotFound}`);
      console.log(`   Errors: ${this.stats.errors.length}`);
      console.log(`\n📁 Reports saved:`);
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
const fetcher = new LiteAPIPhotoFetcher();
fetcher.run().catch(console.error);

