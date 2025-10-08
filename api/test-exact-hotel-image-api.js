const axios = require('axios');

class ExactHotelImageTester {
  constructor() {
    this.baseUrl = 'https://api.cert.platform.sabre.com';
    this.accessToken = 'T1RLAQJ85mPwMuv+AAPIk8YR9V2BkF9gdY3pwCNQ82NXG79A7RCPnP6m+Bo+ESriu+L1LrewAADg/YuvJXuzjsp1YrRaCVZF8IRU5upx4yKgzyOcKM2ahYnaWVT2gQlfPu1qbxrU2Faa3mpoe9jXrE17OiukiEO67nIoD9YY7yV79c4GmLOUo9Qj7NuGsdMfIaVqibMpAc1r1au3e0WSlDew2zbpDmU5aPObtpfoKQrMTufzudptTocYy+JoLeps7LthpAqqEA3t7R9yRQqCOwGIeLtq3m5gyTT77LjKE9S0euVMbde+CmHsrH5lZgjyoqwqqx3VzdKhUt8Pjsc3SjoUgGufCpSsz+zu0Pplhf2ff52S8AePIOY*';
    
    console.log('�� Exact Hotel Image API Tester');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`🎫 Access Token: ${this.accessToken.substring(0, 30)}...`);
  }

  async testGetHotelImageRQ() {
    console.log('\n🏨 Testing GetHotelImageRQ API with exact format...');
    
    const requestPayload = {
      "GetHotelImageRQ": {
        "ImageRef": {
          "CategoryCode": 3,
          "LanguageCode": "EN",
          "Type": "ORIGINAL"
        },
        "HotelRefs": {
          "HotelRef": [
            {
              "HotelCode": "426",
              "CodeContext": "Sabre"
            }
          ]
        }
      }
    };

    // Try different possible endpoints for GetHotelImageRQ
    const endpoints = [
      '/v1/hotels/images',
      '/v1/shop/hotels/images',
      '/v1/hotel/images',
      '/v2/hotels/images',
      '/v2/shop/hotels/images',
      '/v1/hotels/GetHotelImage',
      '/v1/shop/GetHotelImage',
      '/v1/hotels/GetHotelImageRQ',
      '/v1/shop/GetHotelImageRQ',
      '/v1/hotels/media/images',
      '/v1/shop/hotels/media/images'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔧 Trying endpoint: ${endpoint}`);
      
      try {
        const response = await axios.post(`${this.baseUrl}${endpoint}`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
        if (error.response?.data?.error_description) {
          console.log(`   Description: ${error.response.data.error_description}`);
        }
        if (error.response?.data?.errorCode) {
          console.log(`   Error Code: ${error.response.data.errorCode}`);
        }
      }
    }
    
    return null;
  }

  async testGetHotelMediaRQ() {
    console.log('\n🏨 Testing GetHotelMediaRQ API with exact format...');
    
    const requestPayload = {
      "GetHotelMediaRQ": {
        "ImageRef": {
          "CategoryCode": 3,
          "LanguageCode": "EN",
          "Type": "ORIGINAL"
        },
        "HotelRefs": {
          "HotelRef": [
            {
              "HotelCode": "426",
              "CodeContext": "Sabre"
            }
          ]
        }
      }
    };

    const endpoints = [
      '/v1/hotels/media',
      '/v1/shop/hotels/media',
      '/v1/hotel/media',
      '/v2/hotels/media',
      '/v2/shop/hotels/media',
      '/v1/hotels/GetHotelMedia',
      '/v1/shop/GetHotelMedia',
      '/v1/hotels/GetHotelMediaRQ',
      '/v1/shop/GetHotelMediaRQ'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🔧 Trying endpoint: ${endpoint}`);
      
      try {
        const response = await axios.post(`${this.baseUrl}${endpoint}`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with ${endpoint}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
        if (error.response?.data?.error_description) {
          console.log(`   Description: ${error.response.data.error_description}`);
        }
        if (error.response?.data?.errorCode) {
          console.log(`   Error Code: ${error.response.data.errorCode}`);
        }
      }
    }
    
    return null;
  }

  async testDifferentHotelCodes() {
    console.log('\n🏨 Testing with different hotel codes...');
    
    const hotelCodes = ['426', '1', '100', '1000', '5000'];
    const requestPayload = {
      "GetHotelImageRQ": {
        "ImageRef": {
          "CategoryCode": 3,
          "LanguageCode": "EN",
          "Type": "ORIGINAL"
        },
        "HotelRefs": {
          "HotelRef": []
        }
      }
    };

    for (const hotelCode of hotelCodes) {
      console.log(`\n🔧 Testing with hotel code: ${hotelCode}`);
      
      requestPayload.GetHotelImageRQ.HotelRefs.HotelRef = [
        {
          "HotelCode": hotelCode,
          "CodeContext": "Sabre"
        }
      ];

      try {
        const response = await axios.post(`${this.baseUrl}/v1/hotels/images`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with hotel code ${hotelCode}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`�� Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with hotel code ${hotelCode}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async testDifferentImageTypes() {
    console.log('\n🏨 Testing with different image types...');
    
    const imageTypes = ['ORIGINAL', 'SMALL', 'MEDIUM', 'LARGE', 'THUMBNAIL'];
    const requestPayload = {
      "GetHotelImageRQ": {
        "ImageRef": {
          "CategoryCode": 3,
          "LanguageCode": "EN",
          "Type": ""
        },
        "HotelRefs": {
          "HotelRef": [
            {
              "HotelCode": "426",
              "CodeContext": "Sabre"
            }
          ]
        }
      }
    };

    for (const imageType of imageTypes) {
      console.log(`\n🔧 Testing with image type: ${imageType}`);
      
      requestPayload.GetHotelImageRQ.ImageRef.Type = imageType;

      try {
        const response = await axios.post(`${this.baseUrl}/v1/hotels/images`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log(`✅ SUCCESS with image type ${imageType}`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        console.log(`❌ Failed with image type ${imageType}: ${error.response?.status}`);
        if (error.response?.data?.message) {
          console.log(`   Message: ${error.response.data.message}`);
        }
      }
    }
    
    return null;
  }

  async runAllTests() {
    console.log('🚀 Testing Exact Hotel Image API Format\n');
    
    // Test GetHotelImageRQ with exact format
    const imageResult = await this.testGetHotelImageRQ();
    
    if (!imageResult) {
      // Test GetHotelMediaRQ with exact format
      const mediaResult = await this.testGetHotelMediaRQ();
      
      if (!mediaResult) {
        // Test with different hotel codes
        const hotelCodeResult = await this.testDifferentHotelCodes();
        
        if (!hotelCodeResult) {
          // Test with different image types
          await this.testDifferentImageTypes();
        }
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`🏨 GetHotelImageRQ: ${imageResult ? '✅ Working!' : '❌ Not accessible'}`);
    
    if (imageResult) {
      console.log('\n🎉 SUCCESS! Found working hotel image API!');
      console.log('✅ You can now use Sabre API for hotel photos');
    } else {
      console.log('\n⚠️ Hotel image APIs are still not accessible');
      console.log('💡 Consider using alternative hotel photo APIs');
    }
  }
}

// Run the tests
const tester = new ExactHotelImageTester();
tester.runAllTests().catch(console.error);
