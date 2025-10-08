const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
const supabase = createClient(supabaseUrl, supabaseKey);

class BookingSearchTester {
  constructor() {
    this.apiKey = '16a8c91176msh728dc775b0ebbb4p15464ajsn09d3e69bcd89';
    this.apiHost = 'booking-com.p.rapidapi.com';
  }

  async testSearch() {
    console.log('🔍 TESTING BOOKING.COM SEARCH API');
    console.log('='.repeat(50));
    
    try {
      // Get a few hotels with Unsplash photos
      const { data: hotels, error } = await supabase
        .from('hotels')
        .select('id, name, city, country, photos')
        .limit(5);

      if (error) {
        console.error('Error:', error);
        return;
      }

      for (const hotel of hotels) {
        const hasUnsplash = this.hasUnsplashPhotos(hotel.photos);
        if (hasUnsplash) {
          console.log(`\n🏨 Testing: ${hotel.name} (${hotel.city}, ${hotel.country})`);
          await this.testHotelSearch(hotel);
        }
      }

    } catch (error) {
      console.error('Error:', error);
    }
  }

  hasUnsplashPhotos(photos) {
    if (!photos || !Array.isArray(photos)) return false;
    
    return photos.some(photo => {
      const photoObj = typeof photo === 'string' ? JSON.parse(photo) : photo;
      const source = photoObj.source || photoObj.photoReference || '';
      return source.includes('unsplash') || source.includes('Unsplash');
    });
  }

  async testHotelSearch(hotel) {
    try {
      const searchQuery = `${hotel.name} ${hotel.city}`;
      console.log(`   🔍 Searching: "${searchQuery}"`);
      
      const response = await fetch(`https://${this.apiHost}/v1/hotels/search?query=${encodeURIComponent(searchQuery)}&locale=en-gb`, {
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        console.log(`   ❌ Search failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`   ✅ Found ${data.results.length} results`);
        
        // Show top 3 matches
        data.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i+1}. ${result.name} (ID: ${result.hotel_id})`);
        });
        
        // Test photos for first match
        const firstMatch = data.results[0];
        console.log(`   📸 Testing photos for: ${firstMatch.name}`);
        await this.testPhotos(firstMatch.hotel_id);
        
      } else {
        console.log(`   ❌ No results found`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  async testPhotos(hotelId) {
    try {
      const response = await fetch(`https://${this.apiHost}/v1/hotels/photos?hotel_id=${hotelId}&locale=en-gb`, {
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        console.log(`   ❌ Photos failed: ${response.status}`);
        return;
      }

      const photos = await response.json();
      console.log(`   ✅ Found ${photos.length} photos`);
      
      // Show photo details
      photos.slice(0, 3).forEach((photo, i) => {
        const tags = photo.tags ? photo.tags.map(t => t.tag).join(', ') : 'No tags';
        console.log(`   ${i+1}. ${tags} (${photo.url_max ? 'High-res' : 'Standard'})`);
      });

    } catch (error) {
      console.log(`   ❌ Photos error: ${error.message}`);
    }
  }
}

const tester = new BookingSearchTester();
tester.testSearch().catch(console.error);
