const axios = require('axios');

class FreePhotoServiceNoAPI {
  constructor() {
    // Curated high-quality hotel photos from free sources
    this.curatedPhotos = {
      luxury: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1920&h=1080&fit=crop'
      ],
      rooms: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop'
      ],
      resorts: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1920&h=1080&fit=crop'
      ],
      interiors: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop'
      ]
    };
  }

  /**
   * Get curated hotel photos (no API key required)
   */
  async getCuratedPhotos(category = 'luxury', count = 8) {
    const photos = this.curatedPhotos[category] || this.curatedPhotos.luxury;
    const selectedPhotos = this.shuffleArray([...photos]).slice(0, count);
    
    return selectedPhotos.map((url, index) => ({
      url: url,
      width: 1920,
      height: 1080,
      description: `Luxury hotel ${category} photo ${index + 1}`,
      source: 'unsplash-curated',
      photographer: 'Unsplash Community',
      photographerUrl: 'https://unsplash.com'
    }));
  }

  /**
   * Get hotel photos from multiple categories
   */
  async getHotelPhotos(hotelName, city, country, count = 10) {
    console.log(`🆓 Getting FREE curated photos for ${hotelName}...`);
    
    const categories = ['luxury', 'rooms', 'resorts', 'interiors'];
    let allPhotos = [];
    
    // Get photos from each category
    for (const category of categories) {
      const photos = await this.getCuratedPhotos(category, Math.ceil(count / categories.length));
      allPhotos = allPhotos.concat(photos);
    }
    
    // Shuffle and limit to requested count
    const shuffledPhotos = this.shuffleArray(allPhotos);
    const finalPhotos = shuffledPhotos.slice(0, count);
    
    console.log(`  ✅ Found ${finalPhotos.length} FREE curated photos`);
    
    return finalPhotos;
  }

  /**
   * Shuffle array to randomize photo selection
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Test the curated photo service
   */
  async testService() {
    console.log('🧪 Testing FREE curated photo service...');
    
    const categories = ['luxury', 'rooms', 'resorts', 'interiors'];
    
    for (const category of categories) {
      console.log(`\n📸 Testing category: "${category}"`);
      const photos = await this.getCuratedPhotos(category, 3);
      console.log(`  Found: ${photos.length} photos`);
      photos.forEach((photo, index) => {
        console.log(`    ${index + 1}. ${photo.width}x${photo.height} - ${photo.url}`);
      });
    }
  }
}

// Export the service
module.exports = { FreePhotoServiceNoAPI };

// Test the service if run directly
if (require.main === module) {
  const service = new FreePhotoServiceNoAPI();
  service.testService().catch(console.error);
}
