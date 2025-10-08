require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class ComprehensiveHotelPhotoFetcher {
  constructor() {
    // Sabre API configuration with provided credentials
    this.sabreBaseUrl = 'https://api.sabre.com';
    this.sabreClientId = 'V1:n07msjql7g5bqtku:DEVCENTER:EXT';
    this.sabreClientSecret = 'nw6LvA5D';
    
    // Supabase configuration
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Photo resolution requirements (Full HD to 4K)
    this.minResolution = 1920 * 1080; // Full HD
    this.maxResolution = 3840 * 2160; // 4K
    
    // Statistics tracking
    this.stats = {
      hotelsProcessed: 0,
      photosFound: 0,
      highQualityPhotos: 0,
      errors: 0,
      sabreSuccess: 0,
      fallbackSuccess: 0
    };
  }

  async getSabreAccessToken() {
    console.log('🔑 Attempting Sabre authentication...');
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.sabreClientId);
      params.append('client_secret', this.sabreClientSecret);

      const response = await axios.post(`${this.sabreBaseUrl}/v2/auth/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.access_token) {
        console.log('✅ Sabre access token obtained successfully');
        return response.data.access_token;
      }
    } catch (error) {
      console.error('❌ Sabre authentication failed:', error.response?.data || error.message);
      console.log('⚠️  This could be due to:');
      console.log('   - Expired credentials');
      console.log('   - Invalid client ID/secret format');
      console.log('   - API endpoint changes');
      console.log('   - Rate limiting');
      return null;
    }
  }

  async getRandomHotels(count = 5) {
    console.log(`🎲 Fetching ${count} random hotels from database...`);
    
    try {
      const { data: allHotels, error } = await this.supabase
        .from('hotels')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch hotels: ${error.message}`);
      }

      if (!allHotels || allHotels.length === 0) {
        throw new Error('No hotels found in database');
      }

      const shuffledHotels = allHotels.sort(() => Math.random() - 0.5);
      const selectedHotels = shuffledHotels.slice(0, count);

      console.log(`✅ Selected ${selectedHotels.length} random hotels`);
      return selectedHotels;
    } catch (error) {
      console.error('❌ Error fetching random hotels:', error.message);
      throw error;
    }
  }

  async getHotelPhotosFromSabre(hotel, accessToken) {
    console.log(`\n🏨 [SABRE] Fetching photos for: ${hotel.name}`);
    console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
    
    try {
      const searchResults = await this.searchHotelInSabre(hotel, accessToken);
      
      if (searchResults.length === 0) {
        console.log('   ⚠️  No hotels found in Sabre search');
        return [];
      }

      const sabreHotel = searchResults[0];
      console.log(`   🎯 Found Sabre hotel: ${sabreHotel.HotelName} (${sabreHotel.ChainCode}${sabreHotel.HotelCode})`);
      
      const photos = this.extractPhotosFromSearchResult(sabreHotel);
      
      if (photos.length === 0) {
        console.log('   ⚠️  No photos found in search results');
        const descriptivePhotos = await this.getDescriptiveInfoPhotos(sabreHotel, accessToken);
        return descriptivePhotos;
      }

      const filteredPhotos = this.filterPhotosByResolution(photos);
      console.log(`   📸 Found ${photos.length} total photos, ${filteredPhotos.length} meet resolution requirements`);
      
      return filteredPhotos;
    } catch (error) {
      console.error(`   ❌ Sabre error for ${hotel.name}:`, error.message);
      this.stats.errors++;
      return [];
    }
  }

  async searchHotelInSabre(hotel, accessToken) {
    const requestBody = {
      "OTA_HotelSearchRQ": {
        "Version": "3",
        "PrimaryLangID": "en",
        "Criteria": {
          "Criterion": {
            "HotelSearchCriteria": {
              "Address": {
                "CityName": hotel.city,
                "CountryCode": this.getCountryCode(hotel.country)
              },
              "StayDateRange": {
                "Start": this.getFutureDate(1),
                "End": this.getFutureDate(3)
              },
              "RoomStayCandidates": {
                "RoomStayCandidate": {
                  "GuestCounts": {
                    "GuestCount": {
                      "Count": 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    try {
      const response = await axios.post(
        `${this.sabreBaseUrl}/v1.0.0/shop/hotels`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data.OTA_HotelSearchRS?.HotelDescriptiveContents?.HotelDescriptiveContent) {
        const hotels = Array.isArray(response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent)
          ? response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent
          : [response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent];
        
        return hotels;
      }
      
      return [];
    } catch (error) {
      console.error(`   ❌ Sabre search failed:`, error.response?.data || error.message);
      return [];
    }
  }

  extractPhotosFromSearchResult(sabreHotel) {
    const photos = [];
    
    if (sabreHotel.MultimediaDescriptions?.MultimediaDescription?.ImageItems?.ImageItem) {
      const imageItems = Array.isArray(sabreHotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem)
        ? sabreHotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem
        : [sabreHotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem];
      
      imageItems.forEach((item, index) => {
        if (item.ImageFormat?.URL) {
          photos.push({
            url: item.ImageFormat.URL,
            width: item.ImageFormat?.Width || 1920,
            height: item.ImageFormat?.Height || 1080,
            description: item.ImageFormat?.Description || `Hotel photo ${index + 1}`,
            source: 'sabre_search',
            hotelName: sabreHotel.HotelName,
            chainCode: sabreHotel.ChainCode,
            hotelCode: sabreHotel.HotelCode
          });
        }
      });
    }
    
    return photos;
  }

  async getDescriptiveInfoPhotos(sabreHotel, accessToken) {
    const requestBody = {
      "OTA_HotelDescriptiveInfoRQ": {
        "Version": "3",
        "PrimaryLangID": "en",
        "HotelDescriptiveInfos": {
          "HotelDescriptiveInfo": {
            "ChainCode": sabreHotel.ChainCode,
            "HotelCode": sabreHotel.HotelCode
          }
        }
      }
    };

    try {
      const response = await axios.post(
        `${this.sabreBaseUrl}/v1.0.0/shop/hotels/descriptive-info`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const photos = [];
      
      if (response.data.OTA_HotelDescriptiveInfoRS?.HotelDescriptiveContents?.HotelDescriptiveContent?.MultimediaDescriptions) {
        const multimedia = response.data.OTA_HotelDescriptiveInfoRS.HotelDescriptiveContents.HotelDescriptiveContent.MultimediaDescriptions;
        
        if (multimedia.MultimediaDescription?.ImageItems?.ImageItem) {
          const imageItems = Array.isArray(multimedia.MultimediaDescription.ImageItems.ImageItem)
            ? multimedia.MultimediaDescription.ImageItems.ImageItem
            : [multimedia.MultimediaDescription.ImageItems.ImageItem];
          
          imageItems.forEach((item, index) => {
            if (item.ImageFormat?.URL) {
              photos.push({
                url: item.ImageFormat.URL,
                width: item.ImageFormat?.Width || 1920,
                height: item.ImageFormat?.Height || 1080,
                description: item.ImageFormat?.Description || `Hotel photo ${index + 1}`,
                source: 'sabre_descriptive',
                hotelName: sabreHotel.HotelName,
                chainCode: sabreHotel.ChainCode,
                hotelCode: sabreHotel.HotelCode
              });
            }
          });
        }
      }
      
      return photos;
    } catch (error) {
      console.error(`   ❌ Descriptive info API failed:`, error.response?.data || error.message);
      return [];
    }
  }

  async getFallbackPhotos(hotel) {
    console.log(`\n🔄 [FALLBACK] Getting photos for: ${hotel.name}`);
    
    try {
      // Try Unsplash as fallback
      const unsplashPhotos = await this.getUnsplashPhotos(hotel);
      if (unsplashPhotos.length > 0) {
        console.log(`   ✅ Found ${unsplashPhotos.length} fallback photos from Unsplash`);
        return unsplashPhotos;
      }

      // Try Pexels as secondary fallback
      const pexelsPhotos = await this.getPexelsPhotos(hotel);
      if (pexelsPhotos.length > 0) {
        console.log(`   ✅ Found ${pexelsPhotos.length} fallback photos from Pexels`);
        return pexelsPhotos;
      }

      console.log('   ⚠️  No fallback photos found');
      return [];
    } catch (error) {
      console.error(`   ❌ Fallback error for ${hotel.name}:`, error.message);
      return [];
    }
  }

  async getUnsplashPhotos(hotel) {
    try {
      const query = `${hotel.name} hotel ${hotel.city}`;
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: query,
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || 'demo'}`,
          'Accept-Version': 'v1'
        },
        timeout: 10000
      });

      const photos = response.data.results?.map((photo, index) => ({
        url: photo.urls.full,
        width: photo.width,
        height: photo.height,
        description: photo.description || `Hotel photo ${index + 1}`,
        source: 'unsplash_fallback',
        hotelName: hotel.name,
        photographer: photo.user.name
      })) || [];

      return this.filterPhotosByResolution(photos);
    } catch (error) {
      console.log('   ⚠️  Unsplash fallback failed:', error.message);
      return [];
    }
  }

  async getPexelsPhotos(hotel) {
    try {
      const query = `${hotel.name} hotel ${hotel.city}`;
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query: query,
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': process.env.PEXELS_API_KEY || 'demo'
        },
        timeout: 10000
      });

      const photos = response.data.photos?.map((photo, index) => ({
        url: photo.src.large2x,
        width: photo.width,
        height: photo.height,
        description: photo.alt || `Hotel photo ${index + 1}`,
        source: 'pexels_fallback',
        hotelName: hotel.name,
        photographer: photo.photographer
      })) || [];

      return this.filterPhotosByResolution(photos);
    } catch (error) {
      console.log('   ⚠️  Pexels fallback failed:', error.message);
      return [];
    }
  }

  filterPhotosByResolution(photos) {
    return photos.filter(photo => {
      const resolution = photo.width * photo.height;
      return resolution >= this.minResolution && resolution <= this.maxResolution;
    });
  }

  getCountryCode(countryName) {
    const countryCodes = {
      'United States': 'US', 'France': 'FR', 'Italy': 'IT', 'Spain': 'ES', 'Germany': 'DE',
      'United Kingdom': 'GB', 'Japan': 'JP', 'Australia': 'AU', 'Canada': 'CA', 'Mexico': 'MX',
      'Brazil': 'BR', 'Argentina': 'AR', 'Chile': 'CL', 'Peru': 'PE', 'Colombia': 'CO',
      'Thailand': 'TH', 'Singapore': 'SG', 'Malaysia': 'MY', 'Indonesia': 'ID', 'Philippines': 'PH',
      'India': 'IN', 'China': 'CN', 'South Korea': 'KR', 'Turkey': 'TR', 'Greece': 'GR',
      'Portugal': 'PT', 'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
      'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Poland': 'PL',
      'Czech Republic': 'CZ', 'Hungary': 'HU', 'Romania': 'RO', 'Bulgaria': 'BG', 'Croatia': 'HR',
      'Slovenia': 'SI', 'Slovakia': 'SK', 'Estonia': 'EE', 'Latvia': 'LV', 'Lithuania': 'LT',
      'Russia': 'RU', 'Ukraine': 'UA', 'Belarus': 'BY', 'Moldova': 'MD', 'Georgia': 'GE',
      'Armenia': 'AM', 'Azerbaijan': 'AZ', 'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ', 'Kyrgyzstan': 'KG',
      'Tajikistan': 'TJ', 'Turkmenistan': 'TM', 'Afghanistan': 'AF', 'Pakistan': 'PK', 'Bangladesh': 'BD',
      'Sri Lanka': 'LK', 'Maldives': 'MV', 'Nepal': 'NP', 'Bhutan': 'BT', 'Myanmar': 'MM',
      'Laos': 'LA', 'Cambodia': 'KH', 'Vietnam': 'VN', 'Taiwan': 'TW', 'Hong Kong': 'HK',
      'Macau': 'MO', 'Mongolia': 'MN', 'North Korea': 'KP', 'South Africa': 'ZA', 'Egypt': 'EG',
      'Morocco': 'MA', 'Tunisia': 'TN', 'Algeria': 'DZ', 'Libya': 'LY', 'Sudan': 'SD',
      'Ethiopia': 'ET', 'Kenya': 'KE', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Rwanda': 'RW',
      'Burundi': 'BI', 'Democratic Republic of the Congo': 'CD', 'Republic of the Congo': 'CG',
      'Central African Republic': 'CF', 'Chad': 'TD', 'Niger': 'NE', 'Mali': 'ML', 'Burkina Faso': 'BF',
      'Senegal': 'SN', 'Gambia': 'GM', 'Guinea-Bissau': 'GW', 'Guinea': 'GN', 'Sierra Leone': 'SL',
      'Liberia': 'LR', 'Ivory Coast': 'CI', 'Ghana': 'GH', 'Togo': 'TG', 'Benin': 'BJ',
      'Nigeria': 'NG', 'Cameroon': 'CM', 'Equatorial Guinea': 'GQ', 'Gabon': 'GA', 'São Tomé and Príncipe': 'ST',
      'Angola': 'AO', 'Zambia': 'ZM', 'Zimbabwe': 'ZW', 'Botswana': 'BW', 'Namibia': 'NA',
      'Lesotho': 'LS', 'Swaziland': 'SZ', 'Madagascar': 'MG', 'Mauritius': 'MU', 'Seychelles': 'SC',
      'Comoros': 'KM', 'Djibouti': 'DJ', 'Somalia': 'SO', 'Eritrea': 'ER', 'Israel': 'IL',
      'Palestine': 'PS', 'Jordan': 'JO', 'Lebanon': 'LB', 'Syria': 'SY', 'Iraq': 'IQ',
      'Iran': 'IR', 'Kuwait': 'KW', 'Saudi Arabia': 'SA', 'Bahrain': 'BH', 'Qatar': 'QA',
      'United Arab Emirates': 'AE', 'Oman': 'OM', 'Yemen': 'YE', 'Cyprus': 'CY', 'Malta': 'MT',
      'Iceland': 'IS', 'Ireland': 'IE', 'Luxembourg': 'LU', 'Monaco': 'MC', 'Liechtenstein': 'LI',
      'San Marino': 'SM', 'Vatican City': 'VA', 'Andorra': 'AD', 'New Zealand': 'NZ', 'Fiji': 'FJ',
      'Papua New Guinea': 'PG', 'Solomon Islands': 'SB', 'Vanuatu': 'VU', 'New Caledonia': 'NC',
      'French Polynesia': 'PF', 'Samoa': 'WS', 'Tonga': 'TO', 'Kiribati': 'KI', 'Tuvalu': 'TV',
      'Nauru': 'NR', 'Palau': 'PW', 'Marshall Islands': 'MH', 'Micronesia': 'FM', 'Cook Islands': 'CK',
      'Niue': 'NU', 'Tokelau': 'TK', 'American Samoa': 'AS', 'Guam': 'GU', 'Northern Mariana Islands': 'MP',
      'Puerto Rico': 'PR', 'Virgin Islands': 'VI', 'Bermuda': 'BM', 'Cayman Islands': 'KY',
      'Jamaica': 'JM', 'Haiti': 'HT', 'Dominican Republic': 'DO', 'Cuba': 'CU', 'Bahamas': 'BS',
      'Barbados': 'BB', 'Trinidad and Tobago': 'TT', 'Grenada': 'GD', 'Saint Vincent and the Grenadines': 'VC',
      'Saint Lucia': 'LC', 'Dominica': 'DM', 'Antigua and Barbuda': 'AG', 'Saint Kitts and Nevis': 'KN',
      'Montserrat': 'MS', 'Anguilla': 'AI', 'British Virgin Islands': 'VG', 'Turks and Caicos Islands': 'TC',
      'Greenland': 'GL', 'Faroe Islands': 'FO', 'Svalbard and Jan Mayen': 'SJ', 'Bouvet Island': 'BV',
      'South Georgia and the South Sandwich Islands': 'GS', 'French Southern Territories': 'TF',
      'Heard Island and McDonald Islands': 'HM', 'Antarctica': 'AQ', 'Christmas Island': 'CX',
      'Cocos Islands': 'CC', 'Norfolk Island': 'NF', 'Pitcairn Islands': 'PN', 'South Sandwich Islands': 'GS',
      'South Georgia': 'GS', 'Falkland Islands': 'FK', 'Saint Helena': 'SH', 'Ascension Island': 'AC',
      'Tristan da Cunha': 'TA', 'Saint Pierre and Miquelon': 'PM', 'Wallis and Futuna': 'WF',
      'Mayotte': 'YT', 'Réunion': 'RE', 'French Guiana': 'GF', 'Martinique': 'MQ', 'Guadeloupe': 'GP',
      'Saint Barthélemy': 'BL', 'Saint Martin': 'MF', 'Aruba': 'AW', 'Curaçao': 'CW', 'Sint Maarten': 'SX',
      'Bonaire': 'BQ', 'Saba': 'BQ', 'Sint Eustatius': 'BQ'
    };
    
    return countryCodes[countryName] || 'US';
  }

  getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  async fetchPhotosForRandomHotels() {
    console.log('🚀 COMPREHENSIVE HOTEL PHOTO FETCHER');
    console.log('='.repeat(70));
    console.log('🎯 Target: 5 random hotels from database');
    console.log('📸 Quality: Full HD to 4K resolution');
    console.log('🔑 Primary: Sabre Hotels API');
    console.log('🔄 Fallback: Unsplash + Pexels APIs');
    console.log('='.repeat(70));

    try {
      // Try to get Sabre access token
      const sabreToken = await this.getSabreAccessToken();
      
      // Get 5 random hotels
      const hotels = await this.getRandomHotels(5);
      
      console.log('\n📋 SELECTED RANDOM HOTELS:');
      hotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
      });
      
      console.log('\n🔍 FETCHING PHOTOS...\n');
      
      const results = [];
      
      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        console.log(`\n[${i + 1}/${hotels.length}] Processing: ${hotel.name}`);
        
        let photos = [];
        
        // Try Sabre first if token is available
        if (sabreToken) {
          photos = await this.getHotelPhotosFromSabre(hotel, sabreToken);
          if (photos.length > 0) {
            this.stats.sabreSuccess++;
          }
        }
        
        // Use fallback if Sabre fails or no token
        if (photos.length === 0) {
          photos = await this.getFallbackPhotos(hotel);
          if (photos.length > 0) {
            this.stats.fallbackSuccess++;
          }
        }
        
        this.stats.hotelsProcessed++;
        this.stats.photosFound += photos.length;
        this.stats.highQualityPhotos += photos.filter(p => 
          (p.width * p.height) >= this.minResolution && 
          (p.width * p.height) <= this.maxResolution
        ).length;
        
        results.push({
          hotel: hotel,
          photos: photos,
          photoCount: photos.length,
          source: photos.length > 0 ? photos[0].source : 'none'
        });
        
        // Rate limiting
        if (i < hotels.length - 1) {
          console.log('⏳ Waiting 2 seconds before next hotel...');
          await this.sleep(2000);
        }
      }
      
      this.generateReport(results, sabreToken);
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
    }
  }

  generateReport(results, sabreToken) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPREHENSIVE REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n📈 STATISTICS:`);
    console.log(`   Hotels processed: ${this.stats.hotelsProcessed}`);
    console.log(`   Total photos found: ${this.stats.photosFound}`);
    console.log(`   High-quality photos: ${this.stats.highQualityPhotos}`);
    console.log(`   Sabre API successes: ${this.stats.sabreSuccess}`);
    console.log(`   Fallback API successes: ${this.stats.fallbackSuccess}`);
    console.log(`   Errors encountered: ${this.stats.errors}`);
    
    console.log(`\n🔑 AUTHENTICATION STATUS:`);
    if (sabreToken) {
      console.log(`   ✅ Sabre API: Authenticated successfully`);
    } else {
      console.log(`   ❌ Sabre API: Authentication failed`);
      console.log(`   💡 Recommendation: Check credentials or contact Sabre support`);
    }
    
    console.log(`\n🏨 DETAILED RESULTS:`);
    results.forEach((result, index) => {
      const hotel = result.hotel;
      const photos = result.photos;
      
      console.log(`\n${index + 1}. ${hotel.name}`);
      console.log(`   Location: ${hotel.city}, ${hotel.country}`);
      console.log(`   Photos found: ${photos.length}`);
      console.log(`   Source: ${result.source}`);
      
      if (photos.length > 0) {
        console.log(`   Sample photos:`);
        photos.slice(0, 3).forEach((photo, i) => {
          const resolution = `${photo.width}x${photo.height}`;
          const megapixels = ((photo.width * photo.height) / 1000000).toFixed(1);
          console.log(`     ${i + 1}. ${photo.url}`);
          console.log(`        Resolution: ${resolution} (${megapixels}MP)`);
          console.log(`        Source: ${photo.source}`);
        });
      } else {
        console.log(`   ❌ No photos found`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ COMPREHENSIVE PHOTO FETCH COMPLETE');
    console.log('='.repeat(70));
    
    if (!sabreToken) {
      console.log('\n💡 SABRE API TROUBLESHOOTING:');
      console.log('   1. Verify credentials are correct and not expired');
      console.log('   2. Check if API endpoint has changed');
      console.log('   3. Contact Sabre support for assistance');
      console.log('   4. Consider using alternative APIs like Booking.com or Google Places');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the comprehensive photo fetcher
const fetcher = new ComprehensiveHotelPhotoFetcher();
fetcher.fetchPhotosForRandomHotels().catch(console.error);
