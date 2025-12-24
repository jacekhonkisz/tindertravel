import { Image } from 'react-native';
import { HotelCard, HotelsResponse, PersonalizationData, ApiResponse, OTPRequest, OTPVerification, AuthResponse } from '../types';
import { getApiConfig, logApiConfig, printApiInstructions } from '../config/api';

// Get API configuration based on environment (async)
let apiConfig: any = null;
let API_BASE_URL = 'http://192.168.1.108:3001'; // Default to current network IP
let API_TIMEOUT = 30000; // Default timeout
let configInitialized = false;
let configInitPromise: Promise<void> | null = null;

// Initialize API configuration
const initializeConfig = async () => {
  if (configInitPromise) {
    return configInitPromise;
  }
  
  configInitPromise = (async () => {
    try {
      console.log('🔧 Initializing API configuration...');
      apiConfig = await getApiConfig();
      API_BASE_URL = apiConfig.baseUrl;
      API_TIMEOUT = apiConfig.timeout;

      // Update the API client instance
      apiClient.updateConfig(API_BASE_URL, API_TIMEOUT);
      configInitialized = true;

      // Log configuration on startup
      console.log('\n' + '='.repeat(60));
      console.log('🌐 API CLIENT - CONFIGURATION');
      console.log('='.repeat(60));
      logApiConfig(apiConfig);
      console.log('='.repeat(60));
      console.log('');
    } catch (error) {
      console.error('❌ Failed to initialize API config:', error);
      // Keep default URL if config fails
    }
  })();
  
  return configInitPromise;
};

// Start initialization immediately
initializeConfig();

