import { AmadeusHotelOffer, AmadeusHotelContent, HotelCard } from './types';
export interface CuratedHotel {
    name: string;
    city: string;
    country: string;
    countryCode: string;
    coords: {
        lat: number;
        lng: number;
    };
    category: 'luxury' | 'boutique' | 'unique' | 'heritage' | 'resort';
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    description: string;
    amenityTags: string[];
    website?: string;
    bookingPartners: string[];
}
export interface EnhancedAmadeusHotelOffer extends AmadeusHotelOffer {
    visualScore?: number;
    valueScore?: number;
    isAdWorthy?: boolean;
}
export declare class AmadeusClient {
    private client;
    private tokenCache;
    private dataCache;
    private clientId;
    private clientSecret;
    private baseUrl;
    private hotellookClient;
    private googlePlacesClient;
    private curatedLuxuryHotels;
    constructor();
    private getAccessToken;
    getHotelsByCity(cityCode: string, limit?: number): Promise<AmadeusHotelOffer[]>;
    private getBoutiqueUniqueAmenities;
    private getVisuallyStunningLocationKeywords;
    /**
     * Calculate visual appeal score for ad-worthy hotels
     */
    private calculateVisualAppealScore;
    /**
     * Filter for ad-worthy hotels - visually stunning and Instagram-ready
     */
    private filterAdWorthyHotels;
    /**
     * Get affordable luxury hotels - great visual appeal without breaking the bank
     */
    private filterAffordableLuxuryHotels;
    private filterBoutiqueLuxuryHotels;
    private filterPremiumHotels;
    getHotelContent(hotelId: string): Promise<AmadeusHotelContent | null>;
    seedHotelsFromCities(): Promise<HotelCard[]>;
    private generateHotelId;
    private generateRealisticPrice;
    private generateRealisticRating;
    private generateBookingUrl;
    private getFallbackPhotos;
    private transformToHotelCard;
    private extractAmenityTags;
    private getCountryName;
    private getDateString;
    private delay;
    private getHotelPhotos;
    private getGlobalVisuallyStunningLocations;
    private getGlobalInstagramAmenities;
    /**
     * Enhanced global visual appeal scoring
     */
    private calculateGlobalVisualAppealScore;
    /**
     * Get curated real hotel photos by city and hotel name
     */
    private getCuratedRealHotelPhotos;
    /**
     * Calculate distance between two coordinates in kilometers
     */
    private calculateDistance;
    /**
     * Get accurate hotel coordinates using Google Places API
     */
    private getAccurateHotelCoordinates;
}
//# sourceMappingURL=amadeus.d.ts.map