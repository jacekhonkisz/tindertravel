import { HotelCard, HotelsResponse, PersonalizationData, ApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.108:3001';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000');

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; seeded: boolean; hotelCount: number }> {
    return this.request('/health');
  }

  // Seed hotels from Amadeus API
  async seedHotels(): Promise<ApiResponse<{ count: number }>> {
    return this.request('/api/seed', {
      method: 'POST',
    });
  }

  // Get hotels with personalization
  async getHotels(params: {
    limit?: number;
    offset?: number;
    personalization?: PersonalizationData;
  } = {}): Promise<HotelsResponse> {
    const { limit = 20, offset = 0, personalization } = params;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    // Add personalization data to query params if provided
    if (personalization) {
      if (Object.keys(personalization.countryAffinity).length > 0) {
        queryParams.append('countryAffinity', JSON.stringify(personalization.countryAffinity));
      }
      if (Object.keys(personalization.amenityAffinity).length > 0) {
        queryParams.append('amenityAffinity', JSON.stringify(personalization.amenityAffinity));
      }
      if (personalization.seenHotels.length > 0) {
        queryParams.append('seenHotels', JSON.stringify(personalization.seenHotels));
      }
    }

    return this.request(`/api/hotels?${queryParams.toString()}`);
  }

  // Get specific hotel details
  async getHotelDetails(hotelId: string): Promise<HotelCard> {
    return this.request(`/api/hotels/${hotelId}`);
  }

  // Update personalization based on user actions
  async updatePersonalization(data: {
    hotelId: string;
    action: 'like' | 'dismiss' | 'superlike';
    country: string;
    amenityTags: string[];
  }): Promise<ApiResponse<void>> {
    return this.request('/api/personalization', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get real hotel photos for a city using Google Places
  async getCityPhotos(cityName: string, limit: number = 6): Promise<{
    city: string;
    photos: string[];
    count: number;
    source: string;
  }> {
    return this.request(`/api/photos/${encodeURIComponent(cityName)}?limit=${limit}`);
  }

  // Get photos for a specific hotel
  async getHotelPhotos(hotelName: string, cityName: string, limit: number = 6): Promise<{
    hotel: string;
    city: string;
    photos: string[];
    count: number;
    source: string;
  }> {
    return this.request(`/api/photos/hotel/${encodeURIComponent(hotelName)}?city=${encodeURIComponent(cityName)}&limit=${limit}`);
  }

  // Preload images for better performance
  async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      img.src = url;
    });
  }

  // Batch preload multiple images
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.preloadImage(url).catch(error => {
        console.warn(`Failed to preload image ${url}:`, error);
        return Promise.resolve(); // Don't fail the whole batch
      })
    );
    
    await Promise.all(promises);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 