const axios = require('axios');

async function debugPhotoIssues() {
  console.log('🔍 DEBUGGING PHOTO QUALITY ISSUES...\n');
  
  try {
    // Get a few sample hotels
    const response = await axios.get('http://localhost:3001/api/hotels?limit=3');
    const hotels = response.data.hotels;
    
    console.log(`📊 Analyzing ${hotels.length} sample hotels:\n`);
    
    for (const hotel of hotels) {
      console.log(`🏨 Hotel: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      console.log(`📸 Total Photos: ${hotel.photos?.length || 0}`);
      
      if (hotel.photos && hotel.photos.length > 0) {
        console.log('\n📷 Photo Analysis:');
        
        for (let i = 0; i < Math.min(2, hotel.photos.length); i++) {
          const photoUrl = hotel.photos[i];
          console.log(`\n  Photo ${i + 1}:`);
          console.log(`  URL: ${photoUrl.substring(0, 120)}...`);
          
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
              console.log(`  ✅ Meets size requirement (≥1200x800): ${width >= 1200 && height >= 800 ? 'YES' : 'NO'}`);
              
              if (width >= 1200 && height >= 800) {
                console.log(`  🎉 THIS PHOTO SHOULD PASS!`);
              } else {
                console.log(`  ❌ This photo fails: ${width}x${height} < 1200x800`);
              }
            } else {
              console.log(`  ❌ No size parameters found in URL`);
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
    
    // Test the regex pattern used in the audit
    console.log('🧪 TESTING REGEX PATTERN:\n');
    
    const testUrl = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&maxheight=1200&photoreference=test&key=test';
    console.log(`Test URL: ${testUrl}`);
    
    const sizeMatch = testUrl.match(/=(\d+)x(\d+)/);
    console.log(`Regex /=(\d+)x(\d+)/ result:`, sizeMatch);
    
    const correctMatch = testUrl.match(/maxwidth=(\d+).*maxheight=(\d+)/);
    console.log(`Correct regex result:`, correctMatch);
    
    if (correctMatch) {
      const width = parseInt(correctMatch[1]);
      const height = parseInt(correctMatch[2]);
      console.log(`Extracted dimensions: ${width}x${height}`);
      console.log(`Should pass quality check: ${width >= 1200 && height >= 800}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugPhotoIssues();
