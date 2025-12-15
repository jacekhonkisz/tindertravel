/**
 * Partners API Service (JavaScript version)
 * Connects to the Partners API for managing hotel partners
 * Main source: partners table (hotels_partners)
 */

const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

class PartnersApi {
  constructor(baseUrl = API_BASE, apiKey = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get authentication headers
   * Supports both API key and JWT token
   */
  getAuthHeaders(jwtToken = null) {
    const headers = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    } else {
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * List partners with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 50, max: 100)
   * @param {string} params.q - Search query
   * @param {string} params.status - Filter by status: active, paused, offboarded
   * @param {string} params.country_code - Filter by ISO-3166 country code
   * @param {string} params.tag - Filter by tag (exact match)
   * @param {string} params.jwtToken - Optional JWT token for authentication
   * @returns {Promise<Object>} Partners list with pagination
   */
  async listPartners(params = {}) {
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
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object>} Partner object
   */
  async getPartner(partnerId) {
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
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object>} Partner with linked prospect data
   */
  async getPartnerWithProspect(partnerId) {
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
   * @param {string} partnerId - Partner UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated partner
   */
  async updatePartner(partnerId, updates) {
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
   * @param {number[]} prospectIds - Array of prospect IDs
   * @returns {Promise<Object>} Promotion results
   */
  async promoteProspects(prospectIds) {
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
   * @param {string} partnerId - Partner UUID
   * @returns {Promise<Object>} Photos data
   */
  async getPartnerPhotos(partnerId) {
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
   * @param {Object} filters - Optional filters (excluding page/per_page)
   * @returns {Promise<Array>} Array of all partners
   */
  async getAllPartners(filters = {}) {
    const allPartners = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.listPartners({ ...filters, page, per_page: 50 });
      allPartners.push(...(data.partners || []));
      hasMore = page < (data.total_pages || 0);
      page++;
    }

    return allPartners;
  }
}

// Export singleton instance
const partnersApi = new PartnersApi();

// Export for CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PartnersApi, partnersApi };
}

// Export for ES6 modules
if (typeof window !== "undefined") {
  window.PartnersApi = PartnersApi;
  window.partnersApi = partnersApi;
}

export { PartnersApi, partnersApi };
export default PartnersApi;

