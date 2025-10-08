import axios, { AxiosInstance } from 'axios';

export interface GooglePlacesPhoto {
  url: string;
  width: number;
  height: number;
  photoReference: string;
}

export interface GooglePlacesHotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  photos: GooglePlacesPhoto[];
  location: {
    lat: number;
    lng: number;
  };
}

export interface GooglePlacesSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  price_level: number;
  photos: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export class GooglePlacesClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, any>;

  constructor() {
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.cache = new Map();
    
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if API key is available
   */
  private checkAccess(): boolean {
    if (!this.apiKey) {
      console.error('Google Places API key not found. Please set GOOGLE_PLACES_API_KEY environment variable.');
      return false;
    }
    return true;
  }

  /**
   * Search for hotels in a specific city
   */
  async searchHotels(cityName: string, limit: number = 10): Promise<GooglePlacesHotel[]> {
    if (!this.checkAccess()) {
      return [];
    }

    try {
      const searchQuery = `luxury hotels in ${cityName}`;
      const searchUrl = `${this.baseUrl}/textsearch/json`;
      
      const params = {
        query: searchQuery,
        key: this.apiKey,
        type: 'lodging',
        fields: 'place_id,name,formatted_address,rating,price_level,photos,geometry'
      };

      const response = await this.client.get(searchUrl, { params });
      
      if (response.data.status === 'OK') {
        const results = response.data.results.slice(0, limit);
        return results.map((result: GooglePlacesSearchResult) => ({
          id: result.place_id,
          name: result.name,
          address: result.formatted_address,
          rating: result.rating || 0,
          priceLevel: result.price_level || 0,
          photos: (result.photos || []).map(photo => ({
            url: this.generatePhotoUrl(photo.photo_reference, 'high'),
            width: this.getPhotoWidth('high'),
            height: this.getPhotoHeight('high'),
            photoReference: photo.photo_reference
          })),
          location: result.geometry.location
        }));
      }

      return [];
    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  }

  /**
   * Generate high-quality photo URL from Google Places API
   * Now supports multiple resolution levels between Full HD and 4K
   */
  generatePhotoUrl(photoReference: string, quality: 'high' | 'ultra' | 'max' = 'high'): string {
    if (!this.checkAccess()) {
      return '';
    }

    // Resolution levels between Full HD and 4K
    const resolutions = {
      'high': { maxWidth: 1920, maxHeight: 1080 },      // Full HD
      'ultra': { maxWidth: 2560, maxHeight: 1440 },      // 2K
      'max': { maxWidth: 3840, maxHeight: 2160 }         // 4K
    };

    const resolution = resolutions[quality];
    
    return `${this.baseUrl}/photo?maxwidth=${resolution.maxWidth}&maxheight=${resolution.maxHeight}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Get photo width for a given quality level
   */
  private getPhotoWidth(quality: 'high' | 'ultra' | 'max'): number {
    const widths = {
      'high': 1920,   // Full HD
      'ultra': 2560,  // 2K
      'max': 3840     // 4K
    };
    return widths[quality];
  }

  /**
   * Get photo height for a given quality level
   */
  private getPhotoHeight(quality: 'high' | 'ultra' | 'max'): number {
    const heights = {
      'high': 1080,   // Full HD
      'ultra': 1440,  // 2K
      'max': 2160     // 4K
    };
    return heights[quality];
  }

  /**
   * Get photo URLs for a specific hotel (enhanced with smart selection)
   */
  getHotelPhotoUrls(hotel: GooglePlacesHotel, maxPhotos: number = 6): GooglePlacesPhoto[] {
    if (!hotel.photos || hotel.photos.length === 0) {
      return [];
    }

    // Use smart photo selection
    const bestPhotos = this.selectBestPhotos(hotel.photos, maxPhotos);
    return bestPhotos.map(photo => ({
      url: this.generatePhotoUrl(photo.photoReference, 'ultra'), // Use 2K quality by default
      width: this.getPhotoWidth('ultra'),
      height: this.getPhotoHeight('ultra'),
      photoReference: photo.photoReference
    }));
  }

  /**
   * Smart photo selection - prioritize high-quality, Instagram-worthy photos
   */
  selectBestPhotos(photos: any[], maxPhotos: number = 6): any[] {
    if (!photos || photos.length === 0) return [];

    // Score each photo based on quality criteria
    const scoredPhotos = photos.map(photo => ({
      ...photo,
      score: this.calculatePhotoScore(photo)
    }));

    // Sort by score (highest first) and take the best ones
    return scoredPhotos
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPhotos);
  }

  /**
   * Calculate photo quality score based on various criteria
   */
  private calculatePhotoScore(photo: any): number {
    let score = 0;

    // Base score for having a photo
    score += 10;

    // Prefer photos with good dimensions (if available)
    if (photo.width && photo.height) {
      const aspectRatio = photo.width / photo.height;
      // Prefer landscape photos (aspect ratio between 1.2 and 2.0)
      if (aspectRatio >= 1.2 && aspectRatio <= 2.0) {
        score += 20;
      } else if (aspectRatio >= 1.0 && aspectRatio <= 2.5) {
        score += 10;
      }
    }

    // Random factor to add variety
    score += Math.random() * 10;

    return score;
  }

  /**
   * Get detailed information about a specific hotel
   */
  async getHotelDetails(placeId: string): Promise<GooglePlacesHotel | null> {
    if (!this.checkAccess()) {
      return null;
    }

    try {
      const cacheKey = `hotel_details_${placeId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const detailsUrl = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,rating,price_level,photos,geometry'
      };

      const response = await this.client.get(detailsUrl, { params });
      
      if (response.data.status === 'OK') {
        const result = response.data.result;
        const hotel: GooglePlacesHotel = {
          id: placeId,
          name: result.name,
          address: result.formatted_address,
          rating: result.rating,
          priceLevel: result.price_level,
          photos: (result.photos || []).map((photo: any) => ({
            url: this.generatePhotoUrl(photo.photo_reference, 'ultra'), // Use 2K quality
            width: this.getPhotoWidth('ultra'),
            height: this.getPhotoHeight('ultra'),
            photoReference: photo.photo_reference
          })),
          location: result.geometry.location
        };
        
        this.cache.set(cacheKey, hotel);
        return hotel;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get hotel details for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Search for hotels with specific criteria
   */
  async searchHotelsWithCriteria(criteria: {
    location?: string;
    minRating?: number;
    maxPrice?: number;
    limit?: number;
  }): Promise<GooglePlacesHotel[]> {
    if (!this.checkAccess()) {
      return [];
    }

    try {
      let query = 'luxury hotels';
      
      if (criteria.location) {
        query += ` in ${criteria.location}`;
      }
      
      if (criteria.minRating) {
        query += ` rating ${criteria.minRating}+`;
      }

      const searchUrl = `${this.baseUrl}/textsearch/json`;
      const params = {
        query,
        key: this.apiKey,
        type: 'lodging',
        fields: 'place_id,name,formatted_address,rating,price_level,photos,geometry'
      };

      const response = await this.client.get(searchUrl, { params });
      
      if (response.data.status === 'OK') {
        let results = response.data.results;
        
        // Filter by rating if specified
        if (criteria.minRating) {
          results = results.filter((hotel: any) => hotel.rating >= criteria.minRating!);
        }
        
        // Filter by price if specified
        if (criteria.maxPrice) {
          results = results.filter((hotel: any) => 
            !hotel.price_level || hotel.price_level <= criteria.maxPrice!
          );
        }
        
        // Limit results
        const limit = criteria.limit || 10;
        results = results.slice(0, limit);
        
        return results.map((result: GooglePlacesSearchResult) => ({
          id: result.place_id,
          name: result.name,
          address: result.formatted_address,
          rating: result.rating || 0,
          priceLevel: result.price_level || 0,
          photos: (result.photos || []).map(photo => ({
            url: this.generatePhotoUrl(photo.photo_reference, 'ultra'), // Use 2K quality
            width: this.getPhotoWidth('ultra'),
            height: this.getPhotoHeight('ultra'),
            photoReference: photo.photo_reference
          })),
          location: result.geometry.location
        }));
      }

      return [];
    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  }

  /**
   * Get specific hotel photos by hotel name and location
   */
  async getSpecificHotelPhotos(hotelName: string, cityName: string, maxPhotos: number = 6): Promise<GooglePlacesPhoto[]> {
    if (!this.checkAccess()) {
      return [];
    }

    try {
      // Search for the specific hotel
      const searchQuery = `${hotelName} ${cityName}`;
      const searchUrl = `${this.baseUrl}/textsearch/json`;
      const params = {
        query: searchQuery,
        key: this.apiKey,
        type: 'lodging'
      };

      const response = await this.client.get(searchUrl, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        // Get the first result (most relevant)
        const place = response.data.results[0];
        
        // Get detailed information including photos
        const hotelDetails = await this.getHotelDetails(place.place_id);
        
        if (hotelDetails && hotelDetails.photos) {
          return hotelDetails.photos.slice(0, maxPhotos);
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to get specific hotel photos for ${hotelName} in ${cityName}:`, error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}