export interface HotelPhotoSource {
    url: string;
    source: string;
    width?: number;
    height?: number;
}
export declare class PhotoService {
    private cache;
    constructor();
    /**
     * Get real hotel photos using multiple strategies
     */
    getHotelPhotos(hotelName: string, city: string, country: string, hotelId?: string): Promise<string[]>;
    /**
     * Get hotel photos from Pexels API (free tier)
     */
    private getPexelsHotelPhotos;
    /**
     * Get hotel photos from Unsplash API with specific queries
     */
    private getUnsplashHotelPhotos;
    /**
     * Get hotel photos from Google Places API
     */
    private getGooglePlacesPhotos;
    /**
     * Curated real hotel photos from actual hotels in each city
     * These are real hotel photos from public sources
     */
    private getCuratedRealHotelPhotos;
}
export default PhotoService;
//# sourceMappingURL=photo-service.d.ts.map