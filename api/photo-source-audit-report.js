const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Comprehensive Photo Source Audit Report Generator
 * 
 * This script analyzes all hotels in the database and generates a detailed report on:
 * - How many hotels are assigned to each photo source
 * - Photo quality and tagging status
 * - Distribution of photo sources across cities and countries
 */
class PhotoSourceAuditReport {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Statistics object
    this.stats = {
      totalHotels: 0,
      hotelsWithPhotos: 0,
      hotelsWithoutPhotos: 0,
      photoSources: {
        'Google Places': 0,
        'Unsplash': 0,
        'Unsplash Curated': 0,
        'SerpAPI': 0,
        'Bing': 0,
        'Unknown': 0,
        'Multiple Sources': 0
      },
      photoCounts: {},
      byCity: {},
      byCountry: {},
      sourceDetails: {
        'Google Places': { hotels: [], totalPhotos: 0 },
        'Unsplash': { hotels: [], totalPhotos: 0 },
        'Unsplash Curated': { hotels: [], totalPhotos: 0 },
        'SerpAPI': { hotels: [], totalPhotos: 0 },
        'Bing': { hotels: [], totalPhotos: 0 },
        'Unknown': { hotels: [], totalPhotos: 0 },
        'Multiple Sources': { hotels: [], totalPhotos: 0 }
      },
      photoQuality: {
        highQuality: 0, // 8+ photos
        mediumQuality: 0, // 4-7 photos
        lowQuality: 0, // 1-3 photos
        noPhotos: 0
      }
    };
  }

  /**
   * Detect photo source from URL patterns
   */
  detectPhotoSource(photoUrl) {
    if (typeof photoUrl !== 'string') {
      // Try to parse if it's an object or JSON
      try {
        const parsed = typeof photoUrl === 'object' ? photoUrl : JSON.parse(photoUrl);
        if (parsed.source) return parsed.source;
        if (parsed.url) photoUrl = parsed.url;
      } catch (e) {
        return 'Unknown';
      }
    }

    // URL pattern detection
    if (photoUrl.includes('maps.googleapis.com')) return 'Google Places';
    if (photoUrl.includes('bing.net') || photoUrl.includes('bing.com')) return 'Bing';
    if (photoUrl.includes('serpapi')) return 'SerpAPI';
    if (photoUrl.includes('unsplash.com/photos/')) return 'Unsplash';
    if (photoUrl.includes('unsplash.com') || photoUrl.includes('images.unsplash.com')) return 'Unsplash Curated';
    if (photoUrl.includes('pexels.com')) return 'Pexels';
    if (photoUrl.includes('pixabay.com')) return 'Pixabay';
    
    return 'Unknown';
  }

  /**
   * Analyze a single hotel's photo sources
   */
  analyzeHotel(hotel) {
    this.stats.totalHotels++;
    
    // Check if hotel has photos
    if (!hotel.photos || hotel.photos.length === 0) {
      this.stats.hotelsWithoutPhotos++;
      this.stats.photoQuality.noPhotos++;
      return;
    }
    
    this.stats.hotelsWithPhotos++;
    const photoCount = hotel.photos.length;
    
    // Track photo count distribution
    this.stats.photoCounts[photoCount] = (this.stats.photoCounts[photoCount] || 0) + 1;
    
    // Assess photo quality by count
    if (photoCount >= 8) {
      this.stats.photoQuality.highQuality++;
    } else if (photoCount >= 4) {
      this.stats.photoQuality.mediumQuality++;
    } else {
      this.stats.photoQuality.lowQuality++;
    }
    
    // Analyze photo sources
    const sources = new Set();
    hotel.photos.forEach(photo => {
      const source = this.detectPhotoSource(photo);
      sources.add(source);
    });
    
    // Determine primary source
    let primarySource;
    if (sources.size > 1) {
      primarySource = 'Multiple Sources';
    } else {
      primarySource = Array.from(sources)[0];
    }
    
    // Update stats
    this.stats.photoSources[primarySource]++;
    this.stats.sourceDetails[primarySource].hotels.push({
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      photoCount: photoCount,
      sources: Array.from(sources)
    });
    this.stats.sourceDetails[primarySource].totalPhotos += photoCount;
    
    // Track by location
    const countryKey = hotel.country || 'Unknown';
    const cityKey = `${hotel.city}, ${hotel.country}` || 'Unknown';
    
    if (!this.stats.byCountry[countryKey]) {
      this.stats.byCountry[countryKey] = {
        total: 0,
        sources: {}
      };
    }
    this.stats.byCountry[countryKey].total++;
    this.stats.byCountry[countryKey].sources[primarySource] = 
      (this.stats.byCountry[countryKey].sources[primarySource] || 0) + 1;
    
    if (!this.stats.byCity[cityKey]) {
      this.stats.byCity[cityKey] = {
        total: 0,
        sources: {}
      };
    }
    this.stats.byCity[cityKey].total++;
    this.stats.byCity[cityKey].sources[primarySource] = 
      (this.stats.byCity[cityKey].sources[primarySource] || 0) + 1;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    
    console.log('\n' + '='.repeat(80));
    console.log('📸 COMPREHENSIVE HOTEL PHOTO SOURCE AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Total Hotels Analyzed: ${this.stats.totalHotels}`);
    console.log('='.repeat(80));
    
    // Overview
    console.log('\n📊 OVERVIEW');
    console.log('-'.repeat(80));
    console.log(`✅ Hotels with Photos:    ${this.stats.hotelsWithPhotos} (${this.percentage(this.stats.hotelsWithPhotos, this.stats.totalHotels)}%)`);
    console.log(`❌ Hotels without Photos: ${this.stats.hotelsWithoutPhotos} (${this.percentage(this.stats.hotelsWithoutPhotos, this.stats.totalHotels)}%)`);
    
    // Photo Quality
    console.log('\n🎨 PHOTO QUALITY DISTRIBUTION');
    console.log('-'.repeat(80));
    console.log(`🌟 High Quality (8+ photos):   ${this.stats.photoQuality.highQuality} hotels (${this.percentage(this.stats.photoQuality.highQuality, this.stats.totalHotels)}%)`);
    console.log(`⭐ Medium Quality (4-7 photos): ${this.stats.photoQuality.mediumQuality} hotels (${this.percentage(this.stats.photoQuality.mediumQuality, this.stats.totalHotels)}%)`);
    console.log(`📷 Low Quality (1-3 photos):    ${this.stats.photoQuality.lowQuality} hotels (${this.percentage(this.stats.photoQuality.lowQuality, this.stats.totalHotels)}%)`);
    console.log(`❌ No Photos:                   ${this.stats.photoQuality.noPhotos} hotels (${this.percentage(this.stats.photoQuality.noPhotos, this.stats.totalHotels)}%)`);
    
    // Photo Sources
    console.log('\n🔍 PHOTO SOURCES DISTRIBUTION');
    console.log('-'.repeat(80));
    
    // Sort sources by count
    const sortedSources = Object.entries(this.stats.photoSources)
      .sort((a, b) => b[1] - a[1]);
    
    sortedSources.forEach(([source, count]) => {
      if (count > 0) {
        const percentage = this.percentage(count, this.stats.totalHotels);
        const avgPhotos = this.stats.sourceDetails[source].totalPhotos / count;
        const icon = this.getSourceIcon(source);
        console.log(`${icon} ${source.padEnd(20)} ${count.toString().padStart(4)} hotels (${percentage.toString().padStart(5)}%) | Avg ${avgPhotos.toFixed(1)} photos/hotel`);
      }
    });
    
    // Photo count distribution
    console.log('\n📈 PHOTOS PER HOTEL DISTRIBUTION');
    console.log('-'.repeat(80));
    const sortedCounts = Object.entries(this.stats.photoCounts)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    
    sortedCounts.forEach(([count, hotels]) => {
      const bar = '█'.repeat(Math.ceil(hotels / 5));
      console.log(`${count.toString().padStart(2)} photos: ${hotels.toString().padStart(4)} hotels ${bar}`);
    });
    
    // Top countries
    console.log('\n🌍 TOP COUNTRIES BY HOTEL COUNT');
    console.log('-'.repeat(80));
    const topCountries = Object.entries(this.stats.byCountry)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);
    
    topCountries.forEach(([country, data], index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${country.padEnd(25)} ${data.total.toString().padStart(4)} hotels`);
      
      // Show source breakdown
      const sortedSources = Object.entries(data.sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      const sourceBreakdown = sortedSources
        .map(([source, count]) => `${this.getSourceIcon(source)} ${source}: ${count}`)
        .join(' | ');
      console.log(`    ${sourceBreakdown}`);
    });
    
    // Detailed source breakdown
    console.log('\n📋 DETAILED SOURCE BREAKDOWN');
    console.log('='.repeat(80));
    
    sortedSources.forEach(([source, count]) => {
      if (count === 0) return;
      
      console.log(`\n${this.getSourceIcon(source)} ${source.toUpperCase()}`);
      console.log('-'.repeat(80));
      console.log(`Total Hotels: ${count}`);
      console.log(`Total Photos: ${this.stats.sourceDetails[source].totalPhotos}`);
      console.log(`Average Photos per Hotel: ${(this.stats.sourceDetails[source].totalPhotos / count).toFixed(2)}`);
      
      // Show sample hotels
      const sampleHotels = this.stats.sourceDetails[source].hotels.slice(0, 5);
      if (sampleHotels.length > 0) {
        console.log(`\nSample Hotels:`);
        sampleHotels.forEach((hotel, index) => {
          console.log(`  ${index + 1}. ${hotel.name}`);
          console.log(`     📍 ${hotel.city}, ${hotel.country}`);
          console.log(`     📸 ${hotel.photoCount} photos`);
          if (hotel.sources.length > 1) {
            console.log(`     🔀 Mixed sources: ${hotel.sources.join(', ')}`);
          }
        });
        
        if (this.stats.sourceDetails[source].hotels.length > 5) {
          console.log(`  ... and ${this.stats.sourceDetails[source].hotels.length - 5} more hotels`);
        }
      }
    });
    
    // Recommendations
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    if (this.stats.hotelsWithoutPhotos > 0) {
      console.log(`⚠️  ${this.stats.hotelsWithoutPhotos} hotels have no photos - need photo sourcing`);
    }
    
    if (this.stats.photoQuality.lowQuality > 0) {
      console.log(`⚠️  ${this.stats.photoQuality.lowQuality} hotels have low quality photos (1-3) - consider upgrading`);
    }
    
    if (this.stats.photoSources['Unknown'] > 0) {
      console.log(`⚠️  ${this.stats.photoSources['Unknown']} hotels have unknown photo sources - need proper tagging`);
    }
    
    const googlePlacesCount = this.stats.photoSources['Google Places'];
    if (googlePlacesCount > 0) {
      console.log(`ℹ️  ${googlePlacesCount} hotels use Google Places photos - monitor API usage`);
    }
    
    if (this.stats.photoQuality.highQuality > 500) {
      console.log(`✅ Great job! ${this.stats.photoQuality.highQuality} hotels have high-quality photo sets (8+)`);
    }
    
    console.log('\n='.repeat(80));
    console.log('End of Report');
    console.log('='.repeat(80) + '\n');
    
    return this.stats;
  }

  /**
   * Helper: Calculate percentage
   */
  percentage(part, total) {
    if (total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
  }

  /**
   * Helper: Get icon for source
   */
  getSourceIcon(source) {
    const icons = {
      'Google Places': '📸',
      'Unsplash': '🎨',
      'Unsplash Curated': '🎨',
      'SerpAPI': '🔍',
      'Bing': '🌐',
      'Unknown': '❓',
      'Multiple Sources': '🔀'
    };
    return icons[source] || '📷';
  }

  /**
   * Main audit function
   */
  async runAudit() {
    try {
      console.log('🔍 Starting photo source audit...\n');
      console.log('📥 Fetching all hotels from database...');
      
      // Fetch all hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*');
      
      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }
      
      if (!hotels || hotels.length === 0) {
        console.log('❌ No hotels found in database');
        return;
      }
      
      console.log(`✅ Found ${hotels.length} hotels in database\n`);
      console.log('🔬 Analyzing photo sources...');
      
      // Analyze each hotel
      hotels.forEach(hotel => this.analyzeHotel(hotel));
      
      // Generate and display report
      const stats = this.generateReport();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = './photo-source-audit-report.json';
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalHotels: stats.totalHotels,
          hotelsWithPhotos: stats.hotelsWithPhotos,
          hotelsWithoutPhotos: stats.hotelsWithoutPhotos,
          photoSources: stats.photoSources,
          photoQuality: stats.photoQuality
        },
        photoCounts: stats.photoCounts,
        byCountry: stats.byCountry,
        byCity: stats.byCity,
        sourceDetails: stats.sourceDetails
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
  const auditor = new PhotoSourceAuditReport();
  await auditor.runAudit();
}

main();

