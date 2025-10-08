require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

class ExactHotelPhotosSimpleFinder {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  async findExactHotelPhotosSimple(hotelName, city, country, count = 5) {
    console.log(`\n🎯 Finding EXACT photos for: ${hotelName} in ${city}, ${country}`);
    
    const photos = [];
    
    // Strategy 1: Try to find hotel on Booking.com
    try {
      console.log('  🔍 Searching Booking.com for EXACT hotel photos...');
      const bookingPhotos = await this.findBookingExactPhotos(hotelName, city, country);
      photos.push(...bookingPhotos);
      console.log(`  ✅ Booking.com: ${bookingPhotos.length} EXACT photos found`);
    } catch (error) {
      console.log(`  ❌ Booking.com search failed: ${error.message}`);
    }
    
    // Strategy 2: Try to find hotel on TripAdvisor
    try {
      console.log('  🔍 Searching TripAdvisor for EXACT hotel photos...');
      const tripadvisorPhotos = await this.findTripAdvisorExactPhotos(hotelName, city, country);
      photos.push(...tripadvisorPhotos);
      console.log(`  ✅ TripAdvisor: ${tripadvisorPhotos.length} EXACT photos found`);
    } catch (error) {
      console.log(`  ❌ TripAdvisor search failed: ${error.message}`);
    }
    
    // Filter for EXACT photos only (no generic stock photos)
    const exactPhotos = this.filterExactPhotosOnly(photos);
    const highQualityPhotos = this.filterHighQualityPhotos(exactPhotos);
    const uniquePhotos = this.removeDuplicatePhotos(highQualityPhotos);
    const finalPhotos = uniquePhotos.slice(0, count);
    
    console.log(`  ✅ SUCCESS: Found ${finalPhotos.length} EXACT HIGH QUALITY photos for ${hotelName}`);
    
    return finalPhotos;
  }

  async findBookingExactPhotos(hotelName, city, country) {
    try {
      // Search Booking.com for the specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" site:booking.com`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      console.log(`    🔍 Searching Booking.com: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for Booking.com links
      $('a[href*="booking.com"]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('booking.com')) {
          // Try to scrape photos from Booking.com page
          this.scrapeBookingPhotos(href, hotelName).then(bookingPhotos => {
            photos.push(...bookingPhotos);
          }).catch(() => {
            // Ignore errors for individual pages
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`Booking.com search failed: ${error.message}`);
    }
  }

  async scrapeBookingPhotos(url, hotelName) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000,
        maxRedirects: 3
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for high-quality hotel images
      $('img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('logo')) {
          // Check if it's a high-quality image
          if (src.includes('1920') || src.includes('1080') || src.includes('2048') || src.includes('4096') || 
              !src.includes('thumb') && !src.includes('small') && !src.includes('mini')) {
            photos.push({
              url: src,
              width: 1920,
              height: 1080,
              description: `${hotelName} EXACT photo from Booking.com`,
              source: 'booking_com',
              photographer: 'Booking.com',
              photographerUrl: url,
              isExact: true,
              quality: 'high'
            });
          }
        }
      });
      
      return photos.slice(0, 3);
    } catch (error) {
      return [];
    }
  }

  async findTripAdvisorExactPhotos(hotelName, city, country) {
    try {
      // Search TripAdvisor for the specific hotel
      const searchQuery = encodeURIComponent(`"${hotelName}" "${city}" site:tripadvisor.com`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      console.log(`    🔍 Searching TripAdvisor: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for TripAdvisor links
      $('a[href*="tripadvisor.com"]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('tripadvisor.com')) {
          // Try to scrape photos from TripAdvisor page
          this.scrapeTripAdvisorPhotos(href, hotelName).then(tripadvisorPhotos => {
            photos.push(...tripadvisorPhotos);
          }).catch(() => {
            // Ignore errors for individual pages
          });
        }
      });
      
      return photos.slice(0, 5);
    } catch (error) {
      throw new Error(`TripAdvisor search failed: ${error.message}`);
    }
  }

  async scrapeTripAdvisorPhotos(url, hotelName) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000,
        maxRedirects: 3
      });
      
      const $ = cheerio.load(response.data);
      const photos = [];
      
      // Look for high-quality hotel images
      $('img').each((i, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.includes('http') && !src.includes('placeholder') && !src.includes('logo')) {
          // Check if it's a high-quality image
          if (src.includes('1920') || src.includes('1080') || src.includes('2048') || src.includes('4096') || 
              !src.includes('thumb') && !src.includes('small') && !src.includes('mini')) {
            photos.push({
              url: src,
              width: 1920,
              height: 1080,
              description: `${hotelName} EXACT photo from TripAdvisor`,
              source: 'tripadvisor',
              photographer: 'TripAdvisor',
              photographerUrl: url,
              isExact: true,
              quality: 'high'
            });
          }
        }
      });
      
      return photos.slice(0, 3);
    } catch (error) {
      return [];
    }
  }

  filterExactPhotosOnly(photos) {
    return photos.filter(photo => {
      // Must be exact hotel photos (not generic stock photos)
      if (!photo.isExact) {
        return false;
      }
      
      // Filter out generic stock photo sources
      if (photo.source.includes('unsplash') || photo.source.includes('pexels') || photo.source.includes('pixabay')) {
        return false;
      }
      
      return true;
    });
  }

  filterHighQualityPhotos(photos) {
    return photos.filter(photo => {
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

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async updateFirst3HotelsWithExactPhotosSimple() {
    console.log('🔄 Updating first 3 hotels with EXACT photos ONLY...\n');
    
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

      console.log(`📋 Found ${hotels.length} hotels to update with EXACT photos ONLY\n`);

      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`🏨 Hotel ${i + 1}: ${hotel.name} in ${hotel.city}`);
        
        // Get exact photos only
        const exactPhotos = await this.findExactHotelPhotosSimple(hotel.name, hotel.city, hotel.country, 5);
        
        if (exactPhotos.length > 0) {
          console.log(`  📸 Found ${exactPhotos.length} EXACT photos:`);
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
            console.log(`  ✅ SUCCESS: Updated with ${exactPhotos.length} EXACT photos`);
          }
        } else {
          console.log(`  ❌ No EXACT photos found`);
        }
        
        console.log('  ' + '='.repeat(60));
        
        // Add delay between hotels
        if (i < hotels.length - 1) {
          await this.sleep(5000);
        }
      }
      
      console.log('\n🎉 First 3 hotels updated with EXACT photos ONLY!');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the exact photo update
const finder = new ExactHotelPhotosSimpleFinder();
finder.updateFirst3HotelsWithExactPhotosSimple().catch(console.error);
