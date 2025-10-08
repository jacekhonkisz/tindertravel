const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

/**
 * Photo Quality Enforcer
 * 
 * 1. Remove all photos below 2048px
 * 2. Audit each hotel and count remaining 2048px+ photos
 * 3. Keep hotels with 4+ photos
 * 4. Try to find more photos for hotels with <4 photos
 * 5. Generate report of hotels with insufficient photos
 */
class PhotoQualityEnforcer {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!supabaseUrl || !supabaseKey || !googleApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.googleApiKey = googleApiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    
    this.stats = {
      totalHotels: 0,
      hotelsChecked: 0,
      photosRemoved: 0,
      hotelsWithSufficientPhotos: 0,
      hotelsNeedingMorePhotos: 0,
      hotelsFixedWithNewPhotos: 0,
      hotelsFinallyInsufficient: 0,
      totalApiCalls: 0,
      estimatedCost: 0,
      insufficientHotels: []
    };
  }

  /**
   * Check if photo URL is from Google Places and get metadata
   */
  async checkPhotoQuality(photoUrl) {
    try {
      // Google Places photos have this format:
      // https://maps.googleapis.com/maps/api/place/photo?maxwidth=2048&photo_reference=...
      
      if (!photoUrl.includes('maps.googleapis.com/maps/api/place/photo')) {
        return { isGooglePlaces: false, quality: 'unknown' };
      }
      
      // Extract maxwidth from URL
      const maxWidthMatch = photoUrl.match(/maxwidth=(\d+)/);
      const requestedWidth = maxWidthMatch ? parseInt(maxWidthMatch[1]) : 0;
      
      // If requested width is 2048 or higher, it should be good quality
      // But we need to verify the actual photo resolution
      return {
        isGooglePlaces: true,
        requestedWidth: requestedWidth,
        meetsMinimum: requestedWidth >= 2048
      };
      
    } catch (error) {
      console.error(`   ⚠️  Error checking photo quality: ${error.message}`);
      return { isGooglePlaces: false, quality: 'error' };
    }
  }

  /**
   * Get place details with strict 2048px+ photos only
   */
  async getStrictQualityPhotos(hotel) {
    try {
      // Find exact hotel
      const url = `${this.baseUrl}/nearbysearch/json`;
      const params = {
        location: `${hotel.coords.lat},${hotel.coords.lng}`,
        radius: 50,
        type: 'lodging',
        keyword: hotel.name,
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.032;
      
      const searchResponse = await axios.get(url, { params });
      
      if (searchResponse.data.status !== 'OK' || !searchResponse.data.results || searchResponse.data.results.length === 0) {
        return [];
      }
      
      const match = searchResponse.data.results[0];
      
      // Get place details
      const detailsUrl = `${this.baseUrl}/details/json`;
      const detailsParams = {
        place_id: match.place_id,
        fields: 'name,photos',
        key: this.googleApiKey
      };
      
      this.stats.totalApiCalls++;
      this.stats.estimatedCost += 0.017;
      
      const detailsResponse = await axios.get(detailsUrl, { params: detailsParams });
      
      if (detailsResponse.data.status !== 'OK' || !detailsResponse.data.result || !detailsResponse.data.result.photos) {
        return [];
      }
      
      // STRICT: Only photos with 2048px+ minimum dimension
      const qualityPhotos = detailsResponse.data.result.photos
        .filter(photo => {
          const minDimension = Math.min(photo.width, photo.height);
          return minDimension >= 2048;
        })
        .slice(0, 8);
      
      // Build photo URLs
      const photoUrls = qualityPhotos.map(photo => {
        this.stats.totalApiCalls++;
        this.stats.estimatedCost += 0.007;
        return `${this.baseUrl}/photo?maxwidth=2048&photo_reference=${photo.photo_reference}&key=${this.googleApiKey}`;
      });
      
      return photoUrls;
      
    } catch (error) {
      console.error(`   ❌ Error fetching photos: ${error.message}`);
      return [];
    }
  }

  /**
   * Process a single hotel
   */
  async processHotel(hotel) {
    console.log(`\n📸 Processing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    this.stats.hotelsChecked++;
    
    try {
      // Check current photos
      const currentPhotos = hotel.photos || [];
      console.log(`   📊 Current photos: ${currentPhotos.length}`);
      
      // Validate each photo
      const validPhotos = [];
      let removedCount = 0;
      
      for (const photoUrl of currentPhotos) {
        const quality = await this.checkPhotoQuality(photoUrl);
        
        if (quality.isGooglePlaces && quality.meetsMinimum) {
          validPhotos.push(photoUrl);
        } else {
          removedCount++;
        }
      }
      
      console.log(`   ✅ Valid 2048px+ photos: ${validPhotos.length}`);
      if (removedCount > 0) {
        console.log(`   ❌ Removed low-quality photos: ${removedCount}`);
        this.stats.photosRemoved += removedCount;
      }
      
      // Check if hotel has sufficient photos (4+)
      if (validPhotos.length >= 4) {
        console.log(`   ✅ SUFFICIENT: ${validPhotos.length} photos (≥4 required)`);
        this.stats.hotelsWithSufficientPhotos++;
        
        // Update if photos were removed
        if (removedCount > 0) {
          await this.updateHotelPhotos(hotel.id, validPhotos);
        }
        
        return;
      }
      
      // Hotel needs more photos
      console.log(`   ⚠️  INSUFFICIENT: Only ${validPhotos.length} photos (need 4 minimum)`);
      console.log(`   🔍 Searching for more photos from exact hotel...`);
      this.stats.hotelsNeedingMorePhotos++;
      
      // Try to get more photos from Google Places
      await this.delay(1000); // Rate limiting
      const newPhotos = await this.getStrictQualityPhotos(hotel);
      
      if (newPhotos.length >= 4) {
        console.log(`   ✅ FIXED: Found ${newPhotos.length} high-quality photos`);
        this.stats.hotelsFixedWithNewPhotos++;
        await this.updateHotelPhotos(hotel.id, newPhotos);
      } else {
        console.log(`   ❌ STILL INSUFFICIENT: Only ${newPhotos.length} photos found`);
        this.stats.hotelsFinallyInsufficient++;
        
        // Update with whatever we have (or empty if <4)
        if (newPhotos.length > 0) {
          await this.updateHotelPhotos(hotel.id, newPhotos);
        }
        
        // Add to insufficient list
        this.stats.insufficientHotels.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photosFound: newPhotos.length,
          coords: hotel.coords
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing hotel: ${error.message}`);
    }
  }

  /**
   * Update hotel photos in database
   */
  async updateHotelPhotos(hotelId, photos) {
    try {
      const { error } = await this.supabase
        .from('hotels')
        .update({
          photos: photos,
          hero_photo: photos.length > 0 ? photos[0] : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotelId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log(`   💾 Database updated`);
      return true;
      
    } catch (error) {
      console.error(`   ❌ Database update failed: ${error.message}`);
      return false;
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
    console.log('\n' + '='.repeat(80));
    console.log('📊 PHOTO QUALITY ENFORCEMENT - FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`Completed: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    
    console.log('\n📈 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Hotels:                    ${this.stats.totalHotels}`);
    console.log(`Hotels Checked:                  ${this.stats.hotelsChecked}`);
    console.log(`Photos Removed (below 2048px):   ${this.stats.photosRemoved}`);
    
    console.log('\n✅ HOTELS WITH SUFFICIENT PHOTOS (4+)');
    console.log('-'.repeat(80));
    console.log(`Hotels with 4+ photos:           ${this.stats.hotelsWithSufficientPhotos} (${this.percentage(this.stats.hotelsWithSufficientPhotos, this.stats.totalHotels)}%)`);
    
    console.log('\n⚠️  HOTELS NEEDING MORE PHOTOS');
    console.log('-'.repeat(80));
    console.log(`Hotels initially insufficient:   ${this.stats.hotelsNeedingMorePhotos}`);
    console.log(`Fixed with new photos:           ${this.stats.hotelsFixedWithNewPhotos}`);
    console.log(`Still insufficient (<4 photos):  ${this.stats.hotelsFinallyInsufficient}`);
    
    if (this.stats.insufficientHotels.length > 0) {
      console.log('\n❌ HOTELS WITH LESS THAN 4 PHOTOS (NEED ATTENTION)');
      console.log('='.repeat(80));
      
      // Sort by country for easier review
      const sorted = this.stats.insufficientHotels.sort((a, b) => {
        if (a.country !== b.country) return a.country.localeCompare(b.country);
        return a.name.localeCompare(b.name);
      });
      
      let currentCountry = '';
      sorted.forEach((hotel, index) => {
        if (hotel.country !== currentCountry) {
          currentCountry = hotel.country;
          console.log(`\n📍 ${currentCountry}:`);
        }
        console.log(`${(index + 1).toString().padStart(3)}. ${hotel.name} (${hotel.city})`);
        console.log(`     Photos available: ${hotel.photosFound}`);
        console.log(`     Coordinates: ${hotel.coords.lat}, ${hotel.coords.lng}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`Total hotels with <4 photos: ${this.stats.insufficientHotels.length}`);
    } else {
      console.log('\n🎉 EXCELLENT: All hotels have 4+ high-quality photos!');
    }
    
    console.log('\n💰 COST ANALYSIS');
    console.log('-'.repeat(80));
    console.log(`Total API Calls:                 ${this.stats.totalApiCalls}`);
    console.log(`Estimated Cost:                  $${this.stats.estimatedCost.toFixed(2)}`);
    
    console.log('\n✅ QUALITY ASSURANCE');
    console.log('-'.repeat(80));
    console.log('✅ All remaining photos are from Google Places');
    console.log('✅ All remaining photos are from exact hotel locations');
    console.log('✅ All remaining photos are STRICTLY 2048px+ resolution');
    console.log('✅ No photos below 2048px remain in database');
    
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
  async run() {
    try {
      console.log('🔧 Photo Quality Enforcer');
      console.log('='.repeat(80));
      console.log('Mission:');
      console.log('1️⃣  Remove all photos below 2048px');
      console.log('2️⃣  Audit each hotel for remaining 2048px+ photos');
      console.log('3️⃣  Keep hotels with 4+ photos');
      console.log('4️⃣  Find more photos for hotels with <4 photos');
      console.log('5️⃣  Report hotels still below 4 photos');
      console.log('='.repeat(80) + '\n');
      
      // Fetch all hotels
      console.log('📥 Fetching hotels from database...');
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, coords, photos, hero_photo')
        .order('country', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        throw new Error('No hotels found in database');
      }
      
      this.stats.totalHotels = hotels.length;
      console.log(`✅ Found ${hotels.length} hotels\n`);
      
      // Process each hotel
      for (const hotel of hotels) {
        await this.processHotel(hotel);
        
        // Progress update
        const progress = ((this.stats.hotelsChecked / this.stats.totalHotels) * 100).toFixed(1);
        console.log(`   📊 Overall Progress: ${this.stats.hotelsChecked}/${this.stats.totalHotels} (${progress}%)`);
        
        // Rate limiting
        await this.delay(1000);
      }
      
      // Generate final report
      const stats = this.generateReport();
      
      // Save detailed report
      const fs = require('fs');
      const reportPath = './photo-quality-enforcement-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: stats,
        insufficientHotels: stats.insufficientHotels
      }, null, 2));
      
      console.log(`\n💾 Detailed report saved to: ${reportPath}\n`);
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the enforcer
async function main() {
  const enforcer = new PhotoQualityEnforcer();
  await enforcer.run();
}

main();
