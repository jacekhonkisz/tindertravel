import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

export interface GooglePlacesPhoto {
  url: string;
  width: number;
  height: number;
  photoReference: string;
}

export interface GooglePlacesHotel {
  id: string; // place_id
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  photos: GooglePlacesPhoto[];
  location: {
    lat: number;
    lng: number;
  };
}

export class GooglePlacesClient {
  private client: AxiosInstance;
  private cache: NodeCache;
  private apiKey: string;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    
    // Cache for 24 hours (Google Places data doesn't change often)
    this.cache = new NodeCache({ stdTTL: 86400 });

    this.client = axios.create({
      timeout: 10000,
    });
  }

  private checkAccess(): boolean {
    return this.apiKey !== '';
  }

  /**
   * Search for hotels in a city using Google Places Text Search
   */
  async searchHotels(cityName: string, limit: number = 10): Promise<GooglePlacesHotel[]> {
    if (!this.checkAccess()) {
      console.warn('Google Places API key not configured');
      return [];
    }

    const cacheKey = `hotels_${cityName}_${limit}`;
    const cached = this.cache.get<GooglePlacesHotel[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const searchUrl = `${this.baseUrl}/textsearch/json`;
      const params = {
        query: `hotels in ${cityName}`,
        type: 'lodging',
        key: this.apiKey
      };

      const response = await this.client.get(searchUrl, { params });

      if (response.data.status === 'OK') {
        const hotels: GooglePlacesHotel[] = response.data.results.slice(0, limit).map((hotel: any) => ({
          id: hotel.place_id,
          name: hotel.name,
          address: hotel.formatted_address,
          rating: hotel.rating,
          priceLevel: hotel.price_level,
          photos: (hotel.photos || []).map((photo: any) => ({
            url: '', // Will be generated when needed
            width: 0,
            height: 0,
            photoReference: photo.photo_reference
          })),
          location: hotel.geometry.location
        }));

        this.cache.set(cacheKey, hotels);
        return hotels;
      } else {
        console.warn(`Google Places search failed: ${response.data.status}`);
        return [];
      }
    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  }

  /**
   * Generate high-quality photo URL from Google Places API
   */
  generatePhotoUrl(photoReference: string, maxWidth: number = 1600): string {
    if (!this.checkAccess()) {
      return '';
    }

    // Google Places API supports up to 1600px width for maximum quality
    // Also add maxheight parameter for better aspect ratio control
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&maxheight=1200&photoreference=${photoReference}&key=${this.apiKey}`;
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
      url: this.generatePhotoUrl(photo.photoReference, 1600),
      width: 1600,
      height: 1200,
      photoReference: photo.photoReference
    }));
  }

  /**
   * Smart photo selection - prioritize high-quality, Instagram-worthy photos
   */
  private selectBestPhotos(photos: any[], maxPhotos: number = 6): any[] {
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

    // High resolution bonus (Instagram prefers high-res)
    if (photo.width >= 1600) score += 50;
    else if (photo.width >= 1200) score += 30;
    else if (photo.width >= 800) score += 10;

    // Landscape orientation bonus (better for hotel photos)
    const aspectRatio = photo.width / photo.height;
    if (aspectRatio >= 1.2 && aspectRatio <= 1.8) score += 25; // Good landscape ratio
    else if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 15; // Square-ish
    
    // Minimum quality threshold
    if (photo.width < 600 || photo.height < 400) score -= 100; // Penalize low-res

    // Prefer photos with attributions (often higher quality)
    if (photo.html_attributions && photo.html_attributions.length > 0) {
      score += 10;
    }

    return score;
  }

  /**
   * Analyze photo content to detect Instagram-worthy features
   * This is a placeholder for future AI/ML integration
   */
  private analyzePhotoContent(photoUrl: string): Promise<{
    isInstagramWorthy: boolean;
    contentType: 'room' | 'exterior' | 'pool' | 'lobby' | 'restaurant' | 'amenity' | 'unknown';
    qualityScore: number;
  }> {
    // TODO: Integrate with Google Vision API or similar service
    // For now, return a basic analysis based on URL patterns
    return Promise.resolve({
      isInstagramWorthy: true, // Default to true for now
      contentType: 'unknown',
      qualityScore: 0.8
    });
  }

  /**
   * Enhanced photo selection with content analysis
   */
  private async selectInstagramPhotos(photos: any[], maxPhotos: number = 6): Promise<any[]> {
    if (!photos || photos.length === 0) return [];

    // First, apply basic quality filtering
    const qualityFiltered = this.selectBestPhotos(photos, Math.min(photos.length, maxPhotos * 2));

    // TODO: Add AI content analysis here
    // For now, prioritize based on dimensions and aspect ratio
    const instagramPriority = qualityFiltered.map(photo => {
      let priority = photo.score || 0;
      
      // Instagram prefers certain aspect ratios
      const aspectRatio = photo.width / photo.height;
      if (aspectRatio >= 1.0 && aspectRatio <= 1.91) { // Instagram-friendly ratios
        priority += 20;
      }
      
      // Prioritize larger, high-quality images
      if (photo.width >= 1080 && photo.height >= 1080) {
        priority += 15;
      }

      return { ...photo, instagramPriority: priority };
    });

    return instagramPriority
      .sort((a, b) => b.instagramPriority - a.instagramPriority)
      .slice(0, maxPhotos);
  }

  /**
   * Validate photo URL accessibility and quality
   */
  private async validatePhotoUrl(photoUrl: string): Promise<boolean> {
    try {
      const response = await this.client.head(photoUrl, { 
        timeout: 3000,
        validateStatus: (status) => status < 500 // Accept redirects
      });
      
      // Check if it's actually an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return false;
      }

      // Check minimum file size (avoid tiny/broken images)
      const contentLength = parseInt(response.headers['content-length'] || '0');
      if (contentLength > 0 && contentLength < 10000) { // Less than 10KB is probably too small
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`Photo validation failed for ${photoUrl}:`, (error as Error).message);
      return false;
    }
  }

  /**
   * Filter and validate photos for Instagram quality
   */
  private async getValidatedInstagramPhotos(photos: any[], maxPhotos: number = 6): Promise<string[]> {
    if (!photos || photos.length === 0) return [];

    // Get Instagram-optimized photo selection
    const instagramPhotos = await this.selectInstagramPhotos(photos, maxPhotos * 2); // Get extra for validation
    
    const validatedUrls: string[] = [];
    
    for (const photo of instagramPhotos) {
      if (validatedUrls.length >= maxPhotos) break;
      
      const photoUrl = this.generatePhotoUrl(photo.photo_reference, 1600);
      
      // Validate photo accessibility (with timeout to avoid blocking)
      const isValid = await this.validatePhotoUrl(photoUrl);
      
      if (isValid) {
        validatedUrls.push(photoUrl);
      }
    }

    return validatedUrls;
  }

  /**
   * Get hotel photos for a city (main method for integration) - ENHANCED
   */
  async getHotelPhotos(cityName: string, maxPhotos: number = 6): Promise<string[]> {
    try {
      const hotels = await this.searchHotels(cityName, 5);
      
      if (hotels.length === 0) {
        return [];
      }

      const photoUrls: string[] = [];
      
      for (const hotel of hotels) {
        if (photoUrls.length >= maxPhotos) break;
        
        // Use Instagram-quality photo selection with validation
        const instagramPhotos = await this.getValidatedInstagramPhotos(hotel.photos, 3); // Max 3 Instagram-quality photos per hotel
        photoUrls.push(...instagramPhotos);
      }

      return photoUrls.slice(0, maxPhotos);
    } catch (error) {
      console.error(`Failed to get Google Places photos for ${cityName}:`, error);
      return [];
    }
  }

  /**
   * Search for a specific hotel by name and get its photos (enhanced for more photos) - ENHANCED
   */
  async getSpecificHotelPhotos(hotelName: string, cityName: string, maxPhotos: number = 8): Promise<string[]> {
    if (!this.checkAccess()) {
      return [];
    }

    const cacheKey = `specific_hotel_${hotelName}_${cityName}_${maxPhotos}`;
    const cached = this.cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const allPhotoUrls: string[] = [];
      
      // Search queries to get more photos
      const searchQueries = [
        `${hotelName} ${cityName}`,
        `${hotelName} hotel ${cityName}`,
        `${hotelName} luxury hotel ${cityName}`,
        `${hotelName} resort ${cityName}`
      ];

      for (const query of searchQueries) {
        if (allPhotoUrls.length >= maxPhotos) break;

        try {
          const searchUrl = `${this.baseUrl}/textsearch/json`;
          const params = {
            query: query,
            type: 'lodging',
            key: this.apiKey
          };

          const response = await this.client.get(searchUrl, { params });

          if (response.data.status === 'OK' && response.data.results.length > 0) {
            // Check multiple results, not just the first one
            for (const place of response.data.results.slice(0, 3)) {
              if (allPhotoUrls.length >= maxPhotos) break;
              
              // Check if this is likely the same hotel (name similarity)
              if (this.isHotelMatch(place.name, hotelName)) {
                if (place.photos && place.photos.length > 0) {
                  // Use smart photo selection for better quality
                  const bestPhotos = this.selectBestPhotos(place.photos, 4);
                  const photoUrls = bestPhotos.map((photo: any) => 
                    this.generatePhotoUrl(photo.photo_reference, 1600)
                  );
                  
                  // Add unique photos only
                  for (const url of photoUrls) {
                    if (!allPhotoUrls.includes(url) && allPhotoUrls.length < maxPhotos) {
                      allPhotoUrls.push(url);
                    }
                  }
                }

                // If we found the exact hotel, also get detailed photos
                if (place.place_id) {
                  const detailedPhotos = await this.getPlacePhotos(place.place_id, maxPhotos - allPhotoUrls.length);
                  for (const url of detailedPhotos) {
                    if (!allPhotoUrls.includes(url) && allPhotoUrls.length < maxPhotos) {
                      allPhotoUrls.push(url);
                    }
                  }
                }
              }
            }
          }

          // Small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Failed search query "${query}":`, (error as Error).message);
        }
      }

      // Cache the results
      this.cache.set(cacheKey, allPhotoUrls);
      return allPhotoUrls;

    } catch (error) {
      console.error(`Failed to get photos for ${hotelName}:`, error);
      return [];
    }
  }

  /**
   * Check if a place name matches the target hotel name
   */
  private isHotelMatch(placeName: string, targetName: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedPlace = normalize(placeName);
    const normalizedTarget = normalize(targetName);
    
    // Check if they share significant common words
    const placeWords = normalizedPlace.split(/\s+/).filter(w => w.length > 2);
    const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 2);
    
    const commonWords = placeWords.filter(word => targetWords.includes(word));
    return commonWords.length >= Math.min(2, Math.floor(targetWords.length / 2));
  }

  /**
   * Get photos for a specific place ID
   */
  private async getPlacePhotos(placeId: string, maxPhotos: number): Promise<string[]> {
    try {
      const detailsUrl = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        fields: 'photos',
        key: this.apiKey
      };

      const response = await this.client.get(detailsUrl, { params });

      if (response.data.status === 'OK' && response.data.result?.photos) {
        return response.data.result.photos.slice(0, maxPhotos).map((photo: any) => 
          this.generatePhotoUrl(photo.photo_reference, 1600)
        );
      }

      return [];
    } catch (error) {
      console.warn(`Failed to get place photos for ${placeId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Get hotel details including photos by place ID
   */
  async getHotelDetails(placeId: string): Promise<GooglePlacesHotel | null> {
    if (!this.checkAccess()) {
      return null;
    }

    const cacheKey = `hotel_details_${placeId}`;
    const cached = this.cache.get<GooglePlacesHotel>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const detailsUrl = `${this.baseUrl}/details/json`;
      const params = {
        place_id: placeId,
        fields: 'name,formatted_address,rating,price_level,photos,geometry',
        key: this.apiKey
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
            url: this.generatePhotoUrl(photo.photo_reference, 1600),
            width: 1600,
            height: 1200,
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
} 