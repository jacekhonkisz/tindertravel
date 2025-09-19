// Glintz Hotel Curation - Diversification Algorithm
// Bucket shuffle to avoid >2 same city/brand in a row

import { CuratedCard } from './filter';

export interface DiversityStats {
  totalCards: number;
  uniqueCities: number;
  uniqueBrands: number;
  maxConsecutiveSameCity: number;
  maxConsecutiveSameBrand: number;
  diversityScore: number; // 0-1, higher is more diverse
}

/**
 * Diversify cards to avoid repetition using bucket shuffle
 * No more than 2 consecutive cards from same city or brand
 */
export function diversify(cards: CuratedCard[]): CuratedCard[] {
  if (cards.length <= 2) return cards;

  // Sort by score first (highest first)
  const sortedCards = [...cards].sort((a, b) => b.score.total - a.score.total);
  
  const result: CuratedCard[] = [];
  const remaining = [...sortedCards];
  
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestCard = remaining[0];
    
    // If we have at least 2 cards in result, check for diversity
    if (result.length >= 2) {
      const lastCard = result[result.length - 1];
      const secondLastCard = result[result.length - 2];
      
      // Find the best card that doesn't create 3 in a row
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        
        // Check if this would create 3 same cities in a row
        const wouldCreate3Cities = 
          lastCard.city === secondLastCard.city && 
          candidate.city === lastCard.city;
        
        // Check if this would create 3 same brands in a row
        const wouldCreate3Brands = 
          lastCard.chainCode && secondLastCard.chainCode && candidate.chainCode &&
          lastCard.chainCode === secondLastCard.chainCode && 
          candidate.chainCode === lastCard.chainCode;
        
        // If this candidate doesn't create 3 in a row, prefer it
        if (!wouldCreate3Cities && !wouldCreate3Brands) {
          bestIndex = i;
          bestCard = candidate;
          break;
        }
      }
    } else if (result.length === 1) {
      const lastCard = result[result.length - 1];
      
      // Try to find a card from different city/brand for variety
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        
        const differentCity = candidate.city !== lastCard.city;
        const differentBrand = candidate.chainCode !== lastCard.chainCode;
        
        // Prefer different city/brand, but don't sacrifice too much score
        const scoreDiff = bestCard.score.total - candidate.score.total;
        if ((differentCity || differentBrand) && scoreDiff <= 0.1) {
          bestIndex = i;
          bestCard = candidate;
          break;
        }
      }
    }
    
    // Add the selected card and remove from remaining
    result.push(bestCard);
    remaining.splice(bestIndex, 1);
  }
  
  return result;
}

/**
 * Advanced diversification with weighted buckets
 * Groups cards by score tiers and diversifies within each tier
 */
export function diversifyAdvanced(cards: CuratedCard[]): CuratedCard[] {
  if (cards.length <= 3) return cards;

  // Create score-based buckets
  const buckets = createScoreBuckets(cards);
  const result: CuratedCard[] = [];
  
  // Process each bucket and interleave results
  for (const bucket of buckets) {
    const diversifiedBucket = diversifyBucket(bucket);
    result.push(...diversifiedBucket);
  }
  
  // Final pass to ensure no 3 consecutive same city/brand
  return finalDiversityPass(result);
}

/**
 * Create buckets based on score ranges
 */
function createScoreBuckets(cards: CuratedCard[]): CuratedCard[][] {
  const sorted = [...cards].sort((a, b) => b.score.total - a.score.total);
  
  const buckets: CuratedCard[][] = [];
  const bucketSize = Math.ceil(sorted.length / 5); // 5 score tiers
  
  for (let i = 0; i < sorted.length; i += bucketSize) {
    const bucket = sorted.slice(i, i + bucketSize);
    if (bucket.length > 0) {
      buckets.push(bucket);
    }
  }
  
  return buckets;
}

/**
 * Diversify within a single bucket
 */
function diversifyBucket(bucket: CuratedCard[]): CuratedCard[] {
  if (bucket.length <= 2) return bucket;
  
  // Group by city and brand for round-robin selection
  const cityGroups = groupBy(bucket, card => card.city);
  const brandGroups = groupBy(bucket, card => card.chainCode || 'independent');
  
  const result: CuratedCard[] = [];
  const used = new Set<string>();
  
  // Round-robin selection prioritizing diversity
  while (result.length < bucket.length) {
    let added = false;
    
    // Try to add from different cities first
    for (const [city, cityCards] of Object.entries(cityGroups)) {
      const availableCards = cityCards.filter(card => !used.has(card.id));
      if (availableCards.length > 0) {
        const card = availableCards[0];
        
        // Check if adding this card maintains diversity
        if (canAddCard(result, card)) {
          result.push(card);
          used.add(card.id);
          added = true;
          break;
        }
      }
    }
    
    // If no diverse city found, try different brands
    if (!added) {
      for (const [brand, brandCards] of Object.entries(brandGroups)) {
        const availableCards = brandCards.filter(card => !used.has(card.id));
        if (availableCards.length > 0) {
          const card = availableCards[0];
          
          if (canAddCard(result, card)) {
            result.push(card);
            used.add(card.id);
            added = true;
            break;
          }
        }
      }
    }
    
    // If still no card added, add the best remaining card
    if (!added) {
      const remaining = bucket.filter(card => !used.has(card.id));
      if (remaining.length > 0) {
        result.push(remaining[0]);
        used.add(remaining[0].id);
      } else {
        break;
      }
    }
  }
  
  return result;
}

