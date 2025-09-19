import { CuratedCard } from './filter';
export interface DiversityStats {
    totalCards: number;
    uniqueCities: number;
    uniqueBrands: number;
    maxConsecutiveSameCity: number;
    maxConsecutiveSameBrand: number;
    diversityScore: number;
}
/**
 * Diversify cards to avoid repetition using bucket shuffle
 * No more than 2 consecutive cards from same city or brand
 */
export declare function diversify(cards: CuratedCard[]): CuratedCard[];
/**
 * Advanced diversification with weighted buckets
 * Groups cards by score tiers and diversifies within each tier
 */
export declare function diversifyAdvanced(cards: CuratedCard[]): CuratedCard[];
/**
 * Calculate diversity statistics for analysis
 */
export declare function calculateDiversityStats(cards: CuratedCard[]): DiversityStats;
/**
 * Get diversity summary for debugging
 */
export declare function getDiversitySummary(stats: DiversityStats): string;
//# sourceMappingURL=diversify.d.ts.map