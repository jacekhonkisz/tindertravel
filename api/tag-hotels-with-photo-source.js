const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class HotelPhotoSourceTagger {
  constructor() {
    this.apiBaseUrl = 'http://localhost:3001';
    
    // Supabase credentials
    this.supabaseUrl = 'https://qlpxseihykemsblusojx.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs';
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      total: 0,
      tagged: 0,
      failed: 0
    };
  }

  async tagHotelsWithPhotoSource() {
    console.log('🏷️ Tagging hotels with photo source information...');
    console.log(`🔗 Using Supabase: ${this.supabaseUrl}`);
    
    try {
      // Read the hotel list from the file
      const fs = require('fs');
      const fileContent = fs.readFileSync('hotel-photo-sources.txt', 'utf8');
      
      // Parse the file to get hotel categories
      const serpApiAvailable = this.parseHotelList(fileContent, 'SERPAPI PHOTOS AVAILABLE (CAN UPDATE)');
      const googlePlacesOnly = this.parseHotelList(fileContent, 'GOOGLE PLACES ONLY');
      
      console.log(`📊 Found ${serpApiAvailable.length} hotels with SerpApi photos available`);
      console.log(`📊 Found ${googlePlacesOnly.length} hotels with Google Places only`);
      
      this.stats.total = serpApiAvailable.length + googlePlacesOnly.length;
      
      // Tag hotels with SerpApi photos available
      for (const hotelName of serpApiAvailable) {
        await this.tagHotel(hotelName, 'serpapi_available');
      }
      
      // Tag hotels with Google Places only
      for (const hotelName of googlePlacesOnly) {
        await this.tagHotel(hotelName, 'google_places_only');
      }
      
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Tagging failed:', error.message);
    }
  }

  parseHotelList(content, section) {
    const lines = content.split('\n');
    const hotels = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.includes(section)) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        if (line.startsWith('- ')) {
          hotels.push(line.substring(2).trim());
        } else if (line.startsWith('##')) {
          break; // Next section
        }
      }
    }
    
    return hotels;
  }

  async tagHotel(hotelName, photoSource) {
    try {
      console.log(`\n🔍 Tagging ${hotelName} with ${photoSource}...`);
      
      // Find the hotel by name
      const { data: hotels, error: searchError } = await this.supabase
        .from('hotels')
        .select('id, name')
        .ilike('name', `%${hotelName}%`);
      
      if (searchError) {
        console.log(`   ⚠️ Search error: ${searchError.message}`);
        this.stats.failed++;
        return;
      }
      
      if (!hotels || hotels.length === 0) {
        console.log(`   ⚠️ Hotel not found: ${hotelName}`);
        this.stats.failed++;
        return;
      }
      
      const hotel = hotels[0];
      
      // Update hotel with photo source in description field (as a workaround)
      const { error: updateError } = await this.supabase
        .from('hotels')
        .update({ 
          description: `${hotel.description || ''}\n\n[PHOTO_SOURCE: ${photoSource}]`,
          updated_at: new Date().toISOString()
        })
        .eq('id', hotel.id);
      
      if (updateError) {
        console.log(`   ⚠️ Update error: ${updateError.message}`);
        this.stats.failed++;
      } else {
        console.log(`   ✅ Tagged: ${photoSource}`);
        this.stats.tagged++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error tagging hotel: ${error.message}`);
      this.stats.failed++;
    }
  }

  generateSummary() {
    console.log('\n📊 HOTEL TAGGING SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Hotels Processed: ${this.stats.total}`);
    console.log(`Successfully Tagged: ${this.stats.tagged}`);
    console.log(`Failed: ${this.stats.failed}`);
    
    console.log('\n🏷️ TAGS ADDED:');
    console.log('• "serpapi_available" - SerpApi has photos for this hotel');
    console.log('• "google_places_only" - Only Google Places photos available');
    
    console.log('\n🎯 USAGE GUIDE:');
    console.log('1. Hotels tagged with "serpapi_available" - Can be updated with SerpApi photos');
    console.log('2. Hotels tagged with "google_places_only" - Only Google Places photos available');
    console.log('3. Check hotel description field for [PHOTO_SOURCE: tag] to identify photo source');
    console.log('4. Use these tags to avoid touching hotels with SerpApi photos');
    
    console.log('\n📋 QUERY EXAMPLES:');
    console.log('-- Get hotels with SerpApi photos available:');
    console.log('SELECT * FROM hotels WHERE description LIKE \'%PHOTO_SOURCE: serpapi_available%\';');
    console.log('-- Get hotels with only Google Places photos:');
    console.log('SELECT * FROM hotels WHERE description LIKE \'%PHOTO_SOURCE: google_places_only%\';');
  }
}

// Run the tagging
async function runTagging() {
  const tagger = new HotelPhotoSourceTagger();
  await tagger.tagHotelsWithPhotoSource();
}

runTagging();
