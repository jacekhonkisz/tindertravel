const axios = require('axios');
const fs = require('fs');
const path = require('path');

class LuxuryHotelbedsPhotoDownloader {
  constructor() {
    // Create downloads directory
    this.downloadDir = path.join(__dirname, 'landing-page-photos');
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
    
    console.log('🏆 Luxury Hotelbeds Photo Downloader initialized');
    console.log(`📁 Download directory: ${this.downloadDir}`);
  }

  /**
   * Download a single photo with retry logic
   */
  async downloadPhoto(photoUrl, filename, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`⬇️ Downloading: ${filename} (attempt ${attempt}/${retries})`);
        
        const response = await axios.get(photoUrl, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });

        const filePath = path.join(this.downloadDir, filename);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', () => {
            console.log(`✅ Downloaded: ${filename}`);
            resolve(filePath);
          });
          writer.on('error', reject);
        });
      } catch (error) {
        console.log(`⚠️ Attempt ${attempt} failed for ${filename}: ${error.message}`);
        
        if (attempt === retries) {
          console.error(`❌ Failed to download ${filename} after ${retries} attempts`);
          return null;
        }
        
        // Wait before retry
        await this.sleep(2000 * attempt);
      }
    }
  }

  /**
   * Download photos from the most expensive 5-star hotels
   */
  async downloadLuxuryPhotos() {
    console.log('🚀 Starting luxury 5-star hotel photo download...');
    
    // Most expensive 5-star hotels from your database
    const luxuryHotels = [
      {
        id: 'luxury-1',
        name: 'Gran Hotel Bahia del Duque',
        city: 'Costa Adeje',
        country: 'Spain',
        rating: 5,
        price: { min: 700, max: 1200, currency: 'USD' },
        description: 'Exclusive beachfront resort with luxury amenities',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_spa_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg'
          ],
          pools: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg'],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg'],
          spa: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_spa_001.jpg']
        }
      },
      {
        id: 'luxury-2',
        name: 'Hotel Arts Barcelona',
        city: 'Barcelona',
        country: 'Spain',
        rating: 5,
        price: { min: 600, max: 1000, currency: 'USD' },
        description: 'Luxury beachfront hotel with Michelin-starred dining',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_l_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_a_002.jpg'
          ],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_r_001.jpg'],
          lobby: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_l_001.jpg'],
          spa: ['https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg']
        }
      },
      {
        id: 'luxury-3',
        name: 'Hotel Riu Palace Tenerife',
        city: 'Adeje',
        country: 'Spain',
        rating: 5,
        price: { min: 500, max: 800, currency: 'USD' },
        description: 'Luxury beachfront resort with stunning ocean views',
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_a_003.jpg'
          ],
          pools: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_p_001.jpg'],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000010/000010a_hb_r_001.jpg']
        }
      }
    ];

    const downloadedPhotos = [];
    
    for (const hotel of luxuryHotels) {
      console.log(`\n🏆 Processing ${hotel.name} (${hotel.city}) - $${hotel.price.min}-${hotel.price.max}/night`);
      
      // Download general views first (best for landing page)
      const generalViews = hotel.priorityPhotos.generalViews;
      
      for (let i = 0; i < generalViews.length; i++) {
        const photoUrl = generalViews[i];
        const safeHotelName = hotel.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        
        const filename = `${safeHotelName}-luxury-general-${i + 1}.jpg`;
        
        const downloadedPath = await this.downloadPhoto(photoUrl, filename);
        
        if (downloadedPath) {
          downloadedPhotos.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            city: hotel.city,
            country: hotel.country,
            rating: hotel.rating,
            price: hotel.price,
            photoIndex: i + 1,
            filename,
            url: photoUrl,
            localPath: downloadedPath,
            roomType: 'General View',
            roomTypeName: 'Luxury Hotel Exterior',
            category: 'luxury'
          });
        }
        
        // Add delay to be respectful
        await this.sleep(2000);
      }
      
      // Download one pool photo if available (high visual impact)
      if (hotel.priorityPhotos.pools && hotel.priorityPhotos.pools.length > 0) {
        const poolUrl = hotel.priorityPhotos.pools[0];
        const safeHotelName = hotel.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        
        const filename = `${safeHotelName}-luxury-pool.jpg`;
        
        const downloadedPath = await this.downloadPhoto(poolUrl, filename);
        
        if (downloadedPath) {
          downloadedPhotos.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            city: hotel.city,
            country: hotel.country,
            rating: hotel.rating,
            price: hotel.price,
            photoIndex: 'pool',
            filename,
            url: poolUrl,
            localPath: downloadedPath,
            roomType: 'Pool',
            roomTypeName: 'Luxury Pool Area',
            category: 'luxury'
          });
        }
        
        await this.sleep(2000);
      }
      
      console.log(`✅ Completed ${hotel.name}`);
      
      // Add delay between hotels
      await this.sleep(3000);
    }
    
    // Save metadata
    await this.saveMetadata(downloadedPhotos);
    
    console.log(`\n🎉 Luxury download complete! Downloaded ${downloadedPhotos.length} photos`);
    console.log(`📁 Photos saved to: ${this.downloadDir}`);
    
    return downloadedPhotos;
  }

  /**
   * Save metadata about downloaded photos
   */
  async saveMetadata(photos) {
    const metadata = {
      scrapedAt: new Date().toISOString(),
      totalPhotos: photos.length,
      hotels: [...new Set(photos.map(p => p.hotelName))],
      photoQuality: 'XXL (2048px)',
      source: 'Hotelbeds Luxury',
      category: '5-Star Luxury Hotels',
      priceRange: {
        min: Math.min(...photos.map(p => p.price.min)),
        max: Math.max(...photos.map(p => p.price.max)),
        currency: 'USD'
      },
      photos: photos.map(photo => ({
        filename: photo.filename,
        hotelName: photo.hotelName,
        city: photo.city,
        country: photo.country,
        rating: photo.rating,
        price: photo.price,
        roomType: photo.roomType,
        roomTypeName: photo.roomTypeName,
        category: photo.category,
        originalUrl: photo.url,
        localPath: photo.localPath
      }))
    };
    
    const metadataPath = path.join(this.downloadDir, 'luxury-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📄 Luxury metadata saved to: ${metadataPath}`);
  }

  /**
   * Generate HTML gallery for preview
   */
  async generateLuxuryGallery() {
    const metadataPath = path.join(this.downloadDir, 'luxury-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      console.log('❌ No luxury metadata found. Run download first.');
      return;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏆 Luxury Hotelbeds Photos Gallery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            max-width: 1600px;
            margin: 0 auto;
        }
        .photo-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .photo-card:hover {
            transform: translateY(-12px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .photo-card img {
            width: 100%;
            height: 300px;
            object-fit: cover;
        }
        .photo-info {
            padding: 25px;
        }
        .hotel-name {
            font-weight: 800;
            font-size: 20px;
            margin-bottom: 10px;
            color: #333;
        }
        .hotel-location {
            color: #666;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .hotel-rating {
            color: #f39c12;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .hotel-price {
            color: #27ae60;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .room-type {
            color: #8e44ad;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stats {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(15px);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 40px;
            text-align: center;
            color: white;
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .luxury-badge {
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #333;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 700;
            display: inline-block;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .price-range {
            font-size: 24px;
            font-weight: 800;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Luxury Hotelbeds Photos Gallery</h1>
        <p>5-Star Hotels • XXL Quality • Professional Photography</p>
        <p>Scraped on ${new Date(metadata.scrapedAt).toLocaleString()}</p>
    </div>
    
    <div class="stats">
        <h2>💰 Luxury Statistics</h2>
        <p><strong>Total Photos:</strong> ${metadata.totalPhotos}</p>
        <p><strong>Luxury Hotels:</strong> ${metadata.hotels.length}</p>
        <p><strong>Hotels:</strong> ${metadata.hotels.join(', ')}</p>
        <div class="price-range">$${metadata.priceRange.min} - $${metadata.priceRange.max} USD/night</div>
        <div class="luxury-badge">${metadata.photoQuality} • ${metadata.category}</div>
    </div>
    
    <div class="gallery">
        ${metadata.photos.map(photo => `
            <div class="photo-card">
                <img src="${photo.filename}" alt="${photo.hotelName}" loading="lazy">
                <div class="photo-info">
                    <div class="hotel-name">${photo.hotelName}</div>
                    <div class="hotel-location">${photo.city}, ${photo.country}</div>
                    <div class="hotel-rating">⭐ ${photo.rating}/5 Stars</div>
                    <div class="hotel-price">$${photo.price.min} - $${photo.price.max}/night</div>
                    <div class="room-type">${photo.roomTypeName}</div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    
    const galleryPath = path.join(this.downloadDir, 'luxury-gallery.html');
    fs.writeFileSync(galleryPath, html);
    
    console.log(`🎨 Luxury gallery generated: ${galleryPath}`);
    console.log(`🌐 Open in browser: file://${galleryPath}`);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the luxury downloader
async function main() {
  const downloader = new LuxuryHotelbedsPhotoDownloader();
  
  try {
    // Download luxury photos
    const photos = await downloader.downloadLuxuryPhotos();
    
    // Generate gallery
    await downloader.generateLuxuryGallery();
    
    console.log('\n🎉 LUXURY SUCCESS!');
    console.log(`📁 Photos downloaded to: ${downloader.downloadDir}`);
    console.log(`🌐 Gallery: ${downloader.downloadDir}/luxury-gallery.html`);
    console.log(`📄 Metadata: ${downloader.downloadDir}/luxury-metadata.json`);
    
  } catch (error) {
    console.error('❌ Luxury download failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = LuxuryHotelbedsPhotoDownloader;

