import { HotelCard, HotelsResponse, PersonalizationData, ApiResponse, OTPRequest, OTPVerification, AuthResponse } from '../types';

// FORCE CORRECT IP - NO ENV VARIABLES
const API_BASE_URL = 'http://localhost:3001';
const API_TIMEOUT = 10000;

console.log('🌐 API Client FORCED to use base URL:', API_BASE_URL);

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 API Request: ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      console.log(`🌐 Making request to: ${url}`);
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`🌐 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`🌐 API Error Response:`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🌐 API Success: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`🌐 API request failed: ${endpoint}`, error);
      console.error(`🌐 Base URL: ${this.baseUrl}`);
      console.error(`🌐 Full URL: ${url}`);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; seeded: boolean; hotelCount: number }> {
    return this.request('/health');
  }

  // AUTHENTICATION METHODS

  // Request OTP code via email
  async requestOTP(data: OTPRequest): Promise<AuthResponse> {
    console.log('🌐 API Client: Requesting OTP for', data.email);
    console.log('🌐 API Client: Base URL', this.baseUrl);
    
    try {
      const response = await this.request<AuthResponse>('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🌐 API Client: OTP Response', response);
      return response;
    } catch (error) {
      console.log('🌐 API Client: OTP Error', error);
      throw error;
    }
  }

  // Verify OTP code and authenticate
  async verifyOTP(data: OTPVerification): Promise<AuthResponse> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Verify if auth token is still valid
  async verifyToken(token: string): Promise<boolean> {
    try {
      const originalToken = this.authToken;
      this.setAuthToken(token);
      
      const response = await this.request<{ valid: boolean }>('/api/auth/verify-token');
      
      // Restore original token
      this.setAuthToken(originalToken);
      
      return response.valid;
    } catch (error) {
      // Restore original token on error
      this.setAuthToken(this.authToken);
      return false;
    }
  }

  // HOTEL METHODS

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

  // PHOTO CURATION METHODS

  // Save photo curation for a hotel
  async savePhotoCuration(hotelId: string, data: {
    originalPhotos: string[];
    curatedPhotos: Array<{
      url: string;
      order: number;
      is_removed: boolean;
    }>;
  }): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/photos/curate/${hotelId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get photo curation for a hotel
  async getPhotoCuration(hotelId: string): Promise<{
    curation: any;
  }> {
    return this.request(`/api/photos/curate/${hotelId}`);
  }

  // Reset photo curation for a hotel
  async resetPhotoCuration(hotelId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/photos/curate/${hotelId}`, {
      method: 'DELETE',
    });
  }

  // Get all curated hotels
  async getCuratedHotels(): Promise<{
    hotels: any[];
    count: number;
  }> {
    return this.request('/api/photos/curated-hotels');
  }

  // Get photo quality statistics
  async getPhotoStats(): Promise<{
    stats: {
      totalHotels: number;
      curatedHotels: number;
      averagePhotosPerHotel: number;
      averageRemovedPhotos: number;
    };
  }> {
    return this.request('/api/photos/stats');
  }

  // Direct photo removal (dev mode only)
  async removePhotoDirectly(hotelId: string, photoIndex: number): Promise<{ 
    success: boolean; 
    message: string; 
    hotelId: string;
    photoIndex: number;
  }> {
    return this.request(`/api/photos/remove/${hotelId}/${photoIndex}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 