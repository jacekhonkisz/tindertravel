// Glintz Hotel Curation - Hard Gates & Main Pipeline
// Apply hard filters and orchestrate the complete curation process

import {
  SCORING_THRESHOLDS,
  HOTEL_CATEGORIES
} from './constants';

import {
  AmadeusHotel,
  HotelContent,
  Tag,
  extractTags,
  hasPhotoGate,
  brandInfo,
  hasWowAmenities,
  getHeroPhoto,
  getPhotoUrls,
  extractRating
} from './extract';

import {
  HotelOffer,
  ScoringComponents,
  scoreHotel,
  meetsScoreThreshold,
  explainScore
} from './score';

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
 * Hard Gate 1: Photo Gate
 * Must have >= 3 photos with at least one EXTERIOR or ROOM
 */
function passesPhotoGate(content: HotelContent): boolean {
  return hasPhotoGate(content);
}

/**
 * Hard Gate 2: Brand Gate  
 * Must not be blacklisted economy chain
 */
function passesBrandGate(hotel: AmadeusHotel): boolean {
  const brand = brandInfo(hotel);
  return !brand.blacklisted;
}

/**
 * Hard Gate 3: Quality Gate
 * Must have rating >= 4.0 OR (photo gate + wow amenity)
 */
function passesQualityGate(
  hotel: AmadeusHotel, 
  content: HotelContent
): boolean {
  const rating = hotel.rating || extractRating(content);
  
  // Pass if rating is good
  if (rating && rating >= SCORING_THRESHOLDS.minRating) {
    return true;
  }
  
  // Pass if no rating but has photos + wow amenities
  if (!rating || rating === 0) {
    return hasPhotoGate(content) && hasWowAmenities(hotel, content);
  }
  
  // Fail if rating exists but is too low
  return rating >= SCORING_THRESHOLDS.minQualityRating;
}

/**
 * Hard Gate 4: Price Extremes
 * Drop if price > $2000 and no wow amenities
 */
function passesPriceGate(
  hotel: AmadeusHotel,
  content: HotelContent, 
  offers: HotelOffer[]
): boolean {
  if (!offers || offers.length === 0) return true;
  
  const bestOffer = offers[0];
  const price = parseFloat(bestOffer.price.total);
  const currency = bestOffer.price.currency;
  
  // Convert to USD for comparison
  let priceUSD = price;
  if (currency === 'EUR') {
    priceUSD = price * 1.1;
  } else if (currency === 'GBP') {
    priceUSD = price * 1.3;
  }
  
  // If price is extreme, must have wow amenities
  if (priceUSD > SCORING_THRESHOLDS.maxPrice) {
    return hasWowAmenities(hotel, content);
  }
  
  return true;
}

/**
 * Check if hotel passes all hard gates
 */
export function passesHardGates(
  hotel: AmadeusHotel, 
  content: HotelContent, 
  offers: HotelOffer[]
): boolean {
  return (
    passesPhotoGate(content) &&
    passesBrandGate(hotel) &&
    passesQualityGate(hotel, content) &&
    passesPriceGate(hotel, content, offers)
  );
}

/**
 * Convert raw hotel data to curated card
 */
function createCuratedCard(
  hotel: AmadeusHotel,
  content: HotelContent,
  offers: HotelOffer[],
  tags: Tag[],
  score: ScoringComponents
): CuratedCard {
  const bestOffer = offers[0];
  const heroPhoto = getHeroPhoto(content);
  const photos = getPhotoUrls(content);
  const rating = hotel.rating || extractRating(content);

  // Extract city and country from cityCode or description
  const cityCode = hotel.cityCode;
  let city = cityCode;
  let country = 'Unknown';
  
  // Try to extract from description or use cityCode
  const description = content.description?.text || '';
  if (description) {
    // Simple extraction - could be enhanced with a city/country database
    const locationMatch = description.match(/([A-Za-z\s]+),\s*([A-Za-z\s]+)$/);
    if (locationMatch) {
      city = locationMatch[1].trim();
      country = locationMatch[2].trim();
    }
  }

  return {
    id: hotel.hotelId,
    name: hotel.name,
    city,
    country,
    coords: {
      lat: hotel.latitude,
      lng: hotel.longitude
    },
    price: {
      amount: bestOffer?.price.total || '0',
      currency: bestOffer?.price.currency || 'USD'
    },
    photos,
    heroPhoto: heroPhoto || photos[0] || '',
    description: content.description?.text || '',
    tags: tags.slice(0, 3), // Limit to max 3 tags as per spec
    score,
    rating: rating || undefined,
    chainCode: hotel.chainCode
  };
}

