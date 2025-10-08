const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnsplashDiversity() {
  console.log('🔍 CHECKING UNSPLASH PHOTO DIVERSITY');
  console.log('='.repeat(60));
  console.log('🎯 Checking if Unsplash photos are hotel-specific or generic');
  
  try {
    // Get more hotels to check diversity
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📋 Analyzing ${data.length} hotels for photo diversity\n`);
    
    const photoIds = new Set();
    const hotelPhotoMap = new Map();
    
    data.forEach((hotel, index) => {
      const photos = hotel.photos || [];
      const hotelPhotoIds = [];
      
      photos.forEach((photo, i) => {
        const source = getPhotoSource(photo);
        
        if (source === 'Unsplash' || source === 'unsplash_curated') {
          const url = getImageUrl(photo);
          const photoId = extractPhotoId(url);
          
          if (photoId) {
            photoIds.add(photoId);
            hotelPhotoIds.push(photoId);
          }
        }
      });
      
      if (hotelPhotoIds.length > 0) {
        hotelPhotoMap.set(hotel.name, hotelPhotoIds);
      }
    });
    
    console.log('📊 PHOTO DIVERSITY ANALYSIS:');
    console.log(`🔢 Total unique photo IDs: ${photoIds.size}`);
    console.log(`🏨 Hotels with Unsplash photos: ${hotelPhotoMap.size}`);
    
    if (photoIds.size <= 10) {
      console.log('\n🚨 ISSUE FOUND:');
      console.log('Very few unique photo IDs - photos are likely generic placeholders');
      console.log('This means all hotels are showing the same generic images');
    }
    
    console.log('\n🔗 UNIQUE PHOTO IDS:');
    Array.from(photoIds).forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    console.log('\n🏨 HOTEL PHOTO BREAKDOWN:');
    hotelPhotoMap.forEach((photoIds, hotelName) => {
      console.log(`${hotelName}:`);
      console.log(`  Photos: ${photoIds.length}`);
      console.log(`  IDs: ${photoIds.join(', ')}`);
    });
    
    // Check if photos are actually hotel-related
    console.log('\n🧪 TESTING PHOTO RELEVANCE:');
    const samplePhotoIds = Array.from(photoIds).slice(0, 3);
    
    for (const photoId of samplePhotoIds) {
      const url = `https://images.unsplash.com/photo-${photoId}?w=1920&h=1080&fit=crop`;
      console.log(`\nPhoto ID: ${photoId}`);
      console.log(`URL: ${url}`);
      
      try {
        // Try to get photo info from Unsplash API (if available)
        const response = await fetch(`https://unsplash.com/photos/${photoId}`);
        if (response.status === 200) {
          console.log('✅ Photo exists on Unsplash');
        } else {
          console.log(`❌ Photo not found on Unsplash (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ Error checking photo: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Failed:', error);
  }
}

function getPhotoSource(photo) {
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
    } catch (e) {
      // fall through
    }
  }
  
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
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
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (e) {
      // fall through
    }
  }
  
  if (typeof photo === 'object' && photo && photo.url) {
    return photo.url;
  }
  
  if (typeof photo === 'string') {
    return photo;
  }
  
  return '';
}

function extractPhotoId(url) {
  const match = url.match(/photo-(\d+)/);
  return match ? match[1] : null;
}

checkUnsplashDiversity().catch(console.error);
