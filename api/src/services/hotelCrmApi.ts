/**
 * Hotel CRM API Service
 * Connects to the external Hotel CRM API for fetching hotel data
 */

// API credentials from environment variables
// Set PARTNERS_API_URL and PARTNERS_API_KEY in your .env file
const API_BASE = process.env.PARTNERS_API_URL || "https://web-production-b200.up.railway.app";
const API_KEY = process.env.PARTNERS_API_KEY || "";

export interface HotelCrmParams {
  page?: number;
  per_page?: number;
  stage?: string;
  country?: string;
  city?: string;
  search?: string;
}

export interface HotelCrmResponse {
  hotels: any[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StatsResponse {
  statistics: {
    total: number;
    [key: string]: any;
  };
}

class HotelCrmApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = API_BASE, apiKey: string = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get hotels from the CRM API
   */
  async getHotels(params: HotelCrmParams = {}): Promise<HotelCrmResponse> {
    const queryParams = new URLSearchParams({
      page: String(params.page || 1),
      per_page: String(params.per_page || 50),
    });

    if (params.stage) {
      queryParams.append("stage", params.stage);
    }
    if (params.country) {
      queryParams.append("country", params.country);
    }
    if (params.city) {
      queryParams.append("city", params.city);
    }
    if (params.search) {
      queryParams.append("search", params.search);
    }

    const url = `${this.baseUrl}/api/hotels?${queryParams.toString()}`;

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
      console.error("Error fetching hotels from CRM:", error);
      throw error;
    }
  }

  /**
   * Get statistics from the CRM API
   */
  async getStats(): Promise<StatsResponse> {
    const url = `${this.baseUrl}/api/stats`;

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
      console.error("Error fetching stats from CRM:", error);
      throw error;
    }
  }

  /**
   * Get all hotels in a stage (handles pagination automatically)
   */
  async getAllHotelsInStage(stage: string): Promise<any[]> {
    const allHotels: any[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getHotels({ stage, page, per_page: 50 });
      allHotels.push(...data.hotels);
      hasNext = data.pagination.has_next;
      page++;
    }

    return allHotels;
  }

  /**
   * Search hotels by name or location
   */
  async searchHotels(searchTerm: string, filters?: Omit<HotelCrmParams, "search">): Promise<HotelCrmResponse> {
    return this.getHotels({ ...filters, search: searchTerm });
  }
}

// Export singleton instance
export const hotelCrmApi = new HotelCrmApi();

// Export class for custom instances
export default HotelCrmApi;

