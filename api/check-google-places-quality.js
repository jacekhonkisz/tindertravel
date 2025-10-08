const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGooglePlacesQuality() {
  console.log('🔍 CHECKING GOOGLE PLACES PHOTO QUALITY');
  console.log('='.repeat(60));
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for Google Places photos\n`);
    
    let googlePlacesCount = 0;
    let qualityIssues = 0;
    
    data.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      const googlePhotos = photos.filter(photo => 
        typeof photo === 'string' && photo.includes('maps.googleapis.com')
      );
      
      if (googlePhotos.length > 0) {
        googlePlacesCount++;
        console.log(`${index + 1}. ${hotel.name}`);
        console.log(`   📍 ${hotel.city}, ${hotel.country}`);
        console.log(`   �� Google Places photos: ${googlePhotos.length}`);
        
        googlePhotos.slice(0, 2).forEach((photo, i) => {
          const analysis = analyzeGooglePlacesPhoto(photo);
          console.log(`   ${i + 1}. ${analysis.url}`);
          console.log(`      Resolution: ${analysis.width}x${analysis.height}`);
          console.log(`      Quality: ${analysis.quality}`);
          console.log(`      Issues: ${analysis.issues.join(', ') || 'None'}`);
          
          if (analysis.issues.length > 0) {
            qualityIssues++;
          }
        });
        console.log('');
      }
    });
    
    console.log('📊 SUMMARY:');
    console.log(`🏨 Hotels with Google Places photos: ${googlePlacesCount}`);
    console.log(`⚠️ Photos with quality issues: ${qualityIssues}`);
    
    if (qualityIssues > 0) {
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Update Google Places API calls to use higher resolution:');
      console.log('   • Change maxwidth=1600 to maxwidth=1920');
      console.log('   • Change maxheight=1200 to maxheight=1080');
      console.log('2. Add quality parameter to Google Places API calls');
      console.log('3. Consider using multiple image sizes for different screen densities');
    } else {
      console.log('\n✅ No quality issues detected in Google Places photos');
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function analyzeGooglePlacesPhoto(url) {
  const analysis = {
    url: url.substring(0, 100) + '...',
    width: 0,
    height: 0,
    quality: 'Unknown',
    issues: []
  };
  
  // Extract dimensions
  const maxWidthMatch = url.match(/maxwidth=(\d+)/);
  const maxHeightMatch = url.match(/maxheight=(\d+)/);
  
  if (maxWidthMatch && maxHeightMatch) {
    analysis.width = parseInt(maxWidthMatch[1]);
    analysis.height = parseInt(maxHeightMatch[1]);
    
    // Determine quality level
    if (analysis.width >= 1920 && analysis.height >= 1080) {
      analysis.quality = 'High (Full HD+)';
    } else if (analysis.width >= 1600 && analysis.height >= 1200) {
      analysis.quality = 'Medium-High';
    } else if (analysis.width >= 1280 && analysis.height >= 900) {
      analysis.quality = 'Medium';
    } else {
      analysis.quality = 'Low';
    }
    
    // Check for issues
    if (analysis.width < 1920) {
      analysis.issues.push('Width below Full HD (1920)');
    }
    if (analysis.height < 1080) {
      analysis.issues.push('Height below Full HD (1080)');
    }
    if (analysis.width < 1600) {
      analysis.issues.push('Width below recommended minimum (1600)');
    }
    if (analysis.height < 1200) {
      analysis.issues.push('Height below recommended minimum (1200)');
    }
  }
  
  return analysis;
}

checkGooglePlacesQuality().catch(console.error);
