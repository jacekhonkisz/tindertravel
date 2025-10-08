const axios = require('axios');

class AllHotelsAnalyzer {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    this.stats = {
      total: 0,
      serpApiAvailable: 0,
      googlePlacesOnly: 0,
      noPhotos: 0,
      failed: 0,
      processed: 0
    };
    
    this.analysis = {
      serpApiAvailable: [],
      googlePlacesOnly: [],
      noPhotos: [],
      failed: [],
      generated: new Date().toISOString()
    };
  }

  async analyzeAllHotels() {
    console.log('📋 Analyzing ALL 1000 hotels for photo sources...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    console.log(`⚠️ This will use 1000 SerpApi calls (your full quota!)`);
    
    try {
      // Get all hotels from your API
      console.log('\n📊 Fetching all hotels...');
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`�� Found ${hotels.length} hotels to analyze`);
      this.stats.total = hotels.length;
      
      // Process hotels in batches to show progress
      const batchSize = 50;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(hotels.length / batchSize);
        
        console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (hotels ${i + 1}-${Math.min(i + batchSize, hotels.length)})`);
        
        for (const hotel of batch) {
          await this.analyzeHotel(hotel);
          this.stats.processed++;
          
          // Show progress every 10 hotels
          if (this.stats.processed % 10 === 0) {
            const progress = Math.round((this.stats.processed / this.stats.total) * 100);
            console.log(`   📈 Progress: ${this.stats.processed}/${this.stats.total} (${progress}%)`);
          }
          
          await this.sleep(1000); // Rate limiting
        }
        
        // Show batch summary
        console.log(`   ✅ Batch ${batchNumber} complete: ${batch.length} hotels processed`);
        
        // Rate limiting between batches
        await this.sleep(2000);
      }
      
      this.generateFinalAnalysis();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async analyzeHotel(hotel) {
    try {
      // Check if hotel has photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      
      if (!hasPhotos) {
        this.stats.noPhotos++;
        this.analysis.noPhotos.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: 0
        });
        return;
      }
      
      // Check if photos are from Google Places (old format)
      const firstPhoto = hotel.photos[0];
      const isGooglePlaces = firstPhoto && firstPhoto.includes('maps.googleapis.com');
      
      if (isGooglePlaces) {
        // Check if SerpApi has photos for this hotel
        const hasSerpApiPhotos = await this.checkSerpApiPhotos(hotel);
        
        if (hasSerpApiPhotos) {
          this.stats.serpApiAvailable++;
          this.analysis.serpApiAvailable.push({
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            currentSource: 'google_places',
            status: 'CAN_UPDATE_WITH_SERPAPI'
          });
        } else {
          this.stats.googlePlacesOnly++;
          this.analysis.googlePlacesOnly.push({
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            currentSource: 'google_places',
            status: 'GOOGLE_PLACES_ONLY'
          });
        }
      } else {
        // Photos are already from SerpApi or another source
        this.stats.serpApiAvailable++;
        this.analysis.serpApiAvailable.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: hotel.photos.length,
          currentSource: 'serpapi',
          status: 'ALREADY_HAS_SERPAPI'
        });
      }
      
    } catch (error) {
      this.stats.failed++;
      this.analysis.failed.push({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        error: error.message
      });
    }
  }

  async checkSerpApiPhotos(hotel) {
    try {
      const checkInDate = this.getFutureDate(7);
      const checkOutDate = this.getFutureDate(10);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_hotels',
          q: `${hotel.name} ${hotel.city} ${hotel.country}`,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          api_key: this.serpApiKey,
          gl: 'us',
          hl: 'en'
        },
        timeout: 10000
      });

      const hotels = response.data.properties || [];
      if (hotels.length === 0) {
        return false;
      }

      const foundHotel = hotels[0];
      const photos = foundHotel.images || [];
      
      return photos.length > 0;
      
    } catch (error) {
      return false;
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  generateFinalAnalysis() {
    console.log('\n📊 COMPLETE HOTEL PHOTO SOURCE ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`Total Hotels Analyzed: ${this.stats.total}`);
    console.log(`SerpApi Available: ${this.stats.serpApiAvailable}`);
    console.log(`Google Places Only: ${this.stats.googlePlacesOnly}`);
    console.log(`No Photos: ${this.stats.noPhotos}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Success Rate: ${Math.round(((this.stats.total - this.stats.failed) / this.stats.total) * 100)}%`);
    
    // Create comprehensive reference files
    const fs = require('fs');
    
    // 1. Complete reference file
    let referenceContent = `# COMPLETE HOTEL PHOTO SOURCE REFERENCE\n\n`;
    referenceContent += `Generated: ${this.analysis.generated}\n`;
    referenceContent += `Total Hotels: ${this.stats.total}\n`;
    referenceContent += `SerpApi Available: ${this.stats.serpApiAvailable}\n`;
    referenceContent += `Google Places Only: ${this.stats.googlePlacesOnly}\n`;
    referenceContent += `No Photos: ${this.stats.noPhotos}\n`;
    referenceContent += `Failed: ${this.stats.failed}\n`;
    referenceContent += `Success Rate: ${Math.round(((this.stats.total - this.stats.failed) / this.stats.total) * 100)}%\n\n`;
    
    // Categorize SerpApi available hotels
    const alreadySerpApi = this.analysis.serpApiAvailable.filter(h => h.status === 'ALREADY_HAS_SERPAPI');
    const canUpdate = this.analysis.serpApiAvailable.filter(h => h.status === 'CAN_UPDATE_WITH_SERPAPI');
    
    referenceContent += `## 🚫 DO NOT TOUCH - ALREADY HAVE SERPAPI PHOTOS (${alreadySerpApi.length} hotels)\n`;
    alreadySerpApi.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ✅ CAN UPDATE WITH SERPAPI PHOTOS (${canUpdate.length} hotels)\n`;
    canUpdate.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ⏭️ GOOGLE PLACES ONLY (${this.analysis.googlePlacesOnly.length} hotels)\n`;
    this.analysis.googlePlacesOnly.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ❌ NO PHOTOS (${this.analysis.noPhotos.length} hotels)\n`;
    this.analysis.noPhotos.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    if (this.analysis.failed.length > 0) {
      referenceContent += `\n## ❌ FAILED ANALYSIS (${this.analysis.failed.length} hotels)\n`;
      this.analysis.failed.forEach(hotel => {
        referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | Error: ${hotel.error}\n`;
      });
    }
    
    fs.writeFileSync('COMPLETE_HOTEL_PHOTO_REFERENCE.txt', referenceContent);
    
    // 2. Simple lists for easy reference
    let avoidContent = `# HOTELS TO AVOID TOUCHING (ALREADY HAVE SERPAPI PHOTOS)\n\n`;
    alreadySerpApi.forEach(hotel => {
      avoidContent += `${hotel.name}\n`;
    });
    
    avoidContent += `\n# HOTELS THAT CAN BE UPDATED WITH SERPAPI PHOTOS\n\n`;
    canUpdate.forEach(hotel => {
      avoidContent += `${hotel.name}\n`;
    });
    
    fs.writeFileSync('ALL_HOTELS_TO_AVOID.txt', avoidContent);
    
    // 3. Summary file
    let summaryContent = `# HOTEL PHOTO ANALYSIS SUMMARY\n\n`;
    summaryContent += `Generated: ${this.analysis.generated}\n`;
    summaryContent += `Total Hotels: ${this.stats.total}\n`;
    summaryContent += `SerpApi Available: ${this.stats.serpApiAvailable}\n`;
    summaryContent += `Google Places Only: ${this.stats.googlePlacesOnly}\n`;
    summaryContent += `No Photos: ${this.stats.noPhotos}\n`;
    summaryContent += `Failed: ${this.stats.failed}\n`;
    summaryContent += `Success Rate: ${Math.round(((this.stats.total - this.stats.failed) / this.stats.total) * 100)}%\n\n`;
    
    summaryContent += `## BREAKDOWN:\n`;
    summaryContent += `- Hotels with SerpApi photos available: ${this.stats.serpApiAvailable}\n`;
    summaryContent += `- Hotels with Google Places only: ${this.stats.googlePlacesOnly}\n`;
    summaryContent += `- Hotels with no photos: ${this.stats.noPhotos}\n`;
    summaryContent += `- Hotels that failed analysis: ${this.stats.failed}\n\n`;
    
    summaryContent += `## RECOMMENDATIONS:\n`;
    summaryContent += `1. Update ${canUpdate.length} hotels with SerpApi photos\n`;
    summaryContent += `2. Leave ${alreadySerpApi.length} hotels alone (already have SerpApi photos)\n`;
    summaryContent += `3. Keep ${this.stats.googlePlacesOnly} hotels with Google Places photos\n`;
    summaryContent += `4. Investigate ${this.stats.failed} hotels that failed analysis\n`;
    
    fs.writeFileSync('HOTEL_ANALYSIS_SUMMARY.txt', summaryContent);
    
    // 4. JSON file for programmatic use
    fs.writeFileSync('complete-hotel-analysis.json', JSON.stringify(this.analysis, null, 2));
    
    console.log('\n📄 Files created:');
    console.log('• COMPLETE_HOTEL_PHOTO_REFERENCE.txt - Complete reference with all hotels');
    console.log('• ALL_HOTELS_TO_AVOID.txt - Simple list of hotels to avoid');
    console.log('• HOTEL_ANALYSIS_SUMMARY.txt - Summary and recommendations');
    console.log('• complete-hotel-analysis.json - JSON data for programmatic use');
    
    console.log('\n🎯 FINAL SUMMARY:');
    console.log(`✅ ${alreadySerpApi.length} hotels already have SerpApi photos (DON'T TOUCH)`);
    console.log(`🔄 ${canUpdate.length} hotels can be updated with SerpApi photos`);
    console.log(`⏭️ ${this.stats.googlePlacesOnly} hotels have Google Places only`);
    console.log(`❌ ${this.stats.noPhotos} hotels have no photos`);
    console.log(`⚠️ ${this.stats.failed} hotels failed analysis`);
    
    console.log('\n💰 API USAGE:');
    console.log(`SerpApi calls used: ${this.stats.total}/250`);
    console.log(`Remaining calls: ${250 - this.stats.total}`);
    console.log(`Cost: $${(this.stats.total * 0.01).toFixed(2)}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the complete analysis
async function runCompleteAnalysis() {
  const analyzer = new AllHotelsAnalyzer();
  await analyzer.analyzeAllHotels();
}

runCompleteAnalysis();
