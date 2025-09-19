interface BatchResult {
    processed: number;
    added: number;
    failed: number;
    countries: string[];
    cities: string[];
}
export declare class GlobalHotelFetcher {
    private amadeusClient;
    private supabaseService;
    private googlePlacesClient;
    private processedCities;
    private totalProcessed;
    private totalAdded;
    private totalPhotosValidated;
    private totalPhotosRejected;
    constructor();
    /**
     * Fetch hotels from ALL countries globally
     */
    fetchGlobalHotels(options?: {
        batchSize?: number;
        maxHotelsPerCity?: number;
        continents?: string[];
        skipExisting?: boolean;
    }): Promise<BatchResult>;
    /**
     * Fetch and validate real photos from Google Places for hotels
     */
    private fetchAndValidatePhotos;
    /**
     * Fetch hotels from a specific city using Amadeus
     */
    private fetchCityHotels;
    /**
     * Get Amadeus city code for a city name
     */
    private getCityCode;
    /**
     * Sleep utility for rate limiting
     */
    private sleep;
    /**
     * Get comprehensive statistics
     */
    getGlobalStats(): Promise<{
        totalHotels: number;
        countriesRepresented: number;
        citiesRepresented: number;
        continentBreakdown: Record<string, number>;
    }>;
}
export {};
//# sourceMappingURL=global-hotel-fetcher.d.ts.map