interface FetchProgress {
    totalProcessed: number;
    totalAdded: number;
    citiesCompleted: number;
    photosValidated: number;
    currentCity: string;
    estimatedRemaining: number;
}
export declare class OptimizedHotelFetcher {
    private amadeusClient;
    private supabaseService;
    private googlePlacesClient;
    private progress;
    private readonly PREMIUM_CITIES;
    constructor();
    /**
     * Fetch 1,500 quality hotels with intelligent rate limiting
     */
    fetch1500QualityHotels(): Promise<void>;
    /**
     * Fetch hotels from a specific city with optimization
     */
    private fetchCityHotelsOptimized;
    /**
     * Fetch and validate photos from Google Places
     */
    private fetchAndValidatePhotos;
    /**
     * Sleep utility for rate limiting
     */
    private sleep;
    /**
     * Get current progress
     */
    getProgress(): FetchProgress;
}
export {};
//# sourceMappingURL=optimized-hotel-fetcher.d.ts.map