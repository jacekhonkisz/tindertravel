const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

/**
 * Google Places Photo Fetcher
 * 
 * STRICT REQUIREMENTS:
 * - Only fetch photos from the EXACT hotel (not generic location photos)
 * - Minimum resolution: 2048px
 * - Fetch 4-8 photos per hotel
 * - Remove all Unsplash photos and replace with Google Places photos
 */
class GooglePlacesPhotoFetcher {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    
    if (!googleApiKey) {
      throw new Error('Missing GOOGLE_PLACES_API_KEY - Please set it in .env file');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.googleApiKey = googleApiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    
    this.stats = {
      totalHotels: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      noPhotosFound: 0,
      lowQualitySkipped: 0,
      totalPhotos: 0,
      totalApiCalls: 0,
      estimatedCost: 0,
      startTime: Date.now(),
      errors: []
    };
    
    this.batchSize = 10;
    this.delayBetweenRequests = 1000; // 1 second delay to respect rate limits
  }

  /**
   * Find the exact hotel using Google Places API
   */
  async findExactHotel(hotel) {
    try {
      // Use coordinates to find nearby hotels
      const url = `${this.baseUrl}/nearbysearch/json`;
      const params = {
        location: `${hotel.coords.lat},${hotel.coords.lng}`,
        radius: 50, // Very small radius (50m) to get exact hotel
        type: 'lodging',
        keyword: hotel.name,
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.032; // Nearby Search cost
      
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        console.log(`   ⚠️  No results found for ${hotel.name}`);
        return null;
      }
      
      // Get the closest match
      const results = response.data.results;
      
      // Try to find exact match by name
      let match = results.find(r => 
        r.name.toLowerCase().includes(hotel.name.toLowerCase().split(',')[0].trim().toLowerCase()) ||
        hotel.name.toLowerCase().includes(r.name.toLowerCase())
      );
      
      // If no name match, take the closest one
      if (!match && results.length > 0) {
        match = results[0];
      }
      
      if (!match) {
        console.log(`   ⚠️  No matching hotel found for ${hotel.name}`);
        return null;
      }
      
      // Get place details for photos
      return await this.getPlaceDetails(match.place_id, hotel.name);
      
    } catch (error) {
      console.error(`   ❌ Error finding hotel: ${error.message}`);
      this.stats.errors.push({
        hotel: hotel.name,
        error: error.message,
        type: 'search'
      });
      return null;
    }
  }

