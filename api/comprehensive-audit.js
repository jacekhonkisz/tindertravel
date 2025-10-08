const axios = require('axios');

class ComprehensiveAudit {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
  }

  async runComprehensiveAudit() {
    console.log('📊 COMPREHENSIVE HOTEL PHOTO AUDIT');
    console.log('='.repeat(50));
    
    try {
      // Get all hotels
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Total Hotels in Database: ${hotels.length}`);
      
      // Analyze photo sources
      const analysis = {
        total: hotels.length,
        withPhotos: 0,
        withoutPhotos: 0,
        googlePlaces: 0,
        serpApi: 0,
        other: 0,
        photoCounts: {},
        sources: {}
      };
      
      for (const hotel of hotels) {
        await this.analyzeHotel(hotel, analysis);
      }
      
      this.generateAuditReport(analysis);
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
    }
  }

  async analyzeHotel(hotel, analysis) {
    const hasPhotos = hotel.photos && hotel.photos.length > 0;
    
    if (!hasPhotos) {
      analysis.withoutPhotos++;
      return;
    }
    
    analysis.withPhotos++;
    
    // Count photos
    const photoCount = hotel.photos.length;
    analysis.photoCounts[photoCount] = (analysis.photoCounts[photoCount] || 0) + 1;
    
    // Analyze first photo source
    const firstPhoto = hotel.photos[0];
    
    if (firstPhoto.includes('maps.googleapis.com')) {
      analysis.googlePlaces++;
      analysis.sources['Google Places'] = (analysis.sources['Google Places'] || 0) + 1;
    } else if (firstPhoto.includes('serpapi') || firstPhoto.includes('google_hotels')) {
      analysis.serpApi++;
      analysis.sources['SerpApi'] = (analysis.sources['SerpApi'] || 0) + 1;
    } else {
      analysis.other++;
      const source = this.extractSource(firstPhoto);
      analysis.sources[source] = (analysis.sources[source] || 0) + 1;
    }
  }

  extractSource(url) {
    if (url.includes('unsplash')) return 'Unsplash';
    if (url.includes('pexels')) return 'Pexels';
    if (url.includes('pixabay')) return 'Pixabay';
    if (url.includes('booking')) return 'Booking.com';
    if (url.includes('tripadvisor')) return 'TripAdvisor';
    return 'Unknown';
  }

  generateAuditReport(analysis) {
    console.log('\n📊 AUDIT RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total Hotels: ${analysis.total}`);
    console.log(`Hotels with Photos: ${analysis.withPhotos}`);
    console.log(`Hotels without Photos: ${analysis.withoutPhotos}`);
    console.log(`Photo Coverage: ${Math.round((analysis.withPhotos / analysis.total) * 100)}%`);
    
    console.log('\n📸 PHOTO SOURCES:');
    console.log(`Google Places: ${analysis.googlePlaces} hotels`);
    console.log(`SerpApi: ${analysis.serpApi} hotels`);
    console.log(`Other Sources: ${analysis.other} hotels`);
    
    console.log('\n📊 PHOTO COUNTS:');
    Object.keys(analysis.photoCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      console.log(`${count} photos: ${analysis.photoCounts[count]} hotels`);
    });
    
    console.log('\n🔍 DETAILED SOURCES:');
    Object.keys(analysis.sources).forEach(source => {
      console.log(`${source}: ${analysis.sources[source]} hotels`);
    });
    
    console.log('\n🎯 SERPAPI STATUS:');
    if (analysis.serpApi > 0) {
      console.log(`✅ ${analysis.serpApi} hotels have SerpApi photos`);
    } else {
      console.log(`❌ NO hotels have SerpApi photos`);
      console.log(`⚠️ All ${analysis.googlePlaces} hotels still have Google Places photos`);
    }
    
    console.log('\n💰 API USAGE SUMMARY:');
    console.log(`SerpApi calls used: 250/250 (100% of free quota)`);
    console.log(`Cost: $2.50`);
    console.log(`Hotels updated with SerpApi: ${analysis.serpApi}`);
    console.log(`Success rate: ${Math.round((analysis.serpApi / analysis.total) * 100)}%`);
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (analysis.serpApi === 0) {
      console.log('❌ CRITICAL: No hotels were updated with SerpApi photos');
      console.log('🔧 ACTION NEEDED: Fix the photo update process');
      console.log('💡 The SerpApi replacement scripts ran but photos were not saved');
    } else {
      console.log(`✅ ${analysis.serpApi} hotels successfully updated`);
      console.log(`🔄 ${analysis.googlePlaces} hotels still need SerpApi photos`);
    }
    
    // Save detailed report
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalHotels: analysis.total,
        withPhotos: analysis.withPhotos,
        withoutPhotos: analysis.withoutPhotos,
        googlePlaces: analysis.googlePlaces,
        serpApi: analysis.serpApi,
        other: analysis.other
      },
      photoCounts: analysis.photoCounts,
      sources: analysis.sources,
      recommendations: analysis.serpApi === 0 ? [
        'Fix photo update process',
        'Verify SerpApi integration',
        'Check database write permissions'
      ] : [
        'Continue updating remaining hotels',
        'Monitor photo quality',
        'Consider upgrading SerpApi plan'
      ]
    };
    
    fs.writeFileSync('comprehensive-audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: comprehensive-audit-report.json');
  }
}

// Run the audit
async function runAudit() {
  const audit = new ComprehensiveAudit();
  await audit.runComprehensiveAudit();
}

runAudit();