// If connection fails, show instructions
let hasShownInstructions = false;

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  // Update configuration if it becomes available later
  updateConfig(newBaseUrl: string, newTimeout: number) {
    this.baseUrl = newBaseUrl;
    this.timeout = newTimeout;
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure config is initialized before making requests
    if (!configInitialized) {
      await initializeConfig();
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    
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
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Create error object with status code
        const error: any = new Error(errorMessage);
        error.status = response.status;
        error.response = { status: response.status, data: errorData };
        
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Show configuration instructions on first error
      if (!hasShownInstructions) {
        hasShownInstructions = true;
        console.error(`🌐 API request failed: ${endpoint}`, error);
        printApiInstructions();
      }
      
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; seeded: boolean; hotelCount: number }> {
    return this.request('/health');
  }

  // Validate connection to API server
  async validateConnection(): Promise<{ 
    connected: boolean; 
    message: string; 
    details?: any 
  }> {
    try {
      console.log('🔍 Validating API connection...');
      const health = await this.healthCheck();
      
      if (health.status === 'ok') {
        console.log('✅ API connection validated successfully');
        console.log(`   Server Status: ${health.status}`);
        console.log(`   Database: ${health.seeded ? 'Seeded' : 'Not seeded'}`);
        console.log(`   Hotels Available: ${health.hotelCount}`);
        
        return {
          connected: true,
          message: 'API connection successful',
          details: health,
        };
      } else {
        return {
          connected: false,
          message: 'API returned unexpected status',
          details: health,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ API connection validation failed:', errorMessage);
      console.error('');
      console.error('🔧 TROUBLESHOOTING:');
      console.error('   1. Check if the server is running: lsof -i TCP:3001');
      console.error('   2. Check your network IP: ifconfig | grep "inet "');
      console.error(`   3. Current API URL: ${this.baseUrl}`);
      console.error('   4. Update the IP in app/src/config/api.ts if needed');
      console.error('');
      
      return {
        connected: false,
        message: `Connection failed: ${errorMessage}`,
        details: { error: errorMessage, baseUrl: this.baseUrl },
      };
    }
  }

  // AUTHENTICATION METHODS

  // Request OTP code via email
  async requestOTP(data: OTPRequest): Promise<AuthResponse & { waitSeconds?: number }> {
    try {
      return await this.request<AuthResponse & { waitSeconds?: number }>('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      // Better error handling for rate limiting
      if (error.status === 429 || error.response?.status === 429) {
        return {
          success: false,
          error: error.message || 'Too many requests. Please wait before trying again.',
          waitSeconds: error.waitSeconds || 60,
        };
      }
      return {
        success: false,
        error: error.message || 'Failed to request OTP',
      };
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
      
      // Make request without logging the expected 401 error
      const url = `${this.baseUrl}/api/auth/verify-token`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Restore original token
      this.setAuthToken(originalToken);

      if (response.status === 401) {
        // Expected - token is invalid/expired (don't log as error)
        return false;
      }

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      // Restore original token on error
      this.setAuthToken(this.authToken);
      // Don't log - token verification failure is expected when not logged in
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
  // Option to use Partners API instead of Supabase
  async getHotels(params: {
    limit?: number;
    offset?: number;
    personalization?: PersonalizationData;
    usePartners?: boolean; // Use Partners API instead of Supabase
  } = {}): Promise<HotelsResponse> {
    const { limit = 20, offset = 0, personalization, usePartners = false } = params;
    
    // Use local backend's Partners endpoint (has R2 photos integrated)
    if (usePartners) {
      const page = Math.floor(offset / limit) + 1;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
        status: 'active',
        include_photos: 'true' // Important: request R2 photos
      });

      // Use local backend endpoint which has R2 photo mapping
      const response = await this.request(`/api/hotels/partners?${queryParams.toString()}`);
      
      // Response is already in HotelsResponse format from our backend
      return {
        hotels: response.hotels || [],
        total: response.total || 0,
        hasMore: response.hasMore || false
      };
    }
    
    // Default: Use Supabase endpoint
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

  // Get GIATA hotel location (coordinates)
  async getGiataLocation(giataId: number): Promise<{
    success: boolean;
    location?: {
      giata_id: number;
      hotel_name: string;
      latitude?: number;
      longitude?: number;
      address?: string;
      city?: string;
      country?: string;
      postal_code?: string;
    };
    error?: string;
  }> {
    try {
      return await this.request(`/api/giata/${giataId}/location`);
    } catch (error) {
      console.error(`Failed to fetch GIATA location for ID ${giataId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

  // USER METRICS ENDPOINTS

  // Save user preferences to database
  async saveUserPreferences(data: {
    userId: string;
    countryAffinity: Record<string, number>;
    amenityAffinity: Record<string, number>;
    seenHotels: string[];
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Load user preferences from database
  async loadUserPreferences(userId: string): Promise<{
    success: boolean;
    preferences?: {
      countryAffinity: Record<string, number>;
      amenityAffinity: Record<string, number>;
      seenHotels: string[];
      lastUpdated: string;
    } | null;
    error?: string;
  }> {
    return this.request(`/api/user/preferences?userId=${encodeURIComponent(userId)}`);
  }

  // Save user interaction (swipe action)
  async saveUserInteraction(data: {
    userId: string;
    hotelId: string;
    actionType: 'like' | 'superlike' | 'dismiss';
    sessionId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.request('/api/user/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Save hotel to user's saved list
  async saveUserHotel(data: {
    userId: string;
    hotelId: string;
    saveType: 'like' | 'superlike';
    hotelData: HotelCard;
  }): Promise<{ success: boolean; error?: string }> {
    return this.request('/api/user/saved-hotels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Load user's saved hotels
  async loadUserSavedHotels(
    userId: string,
    type?: 'like' | 'superlike'
  ): Promise<{
    success: boolean;
    hotels: HotelCard[];
    error?: string;
  }> {
    const url = type
      ? `/api/user/saved-hotels?userId=${encodeURIComponent(userId)}&type=${type}`
      : `/api/user/saved-hotels?userId=${encodeURIComponent(userId)}`;
    return this.request(url);
  }

  // Remove hotel from saved list
  async removeUserSavedHotel(
    userId: string,
    hotelId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.request(`/api/user/saved-hotels/${userId}/${hotelId}`, {
      method: 'DELETE',
    });
  }

  // Get user stats
  async getUserStats(userId: string): Promise<{
    success: boolean;
    stats?: {
      totalInteractions: number;
      likes: number;
      superlikes: number;
      dismisses: number;
      savedLikes: number;
      savedSuperlikes: number;
    };
    error?: string;
  }> {
    return this.request(`/api/user/stats?userId=${encodeURIComponent(userId)}`);
  }

  // Get personalized hotel recommendations
  // Changed to POST to avoid HTTP 431 errors with large datasets
  async getRecommendations(params: {
    userId: string;
    limit?: number;
    offset?: number;
    countryAffinity?: Record<string, number>;
    amenityAffinity?: Record<string, number>;
    seenHotels?: string[];
    likedHotels?: HotelCard[];
    superlikedHotels?: HotelCard[];
  }): Promise<{
    hotels: HotelCard[];
    total: number;
    hasMore: boolean;
    algorithm: string;
    algorithmVersion: string;
    metrics: {
      averageScore: number;
      topScore: number;
      bottomScore: number;
    };
  }> {
    const {
      userId,
      limit = 20,
      offset = 0,
      countryAffinity = {},
      amenityAffinity = {},
      seenHotels = [],
      likedHotels = [],
      superlikedHotels = []
    } = params;

    // Send data in POST body instead of URL to avoid HTTP 431 errors
    return this.request('/api/hotels/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        limit,
        offset,
        countryAffinity,
        amenityAffinity,
        seenHotels,
        likedHotels,
        superlikedHotels
      })
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

  // Preload images for better performance using React Native's Image.prefetch
  async preloadImage(url: string): Promise<void> {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn(`Invalid image URL for preloading:`, url);
      return Promise.resolve();
    }

    try {
      await Image.prefetch(url);
    } catch (error) {
      throw new Error(`Failed to preload image: ${url}`);
    }
  }

  // Batch preload multiple images
  async preloadImages(urls: string[]): Promise<void> {
    // Filter out undefined, null, or empty URLs
    const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');
    
    if (validUrls.length === 0) {
      return;
    }

    const promises = validUrls.map(url => 
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
