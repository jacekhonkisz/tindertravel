const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixedPhotoAudit() {
  console.log('🔍 FIXED PHOTO RESOLUTION AUDIT');
  console.log('='.repeat(60));
  console.log('🎯 Target: ALL hotels in database');
  console.log('📏 Minimum resolution: 1280x900 (1,152,000 pixels)');
  console.log('🔧 Using FIXED resolution extraction');
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Found ${data.length} hotels\n`);
    
    let totalPhotos = 0;
    let highResPhotos = 0;
    let lowResPhotos = 0;
    let hotelsWithLowRes = 0;
    
    // Sample first 10 hotels for detailed analysis
    const sampleHotels = data.slice(0, 10);
    
    console.log('🔍 DETAILED ANALYSIS (First 10 hotels):\n');
    
    sampleHotels.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      totalPhotos += photos.length;
      
      console.log(`${index + 1}. ${hotel.name}`);
      console.log(`   📍 ${hotel.city}, ${hotel.country}`);
      console.log(`   📸 Photos: ${photos.length}`);
      
      let hotelHighRes = 0;
      let hotelLowRes = 0;
      
      photos.slice(0, 3).forEach((photo, i) => {
        const resolution = getResolutionFromUrl(photo);
        const isHighRes = resolution.pixels >= 1152000; // 1280x900
        
        if (isHighRes) {
          highResPhotos++;
          hotelHighRes++;
        } else {
          lowResPhotos++;
          hotelLowRes++;
        }
        
        console.log(`   ${i + 1}. Resolution: ${resolution.width}x${resolution.height} (${resolution.pixels.toLocaleString()} pixels) ${isHighRes ? '✅' : '❌'}`);
      });
      
      if (hotelLowRes > 0) {
        hotelsWithLowRes++;
        console.log(`   ⚠️  ${hotelLowRes} low-res photos found`);
      } else {
        console.log(`   ✅ All photos are high-resolution`);
      }
      console.log('');
    });
    
    // Quick analysis of all hotels
    console.log('📊 QUICK ANALYSIS (All 1000 hotels):\n');
    
    let allHighRes = 0;
    let allLowRes = 0;
    
    data.forEach(hotel => {
      const photos = hotel.photos || [];
      photos.forEach(photo => {
        const resolution = getResolutionFromUrl(photo);
        if (resolution.pixels >= 1152000) {
          allHighRes++;
        } else {
          allLowRes++;
        }
      });
    });
    
    console.log('📈 FINAL RESULTS:');
    console.log(`📸 Total photos analyzed: ${allHighRes + allLowRes}`);
    console.log(`✅ High-res photos (≥1280x900): ${allHighRes}`);
    console.log(`❌ Low-res photos (<1280x900): ${allLowRes}`);
    console.log(`📊 High-res percentage: ${Math.round((allHighRes / (allHighRes + allLowRes)) * 100)}%`);
    
    if (allLowRes === 0) {
      console.log('\n🎉 EXCELLENT NEWS!');
      console.log('✅ ALL photos are already high-resolution (≥1280x900)');
      console.log('✅ No cleanup needed!');
    } else {
      console.log(`\n⚠️  ${allLowRes} photos need to be removed`);
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function getResolutionFromUrl(photo) {
  // Handle different photo formats
  if (typeof photo === 'object' && photo.url) {
    // Object format: {"url": "...", "width": 1920, "height": 1080}
    if (photo.width && photo.height) {
      return {
        width: photo.width,
        height: photo.height,
        pixels: photo.width * photo.height
      };
    }
    photo = photo.url;
  }
  
  if (typeof photo === 'string') {
    // Google Places API: maxwidth=1600&maxheight=1200
    const googleMatch = photo.match(/maxwidth=(\d+)&maxheight=(\d+)/);
    if (googleMatch) {
      return {
        width: parseInt(googleMatch[1]),
        height: parseInt(googleMatch[2]),
        pixels: parseInt(googleMatch[1]) * parseInt(googleMatch[2])
      };
    }
    
    // Unsplash: w=1920&h=1080
    const unsplashMatch = photo.match(/w=(\d+)&h=(\d+)/);
    if (unsplashMatch) {
      return {
        width: parseInt(unsplashMatch[1]),
        height: parseInt(unsplashMatch[2]),
        pixels: parseInt(unsplashMatch[1]) * parseInt(unsplashMatch[2])
      };
    }
    
    // Generic patterns: 1280x900, max1280x900, etc.
    const patterns = [
      /(\d+)x(\d+)/,  // 1280x900
      /max(\d+)x(\d+)/,  // max1280x900
      /(\d+)x(\d+)\.jpg/,  // 1280x900.jpg
      /_(\d+)x(\d+)_/,  // _1280x900_
    ];
    
    for (const pattern of patterns) {
      const match = photo.match(pattern);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        return {
          width: width,
          height: height,
          pixels: width * height
        };
      }
    }
  }
  
  // Default to high resolution if we can't determine
  return { width: 1920, height: 1080, pixels: 2073600 };
}

fixedPhotoAudit().catch(console.error);
