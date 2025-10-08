const axios = require('axios');

class PhotoStorageAnalyzer {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
  }

  async analyzePhotoStorage() {
    console.log('🔍 ANALYZING PHOTO STORAGE ISSUE');
    console.log('='.repeat(50));
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/hotels?limit=1000`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Analyzing ${hotels.length} hotels...`);
      
      const analysis = {
        total: hotels.length,
        jsonPhotos: 0,
        urlPhotos: 0,
        googlePlaces: 0,
        serpApiUrls: 0,
        serpApiJson: 0,
        examples: {
          jsonPhotos: [],
          urlPhotos: [],
          googlePlaces: [],
          serpApiUrls: []
        }
      };
      
      for (const hotel of hotels) {
        await this.analyzeHotelPhotos(hotel, analysis);
      }
      
      this.generateAnalysisReport(analysis);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async analyzeHotelPhotos(hotel, analysis) {
    if (!hotel.photos || hotel.photos.length === 0) return;
    
    const firstPhoto = hotel.photos[0];
    
    // Check if it's a JSON string
    if (typeof firstPhoto === 'string' && firstPhoto.startsWith('{')) {
      analysis.jsonPhotos++;
      analysis.examples.jsonPhotos.push({
        name: hotel.name,
        photo: firstPhoto
      });
      
      // Check if it's SerpApi JSON
      if (firstPhoto.includes('serpapi')) {
        analysis.serpApiJson++;
      }
    }
    // Check if it's a URL
    else if (typeof firstPhoto === 'string' && firstPhoto.startsWith('http')) {
      analysis.urlPhotos++;
      analysis.examples.urlPhotos.push({
        name: hotel.name,
        photo: firstPhoto
      });
      
      // Check if it's Google Places
      if (firstPhoto.includes('maps.googleapis.com')) {
        analysis.googlePlaces++;
        analysis.examples.googlePlaces.push({
          name: hotel.name,
          photo: firstPhoto
        });
      }
      // Check if it's SerpApi URL
      else if (firstPhoto.includes('serpapi') || firstPhoto.includes('google_hotels')) {
        analysis.serpApiUrls++;
        analysis.examples.serpApiUrls.push({
          name: hotel.name,
          photo: firstPhoto
        });
      }
    }
  }

  generateAnalysisReport(analysis) {
    console.log('\n📊 PHOTO STORAGE ANALYSIS:');
    console.log('='.repeat(50));
    console.log(`Total Hotels: ${analysis.total}`);
    console.log(`JSON Photos: ${analysis.jsonPhotos}`);
    console.log(`URL Photos: ${analysis.urlPhotos}`);
    console.log(`Google Places URLs: ${analysis.googlePlaces}`);
    console.log(`SerpApi URLs: ${analysis.serpApiUrls}`);
    console.log(`SerpApi JSON: ${analysis.serpApiJson}`);
    
    console.log('\n🔍 WHAT HAPPENED:');
    if (analysis.serpApiJson > 0) {
      console.log(`❌ ${analysis.serpApiJson} hotels have SerpApi photos stored as JSON strings`);
      console.log(`⚠️ These photos contain metadata but NO actual image URLs`);
      console.log(`🔧 The photos were fetched but not properly converted to URLs`);
    }
    
    if (analysis.serpApiUrls > 0) {
      console.log(`✅ ${analysis.serpApiUrls} hotels have actual SerpApi photo URLs`);
    }
    
    console.log(`📸 ${analysis.googlePlaces} hotels still have Google Places URLs`);
    
    console.log('\n📋 EXAMPLES:');
    
    if (analysis.examples.jsonPhotos.length > 0) {
      console.log('\n❌ JSON Photos (Broken):');
      analysis.examples.jsonPhotos.slice(0, 2).forEach(example => {
        console.log(`Hotel: ${example.name}`);
        console.log(`Photo: ${example.photo.substring(0, 100)}...`);
      });
    }
    
    if (analysis.examples.serpApiUrls.length > 0) {
      console.log('\n✅ SerpApi URLs (Working):');
      analysis.examples.serpApiUrls.slice(0, 2).forEach(example => {
        console.log(`Hotel: ${example.name}`);
        console.log(`Photo: ${example.photo.substring(0, 100)}...`);
      });
    }
    
    if (analysis.examples.googlePlaces.length > 0) {
      console.log('\n📸 Google Places URLs (Original):');
      analysis.examples.googlePlaces.slice(0, 2).forEach(example => {
        console.log(`Hotel: ${example.name}`);
        console.log(`Photo: ${example.photo.substring(0, 100)}...`);
      });
    }
    
    console.log('\n🎯 THE PROBLEM:');
    if (analysis.serpApiJson > 0) {
      console.log('❌ SerpApi photos were fetched but stored as JSON metadata instead of URLs');
      console.log('🔧 The photo objects contain width, height, source, description but NO URL');
      console.log('💡 We need to extract the actual image URLs from the SerpApi response');
    }
    
    console.log('\n🔧 SOLUTION:');
    console.log('1. Fix the SerpApi photo processing to extract actual URLs');
    console.log('2. Update hotels with JSON photos to have proper URLs');
    console.log('3. Re-run the replacement process with correct URL extraction');
    
    // Save detailed analysis
    const fs = require('fs');
    fs.writeFileSync('photo-storage-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\n📄 Detailed analysis saved to: photo-storage-analysis.json');
  }
}

// Run the analysis
async function runAnalysis() {
  const analyzer = new PhotoStorageAnalyzer();
  await analyzer.analyzePhotoStorage();
}

runAnalysis();
