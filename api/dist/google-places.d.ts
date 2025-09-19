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
    rating?: number;
    priceLevel?: number;
    photos: GooglePlacesPhoto[];
    location: {
        lat: number;
        lng: number;
    };
}
export declare class GooglePlacesClient {
    private client;
    private cache;
    private apiKey;
    private baseUrl;
    constructor();
    private checkAccess;
    /**
     * Search for hotels in a city using Google Places Text Search
     */
    searchHotels(cityName: string, limit?: number): Promise<GooglePlacesHotel[]>;
    /**
     * Generate high-quality photo URL from Google Places API
     */
    generatePhotoUrl(photoReference: string, maxWidth?: number): string;
    /**
     * Get photo URLs for a specific hotel (enhanced with smart selection)
     */
    getHotelPhotoUrls(hotel: GooglePlacesHotel, maxPhotos?: number): GooglePlacesPhoto[];
    /**
     * Smart photo selection - prioritize high-quality, Instagram-worthy photos
     */
    private selectBestPhotos;
    /**
     * Calculate photo quality score based on various criteria
     */
    private calculatePhotoScore;
    /**
     * Analyze photo content to detect Instagram-worthy features
     * This is a placeholder for future AI/ML integration
     */
    private analyzePhotoContent;
    /**
     * Enhanced photo selection with content analysis
     */
    private selectInstagramPhotos;
    /**
     * Validate photo URL accessibility and quality
     */
    private validatePhotoUrl;
    /**
     * Filter and validate photos for Instagram quality
     */
    private getValidatedInstagramPhotos;
    /**
     * Get hotel photos for a city (main method for integration) - ENHANCED
     */
    getHotelPhotos(cityName: string, maxPhotos?: number): Promise<string[]>;
    /**
     * Search for a specific hotel by name and get its photos (enhanced for more photos) - ENHANCED
     */
    getSpecificHotelPhotos(hotelName: string, cityName: string, maxPhotos?: number): Promise<string[]>;
    /**
     * Check if a place name matches the target hotel name
     */
    private isHotelMatch;
    /**
     * Get photos for a specific place ID
     */
    private getPlacePhotos;
    /**
     * Get hotel details including photos by place ID
     */
    getHotelDetails(placeId: string): Promise<GooglePlacesHotel | null>;
}
//# sourceMappingURL=google-places.d.ts.map