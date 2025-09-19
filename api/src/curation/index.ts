// Glintz Hotel Curation - Main Module
// Export all curation functionality

export * from './constants';
export * from './extract';
export * from './score';
export * from './filter';
export * from './diversify';

// Main curation function for easy integration
import { curate, RawHotel, CuratedCard, CurationStats } from './filter';
import { diversify, calculateDiversityStats, DiversityStats } from './diversify';

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
export async function glintzCurate(rawHotels: RawHotel[]): Promise<GlintzCurationResult> {
  console.log(`🎯 Starting Glintz curation for ${rawHotels.length} hotels...`);
  
  // Step 1: Apply hard gates and scoring
  const { cards, stats: curationStats } = curate(rawHotels);
  console.log(`✅ Curation complete: ${cards.length} cards passed all gates`);
  
  // Step 2: Diversify to avoid repetition
  const diversifiedCards = diversify(cards);
  console.log(`🔀 Diversification complete: ${diversifiedCards.length} cards arranged`);
  
  // Step 3: Calculate diversity statistics
  const diversityStats = calculateDiversityStats(diversifiedCards);
  
  // Step 4: Create summary
  const summary = `
Glintz Curation Results:
- Input Hotels: ${rawHotels.length}
- Final Curated Cards: ${diversifiedCards.length}
- Success Rate: ${((diversifiedCards.length / rawHotels.length) * 100).toFixed(1)}%
- Average Score: ${(curationStats.averageScore * 100).toFixed(1)}%
- Diversity Score: ${(diversityStats.diversityScore * 100).toFixed(1)}%
- Unique Cities: ${diversityStats.uniqueCities}
- Unique Brands: ${diversityStats.uniqueBrands}
  `.trim();
  
  console.log(summary);
  
  return {
    cards: diversifiedCards,
    curationStats,
    diversityStats,
    summary
  };
} 