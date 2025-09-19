import { AmadeusHotel, HotelContent, MediaItem } from './extract';
export interface HotelOffer {
    price: {
        total: string;
        currency: string;
    };
    room?: {
        typeEstimated?: {
            category: string;
        };
    };
}
export interface ScoringComponents {
    visual: number;
    amenity: number;
    brand: number;
    location: number;
    rating: number;
    price: number;
    total: number;
}
/**
 * Calculate visual score based on photo quality and quantity
 * Max score: 1.0
 */
export declare function visualScore(media: MediaItem[]): number;
/**
 * Calculate amenity score based on wow amenities and keywords
 * Max score: 1.0
 */
export declare function amenityScore(amenities: string[], description: string): number;
/**
 * Calculate brand score based on chain prestige
 * Max score: 1.0
 */
export declare function brandScore(hotel: AmadeusHotel): number;
/**
 * Calculate location appeal based on destination and setting
 * Max score: 1.0
 */
export declare function locationAppeal(cityCode: string, amenities: string[], description: string): number;
/**
 * Calculate rating score based on hotel rating
 * Max score: 1.0
 */
export declare function ratingScore(rating: number | null): number;
/**
 * Calculate price penalty for overpriced hotels without wow factor
 * Returns negative value (penalty)
 */
export declare function pricePenalty(price: number, currency: string, hasWow: boolean): number;
/**
 * Main scoring function - combines all components
 */
export declare function scoreHotel(hotel: AmadeusHotel, content: HotelContent, offers: HotelOffer[]): ScoringComponents;
/**
 * Check if hotel meets minimum score threshold
 */
export declare function meetsScoreThreshold(score: ScoringComponents): boolean;
/**
 * Get score explanation for debugging
 */
export declare function explainScore(score: ScoringComponents): string;
//# sourceMappingURL=score.d.ts.map