/**
 * Check if a card can be added without violating diversity rules
 */
function canAddCard(result: CuratedCard[], candidate: CuratedCard): boolean {
  if (result.length < 2) return true;
  
  const lastCard = result[result.length - 1];
  const secondLastCard = result[result.length - 2];
  
  // Check for 3 consecutive same cities
  const wouldCreate3Cities = 
    lastCard.city === secondLastCard.city && 
    candidate.city === lastCard.city;
  
  // Check for 3 consecutive same brands
  const wouldCreate3Brands = 
    lastCard.chainCode && secondLastCard.chainCode && candidate.chainCode &&
    lastCard.chainCode === secondLastCard.chainCode && 
    candidate.chainCode === lastCard.chainCode;
  
  return !wouldCreate3Cities && !wouldCreate3Brands;
}

/**
 * Final pass to fix any remaining diversity issues
 */
function finalDiversityPass(cards: CuratedCard[]): CuratedCard[] {
  const result = [...cards];
  
  // Look for violations and try to fix them
  for (let i = 2; i < result.length; i++) {
    const current = result[i];
    const prev = result[i - 1];
    const prevPrev = result[i - 2];
    
    // Check for 3 consecutive same cities
    if (current.city === prev.city && prev.city === prevPrev.city) {
      // Try to swap with a later card
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].city !== prev.city) {
          // Swap
          [result[i], result[j]] = [result[j], result[i]];
          break;
        }
      }
    }
    
    // Check for 3 consecutive same brands
    if (
      current.chainCode && prev.chainCode && prevPrev.chainCode &&
      current.chainCode === prev.chainCode && 
      prev.chainCode === prevPrev.chainCode
    ) {
      // Try to swap with a later card
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].chainCode !== prev.chainCode) {
          // Swap
          [result[i], result[j]] = [result[j], result[i]];
          break;
        }
      }
    }
  }
  
  return result;
}

/**
 * Calculate diversity statistics for analysis
 */
export function calculateDiversityStats(cards: CuratedCard[]): DiversityStats {
  if (cards.length === 0) {
    return {
      totalCards: 0,
      uniqueCities: 0,
      uniqueBrands: 0,
      maxConsecutiveSameCity: 0,
      maxConsecutiveSameBrand: 0,
      diversityScore: 0
    };
  }
  
  const uniqueCities = new Set(cards.map(card => card.city)).size;
  const uniqueBrands = new Set(cards.map(card => card.chainCode || 'independent')).size;
  
  // Calculate max consecutive runs
  let maxConsecutiveSameCity = 1;
  let maxConsecutiveSameBrand = 1;
  let currentCityRun = 1;
  let currentBrandRun = 1;
  
  for (let i = 1; i < cards.length; i++) {
    // City runs
    if (cards[i].city === cards[i - 1].city) {
      currentCityRun++;
      maxConsecutiveSameCity = Math.max(maxConsecutiveSameCity, currentCityRun);
    } else {
      currentCityRun = 1;
    }
    
    // Brand runs
    const currentBrand = cards[i].chainCode || 'independent';
    const prevBrand = cards[i - 1].chainCode || 'independent';
    
    if (currentBrand === prevBrand) {
      currentBrandRun++;
      maxConsecutiveSameBrand = Math.max(maxConsecutiveSameBrand, currentBrandRun);
    } else {
      currentBrandRun = 1;
    }
  }
  
  // Calculate diversity score (0-1, higher is better)
  const cityDiversity = uniqueCities / Math.min(cards.length, 10); // Normalize to max 10 cities
  const brandDiversity = uniqueBrands / Math.min(cards.length, 8); // Normalize to max 8 brands
  const consecutivePenalty = Math.max(0, 1 - (maxConsecutiveSameCity - 2) * 0.2 - (maxConsecutiveSameBrand - 2) * 0.2);
  
  const diversityScore = (cityDiversity + brandDiversity + consecutivePenalty) / 3;
  
  return {
    totalCards: cards.length,
    uniqueCities,
    uniqueBrands,
    maxConsecutiveSameCity,
    maxConsecutiveSameBrand,
    diversityScore: Math.max(0, Math.min(1, diversityScore))
  };
}

/**
 * Utility function to group array by key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Get diversity summary for debugging
 */
export function getDiversitySummary(stats: DiversityStats): string {
  return `
Diversity Analysis:
- Total Cards: ${stats.totalCards}
- Unique Cities: ${stats.uniqueCities}
- Unique Brands: ${stats.uniqueBrands}
- Max Consecutive Same City: ${stats.maxConsecutiveSameCity}
- Max Consecutive Same Brand: ${stats.maxConsecutiveSameBrand}
- Diversity Score: ${(stats.diversityScore * 100).toFixed(1)}%
  `.trim();
} 