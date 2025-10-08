const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Google Places API Location Audit
 * 
 * This script audits all hotels in the database to verify:
 * 1. Coordinate validity for Google Places API
 * 2. Location data completeness
 * 3. Geographic distribution
 * 4. Google Places API compatibility
 */
class GooglePlacesLocationAudit {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.stats = {
      totalHotels: 0,
      validCoordinates: 0,
      invalidCoordinates: 0,
      withAddress: 0,
      withoutAddress: 0,
      coordinateRanges: {
        minLat: 90,
        maxLat: -90,
        minLng: 180,
        maxLng: -180
      },
      countries: {},
      cities: {},
      googlePlacesCompatible: 0,
      issues: []
    };
  }

  /**
   * Validate coordinates for Google Places API compatibility
   */
  validateCoordinates(coords) {
    if (!coords) return false;
    
    const { lat, lng } = coords;
    
    // Check if coordinates are numbers
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return false;
    }
    
    // Check if coordinates are within valid ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
    
    // Check for NaN or Infinity
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if hotel location is suitable for Google Places API
   */
  isGooglePlacesCompatible(hotel) {
    // Must have valid coordinates
    if (!this.validateCoordinates(hotel.coords)) {
      return false;
    }
    
    // Must have city and country
    if (!hotel.city || !hotel.country) {
      return false;
    }
    
    // City and country must not be empty strings
    if (hotel.city.trim() === '' || hotel.country.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * Analyze a single hotel
   */
  analyzeHotel(hotel) {
    this.stats.totalHotels++;
    
    // Check coordinates
    if (this.validateCoordinates(hotel.coords)) {
      this.stats.validCoordinates++;
      
      // Update coordinate ranges
      const { lat, lng } = hotel.coords;
      this.stats.coordinateRanges.minLat = Math.min(this.stats.coordinateRanges.minLat, lat);
      this.stats.coordinateRanges.maxLat = Math.max(this.stats.coordinateRanges.maxLat, lat);
      this.stats.coordinateRanges.minLng = Math.min(this.stats.coordinateRanges.minLng, lng);
      this.stats.coordinateRanges.maxLng = Math.max(this.stats.coordinateRanges.maxLng, lng);
    } else {
      this.stats.invalidCoordinates++;
      this.stats.issues.push({
        hotel: hotel.name,
        issue: 'Invalid coordinates',
        coords: hotel.coords
      });
    }
    
    // Check address (not available in current schema)
    this.stats.withoutAddress++;
    
    // Check Google Places compatibility
    if (this.isGooglePlacesCompatible(hotel)) {
      this.stats.googlePlacesCompatible++;
    } else {
      this.stats.issues.push({
        hotel: hotel.name,
        issue: 'Not Google Places compatible',
        details: {
          hasCoords: !!hotel.coords,
          hasCity: !!hotel.city,
          hasCountry: !!hotel.country,
          coordsValid: this.validateCoordinates(hotel.coords)
        }
      });
    }
    
    // Track geographic distribution
    if (hotel.country) {
      this.stats.countries[hotel.country] = (this.stats.countries[hotel.country] || 0) + 1;
    }
    
    if (hotel.city && hotel.country) {
      const cityKey = `${hotel.city}, ${hotel.country}`;
      this.stats.cities[cityKey] = (this.stats.cities[cityKey] || 0) + 1;
    }
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🗺️  GOOGLE PLACES API LOCATION AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Total Hotels Analyzed: ${this.stats.totalHotels}`);
    console.log('='.repeat(80));
    
    // Overview
    console.log('\n📊 OVERVIEW');
    console.log('-'.repeat(80));
    console.log(`✅ Hotels with valid coordinates:    ${this.stats.validCoordinates} (${this.percentage(this.stats.validCoordinates, this.stats.totalHotels)}%)`);
    console.log(`❌ Hotels with invalid coordinates:  ${this.stats.invalidCoordinates} (${this.percentage(this.stats.invalidCoordinates, this.stats.totalHotels)}%)`);
    console.log(`📍 Hotels with address:             0 (0.0%) - Column not in schema`);
    console.log(`❓ Hotels without address:           ${this.stats.totalHotels} (100.0%) - Column not in schema`);
    console.log(`🎯 Google Places compatible:        ${this.stats.googlePlacesCompatible} (${this.percentage(this.stats.googlePlacesCompatible, this.stats.totalHotels)}%)`);
    
    // Geographic coverage
    console.log('\n🌍 GEOGRAPHIC COVERAGE');
    console.log('-'.repeat(80));
    console.log(`Latitude range:  ${this.stats.coordinateRanges.minLat.toFixed(4)} to ${this.stats.coordinateRanges.maxLat.toFixed(4)}`);
    console.log(`Longitude range: ${this.stats.coordinateRanges.minLng.toFixed(4)} to ${this.stats.coordinateRanges.maxLng.toFixed(4)}`);
    console.log(`Coverage: Global (${this.stats.coordinateRanges.maxLat - this.stats.coordinateRanges.minLat}° lat, ${this.stats.coordinateRanges.maxLng - this.stats.coordinateRanges.minLng}° lng)`);
    
    // Top countries
    console.log('\n🏆 TOP 15 COUNTRIES');
    console.log('-'.repeat(80));
    const topCountries = Object.entries(this.stats.countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    topCountries.forEach(([country, count], index) => {
      const percentage = this.percentage(count, this.stats.totalHotels);
      console.log(`${(index + 1).toString().padStart(2)}. ${country.padEnd(25)} ${count.toString().padStart(3)} hotels (${percentage}%)`);
    });
    
    // Top cities
    console.log('\n🏙️  TOP 15 CITIES');
    console.log('-'.repeat(80));
    const topCities = Object.entries(this.stats.cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    topCities.forEach(([city, count], index) => {
      const percentage = this.percentage(count, this.stats.totalHotels);
      console.log(`${(index + 1).toString().padStart(2)}. ${city.padEnd(35)} ${count.toString().padStart(3)} hotels (${percentage}%)`);
    });
    
    // Issues
    if (this.stats.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND');
      console.log('-'.repeat(80));
      console.log(`Total issues: ${this.stats.issues.length}`);
      
      // Group issues by type
      const issueTypes = {};
      this.stats.issues.forEach(issue => {
        issueTypes[issue.issue] = (issueTypes[issue.issue] || 0) + 1;
      });
      
      Object.entries(issueTypes).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} hotels`);
      });
      
      // Show sample issues
      console.log('\nSample issues:');
      this.stats.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.hotel}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.coords) {
          console.log(`   Coords: ${JSON.stringify(issue.coords)}`);
        }
        if (issue.details) {
          console.log(`   Details: ${JSON.stringify(issue.details)}`);
        }
      });
      
      if (this.stats.issues.length > 5) {
        console.log(`   ... and ${this.stats.issues.length - 5} more issues`);
      }
    } else {
      console.log('\n✅ NO ISSUES FOUND');
      console.log('-'.repeat(80));
      console.log('All hotels are properly configured for Google Places API!');
    }
    
    // Google Places API readiness
    console.log('\n🎯 GOOGLE PLACES API READINESS');
    console.log('-'.repeat(80));
    
    const readinessPercentage = this.percentage(this.stats.googlePlacesCompatible, this.stats.totalHotels);
    
    if (readinessPercentage === 100) {
      console.log('🟢 EXCELLENT: 100% of hotels are Google Places API ready!');
      console.log('✅ All hotels have valid coordinates');
      console.log('✅ All hotels have city and country data');
      console.log('✅ Ready for photo fetching implementation');
    } else if (readinessPercentage >= 95) {
      console.log('🟡 GOOD: Most hotels are ready, minor issues to fix');
      console.log(`✅ ${this.stats.googlePlacesCompatible} hotels ready`);
      console.log(`⚠️  ${this.stats.totalHotels - this.stats.googlePlacesCompatible} hotels need attention`);
    } else if (readinessPercentage >= 80) {
      console.log('🟠 FAIR: Significant number of hotels need fixes');
      console.log(`✅ ${this.stats.googlePlacesCompatible} hotels ready`);
      console.log(`❌ ${this.stats.totalHotels - this.stats.googlePlacesCompatible} hotels need fixes`);
    } else {
      console.log('🔴 POOR: Many hotels are not Google Places API ready');
      console.log(`✅ ${this.stats.googlePlacesCompatible} hotels ready`);
      console.log(`❌ ${this.stats.totalHotels - this.stats.googlePlacesCompatible} hotels need fixes`);
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    if (this.stats.invalidCoordinates > 0) {
      console.log(`🔧 Fix ${this.stats.invalidCoordinates} hotels with invalid coordinates`);
    }
    
    if (this.stats.withoutAddress > 0) {
      console.log(`📍 Add addresses to ${this.stats.withoutAddress} hotels (optional for Google Places)`);
    }
    
    if (this.stats.googlePlacesCompatible < this.stats.totalHotels) {
      const incompatible = this.stats.totalHotels - this.stats.googlePlacesCompatible;
      console.log(`🎯 Fix ${incompatible} hotels to be Google Places compatible`);
    }
    
    if (this.stats.googlePlacesCompatible === this.stats.totalHotels) {
      console.log('🚀 All hotels are ready! Proceed with Google Places photo implementation');
      console.log(`💰 Estimated cost: $${(this.stats.googlePlacesCompatible * 0.073).toFixed(2)} for 8 photos per hotel`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('End of Report');
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
   * Main audit function
   */
  async runAudit() {
    try {
      console.log('🔍 Starting Google Places API location audit...\n');
      console.log('📥 Fetching all hotels from database...');
      
      // Fetch all hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('id, name, city, country, coords');
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        console.log('❌ No hotels found in database');
        return;
      }
      
      console.log(`✅ Found ${hotels.length} hotels in database\n`);
      console.log('🔬 Analyzing location data...');
      
      // Analyze each hotel
      hotels.forEach(hotel => this.analyzeHotel(hotel));
      
      // Generate and display report
      const stats = this.generateReport();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = './google-places-location-audit-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalHotels: stats.totalHotels,
          validCoordinates: stats.validCoordinates,
          invalidCoordinates: stats.invalidCoordinates,
          withAddress: stats.withAddress,
          withoutAddress: stats.withoutAddress,
          googlePlacesCompatible: stats.googlePlacesCompatible
        },
        coordinateRanges: stats.coordinateRanges,
        countries: stats.countries,
        cities: stats.cities,
        issues: stats.issues
      }, null, 2));
      
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the audit
async function main() {
  const auditor = new GooglePlacesLocationAudit();
  await auditor.runAudit();
}

main();
