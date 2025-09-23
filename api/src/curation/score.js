"use strict";
// Glintz Hotel Curation - Scoring Algorithm
// Visual-first scoring with 6 components: visual, amenity, brand, location, rating, price
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualScore = visualScore;
exports.amenityScore = amenityScore;
exports.brandScore = brandScore;
exports.locationAppeal = locationAppeal;
exports.ratingScore = ratingScore;
exports.pricePenalty = pricePenalty;
exports.scoreHotel = scoreHotel;
exports.meetsScoreThreshold = meetsScoreThreshold;
exports.explainScore = explainScore;
var constants_1 = require("./constants");
var extract_1 = require("./extract");
/**
 * Calculate visual score based on photo quality and quantity
 * Max score: 1.0
 */
function visualScore(media) {
    if (!media || media.length === 0)
        return 0;
    // Base score: min(photos, 6) / 6
    var photoCount = Math.min(media.length, 6);
    var score = photoCount / 6;
    // Bonus for having both EXTERIOR and ROOM photos (+0.2)
    var hasExterior = media.some(function (item) { return item.category === 'EXTERIOR'; });
    var hasRoom = media.some(function (item) {
        return item.category === 'ROOM' || item.category === 'SUITE';
    });
    if (hasExterior && hasRoom) {
        score += 0.2;
    }
    // Bonus for high-resolution photos (+0.1)
    var hasHighRes = media.some(function (item) {
        return item.width && item.height && item.width >= 1200 && item.height >= 800;
    });
    if (hasHighRes) {
        score += 0.1;
    }
    // Bonus for diverse photo categories (+0.1)
    var categories = new Set(media.map(function (item) { return item.category; }).filter(Boolean));
    if (categories.size >= 4) {
        score += 0.1;
    }
    return Math.min(score, 1.0);
}
/**
 * Calculate amenity score based on wow amenities and keywords
 * Max score: 1.0
 */
function amenityScore(amenities, description) {
    var score = 0;
    var desc = description.toLowerCase();
    // Beach/Infinity/Rooftop amenities (+0.5 each, max 0.5 total)
    var premiumWaterAmenities = ['BEACH', 'OUTDOOR_POOL', 'POOL', 'SWIMMING_POOL'];
    var hasPremiumWater = amenities.some(function (a) { return premiumWaterAmenities.includes(a); });
    var hasInfinityRooftop = desc.includes('infinity') || desc.includes('rooftop') || desc.includes('roof top');
    if (hasPremiumWater && hasInfinityRooftop) {
        score += 0.5;
    }
    else if (hasPremiumWater || hasInfinityRooftop) {
        score += 0.3;
    }
    // Spa/Wellness amenities (+0.3)
    var wellnessAmenities = ['SPA', 'SAUNA', 'STEAM_ROOM', 'HEALTH_CLUB', 'MASSAGE'];
    var hasWellness = amenities.some(function (a) { return wellnessAmenities.includes(a); }) ||
        desc.includes('spa') || desc.includes('wellness');
    if (hasWellness) {
        score += 0.3;
    }
    // Design/Heritage keywords (+0.3)
    var designKeywords = constants_1.DESCRIPTION_KEYWORDS.design;
    var hasDesign = designKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasDesign) {
        score += 0.3;
    }
    // Premium amenities (+0.2)
    var premiumAmenities = ['GOLF', 'TENNIS', 'VALET_PARKING', 'ROOM_SERVICE', 'ALL_INCLUSIVE'];
    var hasPremiumAmenity = amenities.some(function (a) { return premiumAmenities.includes(a); });
    if (hasPremiumAmenity) {
        score += 0.2;
    }
    // Luxury keywords in description (+0.2)
    var luxuryKeywords = constants_1.DESCRIPTION_KEYWORDS.luxury;
    var hasLuxuryKeyword = luxuryKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasLuxuryKeyword) {
        score += 0.2;
    }
    // Romance/Adults keywords (+0.1)
    var romanceKeywords = constants_1.DESCRIPTION_KEYWORDS.romance;
    var hasRomance = romanceKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasRomance) {
        score += 0.1;
    }
    return Math.min(score, 1.0);
}
/**
 * Calculate brand score based on chain prestige
 * Max score: 1.0
 */
function brandScore(hotel) {
    var brand = (0, extract_1.brandInfo)(hotel);
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
    var hotelName = hotel.name.toLowerCase();
    var luxuryIndicators = ['luxury', 'grand', 'palace', 'royal', 'imperial', 'premium'];
    var hasLuxuryIndicator = luxuryIndicators.some(function (indicator) { return hotelName.includes(indicator); });
    if (hasLuxuryIndicator) {
        return 0.2;
    }
    return 0; // Default for unknown/standard brands
}
/**
 * Calculate location appeal based on destination and setting
 * Max score: 1.0
 */
