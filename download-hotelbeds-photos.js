const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HotelbedsPhotoDownloader {
  constructor() {
    // Create downloads directory
    this.downloadDir = path.join(__dirname, 'landing-page-photos');
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
    
    console.log('🏨 Hotelbeds Photo Downloader initialized');
    console.log(`📁 Download directory: ${this.downloadDir}`);
  }

  /**
   * Download a single photo
   */
  async downloadPhoto(photoUrl, filename) {
    try {
      console.log(`⬇️ Downloading: ${filename}`);
      
      const response = await axios.get(photoUrl, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
      console.error(`❌ Failed to download ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Download all Hotelbeds XXL photos
   */
  async downloadAllPhotos() {
    console.log('🚀 Starting Hotelbeds XXL photo download...');
    
    // Hotelbeds photos from your expanded database
    const hotels = [
      {
        id: 'expanded-1',
        name: 'Hotel Riu Palace Tenerife',
        city: 'Adeje',
        country: 'Spain',
        rating: 5,
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
      },
      {
        id: 'expanded-2',
        name: 'Melia Barcelona Sky',
        city: 'Barcelona',
        country: 'Spain',
        rating: 4,
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_l_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_a_002.jpg'
          ],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_r_001.jpg'],
          others: ['https://photos.hotelbeds.com/giata/xxl/00/000015/000015a_hb_l_001.jpg']
        }
      },
      {
        id: 'expanded-3',
        name: 'Iberostar Selection Playa de Palma',
        city: 'Palma',
        country: 'Spain',
        rating: 4,
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_a_003.jpg'
          ],
          pools: [
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_p_002.jpg'
          ],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000020/000020a_hb_r_001.jpg']
        }
      },
      {
        id: 'expanded-4',
        name: 'Hotel Arts Barcelona',
        city: 'Barcelona',
        country: 'Spain',
        rating: 5,
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
          others: [
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_l_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000025/000025a_hb_spa_001.jpg'
          ]
        }
      },
      {
        id: 'expanded-5',
        name: 'Gran Hotel Bahia del Duque',
        city: 'Costa Adeje',
        country: 'Spain',
        rating: 5,
        photos: [
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg',
          'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg'
        ],
        priorityPhotos: {
          generalViews: [
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_001.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_002.jpg',
            'https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_a_003.jpg'
          ],
          pools: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_p_001.jpg'],
          rooms: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_ro_001.jpg'],
          restaurants: ['https://photos.hotelbeds.com/giata/xxl/00/000030/000030a_hb_r_001.jpg']
        }
      }
    ];

    const downloadedPhotos = [];
    
    for (const hotel of hotels) {
      console.log(`\n🏨 Processing ${hotel.name} (${hotel.city})`);
      
      // Download general views first (best for landing page)
      const generalViews = hotel.priorityPhotos.generalViews;
      
      for (let i = 0; i < generalViews.length; i++) {
        const photoUrl = generalViews[i];
        const safeHotelName = hotel.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        
        const filename = `${safeHotelName}-general-${i + 1}.jpg`;
        
        const downloadedPath = await this.downloadPhoto(photoUrl, filename);
        
        if (downloadedPath) {
          downloadedPhotos.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            city: hotel.city,
            country: hotel.country,
            rating: hotel.rating,
            photoIndex: i + 1,
            filename,
            url: photoUrl,
            localPath: downloadedPath,
            roomType: 'General View',
            roomTypeName: 'Hotel Exterior'
          });
        }
        
        // Add delay to be respectful
        await this.sleep(1000);
      }
      
      console.log(`✅ Completed ${hotel.name}`);
      
      // Add delay between hotels
      await this.sleep(2000);
    }
    
    // Save metadata
    await this.saveMetadata(downloadedPhotos);
    
    console.log(`\n🎉 Download complete! Downloaded ${downloadedPhotos.length} photos`);
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
      source: 'Hotelbeds',
      photos: photos.map(photo => ({
        filename: photo.filename,
        hotelName: photo.hotelName,
        city: photo.city,
        country: photo.country,
        rating: photo.rating,
        roomType: photo.roomType,
        roomTypeName: photo.roomTypeName,
        originalUrl: photo.url,
        localPath: photo.localPath
      }))
    };
    
    const metadataPath = path.join(this.downloadDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`📄 Metadata saved to: ${metadataPath}`);
  }

  /**
   * Generate HTML gallery for preview
   */
  async generateGallery() {
    const metadataPath = path.join(this.downloadDir, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      console.log('❌ No metadata found. Run download first.');
      return;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotelbeds XXL Photos Gallery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .photo-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .photo-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 16px 48px rgba(0,0,0,0.3);
        }
        .photo-card img {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }
        .photo-info {
            padding: 20px;
        }
        .hotel-name {
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 8px;
            color: #333;
        }
        .hotel-location {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .hotel-rating {
            color: #f39c12;
            font-weight: 600;
            font-size: 14px;
        }
        .room-type {
            color: #27ae60;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stats {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 25px;
            border-radius: 16px;
            margin-bottom: 30px;
            text-align: center;
            color: white;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .quality-badge {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏨 Hotelbeds XXL Photos Gallery</h1>
        <p>Professional hotel photos at 2048px resolution</p>
        <p>Scraped on ${new Date(metadata.scrapedAt).toLocaleString()}</p>
    </div>
    
    <div class="stats">
        <h2>📊 Statistics</h2>
        <p><strong>Total Photos:</strong> ${metadata.totalPhotos}</p>
        <p><strong>Hotels:</strong> ${metadata.hotels.length}</p>
        <p><strong>Hotels:</strong> ${metadata.hotels.join(', ')}</p>
        <div class="quality-badge">${metadata.photoQuality}</div>
    </div>
    
    <div class="gallery">
        ${metadata.photos.map(photo => `
            <div class="photo-card">
                <img src="${photo.filename}" alt="${photo.hotelName}" loading="lazy">
                <div class="photo-info">
                    <div class="hotel-name">${photo.hotelName}</div>
                    <div class="hotel-location">${photo.city}, ${photo.country}</div>
                    <div class="hotel-rating">⭐ ${photo.rating}/5</div>
                    <div class="room-type">${photo.roomTypeName}</div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    
    const galleryPath = path.join(this.downloadDir, 'gallery.html');
    fs.writeFileSync(galleryPath, html);
    
    console.log(`🎨 Gallery generated: ${galleryPath}`);
    console.log(`🌐 Open in browser: file://${galleryPath}`);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the downloader
async function main() {
  const downloader = new HotelbedsPhotoDownloader();
  
  try {
    // Download photos
    const photos = await downloader.downloadAllPhotos();
    
    // Generate gallery
    await downloader.generateGallery();
    
    console.log('\n🎉 SUCCESS!');
    console.log(`📁 Photos downloaded to: ${downloader.downloadDir}`);
    console.log(`🌐 Gallery: ${downloader.downloadDir}/gallery.html`);
    console.log(`📄 Metadata: ${downloader.downloadDir}/metadata.json`);
    
  } catch (error) {
    console.error('❌ Download failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = HotelbedsPhotoDownloader;

