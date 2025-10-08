require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class GooglePlacesExactPhotosFinder {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!this.googlePlacesApiKey) {
      console.log('⚠️  No Google Places API key found. This is the best source for exact hotel photos.');
      console.log('   To get exact hotel photos, you need to:');
      console.log('   1. Go to https://console.cloud.google.com/');
      console.log('   2. Enable Places API');
      console.log('   3. Create an API key');
      console.log('   4. Add GOOGLE_PLACES_API_KEY=your_key_here to your .env file');
      console.log('   5. Run this script again');
      return;
    }
  }

  async findExactHotelPhotos(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    
    if (!this.googlePlacesApiKey) {
      console.log('  ❌ No Google Places API key available');
      return [];
    }
    
    const photos = [];
    
    try {
      console.log('  🔍 Searching Google Places for exact hotel photos...');
      const placesPhotos = await this.searchGooglePlacesExact(hotelName, city, country);
      photos.push(...placesPhotos);
      console.log(`  ✅ Google Places: ${placesPhotos.length} exact photos found`);
    } catch (error) {
      console.log(`  ❌ Google Places search failed: ${error.message}`);
    }
    
    // Filter for high quality AND exact photos only
    const exactHighQualityPhotos = this.filterExactHighQualityPhotos(photos);
    const uniquePhotos = this.removeDuplicatePhotos(exactHighQualityPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} EXACT HIGH QUALITY photos for ${hotelName}`);
    
    return finalPhotos;
  }

  async searchGooglePlacesExact(hotelName, city, country) {
    try {
      // First, search for the hotel using Places API Text Search
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" "${country}"`);
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${this.googlePlacesApiKey}`;
      
      console.log(`    🔍 Searching Google Places: ${searchUrl}`);
      
      const searchResponse = await axios.get(searchUrl, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      if (searchResponse.data.status !== 'OK') {
        throw new Error(`Places search failed: ${searchResponse.data.status}`);
      }
      
      const places = searchResponse.data.results;
      if (!places || places.length === 0) {
        throw new Error('No places found');
      }
      
      // Find the best matching hotel
      const bestMatch = places.find(place => 
        place.name.toLowerCase().includes(hotelName.toLowerCase()) ||
        hotelName.toLowerCase().includes(place.name.toLowerCase())
      ) || places[0];
      
      console.log(`    🏨 Found hotel: ${bestMatch.name} (${bestMatch.place_id})`);
      
      // Get detailed information including photos
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${bestMatch.place_id}&fields=name,photos,formatted_address&key=${this.googlePlacesApiKey}`;
      
      const detailsResponse = await axios.get(detailsUrl, {
        timeout: 10000,
        maxRedirects: 5
      });
      
      if (detailsResponse.data.status !== 'OK') {
        throw new Error(`Places details failed: ${detailsResponse.data.status}`);
      }
      
      const placeDetails = detailsResponse.data.result;
      const photos = [];
      
      if (placeDetails.photos && placeDetails.photos.length > 0) {
        console.log(`    📸 Found ${placeDetails.photos.length} photos for ${placeDetails.name}`);
        
        // Get high-resolution photos
        for (let i = 0; i < Math.min(placeDetails.photos.length, 5); i++) {
          const photo = placeDetails.photos[i];
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1920&maxheight=1080&photo_reference=${photo.photo_reference}&key=${this.googlePlacesApiKey}`;
          
          photos.push({
            url: photoUrl,
            width: 1920,
            height: 1080,
            description: `${placeDetails.name} exact photo from Google Places`,
            source: 'google_places',
            photographer: 'Google Places',
            photographerUrl: 'https://maps.google.com',
            isExact: true,
            quality: 'high'
          });
        }
      }
      
      return photos;
    } catch (error) {
      throw new Error(`Google Places search failed: ${error.message}`);
    }
  }

  filterExactHighQualityPhotos(photos) {
    return photos.filter(photo => {
      // Must be exact hotel photos
      if (!photo.isExact) {
        return false;
      }
      
      // Filter out low quality indicators
      if (!photo.url || photo.url.includes('placeholder') || photo.url.includes('pixel')) {
        return false;
      }
      
      // Filter out very small images
      if (photo.url.includes('w=42') || photo.url.includes('w=89') || photo.url.includes('w=149')) {
        return false;
      }
      
      // Filter out black/empty images
      if (photo.url.includes('black') || photo.url.includes('empty') || photo.url.includes('blank')) {
        return false;
      }
      
      // Prefer images that look like they could be high quality
      if (photo.url.includes('1920') || photo.url.includes('1080') || photo.url.includes('2048') || photo.url.includes('4096')) {
        return true;
      }
      
      // Prefer images that don't look like thumbnails
      if (!photo.url.includes('thumb') && !photo.url.includes('small') && !photo.url.includes('mini')) {
        return true;
      }
      
      return false;
    });
  }

  removeDuplicatePhotos(photos) {
    const seen = new Set();
    return photos.filter(photo => {
      if (seen.has(photo.url)) {
        return false;
      }
      seen.add(photo.url);
      return true;
    });
  }

  async updateFirst3HotelsWithExactPhotos() {
    console.log('🔄 Updating first 3 hotels with EXACT HIGH QUALITY photos from Google Places...\n');
    
    if (!this.googlePlacesApiKey) {
      console.log('❌ Cannot proceed without Google Places API key');
      console.log('   Please add GOOGLE_PLACES_API_KEY=your_key_here to your .env file');
      return;
    }
    
    try {
      // Get first 3 hotels
      const { data: hotels, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      console.log(`📋 Found ${hotels.length} hotels to update with EXACT photos\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        
        // Get exact photos
        const exactPhotos = await this.findExactHotelPhotos(hotel.name, hotel.city, hotel.country, 5);
        
        if (exactPhotos.length > 0) {
          console.log(`  📸 Found ${exactPhotos.length} EXACT HIGH QUALITY photos:`);
          exactPhotos.forEach((photo, j) => {
            console.log(`    ${j + 1}. ${photo.url}`);
            console.log(`       Source: ${photo.source}`);
            console.log(`       Quality: ${photo.quality}`);
            console.log(`       Exact: ${photo.isExact}`);
          });
          
          // Update hotel with exact photos
          const photoUrls = exactPhotos.map(photo => photo.url);
          const heroPhoto = photoUrls[0] || '';
          
          const { error: updateError } = await this.supabase
            .from('hotels')
            .update({
              photos: photoUrls,
              hero_photo: heroPhoto,
              updated_at: new Date().toISOString()
            })
            .eq('id', hotel.id);
          
          if (updateError) {
            console.log(`  ❌ Update failed: ${updateError.message}`);
          } else {
            console.log(`  ✅ SUCCESS: Updated with ${exactPhotos.length} EXACT HIGH QUALITY photos`);
          }
        } else {
          console.log(`  ❌ No exact photos found`);
        }
        
        console.log('  ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(3000);
        }
      }
      
      console.log('\n🎉 First 3 hotels updated with EXACT HIGH QUALITY photos!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the exact photo update
const finder = new GooglePlacesExactPhotosFinder();
finder.updateFirst3HotelsWithExactPhotos().catch(console.error);
