const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditUnsplashPhotos() {
  console.log('🔍 AUDITING UNSPLASH PHOTOS');
  console.log('='.repeat(60));
  console.log('🎯 Checking if Unsplash photos are valid and accessible');
  
  try {
    // Get hotels with Unsplash photos
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for Unsplash photos\n`);
    
    let unsplashCount = 0;
    let validUnsplashCount = 0;
    let invalidUnsplashCount = 0;
    let sampleUrls = [];
    
    data.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      let hasUnsplash = false;
      
      photos.forEach((photo, i) => {
        const source = getPhotoSource(photo);
        if (source === 'Unsplash' || source === 'unsplash_curated') {
          hasUnsplash = true;
          unsplashCount++;
          
          const url = getImageUrl(photo);
          if (url && url.includes('unsplash.com')) {
            validUnsplashCount++;
            if (sampleUrls.length < 5) {
              sampleUrls.push({
                hotel: hotel.name,
                url: url,
                source: source
              });
            }
          } else {
            invalidUnsplashCount++;
            console.log(`❌ Invalid Unsplash URL in ${hotel.name}:`);
            console.log(`   Photo ${i + 1}: ${url}`);
          }
        }
      });
      
      if (hasUnsplash) {
        console.log(`${index + 1}. ${hotel.name}`);
        console.log(`   📍 ${hotel.city}, ${hotel.country}`);
        console.log(`   📸 Has Unsplash photos: ${photos.filter(p => getPhotoSource(p) === 'Unsplash' || getPhotoSource(p) === 'unsplash_curated').length}`);
      }
    });
    
    console.log('\n📊 UNSPLASH AUDIT SUMMARY:');
    console.log(`📸 Total Unsplash photos found: ${unsplashCount}`);
    console.log(`✅ Valid Unsplash URLs: ${validUnsplashCount}`);
    console.log(`❌ Invalid Unsplash URLs: ${invalidUnsplashCount}`);
    
    if (sampleUrls.length > 0) {
      console.log('\n🔗 SAMPLE UNSPLASH URLS:');
      sampleUrls.forEach((sample, index) => {
        console.log(`${index + 1}. ${sample.hotel}`);
        console.log(`   Source: ${sample.source}`);
        console.log(`   URL: ${sample.url}`);
        console.log('');
      });
    }
    
    // Test a few URLs
    if (sampleUrls.length > 0) {
      console.log('🧪 TESTING SAMPLE URLS:');
      for (let i = 0; i < Math.min(3, sampleUrls.length); i++) {
        const sample = sampleUrls[i];
        console.log(`\nTesting ${sample.hotel}:`);
        console.log(`URL: ${sample.url}`);
        
        try {
          const response = await fetch(sample.url, { method: 'HEAD' });
          console.log(`Status: ${response.status} ${response.statusText}`);
          console.log(`Content-Type: ${response.headers.get('content-type')}`);
          console.log(`Content-Length: ${response.headers.get('content-length')}`);
          
          if (response.status === 200) {
            console.log('✅ URL is accessible');
          } else {
            console.log('❌ URL is not accessible');
          }
        } catch (error) {
          console.log(`❌ Error testing URL: ${error.message}`);
        }
      }
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

auditUnsplashPhotos().catch(console.error);
