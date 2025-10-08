import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface HotelbedsImage {
  type: {
    code: string;
    description: {
      content: string;
    };
  };
  path: string;
  order: number;
  visualOrder: number;
  roomCode?: string;
  roomType?: string;
  characteristicCode?: string;
}

export interface HotelbedsHotel {
  code: number;
  name: {
    content: string;
  };
  description: {
    content: string;
  };
  address: {
    content: string;
  };
  S2C: string;
  images: HotelbedsImage[];
  facilities: any[];
  rooms: any[];
  web: string;
  lastUpdate: string;
  ranking: number;
}

export interface HotelbedsPhotoResponse {
  hotel: HotelbedsHotel;
  priorityPhotos: {
    generalViews: string[];
    pools: string[];
    rooms: string[];
    restaurants: string[];
    others: string[];
  };
  allPhotos: string[];
}

export class HotelbedsClient {
  private api: AxiosInstance;
  private apiKey: string;
  private secret: string;
  private baseUrl: string = 'https://api.test.hotelbeds.com';

  constructor(apiKey: string, secret: string) {
    this.apiKey = apiKey;
    this.secret = secret;
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate authentication signature for Hotelbeds API
   */
  private generateSignature(): { signature: string; timestamp: number } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash('sha256')
      .update(this.apiKey + this.secret + timestamp)
      .digest('hex');
    
    return { signature, timestamp };
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders() {
    const { signature } = this.generateSignature();
    return {
      'Api-key': this.apiKey,
      'X-Signature': signature
    };
  }

  /**
   * Sort images by priority (General views first, then by visual order)
   */
  private sortImagesByPriority(images: HotelbedsImage[]): HotelbedsImage[] {
    return images.sort((a, b) => {
      // General views first
      if (a.type?.code === 'GEN' && b.type?.code !== 'GEN') return -1;
      if (b.type?.code === 'GEN' && a.type?.code !== 'GEN') return 1;
      
      // Then by visual order
      return (a.visualOrder || 0) - (b.visualOrder || 0);
    });
  }

  /**
   * Generate XXL quality image URL (2048px)
   */
  private generateXXLImageUrl(path: string): string {
    return `https://photos.hotelbeds.com/giata/xxl/${path}`;
  }

  /**
   * Organize photos by priority categories
   */
  private organizePhotosByPriority(images: HotelbedsImage[]): {
    generalViews: string[];
    pools: string[];
    rooms: string[];
    restaurants: string[];
    others: string[];
  } {
    const organized = {
      generalViews: [] as string[],
      pools: [] as string[],
      rooms: [] as string[],
      restaurants: [] as string[],
      others: [] as string[]
    };

    images.forEach(img => {
      const xxlUrl = this.generateXXLImageUrl(img.path);
      const typeCode = img.type?.code;

      switch (typeCode) {
        case 'GEN':
          organized.generalViews.push(xxlUrl);
          break;
        case 'PIS':
          organized.pools.push(xxlUrl);
          break;
        case 'HAB':
          organized.rooms.push(xxlUrl);
          break;
        case 'RES':
          organized.restaurants.push(xxlUrl);
          break;
        default:
          organized.others.push(xxlUrl);
          break;
      }
    });

    return organized;
  }

  /**
   * Get hotel with priority photos (General views displayed first)
   */
  async getHotelWithPriorityPhotos(hotelId: number): Promise<HotelbedsPhotoResponse> {
    try {
      const headers = this.getAuthHeaders();
      const response = await this.api.get(`/hotel-content-api/1.0/hotels/${hotelId}`, { headers });
      
      const hotel = response.data as HotelbedsHotel;
      
      // Sort images by priority
      const sortedImages = this.sortImagesByPriority(hotel.images || []);
      
      // Organize photos by priority categories
      const priorityPhotos = this.organizePhotosByPriority(sortedImages);
      
      // Generate all XXL URLs
      const allPhotos = sortedImages.map(img => this.generateXXLImageUrl(img.path));

      return {
        hotel,
        priorityPhotos,
        allPhotos
      };
    } catch (error) {
      throw new Error(`Failed to fetch hotel ${hotelId}: ${error}`);
    }
  }

  /**
   * Get multiple hotels with priority photos
   */
  async getHotelsWithPriorityPhotos(hotelIds: number[]): Promise<HotelbedsPhotoResponse[]> {
    const promises = hotelIds.map(id => this.getHotelWithPriorityPhotos(id));
    return Promise.all(promises);
  }

  /**
   * Get hotels list with pagination
   */
  async getHotels(from: number = 1, to: number = 100): Promise<HotelbedsHotel[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await this.api.get(`/hotel-content-api/1.0/hotels?from=${from}&to=${to}`, { headers });
      
      return response.data.hotels || [];
    } catch (error) {
      throw new Error(`Failed to fetch hotels: ${error}`);
    }
  }

  /**
   * Test image URL accessibility
   */
  async testImageAccess(imageUrl: string): Promise<{ accessible: boolean; status?: number; size?: number }> {
    try {
      const response = await axios.head(imageUrl, { timeout: 5000 });
      return {
        accessible: true,
        status: response.status,
        size: parseInt(response.headers['content-length'] || '0')
      };
    } catch (error) {
      return {
        accessible: false,
        status: (error as any).response?.status
      };
    }
  }
}

// Example usage
export async function exampleUsage() {
  const client = new HotelbedsClient('0bc206e3e785cb903a7e081d08a2f655', '33173d97fe');
  
  try {
    // Get hotel with priority photos
    const hotelData = await client.getHotelWithPriorityPhotos(1);
    
    console.log('🏨 Hotel:', hotelData.hotel.name.content);
    console.log('⭐ Rating:', hotelData.hotel.S2C);
    console.log('📊 Total Images:', hotelData.allPhotos.length);
    
    console.log('\\n�� PRIORITY PHOTOS (XXL Quality - 2048px):');
    console.log('General Views:', hotelData.priorityPhotos.generalViews.length);
    console.log('Pools:', hotelData.priorityPhotos.pools.length);
    console.log('Rooms:', hotelData.priorityPhotos.rooms.length);
    console.log('Restaurants:', hotelData.priorityPhotos.restaurants.length);
    
    // Test first image accessibility
    if (hotelData.priorityPhotos.generalViews.length > 0) {
      const testResult = await client.testImageAccess(hotelData.priorityPhotos.generalViews[0]);
      console.log('\\n🖼️ First image test:', testResult);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}
