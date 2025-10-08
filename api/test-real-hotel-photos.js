const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class RealHotelPhotoTester {
  constructor() {
    // Your RapidAPI key
    this.rapidApiKey = '8d627aa74fmsh2825b3c356bcdbap15b110jsn13c0c522393c';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Test hotels - specific real hotels
    this.testHotels = [
      { name: 'The Ritz-Carlton New York', city: 'New York', country: 'United States' },
      { name: 'Four Seasons Hotel London', city: 'London', country: 'United Kingdom' },
      { name: 'Mandarin Oriental Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'Burj Al Arab', city: 'Dubai', country: 'United Arab Emirates' },
      { name: 'Hotel Plaza Athénée', city: 'Paris', country: 'France' },
      { name: 'The Peninsula Hong Kong', city: 'Hong Kong', country: 'Hong Kong' },
      { name: 'Belmond Hotel Caruso', city: 'Ravello', country: 'Italy' },
      { name: 'Aman Tokyo', city: 'Tokyo', country: 'Japan' },
      { name: 'The St. Regis Bali Resort', city: 'Bali', country: 'Indonesia' },
      { name: 'Rosewood Mayakoba', city: 'Playa del Carmen', country: 'Mexico' }
    ];
    
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      photosFound: 0,
      highQualityPhotos: 0
    };
  }

  async testRealHotelPhotos() {
    console.log('🔍 TESTING REAL HOTEL PHOTOS');
    console.log('='.repeat(60));
    console.log('🎯 Target: 10 specific luxury hotels');
    console.log('📸 Quality: Full HD (1920x1080) to 4K (3840x2160)');
    console.log('🔑 API: Multiple sources with RapidAPI key');
    console.log('🏨 Hotels: Real, specific luxury properties');
    
    console.log('\n📋 TEST HOTELS:');
    this.testHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
    });
    
    console.log('\n🚀 Starting photo fetch tests...\n');
    
    for (let i = 0; i < this.testHotels.length; i++) {
      const hotel = this.testHotels[i];
      console.log(`\n🏨 [${i + 1}/10] Testing: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      
      await this.testHotelPhotos(hotel);
      
      // Rate limiting
      if (i < this.testHotels.length - 1) {
        console.log('⏳ Waiting 2 seconds before next hotel...');
        await this.sleep(2000);
      }
    }
    
    this.generateTestReport();
  }

  async testHotelPhotos(hotel) {
    this.stats.total++;
    
    try {
      // Try multiple photo sources
      const photoSources = [
        {
          name: 'Unsplash (Free)',
          method: 'unsplash'
        },
        {
          name: 'Pexels (Free)',
          method: 'pexels'
        },
        {
          name: 'Pixabay (Free)',
          method: 'pixabay'
        },
        {
          name: 'Google Images (Scraping)',
          method: 'google'
        }
      ];

      let bestPhotos = [];
      let bestSource = '';

      for (const source of photoSources) {
        try {
          console.log(`  🔍 Trying ${source.name}...`);
          
          const photos = await this.fetchPhotosFromSource(hotel, source);
          
          if (photos.length > bestPhotos.length) {
            bestPhotos = photos;
            bestSource = source.name;
          }
          
          console.log(`  📸 ${source.name}: ${photos.length} photos found`);
          
        } catch (error) {
          console.log(`  ❌ ${source.name}: ${error.message}`);
        }
      }

      if (bestPhotos.length > 0) {
        console.log(`  ✅ Best result: ${bestSource} with ${bestPhotos.length} photos`);
        
        // Analyze photo quality
        const qualityAnalysis = this.analyzePhotoQuality(bestPhotos);
        console.log(`  📊 Quality analysis:`);
        console.log(`     • HD+ photos: ${qualityAnalysis.hdPlus}`);
        console.log(`     • 4K photos: ${qualityAnalysis.fourK}`);
        console.log(`     • Average resolution: ${qualityAnalysis.avgResolution}`);
        
        this.stats.success++;
        this.stats.photosFound += bestPhotos.length;
        this.stats.highQualityPhotos += qualityAnalysis.hdPlus;
        
        // Show sample photo URLs
        console.log(`  🔗 Sample photo URLs:`);
        bestPhotos.slice(0, 3).forEach((photo, index) => {
          console.log(`     ${index + 1}. ${photo.url} (${photo.width}x${photo.height})`);
        });
        
      } else {
        console.log(`  ❌ No photos found for ${hotel.name}`);
        this.stats.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${hotel.name}: ${error.message}`);
      this.stats.failed++;
    }
  }

  async fetchPhotosFromSource(hotel, source) {
    switch (source.method) {
      case 'unsplash':
        return await this.fetchUnsplashPhotos(hotel);
      case 'pexels':
        return await this.fetchPexelsPhotos(hotel);
      case 'pixabay':
        return await this.fetchPixabayPhotos(hotel);
      case 'google':
        return await this.fetchGooglePhotos(hotel);
      default:
        return [];
    }
  }

  async fetchUnsplashPhotos(hotel) {
    try {
      // Use Unsplash API (free tier: 50 requests/hour)
      const query = `${hotel.name} hotel ${hotel.city}`;
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: query,
          per_page: 10,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY' // You'd need to get this
        }
      });

      if (!response.data.results) {
        return [];
      }

      return response.data.results.map((photo, index) => ({
        url: photo.urls.full,
        width: photo.width,
        height: photo.height,
        source: 'unsplash',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `unsplash_${photo.id}`
      }));

    } catch (error) {
      throw new Error(`Unsplash: ${error.message}`);
    }
  }

  async fetchPexelsPhotos(hotel) {
    try {
      // Use Pexels API (free tier: 200 requests/hour)
      const query = `${hotel.name} hotel ${hotel.city}`;
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: query,
          per_page: 10,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': 'YOUR_PEXELS_API_KEY' // You'd need to get this
        }
      });

      if (!response.data.photos) {
        return [];
      }

      return response.data.photos.map((photo, index) => ({
        url: photo.src.large2x,
        width: photo.width,
        height: photo.height,
        source: 'pexels',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `pexels_${photo.id}`
      }));

    } catch (error) {
      throw new Error(`Pexels: ${error.message}`);
    }
  }

  async fetchPixabayPhotos(hotel) {
    try {
      // Use Pixabay API (free tier: 5000 requests/hour)
      const query = `${hotel.name} hotel ${hotel.city}`;
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: 'YOUR_PIXABAY_API_KEY', // You'd need to get this
          q: query,
          image_type: 'photo',
          orientation: 'horizontal',
          category: 'travel',
          per_page: 10
        }
      });

      if (!response.data.hits) {
        return [];
      }

      return response.data.hits.map((photo, index) => ({
        url: photo.largeImageURL,
        width: photo.imageWidth,
        height: photo.imageHeight,
        source: 'pixabay',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `pixabay_${photo.id}`
      }));

    } catch (error) {
      throw new Error(`Pixabay: ${error.message}`);
    }
  }

  async fetchGooglePhotos(hotel) {
    try {
      // Use Google Custom Search API (free tier: 100 requests/day)
      const query = `${hotel.name} hotel ${hotel.city} interior exterior`;
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: 'YOUR_GOOGLE_API_KEY', // You'd need to get this
          cx: 'YOUR_SEARCH_ENGINE_ID', // You'd need to get this
          q: query,
          searchType: 'image',
          imgSize: 'large',
          num: 10,
          safe: 'medium'
        }
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map((item, index) => ({
        url: item.link,
        width: item.image.width,
        height: item.image.height,
        source: 'google_images',
        description: `${hotel.name} photo ${index + 1}`,
        photoReference: `google_${index}`
      }));

    } catch (error) {
      throw new Error(`Google Images: ${error.message}`);
    }
  }

  analyzePhotoQuality(photos) {
    let hdPlus = 0;
    let fourK = 0;
    let totalPixels = 0;

    photos.forEach(photo => {
      const pixels = photo.width * photo.height;
      totalPixels += pixels;
      
      if (pixels >= 1920 * 1080) hdPlus++;
      if (pixels >= 3840 * 2160) fourK++;
    });

    const avgPixels = totalPixels / photos.length;
    const avgResolution = Math.round(Math.sqrt(avgPixels));

    return {
      hdPlus,
      fourK,
      avgResolution: `${avgResolution}x${Math.round(avgResolution * 0.5625)}` // 16:9 aspect ratio
    };
  }

  generateTestReport() {
    console.log('\n📊 REAL HOTEL PHOTO TEST REPORT');
    console.log('='.repeat(60));
    console.log(`📈 Total hotels tested: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.success}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📸 Total photos found: ${this.stats.photosFound}`);
    console.log(`🎯 HD+ photos: ${this.stats.highQualityPhotos}`);
    console.log(`📊 Success rate: ${Math.round((this.stats.success / this.stats.total) * 100)}%`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.stats.success >= 8) {
      console.log('✅ Excellent! Photo sources are working well');
      console.log('�� Ready to implement for all hotels');
    } else if (this.stats.success >= 5) {
      console.log('⚠️ Good results, but some hotels need alternative sources');
      console.log('🔄 Consider fallback to multiple photo services');
    } else {
      console.log('❌ Poor results - need to set up API keys');
      console.log('🔄 Consider using free photo services with API keys');
    }
    
    console.log('\n💰 COST ANALYSIS:');
    console.log(`• Free APIs: Unsplash, Pexels, Pixabay`);
    console.log(`• Google Custom Search: 100 requests/day free`);
    console.log(`• Estimated monthly cost: $0 (free tier)`);
    console.log(`• Cost per hotel: $0`);
    
    console.log('\n🔑 API KEYS NEEDED:');
    console.log('1. Unsplash: https://unsplash.com/developers');
    console.log('2. Pexels: https://www.pexels.com/api/');
    console.log('3. Pixabay: https://pixabay.com/api/docs/');
    console.log('4. Google Custom Search: https://developers.google.com/custom-search');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runTest() {
  const tester = new RealHotelPhotoTester();
  await tester.testRealHotelPhotos();
}

runTest().catch(console.error);