function locationAppeal(cityCode, amenities, description) {
    var score = 0;
    var desc = description.toLowerCase();
    // Check if it's a top inspiration city (+0.5)
    var isInspoCity = constants_1.TOP_INSPO_CITIES.some(function (city) {
        return cityCode.toLowerCase().includes(city) ||
            desc.includes(city);
    });
    if (isInspoCity) {
        score += 0.5;
    }
    // Beach/Ocean location (+0.5)
    var beachKeywords = ['beach', 'ocean', 'sea', 'oceanfront', 'beachfront', 'seaside'];
    var hasBeach = amenities.includes('BEACH') ||
        beachKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasBeach) {
        score += 0.5;
    }
    // Mountain/Lake/Cliff location (+0.3)
    var scenicKeywords = ['mountain', 'lake', 'cliff', 'clifftop', 'valley', 'canyon', 'caldera'];
    var hasScenic = scenicKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasScenic) {
        score += 0.3;
    }
    // Vineyard/Wine region (+0.2)
    var wineKeywords = ['vineyard', 'winery', 'wine region', 'wine country'];
    var hasWine = wineKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasWine) {
        score += 0.2;
    }
    // Historic/Cultural location (+0.2)
    var culturalKeywords = ['historic', 'heritage', 'cultural', 'unesco', 'monument'];
    var hasCultural = culturalKeywords.some(function (keyword) { return desc.includes(keyword); });
    if (hasCultural) {
        score += 0.2;
    }
    return Math.min(score, 1.0);
}
/**
 * Calculate rating score based on hotel rating
 * Max score: 1.0
 */
function ratingScore(rating) {
    if (rating === null)
        return 0;
    if (rating >= 5.0)
        return 1.0;
    if (rating >= 4.5)
        return 0.8;
    if (rating >= 4.0)
        return 0.6;
    if (rating >= 3.5)
        return 0.4;
    if (rating >= 3.0)
        return 0.2;
    return -0.2; // Penalty for very low ratings
}
/**
 * Calculate price penalty for overpriced hotels without wow factor
 * Returns negative value (penalty)
 */
function pricePenalty(price, currency, hasWow) {
    // Convert to USD for consistent comparison
    var priceUSD = price;
    if (currency === 'EUR') {
        priceUSD = price * 1.1; // Rough EUR to USD conversion
    }
    else if (currency === 'GBP') {
        priceUSD = price * 1.3; // Rough GBP to USD conversion
    }
    // No penalty if hotel has wow amenities
    if (hasWow)
        return 0;
    // Apply penalty for expensive hotels without wow factor
    if (priceUSD > 1500)
        return -0.4;
    if (priceUSD > 1000)
        return -0.2;
    if (priceUSD > 500)
        return -0.1;
    return 0;
}
/**
 * Main scoring function - combines all components
 */
function scoreHotel(hotel, content, offers) {
    var _a;
    var media = content.media || [];
    var amenities = content.amenities || [];
    var description = ((_a = content.description) === null || _a === void 0 ? void 0 : _a.text) || '';
    var rating = hotel.rating || (0, extract_1.extractRating)(content);
    // Get price from best offer
    var bestOffer = offers[0]; // Assuming offers are sorted by price
    var price = bestOffer ? parseFloat(bestOffer.price.total) : 0;
    var currency = bestOffer ? bestOffer.price.currency : 'USD';
    // Check if hotel has wow amenities
    var hasWow = (0, extract_1.hasWowAmenities)(hotel, content);
    // Calculate individual component scores
    var visual = visualScore(media);
    var amenity = amenityScore(amenities, description);
    var brand = brandScore(hotel);
    var location = locationAppeal(hotel.cityCode, amenities, description);
    var ratingComp = ratingScore(rating);
    var priceComp = pricePenalty(price, currency, hasWow);
    // Calculate weighted total score
    var total = constants_1.SCORING_WEIGHTS.visual * visual +
        constants_1.SCORING_WEIGHTS.amenity * amenity +
        constants_1.SCORING_WEIGHTS.brand * brand +
        constants_1.SCORING_WEIGHTS.location * location +
        constants_1.SCORING_WEIGHTS.rating * ratingComp +
        constants_1.SCORING_WEIGHTS.price * priceComp;
    return {
        visual: visual,
        amenity: amenity,
        brand: brand,
        location: location,
        rating: ratingComp,
        price: priceComp,
        total: Math.max(total, 0) // Ensure non-negative total
    };
}
/**
 * Check if hotel meets minimum score threshold
 */
function meetsScoreThreshold(score) {
    return score.total >= constants_1.SCORING_THRESHOLDS.minScore;
}
/**
 * Get score explanation for debugging
 */
function explainScore(score) {
    var components = [
        "Visual: ".concat((score.visual * 100).toFixed(0), "%"),
        "Amenity: ".concat((score.amenity * 100).toFixed(0), "%"),
        "Brand: ".concat((score.brand * 100).toFixed(0), "%"),
        "Location: ".concat((score.location * 100).toFixed(0), "%"),
        "Rating: ".concat((score.rating * 100).toFixed(0), "%"),
        "Price: ".concat(score.price >= 0 ? '+' : '').concat((score.price * 100).toFixed(0), "%")
    ];
    return "Total: ".concat((score.total * 100).toFixed(0), "% (").concat(components.join(', '), ")");
}
