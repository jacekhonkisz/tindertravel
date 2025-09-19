import { AmadeusHotel, HotelContent, Tag } from './extract';
import { HotelOffer, ScoringComponents } from './score';
export interface RawHotel {
    hotel: AmadeusHotel;
    content: HotelContent;
    offers: HotelOffer[];
}
export interface CuratedCard {
    id: string;
    name: string;
    city: string;
    country: string;
    coords: {
        lat: number;
        lng: number;
    };
    price: {
        amount: string;
        currency: string;
    };
    photos: string[];
    heroPhoto: string;
    description: string;
    tags: Tag[];
    score: ScoringComponents;
    rating?: number;
    chainCode?: string;
}
export interface CurationStats {
    totalProcessed: number;
    passedPhotoGate: number;
    passedBrandGate: number;
    passedQualityGate: number;
    passedPriceGate: number;
    passedScoreThreshold: number;
    finalCurated: number;
    averageScore: number;
}
/**
 * Check if hotel passes all hard gates
 */
export declare function passesHardGates(hotel: AmadeusHotel, content: HotelContent, offers: HotelOffer[]): boolean;
/**
 * Main curation pipeline
 * Apply hard gates → compute tags & score → threshold filter → return cards
 */
export declare function curate(rawHotels: RawHotel[]): {
    cards: CuratedCard[];
    stats: CurationStats;
};
/**
 * Filter cards by specific criteria (for debugging/testing)
 */
export declare function filterCards(cards: CuratedCard[], criteria: {
    minScore?: number;
    maxPrice?: number;
    requiredTags?: string[];
    excludeChains?: string[];
    minRating?: number;
}): CuratedCard[];
/**
 * Get curation statistics summary
 */
export declare function getCurationSummary(stats: CurationStats): string;
//# sourceMappingURL=filter.d.ts.map