/**
 * Giata Partners API Service
 * Second database connection for Giata hotel partners with photos
 * Uses the same CRM API as partnersApi (Railway deployment)
 * As documented in giatapartners.md
 */

// API credentials from environment variables
// Set PARTNERS_API_URL and PARTNERS_API_KEY in your .env file
const API_BASE = process.env.PARTNERS_API_URL || "https://web-production-b200.up.railway.app";
const API_KEY = process.env.PARTNERS_API_KEY || "";

export interface GiataPartner {
  partner_id: string;
  giata_id: number;
  partner_status: 'candidate' | 'approved' | 'rejected' | 'archived';
  rating_internal?: number;
  notes_internal?: string;
  hotel_name: string;
  country_name?: string;
  city_name?: string;
  website?: string;
  email?: string;
  rating_value?: string;
  rating_unit?: string;
  images?: GiataImage[];
  total_images?: number;
  selected_photo_count?: number;
  has_selected_photos?: boolean;
}

export interface GiataImage {
  imageId: number;
  url: string;
  sizes?: {
    thumbnail?: { href: string; maxWidth: number };
    medium?: { href: string; maxWidth: number };
    large?: { href: string; maxWidth: number };
  };
}

export interface GiataLocation {
  giata_id: number;
  hotel_name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

export interface GiataSelectedPhoto {
  id: string;
  giata_id: number;
  original_url: string;
  cloudflare_public_url: string;
  cloudflare_image_id: string;
  is_hero: boolean;
  display_order: number;
}

export interface GiataPartnersListResponse {
  success: boolean;
  partners: GiataPartner[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface GiataSelectedPhotosResponse {
  giata_id: number;
  photos: GiataSelectedPhoto[];
  count: number;
}

export interface GiataPartnerStatsResponse {
  success: boolean;
  stats: {
    total: number;
    by_status: {
      approved: number;
      candidate: number;
      rejected: number;
      archived: number;
    };
    by_country: Array<[string, number]>;
    average_rating?: number;
    rated_count?: number;
  };
}

class GiataPartnersApi {
  private baseUrl: string;
  private apiKey: string;
  private photoCache: Map<number, { photos: GiataSelectedPhoto[]; timestamp: number }>;
  private readonly CACHE_TTL = 50 * 60 * 1000; // 50 minutes (photos expire after 1 hour)

  constructor(baseUrl?: string, apiKey?: string) {
    // Use the same API credentials as the internal CRM (partnersApi)
    this.baseUrl = baseUrl || process.env.GIATA_API_BASE_URL || API_BASE;
    this.apiKey = apiKey || process.env.GIATA_API_KEY || API_KEY;
    this.photoCache = new Map();

    console.log(`🔗 Giata Partners API using CRM endpoint: ${this.baseUrl}`);
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List all Giata partners with filtering and pagination
   */
  async listPartners(params: {
    page?: number;
    per_page?: number;
    partner_status?: 'candidate' | 'approved' | 'rejected' | 'archived';
    search?: string;
  } = {}): Promise<GiataPartnersListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));
    if (params.partner_status) queryParams.append('partner_status', params.partner_status);
    if (params.search) queryParams.append('search', params.search);

    const url = `${this.baseUrl}/api/giata-partners?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Giata API Error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Giata partners:', error);
      throw error;
    }
  }

  /**
   * Get a single partner by partner ID
   */
  async getPartner(partnerId: string): Promise<{ success: boolean; partner: GiataPartner }> {
    const url = `${this.baseUrl}/api/giata-partners/${partnerId}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Giata API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Giata partner:', error);
      throw error;
    }
  }

