export * from './constants';
export * from './extract';
export * from './score';
export * from './filter';
export * from './diversify';
import { RawHotel, CuratedCard, CurationStats } from './filter';
import { DiversityStats } from './diversify';
export interface GlintzCurationResult {
    cards: CuratedCard[];
    curationStats: CurationStats;
    diversityStats: DiversityStats;
    summary: string;
}
/**
 * Complete Glintz curation pipeline
 * Apply hard gates → score → threshold → diversify
 */
export declare function glintzCurate(rawHotels: RawHotel[]): Promise<GlintzCurationResult>;
//# sourceMappingURL=index.d.ts.map