const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHotels() {
  console.log('🔍 CHECKING ALL HOTELS AND PHOTOS');
  console.log('='.repeat(50));
  
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
    let hotelsWithPhotos = 0;
    
    data.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      totalPhotos += photos.length;
      
      if (photos.length > 0) {
        hotelsWithPhotos++;
        console.log(`${index + 1}. ${hotel.name}`);
        console.log(`   📍 ${hotel.city}, ${hotel.country}`);
        console.log(`   📸 Photos: ${photos.length}`);
        
        // Check first few photo URLs for resolution patterns
        photos.slice(0, 3).forEach((url, i) => {
          const resolution = getResolutionFromUrl(url);
          console.log(`   ${i + 1}. ${url}`);
          console.log(`      Resolution: ${resolution.width}x${resolution.height} (${resolution.pixels} pixels)`);
        });
        console.log('');
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`📈 Total hotels: ${data.length}`);
    console.log(`📸 Hotels with photos: ${hotelsWithPhotos}`);
    console.log(`📸 Total photos: ${totalPhotos}`);
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function getResolutionFromUrl(url) {
  const patterns = [
    /(\d+)x(\d+)/,
    /max(\d+)x(\d+)/,
    /(\d+)x(\d+)\.jpg/,
    /_(\d+)x(\d+)_/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      return { width, height, pixels: width * height };
    }
  }
  
  return { width: 0, height: 0, pixels: 0 };
}

checkHotels().catch(console.error);