  /**
   * Get selected photos from Cloudflare for a hotel
   * Note: URLs expire after 1 hour, so we cache for 50 minutes
   */
  async getSelectedPhotos(giataId: number, useCache: boolean = true): Promise<GiataSelectedPhotosResponse> {
    // Check cache first
    if (useCache) {
      const cached = this.photoCache.get(giataId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        console.log(`📸 Using cached photos for Giata ID ${giataId}`);
        return {
          giata_id: giataId,
          photos: cached.photos,
          count: cached.photos.length,
        };
      }
    }

    const url = `${this.baseUrl}/api/giata/${giataId}/photos/selected`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Giata API Error: ${response.status} ${response.statusText}`);
      }

      const data: GiataSelectedPhotosResponse = await response.json();

      // Cache the photos
      this.photoCache.set(giataId, {
        photos: data.photos,
        timestamp: Date.now(),
      });

      console.log(`✅ Fetched ${data.photos.length} photos for Giata ID ${giataId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching photos for Giata ID ${giataId}:`, error);
      throw error;
    }
  }

  /**
   * Get partner statistics
   */
  async getStats(): Promise<GiataPartnerStatsResponse> {
    const url = `${this.baseUrl}/api/giata-partners/stats`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Giata API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Giata partner stats:', error);
      throw error;
    }
  }

  /**
   * Get all approved partners (handles pagination automatically)
   */
  async getAllApprovedPartners(): Promise<GiataPartner[]> {
    const allPartners: GiataPartner[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.listPartners({
        page,
        per_page: 100,
        partner_status: 'approved',
      });

      allPartners.push(...data.partners);
      hasMore = page < data.total_pages;
      page++;
    }

    console.log(`✅ Fetched all ${allPartners.length} approved Giata partners`);
    return allPartners;
  }

  /**
   * Get all partners with their selected photos
   * This is useful for mobile app initialization
   */
  async getAllPartnersWithPhotos(status: 'approved' | 'candidate' = 'approved'): Promise<
    Array<GiataPartner & { selectedPhotos: GiataSelectedPhoto[] }>
  > {
    const partners = await this.getAllApprovedPartners();
    const partnersWithPhotos: Array<GiataPartner & { selectedPhotos: GiataSelectedPhoto[] }> = [];

    console.log(`🔄 Fetching photos for ${partners.length} partners...`);

    for (const partner of partners) {
      try {
        // Only fetch photos if hotel has selected photos
        if (partner.has_selected_photos && partner.giata_id) {
          const photosData = await this.getSelectedPhotos(partner.giata_id);
          partnersWithPhotos.push({
            ...partner,
            selectedPhotos: photosData.photos,
          });
        } else {
          partnersWithPhotos.push({
            ...partner,
            selectedPhotos: [],
          });
        }
      } catch (error) {
        console.error(`Failed to fetch photos for partner ${partner.partner_id}:`, error);
        partnersWithPhotos.push({
          ...partner,
          selectedPhotos: [],
        });
      }
    }

    console.log(`✅ Loaded ${partnersWithPhotos.length} partners with photos`);
    return partnersWithPhotos;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const url = `${this.baseUrl}/api/test-api-key`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Successfully connected to Giata Partners API',
        details: data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get hotel location data (coordinates and address) from GIATA table in CRM
   * This directly queries the Giata table from the CRM API by giata_id
   */
  async getHotelLocation(giataId: number): Promise<GiataLocation | null> {
    try {
      console.log(`📍 Fetching location from Giata table for Giata ID ${giataId}`);
      
      // Try direct Giata table endpoint first (the CRM should have this endpoint)
      let url = `${this.baseUrl}/api/giata/${giataId}`;
      let response = await fetch(url, {
        headers: this.getHeaders(),
      });

      // If direct endpoint doesn't exist, use the partner endpoint and search for the giata_id
      if (!response.ok) {
        console.log(`📍 Direct Giata endpoint returned ${response.status}, fetching from partners endpoint`);
        
        // Fetch all partners (they should be cached) and find the one with matching giata_id
        const partnersResponse = await this.listPartners({
          page: 1,
          per_page: 100, // Get more partners to increase chance of finding it
          partner_status: undefined // Search all statuses
        });

        const partner = partnersResponse.partners.find((p: any) => p.giata_id === giataId);
        
        if (!partner) {
          console.log(`❌ No partner found with Giata ID ${giataId} in partners list`);
          return null;
        }

        console.log(`✅ Found partner for Giata ID ${giataId}: ${partner.hotel_name}`);
        
        // Extract location from partner data (which should include Giata table geolocation)
        const location: GiataLocation = {
          giata_id: giataId,
          hotel_name: partner.hotel_name,
          latitude: (partner as any).latitude || (partner as any).lat,
          longitude: (partner as any).longitude || (partner as any).lng || (partner as any).lon,
          address: (partner as any).address,
          city: partner.city_name,
          country: partner.country_name,
          postal_code: (partner as any).postal_code || (partner as any).postcode,
        };

        if (!location.latitude || !location.longitude) {
          console.log(`⚠️  Partner found but no coordinates in Giata table for Giata ID ${giataId}`);
          console.log(`📊 Partner data keys:`, Object.keys(partner));
          return null;
        }

        console.log(`✅ Found location from Giata table for ${location.hotel_name}: ${location.latitude}, ${location.longitude}`);
        return location;
      }

      // Handle direct Giata endpoint response
      const giataData = await response.json();

      const location: GiataLocation = {
        giata_id: giataId,
        hotel_name: giataData.hotel_name || giataData.name || '',
        latitude: giataData.latitude || giataData.lat,
        longitude: giataData.longitude || giataData.lng || giataData.lon,
        address: giataData.address,
        city: giataData.city || giataData.city_name,
        country: giataData.country || giataData.country_name,
        postal_code: giataData.postal_code || giataData.postcode,
      };

      if (!location.latitude || !location.longitude) {
        console.log(`⚠️  Giata record found but no coordinates available in Giata table for Giata ID ${giataId}`);
        console.log(`📊 Available data fields:`, Object.keys(giataData));
        return null;
      }

      console.log(`✅ Found location from Giata table for ${location.hotel_name}: ${location.latitude}, ${location.longitude}`);
      return location;
    } catch (error) {
      console.error(`Error fetching location from Giata table for Giata ID ${giataId}:`, error);
      return null;
    }
  }

  /**
   * Clear photo cache (useful when you need fresh URLs)
   */
  clearPhotoCache() {
    this.photoCache.clear();
    console.log('🧹 Cleared photo cache');
  }
}

// Export singleton instance
export const giataPartnersApi = new GiataPartnersApi();

// Export class for custom instances
export default GiataPartnersApi;

