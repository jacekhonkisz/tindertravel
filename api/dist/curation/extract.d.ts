export interface Tag {
    id: string;
    label: string;
    category: string;
}
export interface BrandInfo {
    premium: boolean;
    boutique: boolean;
    blacklisted: boolean;
    chainCode?: string;
}
export interface MediaItem {
    uri: string;
    category?: string;
    width?: number;
    height?: number;
}
export interface HotelContent {
    hotelId: string;
    name: string;
    description?: {
        text: string;
        lang: string;
    };
    amenities: string[];
    media: MediaItem[];
    ratings?: Array<{
        provider: string;
        rating: string;
    }>;
}
export interface AmadeusHotel {
    hotelId: string;
    chainCode?: string;
    name: string;
    rating?: number;
    cityCode: string;
    latitude: number;
    longitude: number;
}
/**
 * Extract visual and experiential tags from hotel amenities and description
 */
export declare function extractTags(hotel: AmadeusHotel, content: HotelContent): Tag[];
/**
 * Check if hotel passes photo gate requirements
 */
export declare function hasPhotoGate(content: HotelContent): boolean;
/**
 * Analyze brand information from chain code and hotel name
 */
export declare function brandInfo(hotel: AmadeusHotel): BrandInfo;
/**
 * Check if hotel has "wow" amenities for quality gate
 */
export declare function hasWowAmenities(hotel: AmadeusHotel, content: HotelContent): boolean;
/**
 * Get the best quality photo for hero image
 */
export declare function getHeroPhoto(content: HotelContent): string | null;
/**
 * Extract all photo URLs for the hotel
 */
export declare function getPhotoUrls(content: HotelContent): string[];
/**
 * Check if location is in top inspiration cities
 */
export declare function isInspirationCity(cityName: string): boolean;
/**
 * Extract numeric rating from various rating providers
 */
export declare function extractRating(content: HotelContent): number | null;
//# sourceMappingURL=extract.d.ts.map