/**
 * Main curation pipeline
 * Apply hard gates → compute tags & score → threshold filter → return cards
 */
export function curate(rawHotels: RawHotel[]): {
  cards: CuratedCard[];
  stats: CurationStats;
} {
  const stats: CurationStats = {
    totalProcessed: rawHotels.length,
    passedPhotoGate: 0,
    passedBrandGate: 0,
    passedQualityGate: 0,
    passedPriceGate: 0,
    passedScoreThreshold: 0,
    finalCurated: 0,
    averageScore: 0
  };

  const curatedCards: CuratedCard[] = [];
  let totalScore = 0;

  for (const rawHotel of rawHotels) {
    const { hotel, content, offers } = rawHotel;

    // Hard Gate 1: Photo Gate
    if (!passesPhotoGate(content)) {
      continue;
    }
    stats.passedPhotoGate++;

    // Hard Gate 2: Brand Gate
    if (!passesBrandGate(hotel)) {
      continue;
    }
    stats.passedBrandGate++;

    // Hard Gate 3: Quality Gate
    if (!passesQualityGate(hotel, content)) {
      continue;
    }
    stats.passedQualityGate++;

    // Hard Gate 4: Price Gate
    if (!passesPriceGate(hotel, content, offers)) {
      continue;
    }
    stats.passedPriceGate++;

    // Extract tags and compute score
    const tags = extractTags(hotel, content);
    const score = scoreHotel(hotel, content, offers);

    // Score threshold check
    if (!meetsScoreThreshold(score)) {
      continue;
    }
    stats.passedScoreThreshold++;

    // Create curated card
    const card = createCuratedCard(hotel, content, offers, tags, score);
    curatedCards.push(card);
    totalScore += score.total;
  }

  stats.finalCurated = curatedCards.length;
  stats.averageScore = curatedCards.length > 0 ? totalScore / curatedCards.length : 0;

  return {
    cards: curatedCards,
    stats
  };
}

/**
 * Filter cards by specific criteria (for debugging/testing)
 */
export function filterCards(
  cards: CuratedCard[],
  criteria: {
    minScore?: number;
    maxPrice?: number;
    requiredTags?: string[];
    excludeChains?: string[];
    minRating?: number;
  }
): CuratedCard[] {
  return cards.filter(card => {
    // Score filter
    if (criteria.minScore && card.score.total < criteria.minScore) {
      return false;
    }

    // Price filter
    if (criteria.maxPrice) {
      const price = parseFloat(card.price.amount);
      if (price > criteria.maxPrice) {
        return false;
      }
    }

    // Required tags filter
    if (criteria.requiredTags && criteria.requiredTags.length > 0) {
      const cardTagIds = card.tags.map(tag => tag.id);
      const hasRequiredTag = criteria.requiredTags.some(tagId => 
        cardTagIds.includes(tagId)
      );
      if (!hasRequiredTag) {
        return false;
      }
    }

    // Chain exclusion filter
    if (criteria.excludeChains && criteria.excludeChains.length > 0) {
      if (card.chainCode && criteria.excludeChains.includes(card.chainCode)) {
        return false;
      }
    }

    // Rating filter
    if (criteria.minRating && card.rating) {
      if (card.rating < criteria.minRating) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get curation statistics summary
 */
export function getCurationSummary(stats: CurationStats): string {
  const photoGateRate = (stats.passedPhotoGate / stats.totalProcessed * 100).toFixed(1);
  const brandGateRate = (stats.passedBrandGate / stats.totalProcessed * 100).toFixed(1);
  const qualityGateRate = (stats.passedQualityGate / stats.totalProcessed * 100).toFixed(1);
  const priceGateRate = (stats.passedPriceGate / stats.totalProcessed * 100).toFixed(1);
  const scoreRate = (stats.passedScoreThreshold / stats.totalProcessed * 100).toFixed(1);
  const finalRate = (stats.finalCurated / stats.totalProcessed * 100).toFixed(1);

  return `
Curation Pipeline Results:
- Total Processed: ${stats.totalProcessed}
- Photo Gate: ${stats.passedPhotoGate} (${photoGateRate}%)
- Brand Gate: ${stats.passedBrandGate} (${brandGateRate}%)
- Quality Gate: ${stats.passedQualityGate} (${qualityGateRate}%)
- Price Gate: ${stats.passedPriceGate} (${priceGateRate}%)
- Score Threshold: ${stats.passedScoreThreshold} (${scoreRate}%)
- Final Curated: ${stats.finalCurated} (${finalRate}%)
- Average Score: ${(stats.averageScore * 100).toFixed(1)}%
  `.trim();
} 