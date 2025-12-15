const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePixelationIssues() {
  console.log('🔍 DIAGNOSING PIXELATION ISSUES');
  console.log('='.repeat(60));
  console.log('🎯 Analyzing photo quality and display issues');
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} sample hotels\n`);
    
    data.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name}`);
      console.log(`   📍 ${hotel.city}, ${hotel.country}`);
      
      const photos = hotel.photos || [];
      console.log(`   📸 Photos: ${photos.length}`);
      
      // Analyze first few photos
      photos.slice(0, 3).forEach((photo, i) => {
        const analysis = analyzePhotoForPixelation(photo);
        console.log(`   ${i + 1}. ${analysis.type}`);
        console.log(`      Resolution: ${analysis.width}x${analysis.height}`);
        console.log(`      Quality Issues: ${analysis.issues.join(', ') || 'None detected'}`);
        console.log(`      Recommendations: ${analysis.recommendations.join(', ')}`);
      });
      console.log('');
    });
    
    console.log('🔧 PIXELATION SOLUTIONS:');
    console.log('='.repeat(60));
    console.log('1. 📱 SCREEN DENSITY ISSUES:');
    console.log('   • Problem: Images scaled down from high-res to screen size');
    console.log('   • Solution: Use proper resizeMode and contentFit settings');
    console.log('');
    console.log('2. 🖼️ IMAGE COMPRESSION:');
    console.log('   • Problem: Google Places API may compress images');
    console.log('   • Solution: Request higher quality parameters');
    console.log('');
    console.log('3. 📐 ASPECT RATIO MISMATCH:');
    console.log('   • Problem: Images stretched/distorted during scaling');
    console.log('   • Solution: Use contentFit="cover" with proper dimensions');
    console.log('');
    console.log('4. 🚀 PERFORMANCE OPTIMIZATION:');
    console.log('   • Problem: React Native may downsample for performance');
    console.log('   • Solution: Use expo-image with quality settings');
    console.log('');
    console.log('5. 📱 DEVICE-SPECIFIC ISSUES:');
    console.log('   • Problem: Different screen densities (1x, 2x, 3x)');
    console.log('   • Solution: Provide multiple image resolutions');
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function analyzePhotoForPixelation(photo) {
  const analysis = {
    type: 'Unknown',
    width: 0,
    height: 0,
    issues: [],
    recommendations: []
  };
  
  // Handle different photo formats
  if (typeof photo === 'object' && photo.url) {
    analysis.type = 'Object Format';
    if (photo.width && photo.height) {
      analysis.width = photo.width;
      analysis.height = photo.height;
    }
    photo = photo.url;
  }
  
  if (typeof photo === 'string') {
    // Google Places API analysis
    if (photo.includes('maps.googleapis.com')) {
      analysis.type = 'Google Places API';
      
      // Extract dimensions from URL
      const maxWidthMatch = photo.match(/maxwidth=(\d+)/);
      const maxHeightMatch = photo.match(/maxheight=(\d+)/);
      
      if (maxWidthMatch && maxHeightMatch) {
        analysis.width = parseInt(maxWidthMatch[1]);
        analysis.height = parseInt(maxHeightMatch[1]);
        
        // Check for potential issues
        if (analysis.width < 1920) {
          analysis.issues.push('Low maxwidth parameter');
          analysis.recommendations.push('Increase maxwidth to 1920+');
        }
        if (analysis.height < 1080) {
          analysis.issues.push('Low maxheight parameter');
          analysis.recommendations.push('Increase maxheight to 1080+');
        }
      }
    }
    
    // Unsplash analysis
    else if (photo.includes('unsplash.com')) {
      analysis.type = 'Unsplash';
      
      const widthMatch = photo.match(/w=(\d+)/);
      const heightMatch = photo.match(/h=(\d+)/);
      
      if (widthMatch && heightMatch) {
        analysis.width = parseInt(widthMatch[1]);
        analysis.height = parseInt(heightMatch[1]);
        
        if (analysis.width < 1920) {
          analysis.issues.push('Low width parameter');
          analysis.recommendations.push('Increase w parameter to 1920+');
        }
        if (analysis.height < 1080) {
          analysis.issues.push('Low height parameter');
          analysis.recommendations.push('Increase h parameter to 1080+');
        }
      }
    }
    
    // Generic URL analysis
    else {
      analysis.type = 'Generic URL';
      const patterns = [/(\d+)x(\d+)/, /max(\d+)x(\d+)/];
      
      for (const pattern of patterns) {
        const match = photo.match(pattern);
        if (match) {
          analysis.width = parseInt(match[1]);
          analysis.height = parseInt(match[2]);
          break;
        }
      }
    }
  }
  
  // General quality checks
  if (analysis.width > 0 && analysis.height > 0) {
    const pixels = analysis.width * analysis.height;
    
    if (pixels < 1920 * 1080) {
      analysis.issues.push('Below Full HD resolution');
      analysis.recommendations.push('Use higher resolution images');
    }
    
    // Check aspect ratio
    const aspectRatio = analysis.width / analysis.height;
    if (aspectRatio < 1.5 || aspectRatio > 2.0) {
      analysis.issues.push('Non-standard aspect ratio');
      analysis.recommendations.push('Use 16:9 or 4:3 aspect ratios');
    }
  }
  
  return analysis;
}

diagnosePixelationIssues().catch(console.error);
