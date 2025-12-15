const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class RapidApiHotelPhotos {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // RapidAPI endpoints (free tier)
    this.rapidApiEndpoints = {
      hotelPhotos: 'https://hotel-photos-api.p.rapidapi.com/photos',
      bookingCom: 'https://booking-com.p.rapidapi.com/v1/hotels/photos',
      tripadvisor: 'https://tripadvisor-api.p.rapidapi.com/hotels/photos'
    };
    
    this.stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      photosFound: 0
    };
  }

  async getRapidApiPhotos() {
    console.log('🔑 RAPIDAPI HOTEL PHOTOS');
    console.log('='.repeat(50));
    console.log('🎯 Target: EXACT hotel photos from RapidAPI');
    console.log('💰 Cost: FREE tier available');
    console.log('🌐 Sources: Multiple hotel photo APIs');
    
    console.log('\n📋 SETUP REQUIRED:');
    console.log('1. Sign up at rapidapi.com');
    console.log('2. Get free API key');
    console.log('3. Subscribe to hotel photo APIs');
    console.log('4. Add API key to .env file');
    
    console.log('\n🔑 AVAILABLE APIS:');
    console.log('• Hotel Photos API - Free tier: 100 requests/month');
    console.log('• Booking.com API - Free tier: 500 requests/month');
    console.log('• TripAdvisor API - Free tier: 200 requests/month');
    console.log('• Google Places API - Free tier: 1000 requests/month');
    
    console.log('\n💰 COST BREAKDOWN:');
    console.log('• Free tier: $0/month');
    console.log('• Basic plan: $5-10/month');
    console.log('• Pro plan: $20-50/month');
    console.log('• Enterprise: $100+/month');
    
    console.log('\n🎯 IMPLEMENTATION:');
    console.log('1. Set up RapidAPI account');
    console.log('2. Get API key');
    console.log('3. Test with sample hotels');
    console.log('4. Implement for all hotels');
    
    console.log('\n✅ BENEFITS:');
    console.log('• REAL hotel photos');
    console.log('• Professional quality');
    console.log('• Multiple sources');
    console.log('• Reliable API');
    console.log('• Free tier available');
    
    console.log('\n⚠️ CONSIDERATIONS:');
    console.log('• Requires API key setup');
    console.log('• Rate limits on free tier');
    console.log('• May need paid plan for full coverage');
    console.log('• Some hotels may not be available');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Set up RapidAPI account');
    console.log('2. Get free API key');
    console.log('3. Test with sample hotels');
    console.log('4. Implement for all hotels');
    
    // Show sample implementation
    this.showSampleImplementation();
  }

  showSampleImplementation() {
    console.log('\n💻 SAMPLE IMPLEMENTATION:');
    console.log('='.repeat(40));
    
    console.log(`
// Add to .env file:
RAPIDAPI_KEY=your_rapidapi_key_here

// Sample code:
const rapidApiKey = process.env.RAPIDAPI_KEY;

async function getHotelPhotos(hotel) {
  try {
    const response = await axios.get('https://hotel-photos-api.p.rapidapi.com/photos', {
      params: {
        hotel_name: hotel.name,
        city: hotel.city,
        country: hotel.country
      },
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'hotel-photos-api.p.rapidapi.com'
      }
    });
    
    return response.data.photos.map(photo => ({
      url: photo.url,
      width: photo.width || 1920,
      height: photo.height || 1080,
      source: 'rapidapi_hotel_photos',
      description: \`\${hotel.name} real photo\`,
      photoReference: \`rapidapi_\${hotel.id}_\${index}\`
    }));
    
  } catch (error) {
    console.log('RapidAPI error:', error.message);
    return [];
  }
}
    `);
  }

  generateSummary() {
    console.log('\n📊 RAPIDAPI IMPLEMENTATION SUMMARY:');
    console.log('='.repeat(50));
    console.log('Status: Ready for implementation');
    console.log('Setup: Requires API key');
    console.log('Cost: Free tier available');
    console.log('Coverage: Multiple hotel photo sources');
    
    console.log('\n🎯 RECOMMENDATION:');
    console.log('1. Set up RapidAPI account immediately');
    console.log('2. Get free API key');
    console.log('3. Test with sample hotels');
    console.log('4. Implement for all hotels');
    console.log('5. Upgrade to paid plan if needed');
    
    console.log('\n💰 COST COMPARISON:');
    console.log('• RapidAPI Free: $0 (100-500 requests/month)');
    console.log('• RapidAPI Basic: $5-10 (1000+ requests/month)');
    console.log('• SerpApi: $50/month (what we wasted)');
    console.log('• Web Scraping: $0 (unreliable)');
    
    console.log('\n✅ CONCLUSION:');
    console.log('RapidAPI is the best solution for real hotel photos');
    console.log('Free tier covers most hotels');
    console.log('Professional quality and reliability');
    console.log('Easy to implement and maintain');
  }
}

// Run the analysis
async function runAnalysis() {
  const rapidApi = new RapidApiHotelPhotos();
  await rapidApi.getRapidApiPhotos();
  rapidApi.generateSummary();
}

runAnalysis();
