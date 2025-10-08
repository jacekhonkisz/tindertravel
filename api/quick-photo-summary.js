const axios = require('axios');

class QuickPhotoSummary {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
  }

  async analyzePhotoResolutions() {
    console.log('🔍 Analyzing current photo resolutions...');
    
    try {
      // Get a sample of hotels
      const response = await axios.get(`${this.apiBase}/hotels?limit=50`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Analyzing ${hotels.length} hotels...`);
      
      let totalPhotos = 0;
      let googlePlacesPhotos = 0;
      let otherPhotos = 0;
      const resolutions = {};
      const googleResolutions = {};
      
      hotels.forEach(hotel => {
        const photos = hotel.photos || [];
        totalPhotos += photos.length;
        
        photos.forEach(photoUrl => {
          if (photoUrl.includes('maps.googleapis.com')) {
            googlePlacesPhotos++;
            
            // Extract resolution from Google Places URL
            const sizeMatch = photoUrl.match(/maxwidth=(\d+)&maxheight=(\d+)/);
            if (sizeMatch) {
              const width = parseInt(sizeMatch[1]);
              const height = parseInt(sizeMatch[2]);
              const resolution = `${width}x${height}`;
              
              googleResolutions[resolution] = (googleResolutions[resolution] || 0) + 1;
            }
          } else {
            otherPhotos++;
          }
        });
      });
      
      console.log('\n📈 PHOTO RESOLUTION SUMMARY:');
      console.log(`Total Photos Analyzed: ${totalPhotos}`);
      console.log(`Google Places Photos: ${googlePlacesPhotos} (${Math.round(googlePlacesPhotos/totalPhotos*100)}%)`);
      console.log(`Other Photos: ${otherPhotos} (${Math.round(otherPhotos/totalPhotos*100)}%)`);
      
      console.log('\n📏 Google Places Photo Resolutions:');
      Object.entries(googleResolutions)
        .sort((a, b) => b[1] - a[1])
        .forEach(([resolution, count]) => {
          const percentage = Math.round(count / googlePlacesPhotos * 100);
          console.log(`  ${resolution}: ${count} photos (${percentage}%)`);
        });
      
      // Analyze quality levels
      console.log('\n🎯 QUALITY ANALYSIS:');
      const qualityLevels = {
        '4K+ (3840x2160+)': 0,
        '2K+ (2560x1440+)': 0,
        'Full HD (1920x1080+)': 0,
        'HD+ (1600x1200+)': 0,
        'HD (1280x720+)': 0,
        'Low (<1280x720)': 0
      };
      
      Object.entries(googleResolutions).forEach(([resolution, count]) => {
        const [width, height] = resolution.split('x').map(Number);
        const pixels = width * height;
        
        if (pixels >= 3840 * 2160) {
          qualityLevels['4K+ (3840x2160+)'] += count;
        } else if (pixels >= 2560 * 1440) {
          qualityLevels['2K+ (2560x1440+)'] += count;
        } else if (pixels >= 1920 * 1080) {
          qualityLevels['Full HD (1920x1080+)'] += count;
        } else if (pixels >= 1600 * 1200) {
          qualityLevels['HD+ (1600x1200+)'] += count;
        } else if (pixels >= 1280 * 720) {
          qualityLevels['HD (1280x720+)'] += count;
        } else {
          qualityLevels['Low (<1280x720)'] += count;
        }
      });
      
      Object.entries(qualityLevels).forEach(([level, count]) => {
        if (count > 0) {
          const percentage = Math.round(count / googlePlacesPhotos * 100);
          console.log(`  ${level}: ${count} photos (${percentage}%)`);
        }
      });
      
      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      const maxResolution = Object.keys(googleResolutions).reduce((max, res) => {
        const [w, h] = res.split('x').map(Number);
        const [maxW, maxH] = max.split('x').map(Number);
        return (w * h) > (maxW * maxH) ? res : max;
      });
      
      console.log(`Current max resolution found: ${maxResolution}`);
      
      if (maxResolution.includes('1600x1200')) {
        console.log('❌ ISSUE: Photos are limited to 1600x1200 (HD+ quality)');
        console.log('✅ SOLUTION: Update Google Places API calls to use higher resolution parameters:');
        console.log('   - For Full HD: maxwidth=1920&maxheight=1080');
        console.log('   - For 2K: maxwidth=2560&maxheight=1440');
        console.log('   - For 4K: maxwidth=3840&maxheight=2160');
      } else if (maxResolution.includes('1920x1080')) {
        console.log('✅ GOOD: Photos are Full HD quality');
        console.log('💡 OPTION: Consider upgrading to 2K or 4K for premium experience');
      } else if (maxResolution.includes('2560x1440') || maxResolution.includes('3840x2160')) {
        console.log('✅ EXCELLENT: Photos are high resolution (2K/4K)');
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }
}

// Run the analysis
async function runQuickSummary() {
  const analyzer = new QuickPhotoSummary();
  await analyzer.analyzePhotoResolutions();
}

runQuickSummary();
