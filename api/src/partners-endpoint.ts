/**
 * Partners API Endpoint
 * Fetches hotels from Partners API and includes photos from Dropbox folders
 */

import { partnersApi } from './services/partnersApi';
import type { HotelCard } from './types';

const API_BASE = "https://web-production-b200.up.railway.app";
const API_KEY = "javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8";

/**
 * Convert Partner to HotelCard format
 */
function partnerToHotelCard(partner: any, photos: string[] = []): HotelCard {
  // Use location_label or construct from city/country
  const location = partner.location_label || 
    (partner.city && partner.country_code 
      ? `${partner.city}, ${partner.country_code}` 
      : partner.country_code || 'Unknown');

  // Split location into city and country
  const locationParts = location.split(',').map((s: string) => s.trim());
  const city = partner.city || locationParts[0] || '';
  const country = partner.country_code || locationParts[1] || location || '';

  // Use website as booking URL
  const bookingUrl = partner.website || 
    `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(partner.hotel_name)}`;

  // Use tags as amenity tags
  const amenityTags = partner.tags || [];

  // Set hero photo (first photo or empty)
  const heroPhoto = photos.length > 0 ? photos[0] : '';

  return {
    id: partner.id,
    name: partner.hotel_name,
    city,
    country,
    address: location,
    coords: partner.lat && partner.lng ? {
      lat: partner.lat,
      lng: partner.lng
    } : undefined,
    description: partner.notes || `${partner.hotel_name} - ${location}`,
    amenityTags,
    photos,
    heroPhoto,
    bookingUrl,
    rating: undefined
  };
}

/**
 * Fetch photos from Dropbox for a partner
 */
async function fetchPartnerPhotos(partnerId: string): Promise<string[]> {
  try {
    const photosResponse = await partnersApi.getPartnerPhotos(partnerId);
    
    if (photosResponse.photos && photosResponse.photos.length > 0) {
      // Return photo URLs (they're temporary 4-hour URLs from Dropbox)
      return photosResponse.photos.map(photo => photo.url);
    }
    
    return [];
  } catch (error) {
    console.warn(`Failed to fetch photos for partner ${partnerId}:`, error);
    return [];
  }
}

/**
 * Get hotels from Partners API
 */
export async function getPartnersHotels(params: {
  page?: number;
  per_page?: number;
  status?: 'active' | 'paused' | 'offboarded';
  country_code?: string;
  includePhotos?: boolean;
} = {}): Promise<{
  hotels: HotelCard[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const {
      page = 1,
      per_page = 20,
      status = 'active',
      country_code,
      includePhotos = true
    } = params;

    // Fetch partners from Partners API
    const partnersResponse = await partnersApi.listPartners({
      page,
      per_page,
      status,
      country_code
    });

    // Convert partners to hotel cards
    const hotels: HotelCard[] = [];

    // Fetch photos for each partner (in parallel for better performance)
    const hotelPromises = partnersResponse.partners.map(async (partner) => {
      let photos: string[] = [];
      
      if (includePhotos && (partner.dropbox_folder_id || partner.dropbox_path)) {
        photos = await fetchPartnerPhotos(partner.id);
      }

      return partnerToHotelCard(partner, photos);
    });

    const hotelCards = await Promise.all(hotelPromises);

    return {
      hotels: hotelCards,
      total: partnersResponse.total,
      hasMore: partnersResponse.page < partnersResponse.total_pages
    };
  } catch (error) {
    console.error('Failed to fetch partners hotels:', error);
    throw error;
  }
}

/**
 * Get all active partners (for seeding or bulk operations)
 */
export async function getAllPartnersHotels(includePhotos = true): Promise<HotelCard[]> {
  try {
    const allPartners = await partnersApi.getAllPartners({ status: 'active' });
    
    // Fetch photos for all partners
    const hotelPromises = allPartners.map(async (partner) => {
      let photos: string[] = [];
      
      if (includePhotos && (partner.dropbox_folder_id || partner.dropbox_path)) {
        photos = await fetchPartnerPhotos(partner.id);
      }

      return partnerToHotelCard(partner, photos);
    });

    return Promise.all(hotelPromises);
  } catch (error) {
    console.error('Failed to fetch all partners hotels:', error);
    throw error;
  }
}

