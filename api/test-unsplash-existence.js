const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUnsplashExistence() {
  console.log('🔍 TESTING UNSPLASH PHOTO EXISTENCE');
  console.log('='.repeat(60));
  console.log('🎯 Checking if Unsplash photos actually exist and are accessible');
  
  try {
    // Get a few hotels with Unsplash photos
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Testing ${data.length} hotels for Unsplash photo existence\n`);
    
    let totalUnsplashPhotos = 0;
    let existingPhotos = 0;
    let missingPhotos = 0;
    let errorPhotos = 0;
    
    for (const hotel of data) {
      const photos = hotel.photos || [];
      let hotelUnsplashCount = 0;
      
      console.log(`🏨 ${hotel.name}`);
      console.log(`📍 ${hotel.city}, ${hotel.country}`);
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const source = getPhotoSource(photo);
        
        if (source === 'Unsplash' || source === 'unsplash_curated') {
          hotelUnsplashCount++;
          totalUnsplashPhotos++;
          
          const url = getImageUrl(photo);
          console.log(`  📸 Photo ${i + 1}: ${source}`);
          console.log(`     URL: ${url}`);
          
          try {
            const response = await fetch(url, { 
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ReactNative/1.0)',
                'Accept': 'image/*',
              }
            });
            
            console.log(`     Status: ${response.status} ${response.statusText}`);
            console.log(`     Content-Type: ${response.headers.get('content-type')}`);
            console.log(`     Content-Length: ${response.headers.get('content-length')}`);
            
            if (response.status === 200) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                console.log('     ✅ Photo exists and is accessible');
                existingPhotos++;
              } else {
                console.log('     ❌ Response is not an image');
                errorPhotos++;
              }
            } else if (response.status === 404) {
              console.log('     ❌ Photo not found (404)');
              missingPhotos++;
            } else if (response.status === 403) {
              console.log('     ❌ Access forbidden (403)');
              errorPhotos++;
            } else {
              console.log(`     ❌ Unexpected status: ${response.status}`);
              errorPhotos++;
            }
          } catch (fetchError) {
            console.log(`     ❌ Network error: ${fetchError.message}`);
            errorPhotos++;
          }
          
          console.log('');
        }
      }
      
      console.log(`  📊 Unsplash photos in this hotel: ${hotelUnsplashCount}`);
      console.log('');
    }
    
    console.log('📊 UNSPLASH EXISTENCE SUMMARY:');
    console.log(`📸 Total Unsplash photos tested: ${totalUnsplashPhotos}`);
    console.log(`✅ Existing and accessible: ${existingPhotos}`);
    console.log(`❌ Missing (404): ${missingPhotos}`);
    console.log(`⚠️  Errors (403, network, etc.): ${errorPhotos}`);
    
    if (missingPhotos > 0) {
      console.log('\n🚨 ISSUE FOUND:');
      console.log(`${missingPhotos} Unsplash photos are missing (404 errors)`);
      console.log('This means the photos were deleted or URLs are invalid');
    }
    
    if (errorPhotos > 0) {
      console.log('\n⚠️  WARNING:');
      console.log(`${errorPhotos} Unsplash photos have access issues`);
      console.log('This could be due to CORS, authentication, or network issues');
    }
    
    if (existingPhotos === totalUnsplashPhotos) {
      console.log('\n✅ ALL UNSPLASH PHOTOS ARE ACCESSIBLE');
      console.log('The issue might be with React Native image loading');
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function getPhotoSource(photo) {
  // If it's a JSON string, try to parse it
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
    } catch (e) {
      // If parsing fails, fall through to URL detection
    }
  }
  
  // If it's an object with source property
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
  // If it's a string URL, try to detect source
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';
    } else if (photo.includes('serpapi')) {
      return 'SerpAPI';
    }
  }
  
  return 'Unknown';
}

function getImageUrl(photo) {
  // If it's a JSON string, try to parse it and extract URL
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (e) {
      // If parsing fails, fall through to direct usage
    }
  }
  
  // If it's an object with url property
  if (typeof photo === 'object' && photo && photo.url) {
    return photo.url;
  }
  
  // If it's already a string URL, use it directly
  if (typeof photo === 'string') {
    return photo;
  }
  
  // Fallback
  return '';
}

testUnsplashExistence().catch(console.error);
