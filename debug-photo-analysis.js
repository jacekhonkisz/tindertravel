const axios = require('axios');

class PhotoDebugger {
  constructor() {
    this.apiBase = 'http://localhost:3001/api';
  }

  async debugPhotoIssues() {
    console.log('🔍 DEBUGGING PHOTO QUALITY ISSUES...\n');
    
    try {
      // Get a few sample hotels
      const response = await axios.get(`${this.apiBase}/hotels?limit=5`);
      const hotels = response.data.hotels;
      
      console.log(`📊 Analyzing ${hotels.length} sample hotels:\n`);
      
      for (const hotel of hotels) {
        console.log(`🏨 Hotel: ${hotel.name}`);
        console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
        console.log(`📸 Total Photos: ${hotel.photos?.length || 0}`);
        
        if (hotel.photos && hotel.photos.length > 0) {
          console.log('\n📷 Photo Analysis:');
          
          for (let i = 0; i < Math.min(3, hotel.photos.length); i++) {
            const photoUrl = hotel.photos[i];
            console.log(`\n  Photo ${i + 1}:`);
            console.log(`  URL: ${photoUrl.substring(0, 100)}...`);
            
            // Analyze the URL structure
            if (photoUrl.includes('maps.googleapis.com')) {
              console.log(`  ✅ Source: Google Places`);
              
              // Extract parameters
              const maxwidthMatch = photoUrl.match(/maxwidth=(\d+)/);
              const maxheightMatch = photoUrl.match(/maxheight=(\d+)/);
              
              if (maxwidthMatch && maxheightMatch) {
                const width = parseInt(maxwidthMatch[1]);
                const height = parseInt(maxheightMatch[1]);
                console.log(`  📐 URL Parameters: ${width}x${height}`);
                console.log(`  ✅ Meets size requirement: ${width >= 1200 && height >= 800 ? 'YES' : 'NO'}`);
              } else {
                console.log(`  ❌ No size parameters found in URL`);
              }
              
              // Try to get actual response
              try {
                console.log(`  🔍 Testing photo accessibility...`);
                const headResponse = await axios.head(photoUrl, { timeout: 5000 });
                console.log(`  ✅ Photo accessible: YES`);
                console.log(`  📊 Content-Type: ${headResponse.headers['content-type']}`);
                console.log(`  📊 Content-Length: ${headResponse.headers['content-length'] || 'Unknown'}`);
              } catch (error) {
                console.log(`  ❌ Photo accessible: NO - ${error.message}`);
              }
              
            } else {
              console.log(`  ❓ Source: Other (${photoUrl.includes('amadeus') ? 'Amadeus' : 'Unknown'})`);
            }
          }
        } else {
          console.log('❌ No photos found for this hotel');
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
      }
      
      // Test the photo quality logic
      console.log('🧪 TESTING PHOTO QUALITY LOGIC:\n');
      
      const testCases = [
        {
          name: 'Google Places 1600x1200',
          url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&maxheight=1200&photoreference=test&key=test'
        },
        {
          name: 'Google Places 800x600',
          url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photoreference=test&key=test'
        },
        {
          name: 'Non-Google URL',
          url: 'https://example.com/photo.jpg'
        }
      ];
      
      for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);
        console.log(`URL: ${testCase.url}`);
        
        const result = this.analyzePhotoUrl(testCase.url);
        console.log(`Result: ${JSON.stringify(result, null, 2)}\n`);
      }
      
    } catch (error) {
      console.error('❌ Debug failed:', error.message);
    }
  }

  analyzePhotoUrl(photoUrl) {
    let width = 0;
    let height = 0;
    
    if (photoUrl.includes('maps.googleapis.com')) {
      // Extract dimensions from Google Places URL
      const sizeMatch = photoUrl.match(/maxwidth=(\d+).*maxheight=(\d+)/);
      if (sizeMatch) {
        width = parseInt(sizeMatch[1]);
        height = parseInt(sizeMatch[2]);
      }
    } else {
      // Default for non-Google photos
      width = 1200;
      height = 800;
    }
    
    const meetsRequirement = width >= 1200 && height >= 800;
    
    return {
      width,
      height,
      meetsRequirement,
      reason: meetsRequirement ? 'PASS' : `Resolution too low: ${width}x${height}`
    };
  }
}

// Run the debug analysis
async function runDebug() {
  const debugger = new PhotoDebugger();
  try {
    await debugger.debugPhotoIssues();
  } catch (error) {
    console.error('❌ Debug analysis failed:', error.message);
  }
}

runDebug();
