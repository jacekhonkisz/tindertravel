require('dotenv').config();
const axios = require('axios');

class SabreHotelPhotoTester {
  constructor() {
    this.sabreBaseUrl = 'https://api.sabre.com';
    this.sabreClientId = process.env.SABRE_CLIENT_ID;
    this.sabreClientSecret = process.env.SABRE_CLIENT_SECRET;
  }

  async getSabreAccessToken() {
    console.log('🔑 Getting Sabre access token...');
    
    if (!this.sabreClientId || !this.sabreClientSecret) {
      throw new Error('Sabre credentials not configured. Please set SABRE_CLIENT_ID and SABRE_CLIENT_SECRET in your .env file');
    }

    try {
      const response = await axios.post(`${this.sabreBaseUrl}/v2/auth/token`, {
        grant_type: 'client_credentials',
        client_id: this.sabreClientId,
        client_secret: this.sabreClientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.access_token) {
        console.log('✅ Sabre access token obtained successfully');
        return response.data.access_token;
      }
    } catch (error) {
      console.error('❌ Failed to get Sabre access token:', error.response?.data || error.message);
      throw error;
    }
  }

  async testHotelDescriptiveInfo(accessToken) {
    console.log('\n🏨 Testing Sabre Hotel Descriptive Info API...');
    
    try {
      // Test with a known hotel (Marriott example)
      const requestBody = {
        "OTA_HotelDescriptiveInfoRQ": {
          "Version": "3",
          "PrimaryLangID": "en",
          "HotelDescriptiveInfos": {
            "HotelDescriptiveInfo": {
              "ChainCode": "MC", // Marriott chain code
              "HotelCode": "MC123" // Example hotel code
            }
          }
        }
      };

      const response = await axios.post(
        `${this.sabreBaseUrl}/v1.0.0/shop/hotels/descriptive-info`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ Sabre Hotel Descriptive Info API response:');
      console.log(JSON.stringify(response.data, null, 2));

      // Check for multimedia descriptions (photos)
      if (response.data.OTA_HotelDescriptiveInfoRS?.HotelDescriptiveContents?.HotelDescriptiveContent?.MultimediaDescriptions) {
        const multimedia = response.data.OTA_HotelDescriptiveInfoRS.HotelDescriptiveContents.HotelDescriptiveContent.MultimediaDescriptions;
        console.log('\n📸 Found multimedia content:');
        console.log(JSON.stringify(multimedia, null, 2));
        
        // Extract image URLs
        const imageUrls = [];
        if (multimedia.MultimediaDescription?.ImageItems?.ImageItem) {
          const imageItems = Array.isArray(multimedia.MultimediaDescription.ImageItems.ImageItem) 
            ? multimedia.MultimediaDescription.ImageItems.ImageItem 
            : [multimedia.MultimediaDescription.ImageItems.ImageItem];
          
          imageItems.forEach(item => {
            if (item.ImageFormat?.URL) {
              imageUrls.push(item.ImageFormat.URL);
            }
          });
        }
        
        console.log(`\n🖼️  Found ${imageUrls.length} image URLs:`);
        imageUrls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });
        
        return imageUrls;
      } else {
        console.log('⚠️  No multimedia descriptions found in response');
        return [];
      }

    } catch (error) {
      console.error('❌ Sabre Hotel Descriptive Info API failed:', error.response?.data || error.message);
      return [];
    }
  }

  async testHotelSearch(accessToken) {
    console.log('\n🔍 Testing Sabre Hotel Search API...');
    
    try {
      const requestBody = {
        "OTA_HotelSearchRQ": {
          "Version": "3",
          "PrimaryLangID": "en",
          "Criteria": {
            "Criterion": {
              "HotelSearchCriteria": {
                "Address": {
                  "CityName": "Paris",
                  "CountryCode": "FR"
                },
                "StayDateRange": {
                  "Start": "2024-12-01",
                  "End": "2024-12-03"
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

      const response = await axios.post(
        `${this.sabreBaseUrl}/v1.0.0/shop/hotels`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ Sabre Hotel Search API response:');
      console.log(JSON.stringify(response.data, null, 2));

      // Check for leadImageURI in search results
      if (response.data.OTA_HotelSearchRS?.HotelDescriptiveContents?.HotelDescriptiveContent) {
        const hotels = Array.isArray(response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent)
          ? response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent
          : [response.data.OTA_HotelSearchRS.HotelDescriptiveContents.HotelDescriptiveContent];
        
        console.log(`\n🏨 Found ${hotels.length} hotels in search results`);
        
        hotels.forEach((hotel, index) => {
          console.log(`\n   Hotel ${index + 1}: ${hotel.HotelName || 'Unknown'}`);
          console.log(`   Chain Code: ${hotel.ChainCode || 'N/A'}`);
          console.log(`   Hotel Code: ${hotel.HotelCode || 'N/A'}`);
          
          if (hotel.MultimediaDescriptions?.MultimediaDescription?.ImageItems?.ImageItem) {
            const imageItems = Array.isArray(hotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem)
              ? hotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem
              : [hotel.MultimediaDescriptions.MultimediaDescription.ImageItems.ImageItem];
            
            console.log(`   📸 Images: ${imageItems.length}`);
            imageItems.slice(0, 3).forEach((item, imgIndex) => {
              if (item.ImageFormat?.URL) {
                console.log(`      ${imgIndex + 1}. ${item.ImageFormat.URL}`);
              }
            });
          } else {
            console.log('   📸 No images found');
          }
        });
      }

    } catch (error) {
      console.error('❌ Sabre Hotel Search API failed:', error.response?.data || error.message);
    }
  }

  async runFullTest() {
    console.log('🔍 SABRE HOTEL PHOTO API TEST\n');
    console.log('='.repeat(50));

    try {
      // Get access token
      const accessToken = await this.getSabreAccessToken();

      // Test hotel descriptive info
      const descriptivePhotos = await this.testHotelDescriptiveInfo(accessToken);

      // Test hotel search
      await this.testHotelSearch(accessToken);

      console.log('\n' + '='.repeat(50));
      console.log('📋 SUMMARY:');
      
      if (descriptivePhotos.length > 0) {
        console.log(`✅ Sabre API provides ${descriptivePhotos.length} hotel photos`);
        console.log('✅ Hotel Descriptive Info API works for photos');
      } else {
        console.log('⚠️  No photos found in Descriptive Info API test');
      }
      
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Get Sabre API credentials from https://developer.sabre.com/');
      console.log('   2. Set SABRE_CLIENT_ID and SABRE_CLIENT_SECRET in your .env file');
      console.log('   3. Test with real hotel codes from your database');

    } catch (error) {
      console.error('\n❌ Sabre API test failed:', error.message);
      console.log('\n💡 TO GET SABRE CREDENTIALS:');
      console.log('   1. Go to https://developer.sabre.com/');
      console.log('   2. Create a developer account');
      console.log('   3. Create a new application');
      console.log('   4. Get your Client ID and Client Secret');
      console.log('   5. Add them to your .env file:');
      console.log('      SABRE_CLIENT_ID=your_client_id');
      console.log('      SABRE_CLIENT_SECRET=your_client_secret');
    }
  }
}

// Run the test
const tester = new SabreHotelPhotoTester();
tester.runFullTest().catch(console.error);
