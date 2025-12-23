/**
 * Partners API Service
 * Connects to the Partners API for managing hotel partners
 * Main source: partners table (hotels_partners)
 */

// API credentials from environment variables
// Set PARTNERS_API_URL and PARTNERS_API_KEY in your .env file
const API_BASE = process.env.PARTNERS_API_URL || "https://web-production-b200.up.railway.app";
const API_KEY = process.env.PARTNERS_API_KEY || "";

export interface PartnersListParams {
  page?: number;
  per_page?: number;
  q?: string; // Search query
  status?: "active" | "paused" | "offboarded";
  country_code?: string; // ISO-3166 alpha-2 (e.g., "FR", "US")
  tag?: string; // Filter by tag (exact match)
}

export interface Partner {
  id: string; // UUID
  prospect_id: number; // Reference to hotels.id
  hotel_name: string;
  website?: string;
  location_label?: string;
  country_code?: string;
  city?: string;
  google_place_id?: string;
  lat?: number;
  lng?: number;
  dropbox_folder_id?: string;
  dropbox_path?: string;
  tags: string[];
  status: "active" | "paused" | "offboarded";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnersListResponse {
  partners: Partner[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PartnerWithProspect {
  partner: Partner;
  prospect: {
    id: number;
    hotel_name: string;
    email?: string;
    website?: string;
    country?: string;
    city?: string;
    stage?: string;
    status?: string;
    notes?: string;
    partner_id?: string;
  } | null;
}

export interface Photo {
  name: string;
  path: string;
  url: string; // Temporary download URL (4-hour validity)
  size: number;
  modified?: string;
}

export interface PartnerPhotosResponse {
  photos: Photo[];
  count: number;
  folder_path: string | null;
  partner_name: string;
  message?: string;
}

class PartnersApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = API_BASE, apiKey: string = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get authentication headers
   * Supports both API key and JWT token
   */
  private getAuthHeaders(jwtToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    } else {
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * List partners with filtering and pagination
   */
  async listPartners(
    params: PartnersListParams & { jwtToken?: string } = {}
  ): Promise<PartnersListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", String(params.page));
    if (params.per_page) queryParams.append("per_page", String(params.per_page));
    if (params.q) queryParams.append("q", params.q);
    if (params.status) queryParams.append("status", params.status);
    if (params.country_code) queryParams.append("country_code", params.country_code);
    if (params.tag) queryParams.append("tag", params.tag);

    const url = `${this.baseUrl}/api/partners?${queryParams.toString()}`;
    const { jwtToken, ...queryParamsOnly } = params;
    const headers = this.getAuthHeaders(jwtToken);

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching partners:", error);
      throw error;
    }
  }

  /**
   * Get a single partner by ID
   */
  async getPartner(partnerId: string): Promise<{ partner: Partner }> {
    const url = `${this.baseUrl}/api/partners/${partnerId}`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching partner:", error);
      throw error;
    }
  }

  /**
   * Get partner with prospect data
   */
  async getPartnerWithProspect(partnerId: string): Promise<PartnerWithProspect> {
    const url = `${this.baseUrl}/api/partners/${partnerId}/with-prospect`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching partner with prospect:", error);
      throw error;
    }
  }

  /**
   * Update a partner
   */
  async updatePartner(
    partnerId: string,
    updates: Partial<Partner>
  ): Promise<{ partner: Partner }> {
    const url = `${this.baseUrl}/api/partners/${partnerId}`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${errorData.error || ""}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating partner:", error);
      throw error;
    }
  }

  /**
   * Promote prospects to partners
   */
  async promoteProspects(prospectIds: number[]): Promise<{
    created: Array<{ prospect_id: number; partner_id: string }>;
    linked_existing: Array<{ prospect_id: number; partner_id: string }>;
    failed: Array<{ prospect_id: number; reason: string }>;
  }> {
    const url = `${this.baseUrl}/api/partners/promote`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prospect_ids: prospectIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error: ${response.status} ${response.statusText} - ${errorData.error || ""}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error promoting prospects:", error);
      throw error;
    }
  }

  /**
   * Get partner photos from Dropbox
   */
  async getPartnerPhotos(partnerId: string): Promise<PartnerPhotosResponse> {
    const url = `${this.baseUrl}/api/partners/${partnerId}/photos`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching partner photos:", error);
      throw error;
    }
  }

  /**
   * Get all partners (handles pagination automatically)
   */
  async getAllPartners(filters?: Omit<PartnersListParams, "page" | "per_page">): Promise<Partner[]> {
    const allPartners: Partner[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.listPartners({ ...filters, page, per_page: 50 });
      allPartners.push(...data.partners);
      hasMore = page < data.total_pages;
      page++;
    }

    return allPartners;
  }
}

// Export singleton instance
export const partnersApi = new PartnersApi();

// Export class for custom instances
export default PartnersApi;

