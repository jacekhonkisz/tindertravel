const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

/**
 * REAL Photo Quality Audit
 * 
 * This script properly validates photo quality by checking the actual
 * photo dimensions from Google Places API metadata, not just the URL.
 */
class RealPhotoQualityAuditor {
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
      hotelsWithAllHighQuality: 0,
      hotelsWithSomeLowQuality: 0,
      hotelsWithNoPhotos: 0,
      totalPhotos: 0,
      highQualityPhotos: 0,
      lowQualityPhotos: 0,
      lowQualityHotels: []
    };
  }

  /**
   * Extract photo reference from Google Places URL
   */
  extractPhotoReference(photoUrl) {
    const match = photoUrl.match(/photo_reference=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get REAL photo dimensions from Google Places API
   */
  async getRealPhotoDimensions(hotel) {
    try {
      // Find the hotel on Google Places
      const searchUrl = `${this.baseUrl}/nearbysearch/json`;
      const searchParams = {
        location: `${hotel.coords.lat},${hotel.coords.lng}`,
        radius: 50,
        type: 'lodging',
        keyword: hotel.name,
        key: this.googleApiKey
      };
      
      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      
      if (searchResponse.data.status !== 'OK' || !searchResponse.data.results || searchResponse.data.results.length === 0) {
        return null;
      }
      
      const match = searchResponse.data.results[0];
      
      // Get place details with photo metadata
      const detailsUrl = `${this.baseUrl}/details/json`;
      const detailsParams = {
        place_id: match.place_id,
        fields: 'photos',
        key: this.googleApiKey
      };
      
      const detailsResponse = await axios.get(detailsUrl, { params: detailsParams });
      
      if (detailsResponse.data.status !== 'OK' || !detailsResponse.data.result || !detailsResponse.data.result.photos) {
        return null;
      }
      
      // Return photo metadata with actual dimensions
      return detailsResponse.data.result.photos.map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        minDimension: Math.min(photo.width, photo.height)
      }));
      
    } catch (error) {
      console.error(`   ❌ Error getting photo dimensions: ${error.message}`);
      return null;
    }
  }

  /**
   * Audit a single hotel's photos
   */
  async auditHotel(hotel) {
    console.log(`\n📸 Auditing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
    this.stats.hotelsChecked++;
    
    try {
      const currentPhotos = hotel.photos || [];
      
      if (currentPhotos.length === 0) {
        console.log(`   ⚠️  No photos in database`);
        this.stats.hotelsWithNoPhotos++;
        return;
      }
      
      console.log(`   📊 Current photos in DB: ${currentPhotos.length}`);
      
      // Get real photo dimensions from Google Places
      await this.delay(1000); // Rate limiting
      const realPhotoDimensions = await this.getRealPhotoDimensions(hotel);
      
      if (!realPhotoDimensions) {
        console.log(`   ⚠️  Could not fetch real photo dimensions from Google`);
        return;
      }
      
      // Check each photo in the database
      const photoQuality = [];
      
      for (const photoUrl of currentPhotos) {
        const photoRef = this.extractPhotoReference(photoUrl);
        
        if (!photoRef) {
          photoQuality.push({
            url: photoUrl,
            quality: 'UNKNOWN',
            reason: 'Not a Google Places photo'
          });
          continue;
        }
        
        // Find this photo in the real dimensions data
        const realDimensions = realPhotoDimensions.find(p => p.reference === photoRef);
        
        if (!realDimensions) {
          photoQuality.push({
            url: photoUrl,
            quality: 'UNKNOWN',
            reason: 'Photo reference not found in current Google data'
          });
          continue;
        }
        
        const isHighQuality = realDimensions.minDimension >= 2048;
        
        photoQuality.push({
          url: photoUrl,
          quality: isHighQuality ? 'HIGH' : 'LOW',
          width: realDimensions.width,
          height: realDimensions.height,
          minDimension: realDimensions.minDimension
        });
        
        this.stats.totalPhotos++;
        
        if (isHighQuality) {
          this.stats.highQualityPhotos++;
        } else {
          this.stats.lowQualityPhotos++;
        }
      }
      
      // Analyze results
      const lowQualityCount = photoQuality.filter(p => p.quality === 'LOW').length;
      const highQualityCount = photoQuality.filter(p => p.quality === 'HIGH').length;
      
      console.log(`   ✅ High quality (≥2048px): ${highQualityCount}`);
      console.log(`   ❌ Low quality (<2048px): ${lowQualityCount}`);
      
      if (lowQualityCount > 0) {
        console.log(`   ⚠️  WARNING: This hotel has ${lowQualityCount} low-quality photos`);
        this.stats.hotelsWithSomeLowQuality++;
        
        this.stats.lowQualityHotels.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          totalPhotos: currentPhotos.length,
          highQuality: highQualityCount,
          lowQuality: lowQualityCount,
          photoDetails: photoQuality.filter(p => p.quality === 'LOW')
        });
      } else {
        this.stats.hotelsWithAllHighQuality++;
      }
      
      console.log(`   📊 Progress: ${this.stats.hotelsChecked}/${this.stats.totalHotels}`);
      
    } catch (error) {
      console.error(`   ❌ Error auditing hotel: ${error.message}`);
    }
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
    console.log('📊 REAL PHOTO QUALITY AUDIT - FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`Completed: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    
    console.log('\n📈 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Hotels Audited:              ${this.stats.hotelsChecked}`);
    console.log(`Hotels with NO photos:             ${this.stats.hotelsWithNoPhotos}`);
    console.log(`Hotels with ALL high-quality:      ${this.stats.hotelsWithAllHighQuality} (${this.percentage(this.stats.hotelsWithAllHighQuality, this.stats.hotelsChecked)}%)`);
    console.log(`Hotels with SOME low-quality:      ${this.stats.hotelsWithSomeLowQuality} (${this.percentage(this.stats.hotelsWithSomeLowQuality, this.stats.hotelsChecked)}%)`);
    
    console.log('\n📸 PHOTO QUALITY BREAKDOWN');
    console.log('-'.repeat(80));
    console.log(`Total Photos Analyzed:             ${this.stats.totalPhotos}`);
    console.log(`High Quality (≥2048px):            ${this.stats.highQualityPhotos} (${this.percentage(this.stats.highQualityPhotos, this.stats.totalPhotos)}%)`);
    console.log(`Low Quality (<2048px):             ${this.stats.lowQualityPhotos} (${this.percentage(this.stats.lowQualityPhotos, this.stats.totalPhotos)}%)`);
    
    if (this.stats.lowQualityHotels.length > 0) {
      console.log('\n❌ HOTELS WITH LOW-QUALITY PHOTOS');
      console.log('='.repeat(80));
      
      // Sort by country
      const sorted = this.stats.lowQualityHotels.sort((a, b) => {
        if (a.country !== b.country) return a.country.localeCompare(b.country);
        return a.name.localeCompare(b.name);
      });
      
      let currentCountry = '';
      sorted.forEach((hotel, index) => {
        if (hotel.country !== currentCountry) {
          currentCountry = hotel.country;
          console.log(`\n📍 ${currentCountry}:`);
        }
        console.log(`\n${(index + 1).toString().padStart(3)}. ${hotel.name} (${hotel.city})`);
        console.log(`     Total: ${hotel.totalPhotos} photos | High: ${hotel.highQuality} | Low: ${hotel.lowQuality}`);
        console.log(`     Low-quality photo dimensions:`);
        hotel.photoDetails.forEach(photo => {
          console.log(`       - ${photo.width}x${photo.height} (min: ${photo.minDimension}px)`);
        });
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`Total hotels needing attention: ${this.stats.lowQualityHotels.length}`);
    } else {
      console.log('\n🎉 EXCELLENT: All hotels have 100% high-quality photos (≥2048px)!');
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
  async run() {
    try {
      console.log('🔍 Real Photo Quality Auditor');
      console.log('='.repeat(80));
      console.log('This audit checks ACTUAL photo dimensions from Google Places API');
      console.log('(not just what we requested in the URL)');
      console.log('='.repeat(80) + '\n');
      
      // Fetch all hotels
      console.log('📥 Fetching hotels from database...');
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, coords, photos')
        .order('country', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        throw new Error('No hotels found in database');
      }
      
      this.stats.totalHotels = hotels.length;
      console.log(`✅ Found ${hotels.length} hotels\n`);
      
      // Audit each hotel
      for (const hotel of hotels) {
        await this.auditHotel(hotel);
      }
      
      // Generate report
      const stats = this.generateReport();
      
      // Save report
      const fs = require('fs');
      const reportPath = './photo-actual-quality-audit-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats: stats,
        lowQualityHotels: stats.lowQualityHotels
      }, null, 2));
      
      console.log(`💾 Detailed report saved to: ${reportPath}\n`);
      
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the auditor
async function main() {
  const auditor = new RealPhotoQualityAuditor();
  await auditor.run();
}

main();
