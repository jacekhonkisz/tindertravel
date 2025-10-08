const axios = require('axios');

class FinalReferenceCreator {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
  }

  async createFinalReference() {
    console.log('📋 Creating final hotel photo source reference...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to analyze`);
      
      const analysis = {
        serpApiAvailable: [],
        googlePlacesOnly: [],
        noPhotos: [],
        total: hotels.length,
        generated: new Date().toISOString()
      };
      
      for (const hotel of hotels) {
        await this.analyzeHotel(hotel, analysis);
        await this.sleep(1000); // Rate limiting
      }
      
      this.generateFinalReference(analysis);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async analyzeHotel(hotel, analysis) {
    try {
      console.log(`\n🔍 Analyzing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel has photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      
      if (!hasPhotos) {
        analysis.noPhotos.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: 0
        });
        console.log(`   ⏭️ No photos`);
        return;
      }
      
      // Check if photos are from Google Places (old format)
      const firstPhoto = hotel.photos[0];
      const isGooglePlaces = firstPhoto && firstPhoto.includes('maps.googleapis.com');
      
      if (isGooglePlaces) {
        // Check if SerpApi has photos for this hotel
        const hasSerpApiPhotos = await this.checkSerpApiPhotos(hotel);
        
        if (hasSerpApiPhotos) {
          analysis.serpApiAvailable.push({
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            currentSource: 'google_places',
            status: 'CAN_UPDATE_WITH_SERPAPI'
          });
          console.log(`   ✅ SerpApi photos available (currently using Google Places)`);
        } else {
          analysis.googlePlacesOnly.push({
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            currentSource: 'google_places',
            status: 'GOOGLE_PLACES_ONLY'
          });
          console.log(`   ⏭️ Google Places photos only`);
        }
      } else {
        // Photos are already from SerpApi or another source
        analysis.serpApiAvailable.push({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: hotel.photos.length,
          currentSource: 'serpapi',
          status: 'ALREADY_HAS_SERPAPI'
        });
        console.log(`   ✅ SerpApi photos currently in use`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error analyzing hotel: ${error.message}`);
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
      console.log(`     ⚠️ SerpApi error: ${error.message}`);
      return false;
    }
  }

  getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  generateFinalReference(analysis) {
    console.log('\n📊 FINAL HOTEL PHOTO SOURCE ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`Total Hotels: ${analysis.total}`);
    console.log(`SerpApi Available: ${analysis.serpApiAvailable.length}`);
    console.log(`Google Places Only: ${analysis.googlePlacesOnly.length}`);
    console.log(`No Photos: ${analysis.noPhotos.length}`);
    
    // Create comprehensive reference files
    const fs = require('fs');
    
    // 1. Complete reference file
    let referenceContent = `# HOTEL PHOTO SOURCE REFERENCE\n\n`;
    referenceContent += `Generated: ${analysis.generated}\n`;
    referenceContent += `Total Hotels: ${analysis.total}\n`;
    referenceContent += `SerpApi Available: ${analysis.serpApiAvailable.length}\n`;
    referenceContent += `Google Places Only: ${analysis.googlePlacesOnly.length}\n`;
    referenceContent += `No Photos: ${analysis.noPhotos.length}\n\n`;
    
    referenceContent += `## 🚫 DO NOT TOUCH - ALREADY HAVE SERPAPI PHOTOS\n`;
    const alreadySerpApi = analysis.serpApiAvailable.filter(h => h.status === 'ALREADY_HAS_SERPAPI');
    alreadySerpApi.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ✅ CAN UPDATE WITH SERPAPI PHOTOS\n`;
    const canUpdate = analysis.serpApiAvailable.filter(h => h.status === 'CAN_UPDATE_WITH_SERPAPI');
    canUpdate.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ⏭️ GOOGLE PLACES ONLY\n`;
    analysis.googlePlacesOnly.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country}) | ${hotel.photoCount} photos\n`;
    });
    
    referenceContent += `\n## ❌ NO PHOTOS\n`;
    analysis.noPhotos.forEach(hotel => {
      referenceContent += `- ID: ${hotel.id} | ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    fs.writeFileSync('HOTEL_PHOTO_SOURCE_REFERENCE.txt', referenceContent);
    
    // 2. Simple list for easy reference
    let simpleContent = `# HOTELS TO AVOID TOUCHING (ALREADY HAVE SERPAPI PHOTOS)\n\n`;
    alreadySerpApi.forEach(hotel => {
      simpleContent += `${hotel.name}\n`;
    });
    
    simpleContent += `\n# HOTELS THAT CAN BE UPDATED WITH SERPAPI PHOTOS\n\n`;
    canUpdate.forEach(hotel => {
      simpleContent += `${hotel.name}\n`;
    });
    
    fs.writeFileSync('HOTELS_TO_AVOID.txt', simpleContent);
    
    // 3. JSON file for programmatic use
    fs.writeFileSync('hotel-photo-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('\n📄 Files created:');
    console.log('• HOTEL_PHOTO_SOURCE_REFERENCE.txt - Complete reference');
    console.log('• HOTELS_TO_AVOID.txt - Simple list of hotels to avoid');
    console.log('• hotel-photo-analysis.json - JSON data for programmatic use');
    
    console.log('\n🎯 USAGE GUIDE:');
    console.log('1. Check HOTELS_TO_AVOID.txt before updating any hotel photos');
    console.log('2. Hotels in "DO NOT TOUCH" section already have SerpApi photos');
    console.log('3. Hotels in "CAN UPDATE" section can be updated with SerpApi photos');
    console.log('4. Use hotel IDs for precise identification');
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ ${alreadySerpApi.length} hotels already have SerpApi photos (DON'T TOUCH)`);
    console.log(`🔄 ${canUpdate.length} hotels can be updated with SerpApi photos`);
    console.log(`⏭️ ${analysis.googlePlacesOnly.length} hotels have Google Places only`);
    console.log(`❌ ${analysis.noPhotos.length} hotels have no photos`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the analysis
async function runAnalysis() {
  const creator = new FinalReferenceCreator();
  await creator.createFinalReference();
}

runAnalysis();