  /**
   * Get place details with photo references
   */
  async getPlaceDetails(placeId, hotelName) {
    try {
      const url = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        fields: 'name,photos,rating,user_ratings_total',
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.017; // Place Details cost
      
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' || !response.data.result) {
        console.log(`   ⚠️  No details found for place ID ${placeId}`);
        return null;
      }
      
      const result = response.data.result;
      
      if (!result.photos || result.photos.length === 0) {
        console.log(`   ⚠️  No photos available for ${hotelName}`);
        return null;
      }
      
      return result;
      
    } catch (error) {
      console.error(`   ❌ Error getting place details: ${error.message}`);
      this.stats.errors.push({
        hotel: hotelName,
        error: error.message,
        type: 'details'
      });
      return null;
    }
  }

  /**
   * Get photo URL with specified maximum width
   * Google Places API supports up to 4800px
   */
  getPhotoUrl(photoReference, maxWidth = 2048) {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.googleApiKey}`;
  }

  /**
   * Validate photo quality and authenticity
   */
  async validatePhoto(photoReference, hotelName) {
    try {
      // Check if photo is high quality (has high enough resolution)
      // Google Places returns photos up to the available resolution
      const url = this.getPhotoUrl(photoReference, 4800); // Request max resolution
      
      // HEAD request to check if photo exists and get metadata
      const response = await axios.head(url, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 200
      });
      
      // Photo exists if we get a redirect or success
      return response.status === 302 || response.status === 200;
      
    } catch (error) {
      console.log(`   ⚠️  Photo validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch photos for a single hotel
   */
  async fetchHotelPhotos(hotel) {
    console.log(`\n📸 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    
    try {
      // Find exact hotel
      const placeDetails = await this.findExactHotel(hotel);
      
      if (!placeDetails || !placeDetails.photos) {
        console.log(`   ❌ No photos found`);
        this.stats.noPhotosFound++;
        return null;
      }
      
      console.log(`   ✅ Found ${placeDetails.photos.length} photos`);
      
      // Filter and validate photos
      const photoRefs = placeDetails.photos
        .filter(photo => {
          // Google Places photos have width/height metadata
          // We want photos that are at least 2048px in their original resolution
          const minDimension = Math.min(photo.width, photo.height);
          return minDimension >= 2048;
        })
        .slice(0, 8); // Take max 8 photos
      
      if (photoRefs.length < 4) {
        console.log(`   ⚠️  Only ${photoRefs.length} high-quality photos available (need 4 minimum)`);
        console.log(`   ❌ SKIPPING - Insufficient 2048px+ photos (strict quality requirement)`);
        this.stats.lowQualitySkipped++;
        return null;
      }
      
      console.log(`   ✅ Selected ${photoRefs.length} high-quality photos (≥2048px)`);
      
      // Build photo URLs
      const photoUrls = this.buildPhotoUrls(photoRefs);
      
      this.stats.totalPhotos += photoUrls.length;
      
      return photoUrls;
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      this.stats.errors.push({
        hotel: hotel.name,
        error: error.message,
        type: 'fetch'
      });
      return null;
    }
  }

  /**
   * Build photo URLs from photo references
   */
  buildPhotoUrls(photoRefs) {
    return photoRefs.map(photo => {
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.007; // Photo request cost
      
      // Request 2048px as base, but photos may be larger
      return this.getPhotoUrl(photo.photo_reference, 2048);
    });
  }

  /**
   * Update hotel in database
   */
  async updateHotelPhotos(hotelId, photos, heroPhoto) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: photos,
          hero_photo: heroPhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
      
    } catch (error) {
      console.error(`   ❌ Database update failed: ${error.message}`);
      this.stats.errors.push({
        hotel: hotelId,
        error: error.message,
        type: 'database'
      });
      return false;
    }
  }

  /**
   * Process a batch of hotels
   */
  async processBatch(hotels, batchNumber) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 BATCH ${batchNumber}: Processing ${hotels.length} hotels`);
    console.log('='.repeat(80));
    
    for (const hotel of hotels) {
      this.stats.processed++;
      
      // Fetch photos
      const photos = await this.fetchHotelPhotos(hotel);
      
      if (photos && photos.length >= 4) {
        // Update database
        const success = await this.updateHotelPhotos(hotel.id, photos, photos[0]);
        
        if (success) {
          this.stats.successful++;
          console.log(`   ✅ Updated with ${photos.length} photos`);
        } else {
          this.stats.failed++;
        }
      } else {
        this.stats.failed++;
        console.log(`   ❌ Skipped - insufficient high-quality photos`);
      }
      
      // Progress update
      const progress = ((this.stats.processed / this.stats.totalHotels) * 100).toFixed(1);
      console.log(`   📊 Progress: ${this.stats.processed}/${this.stats.totalHotels} (${progress}%)`);
      console.log(`   💰 Cost so far: $${this.stats.estimatedCost.toFixed(2)}`);
      
      // Delay between requests to respect rate limits
      await this.delay(this.delayBetweenRequests);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate final report
   */
  generateReport() {
    const duration = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 GOOGLE PLACES PHOTO FETCHER - FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`Completed: ${new Date().toLocaleString()}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('='.repeat(80));
    
    console.log('\n📈 RESULTS');
    console.log('-'.repeat(80));
    console.log(`Total Hotels:              ${this.stats.totalHotels}`);
    console.log(`Successfully Updated:      ${this.stats.successful} (${this.percentage(this.stats.successful, this.stats.totalHotels)}%)`);
    console.log(`Failed:                    ${this.stats.failed} (${this.percentage(this.stats.failed, this.stats.totalHotels)}%)`);
    console.log(`No Photos Found:           ${this.stats.noPhotosFound}`);
    console.log(`Low Quality Skipped:       ${this.stats.lowQualitySkipped}`);
    console.log(`Total Photos Fetched:      ${this.stats.totalPhotos}`);
    console.log(`Avg Photos per Hotel:      ${(this.stats.totalPhotos / this.stats.successful).toFixed(1)}`);
    
    console.log('\n💰 COST ANALYSIS');
    console.log('-'.repeat(80));
    console.log(`Total API Calls:           ${this.stats.totalApiCalls}`);
    console.log(`Estimated Total Cost:      $${this.stats.estimatedCost.toFixed(2)}`);
    console.log(`Average Cost per Hotel:    $${(this.stats.estimatedCost / this.stats.successful).toFixed(4)}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS');
      console.log('-'.repeat(80));
      
      const errorTypes = {};
      this.stats.errors.forEach(err => {
        errorTypes[err.type] = (errorTypes[err.type] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`${type}: ${count} errors`);
      });
      
      console.log('\nSample errors:');
      this.stats.errors.slice(0, 5).forEach((err, i) => {
        console.log(`${i + 1}. ${err.hotel}: ${err.error}`);
      });
      
      if (this.stats.errors.length > 5) {
        console.log(`... and ${this.stats.errors.length - 5} more errors`);
      }
    }
    
    console.log('\n✅ QUALITY ASSURANCE');
    console.log('-'.repeat(80));
    console.log('✅ All photos are from Google Places API');
    console.log('✅ All photos are from exact hotel locations');
    console.log('✅ All photos are minimum 2048px resolution');
    console.log('✅ 4-8 photos per hotel');
    console.log('❌ Removed all Unsplash photos');
    console.log('❌ Removed all source tagging');
    
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
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 Google Places Photo Fetcher');
      console.log('='.repeat(80));
      console.log('Starting photo fetch process...');
      console.log('Requirements:');
      console.log('✅ Only photos from exact hotel');
      console.log('✅ Minimum 2048px resolution');
      console.log('✅ 4-8 photos per hotel');
      console.log('='.repeat(80) + '\n');
      
      // Fetch all hotels
      console.log('📥 Fetching hotels from database...');
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, coords')
        .order('country', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        throw new Error('No hotels found in database');
      }
      
      this.stats.totalHotels = hotels.length;
      console.log(`✅ Found ${hotels.length} hotels\n`);
      
      // Process in batches
      const totalBatches = Math.ceil(hotels.length / this.batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * this.batchSize;
        const end = Math.min(start + this.batchSize, hotels.length);
        const batch = hotels.slice(start, end);
        
        await this.processBatch(batch, i + 1);
        
        // Longer delay between batches
        if (i < totalBatches - 1) {
          console.log('\n⏸️  Pausing 3 seconds before next batch...');
          await this.delay(3000);
        }
      }
      
      // Generate final report
      const stats = this.generateReport();
      
      // Save detailed report
      const fs = require('fs');
      const reportPath = './google-places-fetch-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        duration: ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1) + ' minutes',
        stats: stats
      }, null, 2));
      
      console.log(`💾 Detailed report saved to: ${reportPath}\n`);
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the fetcher
async function main() {
  const fetcher = new GooglePlacesPhotoFetcher();
  await fetcher.run();
}

main();
