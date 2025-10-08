require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class SabreWorkingPhotoFetcher {
  constructor() {
    // Use the existing access token from your Sabre portal
    this.sabreBaseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQJflyyiDbOBCdmHWDnoAPGAZ8Ztsepim6JrxZDV8ZrmlBD4eVoIp0wYhPqOxBBiOm0YAADgijbFOHyDNvueZEtBc4qi6NAP0kiIfyuEp7Lec3VXFcHSNKUfhj6IV9ISH8zmm8kZYfN6cHenkLZ3Dgsvo7cImEhQEJiZoQe5bYnqCfK7Ohfm1VLCkObAow8H1TY/YYZqdyTGBWWYVrUsl/CzxxX75xfINGxaSXO2v0jdMnjrzgwr6Vfx+zROxHeRrpRSa50aDuLxA++jkihX7SxCYSHZx+hlvwJ3EjUmJ2WTLPQO84T+RDQdSWDdPe0wuRw6HmGJ26ra9sqr0z2XPoFYrcm3EWm6UVmyJCN5pbfdC0hk1/4*';
    
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
      apiCalls: 0
    };
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

  async testSabreAPIs() {
    console.log('🔍 Testing available Sabre APIs...\n');
    
    const endpoints = [
      { name: 'Hotel Search', url: '/v1.0.0/shop/hotels', method: 'POST' },
      { name: 'Hotel Availability', url: '/v3.0.0/get/hotels', method: 'POST' },
      { name: 'Hotel Content', url: '/v1.0.0/shop/hotels/content', method: 'POST' },
      { name: 'Hotel Descriptive Info', url: '/v1.0.0/shop/hotels/descriptive-info', method: 'POST' },
      { name: 'Geo Services', url: '/v1/lists/utilities/geoservices/autocomplete', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint.name}...`);
        
        let response;
        if (endpoint.method === 'GET') {
          response = await axios.get(`${this.sabreBaseUrl}${endpoint.url}?query=test`, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Accept': 'application/json'
            },
            timeout: 10000
          });
        } else {
          response = await axios.post(`${this.sabreBaseUrl}${endpoint.url}`, {
            test: 'data'
          }, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });
        }
        
        console.log(`   ✅ ${endpoint.name}: Available`);
        this.stats.apiCalls++;
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`   ❌ ${endpoint.name}: ${errorMsg}`);
      }
    }
    
    console.log(`\n📊 API Test Summary: ${this.stats.apiCalls} endpoints available\n`);
  }

  async getHotelPhotosFromSabre(hotel) {
    console.log(`\n🏨 Fetching photos for: ${hotel.name}`);
    console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
    
    try {
      // Try different Sabre endpoints for hotel photos
      const photos = await this.tryHotelSearchAPI(hotel);
      
      if (photos.length === 0) {
        console.log('   ⚠️  No photos found via Hotel Search API');
        return [];
      }

      const filteredPhotos = this.filterPhotosByResolution(photos);
      console.log(`   📸 Found ${photos.length} total photos, ${filteredPhotos.length} meet resolution requirements`);
      
      return filteredPhotos;
    } catch (error) {
      console.error(`   ❌ Error fetching photos for ${hotel.name}:`, error.message);
      this.stats.errors++;
      return [];
    }
  }

  async tryHotelSearchAPI(hotel) {
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
            'Authorization': `Bearer ${this.accessToken}`,
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
        
        return this.extractPhotosFromSearchResult(hotels[0]);
      }
      
      return [];
    } catch (error) {
      console.error(`   ❌ Hotel Search API failed:`, error.response?.data || error.message);
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
    console.log('🚀 SABRE WORKING PHOTO FETCHER');
    console.log('='.repeat(60));
    console.log('🎯 Target: 5 random hotels from database');
    console.log('📸 Quality: Full HD to 4K resolution');
    console.log('🔑 API: Sabre Hotels API (Sandbox)');
    console.log('='.repeat(60));

    try {
      // First test what APIs are available
      await this.testSabreAPIs();
      
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
        
        const photos = await this.getHotelPhotosFromSabre(hotel);
        
        this.stats.hotelsProcessed++;
        this.stats.photosFound += photos.length;
        this.stats.highQualityPhotos += photos.filter(p => 
          (p.width * p.height) >= this.minResolution && 
          (p.width * p.height) <= this.maxResolution
        ).length;
        
        results.push({
          hotel: hotel,
          photos: photos,
          photoCount: photos.length
        });
        
        // Rate limiting
        if (i < hotels.length - 1) {
          console.log('⏳ Waiting 2 seconds before next hotel...');
          await this.sleep(2000);
        }
      }
      
      this.generateReport(results);
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
    }
  }

  generateReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 STATISTICS:`);
    console.log(`   Hotels processed: ${this.stats.hotelsProcessed}`);
    console.log(`   Total photos found: ${this.stats.photosFound}`);
    console.log(`   High-quality photos: ${this.stats.highQualityPhotos}`);
    console.log(`   API calls made: ${this.stats.apiCalls}`);
    console.log(`   Errors encountered: ${this.stats.errors}`);
    
    console.log(`\n🏨 DETAILED RESULTS:`);
    results.forEach((result, index) => {
      const hotel = result.hotel;
      const photos = result.photos;
      
      console.log(`\n${index + 1}. ${hotel.name}`);
      console.log(`   Location: ${hotel.city}, ${hotel.country}`);
      console.log(`   Photos found: ${photos.length}`);
      
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
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SABRE PHOTO FETCH COMPLETE');
    console.log('='.repeat(60));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the working photo fetcher
const fetcher = new SabreWorkingPhotoFetcher();
fetcher.fetchPhotosForRandomHotels().catch(console.error);
