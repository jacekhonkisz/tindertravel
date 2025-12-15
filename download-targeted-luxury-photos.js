const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Targeted Luxury Hotel Photo Downloader
 * Downloads 3-4 photos from the most expensive hotels with proper headers
 */

class TargetedLuxuryPhotoDownloader {
  constructor() {
    this.downloadDir = path.join(__dirname, 'landing-page-photos');
    this.ensureDownloadDir();
    
    // Most expensive hotels from the database
    this.luxuryHotels = [
      {
        name: 'Gran Hotel Bahia del Duque',
        city: 'Costa Adeje',
        country: 'Spain',
        rating: 5,
        price: { min: 700, max: 1200, currency: 'USD' },
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg'
        ]
      },
      {
        name: 'Hotel Arts Barcelona',
        city: 'Barcelona',
        country: 'Spain',
        rating: 5,
        price: { min: 600, max: 1000, currency: 'USD' },
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg'
        ]
      },
      {
        name: 'Hotel Riu Palace Tenerife',
        city: 'Adeje',
        country: 'Spain',
        rating: 5,
        price: { min: 500, max: 800, currency: 'USD' },
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg'
        ]
      }
    ];
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
      console.log(`📁 Created download directory: ${this.downloadDir}`);
    }
  }

  async downloadPhoto(url, filename, hotelName) {
    const filePath = path.join(this.downloadDir, filename);
    
    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      return true;
    }

    try {
      console.log(`⬇️  Downloading: ${filename}`);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.hotelbeds.com/',
          'Origin': 'https://www.hotelbeds.com',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Downloaded: ${filename}`);
          resolve(true);
        });
        writer.on('error', (error) => {
          console.log(`❌ Failed to write ${filename}: ${error.message}`);
          reject(error);
        });
      });

    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`🚫 Access denied for ${filename} (403 Forbidden)`);
      } else if (error.response?.status === 404) {
        console.log(`🔍 Photo not found: ${filename} (404 Not Found)`);
      } else {
        console.log(`⚠️  Failed to download ${filename}: ${error.message}`);
      }
      return false;
    }
  }

  async downloadLuxuryPhotos() {
    console.log('🏆 Targeted Luxury Hotel Photo Downloader');
    console.log(`📁 Download directory: ${this.downloadDir}`);
    console.log('🚀 Starting targeted luxury photo download...\n');

    let totalDownloaded = 0;
    let totalFailed = 0;

    for (const hotel of this.luxuryHotels) {
      console.log(`🏨 Processing ${hotel.name} (${hotel.city}) - $${hotel.price.min}-${hotel.price.max}/night`);
      
      for (let i = 0; i < hotel.photos.length; i++) {
        const photoUrl = hotel.photos[i];
        const filename = `${hotel.name.toLowerCase().replace(/\s+/g, '-')}-luxury-${i + 1}.jpg`;
        
        const success = await this.downloadPhoto(photoUrl, filename, hotel.name);
        
        if (success) {
          totalDownloaded++;
        } else {
          totalFailed++;
        }
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(''); // Empty line between hotels
    }

    console.log('📊 Download Summary:');
    console.log(`✅ Successfully downloaded: ${totalDownloaded} photos`);
    console.log(`❌ Failed downloads: ${totalFailed} photos`);
    console.log(`📁 Photos saved to: ${this.downloadDir}`);
    
    if (totalDownloaded > 0) {
      console.log('\n🎉 Luxury photos ready for landing page mockup!');
    } else {
      console.log('\n⚠️  No photos were downloaded. Hotelbeds photos may require API authentication.');
    }
  }
}

// Run the downloader
async function main() {
  const downloader = new TargetedLuxuryPhotoDownloader();
  await downloader.downloadLuxuryPhotos();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TargetedLuxuryPhotoDownloader };

