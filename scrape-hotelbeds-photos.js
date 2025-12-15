const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HotelbedsPhotoScraper {
  constructor() {
    this.apiKey = process.env.HOTELBEDS_API_KEY || '0bc206e3e785cb903a7e081d08a2f655';
    this.secret = process.env.HOTELBEDS_SECRET || '33173d97fe';
    this.baseUrl = process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com';
    this.photoBaseUrl = process.env.HOTELBEDS_PHOTO_BASE_URL || 'https://photos.hotelbeds.com/giata/xxl/';
    
    // Create downloads directory
    this.downloadDir = path.join(__dirname, 'landing-page-photos');
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
    
    console.log('🏨 Hotelbeds Photo Scraper initialized');
    console.log(`📁 Download directory: ${this.downloadDir}`);
  }

  /**
   * Get authentication headers for Hotelbeds API
   */
  getAuthHeaders() {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = require('crypto')
      .createHash('sha256')
      .update(this.apiKey + this.secret + timestamp)
      .digest('hex');
    
    return {
      'Api-key': this.apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get hotel details with photos from Hotelbeds
   */
  async getHotelPhotos(hotelId) {
    try {
      console.log(`📸 Fetching photos for hotel ${hotelId}...`);
      
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/hotel-content-api/1.0/hotels/${hotelId}`, { 
        headers,
        timeout: 30000 
      });
      
      const hotel = response.data;
      
      if (!hotel.images || hotel.images.length === 0) {
        console.log(`⚠️ No photos found for hotel ${hotelId}`);
        return null;
      }

      // Sort images by priority (General views first)
      const sortedImages = this.sortImagesByPriority(hotel.images);
      
      return {
        hotelId,
        hotelName: hotel.name?.content || `Hotel ${hotelId}`,
        images: sortedImages,
        totalImages: sortedImages.length
      };
    } catch (error) {
      console.error(`❌ Error fetching hotel ${hotelId}:`, error.message);
      return null;
    }
  }

  /**
   * Sort images by priority (General views first)
   */
  sortImagesByPriority(images) {
    const priorityOrder = {
      'GEN': 1, // General views (hotel exterior)
      'PIS': 2, // Pools
      'HAB': 3, // Rooms
      'RES': 4, // Restaurants
      'PLA': 5, // Beach
      'COM': 6, // Lobby
      'DEP': 7  // Sports
    };

    return images.sort((a, b) => {
      const aPriority = priorityOrder[a.roomType?.code] || 999;
      const bPriority = priorityOrder[b.roomType?.code] || 999;
      return aPriority - bPriority;
    });
  }

  /**
   * Generate XXL photo URL
   */
  generatePhotoUrl(imagePath) {
    return `${this.photoBaseUrl}${imagePath}`;
  }

  /**
   * Download a single photo
   */
  async downloadPhoto(photoUrl, filename) {
    try {
      console.log(`⬇️ Downloading: ${filename}`);
      
      const response = await axios.get(photoUrl, {
        responseType: 'stream',
        timeout: 30000
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
   * Scrape and download photos for multiple hotels
   */
  async scrapeAllPhotos() {
    console.log('🚀 Starting Hotelbeds photo scraping...');
    
    // Available hotel IDs from your system
    const hotelIds = [1, 2, 3, 4, 5, 6, 7, 8];
    const downloadedPhotos = [];
    
    for (const hotelId of hotelIds) {
      try {
        const hotelData = await this.getHotelPhotos(hotelId);
        
        if (!hotelData) {
          console.log(`⚠️ Skipping hotel ${hotelId} - no data`);
          continue;
        }

        console.log(`🏨 Processing ${hotelData.hotelName} (${hotelData.totalImages} photos)`);
        
        // Download first 3 photos (best quality)
        const photosToDownload = hotelData.images.slice(0, 3);
        
        for (let i = 0; i < photosToDownload.length; i++) {
          const image = photosToDownload[i];
          const photoUrl = this.generatePhotoUrl(image.path);
          
          // Create filename: hotel-name-photo-number.jpg
          const safeHotelName = hotelData.hotelName
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
          
          const filename = `${safeHotelName}-${i + 1}.jpg`;
          
          const downloadedPath = await this.downloadPhoto(photoUrl, filename);
          
          if (downloadedPath) {
            downloadedPhotos.push({
              hotelId,
              hotelName: hotelData.hotelName,
              photoIndex: i + 1,
              filename,
              url: photoUrl,
              localPath: downloadedPath,
              roomType: image.roomType?.code || 'UNKNOWN',
              roomTypeName: image.roomType?.description || 'Unknown'
            });
          }
          
          // Add delay to be respectful
          await this.sleep(1000);
        }
        
        console.log(`✅ Completed ${hotelData.hotelName}`);
        
        // Add delay between hotels
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing hotel ${hotelId}:`, error.message);
      }
    }
    
    // Save metadata
    await this.saveMetadata(downloadedPhotos);
    
    console.log(`🎉 Scraping complete! Downloaded ${downloadedPhotos.length} photos`);
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
      photos: photos.map(photo => ({
        filename: photo.filename,
        hotelName: photo.hotelName,
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
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate HTML gallery for preview
   */
  async generateGallery() {
    const metadataPath = path.join(this.downloadDir, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      console.log('❌ No metadata found. Run scraping first.');
      return;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotelbeds Photos Gallery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .photo-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .photo-card:hover {
            transform: translateY(-4px);
        }
        .photo-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .photo-info {
            padding: 15px;
        }
        .hotel-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
            color: #333;
        }
        .room-type {
            color: #666;
            font-size: 14px;
        }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏨 Hotelbeds Photos Gallery</h1>
        <p>Scraped on ${new Date(metadata.scrapedAt).toLocaleString()}</p>
    </div>
    
    <div class="stats">
        <h2>📊 Statistics</h2>
        <p><strong>Total Photos:</strong> ${metadata.totalPhotos}</p>
        <p><strong>Hotels:</strong> ${metadata.hotels.length}</p>
        <p><strong>Hotels:</strong> ${metadata.hotels.join(', ')}</p>
    </div>
    
    <div class="gallery">
        ${metadata.photos.map(photo => `
            <div class="photo-card">
                <img src="${photo.filename}" alt="${photo.hotelName}" loading="lazy">
                <div class="photo-info">
                    <div class="hotel-name">${photo.hotelName}</div>
                    <div class="room-type">${photo.roomTypeName} (${photo.roomType})</div>
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
}

// Run the scraper
async function main() {
  const scraper = new HotelbedsPhotoScraper();
  
  try {
    // Scrape and download photos
    const photos = await scraper.scrapeAllPhotos();
    
    // Generate gallery
    await scraper.generateGallery();
    
    console.log('\n🎉 SUCCESS!');
    console.log(`📁 Photos downloaded to: ${scraper.downloadDir}`);
    console.log(`🌐 Gallery: ${scraper.downloadDir}/gallery.html`);
    console.log(`📄 Metadata: ${scraper.downloadDir}/metadata.json`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = HotelbedsPhotoScraper;

