// Glintz Hotel Curation - Scoring Algorithm
// Visual-first scoring with 6 components: visual, amenity, brand, location, rating, price

import {
  SCORING_WEIGHTS,
  SCORING_THRESHOLDS,
  AMENITY_SCORES,
  LOCATION_SCORES,
  DESCRIPTION_KEYWORDS,
  WOW_AMENITY_CODES,
  TOP_INSPO_CITIES
} from './constants';

import {
  AmadeusHotel,
  HotelContent,
  MediaItem,
  brandInfo,
  hasWowAmenities,
  extractRating
} from './extract';

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
export function visualScore(media: MediaItem[]): number {
  if (!media || media.length === 0) return 0;

  // Base score: min(photos, 6) / 6
  const photoCount = Math.min(media.length, 6);
  let score = photoCount / 6;

  // Bonus for having both EXTERIOR and ROOM photos (+0.2)
  const hasExterior = media.some(item => item.category === 'EXTERIOR');
  const hasRoom = media.some(item => 
    item.category === 'ROOM' || item.category === 'SUITE'
  );
  
  if (hasExterior && hasRoom) {
    score += 0.2;
  }

  // Bonus for high-resolution photos (+0.1)
  const hasHighRes = media.some(item => 
    item.width && item.height && item.width >= 1200 && item.height >= 800
  );
  
  if (hasHighRes) {
    score += 0.1;
  }

  // Bonus for diverse photo categories (+0.1)
  const categories = new Set(media.map(item => item.category).filter(Boolean));
  if (categories.size >= 4) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate amenity score based on wow amenities and keywords
 * Max score: 1.0
 */
export function amenityScore(amenities: string[], description: string): number {
  let score = 0;
  const desc = description.toLowerCase();

  // Beach/Infinity/Rooftop amenities (+0.5 each, max 0.5 total)
  const premiumWaterAmenities = ['BEACH', 'OUTDOOR_POOL', 'POOL', 'SWIMMING_POOL'];
  const hasPremiumWater = amenities.some(a => premiumWaterAmenities.includes(a));
  const hasInfinityRooftop = desc.includes('infinity') || desc.includes('rooftop') || desc.includes('roof top');
  
  if (hasPremiumWater && hasInfinityRooftop) {
    score += 0.5;
  } else if (hasPremiumWater || hasInfinityRooftop) {
    score += 0.3;
  }

  // Spa/Wellness amenities (+0.3)
  const wellnessAmenities = ['SPA', 'SAUNA', 'STEAM_ROOM', 'HEALTH_CLUB', 'MASSAGE'];
  const hasWellness = amenities.some(a => wellnessAmenities.includes(a)) || 
                     desc.includes('spa') || desc.includes('wellness');
  
  if (hasWellness) {
    score += 0.3;
  }

  // Design/Heritage keywords (+0.3)
  const designKeywords = DESCRIPTION_KEYWORDS.design;
  const hasDesign = designKeywords.some(keyword => desc.includes(keyword));
  
  if (hasDesign) {
    score += 0.3;
  }

  // Premium amenities (+0.2)
  const premiumAmenities = ['GOLF', 'TENNIS', 'VALET_PARKING', 'ROOM_SERVICE', 'ALL_INCLUSIVE'];
  const hasPremiumAmenity = amenities.some(a => premiumAmenities.includes(a));
  
  if (hasPremiumAmenity) {
    score += 0.2;
  }

  // Luxury keywords in description (+0.2)
  const luxuryKeywords = DESCRIPTION_KEYWORDS.luxury;
  const hasLuxuryKeyword = luxuryKeywords.some(keyword => desc.includes(keyword));
  
  if (hasLuxuryKeyword) {
    score += 0.2;
  }

  // Romance/Adults keywords (+0.1)
  const romanceKeywords = DESCRIPTION_KEYWORDS.romance;
  const hasRomance = romanceKeywords.some(keyword => desc.includes(keyword));
  
  if (hasRomance) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate brand score based on chain prestige
 * Max score: 1.0
 */
export function brandScore(hotel: AmadeusHotel): number {
  const brand = brandInfo(hotel);

  if (brand.blacklisted) {
    return 0; // Blacklisted brands get 0
  }

  if (brand.premium) {
    return 0.6; // Premium brands get high score
  }

  if (brand.boutique) {
    return 0.3; // Boutique programs get medium score
  }

  // Independent hotels - check for luxury indicators in name
  const hotelName = hotel.name.toLowerCase();
  const luxuryIndicators = ['luxury', 'grand', 'palace', 'royal', 'imperial', 'premium'];
  const hasLuxuryIndicator = luxuryIndicators.some(indicator => hotelName.includes(indicator));

  if (hasLuxuryIndicator) {
    return 0.2;
  }

  return 0; // Default for unknown/standard brands
}

/**
 * Calculate location appeal based on destination and setting
 * Max score: 1.0
 */
export function locationAppeal(
  cityCode: string, 
  amenities: string[], 
  description: string
): number {
  let score = 0;
  const desc = description.toLowerCase();

  // Check if it's a top inspiration city (+0.5)
  const isInspoCity = TOP_INSPO_CITIES.some(city => 
    cityCode.toLowerCase().includes(city) || 
    desc.includes(city)
  );
  
  if (isInspoCity) {
    score += 0.5;
  }

  // Beach/Ocean location (+0.5)
  const beachKeywords = ['beach', 'ocean', 'sea', 'oceanfront', 'beachfront', 'seaside'];
  const hasBeach = amenities.includes('BEACH') || 
                   beachKeywords.some(keyword => desc.includes(keyword));
  
  if (hasBeach) {
    score += 0.5;
  }

  // Mountain/Lake/Cliff location (+0.3)
  const scenicKeywords = ['mountain', 'lake', 'cliff', 'clifftop', 'valley', 'canyon', 'caldera'];
  const hasScenic = scenicKeywords.some(keyword => desc.includes(keyword));
  
  if (hasScenic) {
    score += 0.3;
  }

  // Vineyard/Wine region (+0.2)
  const wineKeywords = ['vineyard', 'winery', 'wine region', 'wine country'];
  const hasWine = wineKeywords.some(keyword => desc.includes(keyword));
  
  if (hasWine) {
    score += 0.2;
  }

  // Historic/Cultural location (+0.2)
  const culturalKeywords = ['historic', 'heritage', 'cultural', 'unesco', 'monument'];
  const hasCultural = culturalKeywords.some(keyword => desc.includes(keyword));
  
  if (hasCultural) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate rating score based on hotel rating
 * Max score: 1.0
 */
export function ratingScore(rating: number | null): number {
  if (rating === null) return 0;

  if (rating >= 5.0) return 1.0;
  if (rating >= 4.5) return 0.8;
  if (rating >= 4.0) return 0.6;
  if (rating >= 3.5) return 0.4;
  if (rating >= 3.0) return 0.2;
  
  return -0.2; // Penalty for very low ratings
}

/**
 * Calculate price penalty for overpriced hotels without wow factor
 * Returns negative value (penalty)
 */
export function pricePenalty(
  price: number, 
  currency: string, 
  hasWow: boolean
): number {
  // Convert to USD for consistent comparison
  let priceUSD = price;
  if (currency === 'EUR') {
    priceUSD = price * 1.1; // Rough EUR to USD conversion
  } else if (currency === 'GBP') {
    priceUSD = price * 1.3; // Rough GBP to USD conversion
  }

  // No penalty if hotel has wow amenities
  if (hasWow) return 0;

  // Apply penalty for expensive hotels without wow factor
  if (priceUSD > 1500) return -0.4;
  if (priceUSD > 1000) return -0.2;
  if (priceUSD > 500) return -0.1;

  return 0;
}

/**
 * Main scoring function - combines all components
 */
export function scoreHotel(
  hotel: AmadeusHotel, 
  content: HotelContent, 
  offers: HotelOffer[]
): ScoringComponents {
  const media = content.media || [];
  const amenities = content.amenities || [];
  const description = content.description?.text || '';
  const rating = hotel.rating || extractRating(content);
  
  // Get price from best offer
  const bestOffer = offers[0]; // Assuming offers are sorted by price
  const price = bestOffer ? parseFloat(bestOffer.price.total) : 0;
  const currency = bestOffer ? bestOffer.price.currency : 'USD';
  
  // Check if hotel has wow amenities
  const hasWow = hasWowAmenities(hotel, content);

  // Calculate individual component scores
  const visual = visualScore(media);
  const amenity = amenityScore(amenities, description);
  const brand = brandScore(hotel);
  const location = locationAppeal(hotel.cityCode, amenities, description);
  const ratingComp = ratingScore(rating);
  const priceComp = pricePenalty(price, currency, hasWow);

  // Calculate weighted total score
  const total = 
    SCORING_WEIGHTS.visual * visual +
    SCORING_WEIGHTS.amenity * amenity +
    SCORING_WEIGHTS.brand * brand +
    SCORING_WEIGHTS.location * location +
    SCORING_WEIGHTS.rating * ratingComp +
    SCORING_WEIGHTS.price * priceComp;

  return {
    visual,
    amenity,
    brand,
    location,
    rating: ratingComp,
    price: priceComp,
    total: Math.max(total, 0) // Ensure non-negative total
  };
}

/**
 * Check if hotel meets minimum score threshold
 */
export function meetsScoreThreshold(score: ScoringComponents): boolean {
  return score.total >= SCORING_THRESHOLDS.minScore;
}

/**
 * Get score explanation for debugging
 */
export function explainScore(score: ScoringComponents): string {
  const components = [
    `Visual: ${(score.visual * 100).toFixed(0)}%`,
    `Amenity: ${(score.amenity * 100).toFixed(0)}%`,
    `Brand: ${(score.brand * 100).toFixed(0)}%`,
    `Location: ${(score.location * 100).toFixed(0)}%`,
    `Rating: ${(score.rating * 100).toFixed(0)}%`,
    `Price: ${score.price >= 0 ? '+' : ''}${(score.price * 100).toFixed(0)}%`
  ];
  
  return `Total: ${(score.total * 100).toFixed(0)}% (${components.join(', ')})`;
} 