/**
 * Hotel CRM API Service (JavaScript version)
 * Connects to the external Hotel CRM API for fetching hotel data
 */

const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

class HotelCrmApi {
  constructor(baseUrl = API_BASE, apiKey = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get hotels from the CRM API
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 50)
   * @param {string} params.stage - Filter by stage
   * @param {string} params.country - Filter by country
   * @param {string} params.city - Filter by city
   * @param {string} params.search - Search term
   * @returns {Promise<Object>} Hotel data with pagination
   */
  async getHotels(params = {}) {
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
   * @returns {Promise<Object>} Statistics data
   */
  async getStats() {
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
   * @param {string} stage - Stage to filter by
   * @returns {Promise<Array>} Array of all hotels in the stage
   */
  async getAllHotelsInStage(stage) {
    const allHotels = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const data = await this.getHotels({ stage, page, per_page: 50 });
      allHotels.push(...(data.hotels || []));
      hasNext = data.pagination?.has_next || false;
      page++;
    }

    return allHotels;
  }

  /**
   * Search hotels by name or location
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async searchHotels(searchTerm, filters = {}) {
    return this.getHotels({ ...filters, search: searchTerm });
  }
}

// Export singleton instance
const hotelCrmApi = new HotelCrmApi();

// Export for CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = { HotelCrmApi, hotelCrmApi };
}

// Export for ES6 modules
if (typeof window !== "undefined") {
  window.HotelCrmApi = HotelCrmApi;
  window.hotelCrmApi = hotelCrmApi;
}

export { HotelCrmApi, hotelCrmApi };
export default HotelCrmApi;

