const axios = require('axios');

class HotelPhotoSourceLister {
  constructor() {
    this.serpApiKey = '2e23f222aecca24206a3d1dc3df64ba79b642aeec1c0a67baa0ae046d6a81b5f';
    this.baseUrl = 'https://serpapi.com/search';
    this.apiBaseUrl = 'http://localhost:3001';
    
    this.stats = {
      total: 0,
      serpApiAvailable: 0,
      googlePlacesOnly: 0,
      skipped: 0,
      failed: 0
    };
    
    this.hotelList = [];
  }

  async createHotelPhotoSourceList() {
    console.log('�� Creating hotel photo source list...');
    console.log(`🔑 Using API key: ${this.serpApiKey.substring(0, 10)}...`);
    
    try {
      // Get all hotels from your API
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Found ${hotels.length} hotels to analyze`);
      
      this.stats.total = hotels.length;
      
      for (const hotel of hotels) {
        await this.analyzeHotel(hotel);
        await this.sleep(1000); // Rate limiting
      }
      
      this.generateList();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async analyzeHotel(hotel) {
    try {
      console.log(`\n🔍 Analyzing ${hotel.name} (${hotel.city}, ${hotel.country})...`);
      
      // Check if hotel has photos
      const hasPhotos = hotel.photos && hotel.photos.length > 0;
      
      if (!hasPhotos) {
        this.stats.skipped++;
        this.hotelList.push({
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: 0,
          photoSource: 'none',
          serpApiAvailable: false,
          status: 'NO_PHOTOS'
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
          this.stats.serpApiAvailable++;
          this.hotelList.push({
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            photoSource: 'google_places',
            serpApiAvailable: true,
            status: 'SERPAPI_AVAILABLE'
          });
          console.log(`   ✅ SerpApi photos available (currently using Google Places)`);
        } else {
          this.stats.googlePlacesOnly++;
          this.hotelList.push({
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            photoCount: hotel.photos.length,
            photoSource: 'google_places',
            serpApiAvailable: false,
            status: 'GOOGLE_PLACES_ONLY'
          });
          console.log(`   ⏭️ Google Places photos only`);
        }
      } else {
        // Photos are already from SerpApi or another source
        this.stats.serpApiAvailable++;
        this.hotelList.push({
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          photoCount: hotel.photos.length,
          photoSource: 'serpapi',
          serpApiAvailable: true,
          status: 'SERPAPI_CURRENT'
        });
        console.log(`   ✅ SerpApi photos currently in use`);
      }
      
    } catch (error) {
      this.stats.failed++;
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

  generateList() {
    console.log('\n📊 HOTEL PHOTO SOURCE ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`Total Hotels Analyzed: ${this.stats.total}`);
    console.log(`SerpApi Available: ${this.stats.serpApiAvailable}`);
    console.log(`Google Places Only: ${this.stats.googlePlacesOnly}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    
    // Create categorized lists
    const serpApiAvailable = this.hotelList.filter(h => h.status === 'SERPAPI_AVAILABLE');
    const serpApiCurrent = this.hotelList.filter(h => h.status === 'SERPAPI_CURRENT');
    const googlePlacesOnly = this.hotelList.filter(h => h.status === 'GOOGLE_PLACES_ONLY');
    const noPhotos = this.hotelList.filter(h => h.status === 'NO_PHOTOS');
    
    console.log('\n🏷️ HOTEL CATEGORIES:');
    console.log(`\n✅ SERPAPI PHOTOS AVAILABLE (${serpApiAvailable.length} hotels):`);
    console.log('   These hotels can be updated with SerpApi photos');
    serpApiAvailable.forEach(hotel => {
      console.log(`   • ${hotel.name} (${hotel.city}, ${hotel.country}) - ${hotel.photoCount} photos`);
    });
    
    console.log(`\n🎯 SERPAPI PHOTOS CURRENT (${serpApiCurrent.length} hotels):`);
    console.log('   These hotels already have SerpApi photos - DO NOT TOUCH');
    serpApiCurrent.forEach(hotel => {
      console.log(`   • ${hotel.name} (${hotel.city}, ${hotel.country}) - ${hotel.photoCount} photos`);
    });
    
    console.log(`\n⏭️ GOOGLE PLACES ONLY (${googlePlacesOnly.length} hotels):`);
    console.log('   These hotels only have Google Places photos available');
    googlePlacesOnly.forEach(hotel => {
      console.log(`   • ${hotel.name} (${hotel.city}, ${hotel.country}) - ${hotel.photoCount} photos`);
    });
    
    console.log(`\n❌ NO PHOTOS (${noPhotos.length} hotels):`);
    console.log('   These hotels have no photos');
    noPhotos.forEach(hotel => {
      console.log(`   • ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    // Save to file
    const fs = require('fs');
    const filename = 'hotel-photo-sources.txt';
    
    let fileContent = '# HOTEL PHOTO SOURCE ANALYSIS\n\n';
    fileContent += `Generated: ${new Date().toISOString()}\n`;
    fileContent += `Total Hotels: ${this.stats.total}\n`;
    fileContent += `SerpApi Available: ${this.stats.serpApiAvailable}\n`;
    fileContent += `Google Places Only: ${this.stats.googlePlacesOnly}\n\n`;
    
    fileContent += '## SERPAPI PHOTOS AVAILABLE (DO NOT TOUCH)\n';
    serpApiCurrent.forEach(hotel => {
      fileContent += `- ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    fileContent += '\n## SERPAPI PHOTOS AVAILABLE (CAN UPDATE)\n';
    serpApiAvailable.forEach(hotel => {
      fileContent += `- ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    fileContent += '\n## GOOGLE PLACES ONLY\n';
    googlePlacesOnly.forEach(hotel => {
      fileContent += `- ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    fileContent += '\n## NO PHOTOS\n';
    noPhotos.forEach(hotel => {
      fileContent += `- ${hotel.name} (${hotel.city}, ${hotel.country})\n`;
    });
    
    fs.writeFileSync(filename, fileContent);
    console.log(`\n📄 Hotel list saved to: ${filename}`);
    
    console.log('\n🎯 USAGE GUIDE:');
    console.log('1. Hotels in "SERPAPI PHOTOS CURRENT" - DO NOT TOUCH (already have SerpApi photos)');
    console.log('2. Hotels in "SERPAPI PHOTOS AVAILABLE" - Can be updated with SerpApi photos');
    console.log('3. Hotels in "GOOGLE PLACES ONLY" - Only Google Places photos available');
    console.log('4. Use this list to avoid touching hotels with SerpApi photos');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the analysis
async function runAnalysis() {
  const lister = new HotelPhotoSourceLister();
  await lister.createHotelPhotoSourceList();
}

runAnalysis();
