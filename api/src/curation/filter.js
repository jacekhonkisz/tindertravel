"use strict";
// Glintz Hotel Curation - Hard Gates & Main Pipeline
// Apply hard filters and orchestrate the complete curation process
Object.defineProperty(exports, "__esModule", { value: true });
exports.passesHardGates = passesHardGates;
exports.curate = curate;
exports.filterCards = filterCards;
exports.getCurationSummary = getCurationSummary;
var constants_1 = require("./constants");
var extract_1 = require("./extract");
var score_1 = require("./score");
/**
 * Hard Gate 1: Photo Gate
 * Must have >= 3 photos with at least one EXTERIOR or ROOM
 */
function passesPhotoGate(content) {
    return (0, extract_1.hasPhotoGate)(content);
}
/**
 * Hard Gate 2: Brand Gate
 * Must not be blacklisted economy chain
 */
function passesBrandGate(hotel) {
    var brand = (0, extract_1.brandInfo)(hotel);
    return !brand.blacklisted;
}
/**
 * Hard Gate 3: Quality Gate
 * Must have rating >= 4.0 OR (photo gate + wow amenity)
 */
function passesQualityGate(hotel, content) {
    var rating = hotel.rating || (0, extract_1.extractRating)(content);
    // Pass if rating is good
    if (rating && rating >= constants_1.SCORING_THRESHOLDS.minRating) {
        return true;
    }
    // Pass if no rating but has photos + wow amenities
    if (!rating || rating === 0) {
        return (0, extract_1.hasPhotoGate)(content) && (0, extract_1.hasWowAmenities)(hotel, content);
    }
    // Fail if rating exists but is too low
    return rating >= constants_1.SCORING_THRESHOLDS.minQualityRating;
}
/**
 * Hard Gate 4: Price Extremes
 * Drop if price > $2000 and no wow amenities
 */
function passesPriceGate(hotel, content, offers) {
    if (!offers || offers.length === 0)
        return true;
    var bestOffer = offers[0];
    var price = parseFloat(bestOffer.price.total);
    var currency = bestOffer.price.currency;
    // Convert to USD for comparison
    var priceUSD = price;
    if (currency === 'EUR') {
        priceUSD = price * 1.1;
    }
    else if (currency === 'GBP') {
        priceUSD = price * 1.3;
    }
    // If price is extreme, must have wow amenities
    if (priceUSD > constants_1.SCORING_THRESHOLDS.maxPrice) {
        return (0, extract_1.hasWowAmenities)(hotel, content);
    }
    return true;
}
/**
 * Check if hotel passes all hard gates
 */
function passesHardGates(hotel, content, offers) {
    return (passesPhotoGate(content) &&
        passesBrandGate(hotel) &&
        passesQualityGate(hotel, content) &&
        passesPriceGate(hotel, content, offers));
}
/**
 * Convert raw hotel data to curated card
 */
function createCuratedCard(hotel, content, offers, tags, score) {
    var _a, _b;
    var bestOffer = offers[0];
    var heroPhoto = (0, extract_1.getHeroPhoto)(content);
    var photos = (0, extract_1.getPhotoUrls)(content);
    var rating = hotel.rating || (0, extract_1.extractRating)(content);
    // Extract city and country from cityCode or description
    var cityCode = hotel.cityCode;
    var city = cityCode;
    var country = 'Unknown';
    // Try to extract from description or use cityCode
    var description = ((_a = content.description) === null || _a === void 0 ? void 0 : _a.text) || '';
    if (description) {
        // Simple extraction - could be enhanced with a city/country database
        var locationMatch = description.match(/([A-Za-z\s]+),\s*([A-Za-z\s]+)$/);
        if (locationMatch) {
            city = locationMatch[1].trim();
            country = locationMatch[2].trim();
        }
    }
    return {
        id: hotel.hotelId,
        name: hotel.name,
        city: city,
        country: country,
        coords: {
            lat: hotel.latitude,
            lng: hotel.longitude
        },
        price: {
            amount: (bestOffer === null || bestOffer === void 0 ? void 0 : bestOffer.price.total) || '0',
            currency: (bestOffer === null || bestOffer === void 0 ? void 0 : bestOffer.price.currency) || 'USD'
        },
        photos: photos,
        heroPhoto: heroPhoto || photos[0] || '',
        description: ((_b = content.description) === null || _b === void 0 ? void 0 : _b.text) || '',
        tags: tags.slice(0, 3), // Limit to max 3 tags as per spec
        score: score,
        rating: rating || undefined,
        chainCode: hotel.chainCode
    };
}
/**
 * Main curation pipeline
 * Apply hard gates → compute tags & score → threshold filter → return cards
 */
function curate(rawHotels) {
    var stats = {
        totalProcessed: rawHotels.length,
        passedPhotoGate: 0,
        passedBrandGate: 0,
        passedQualityGate: 0,
        passedPriceGate: 0,
        passedScoreThreshold: 0,
        finalCurated: 0,
        averageScore: 0
    };
    var curatedCards = [];
    var totalScore = 0;
    for (var _i = 0, rawHotels_1 = rawHotels; _i < rawHotels_1.length; _i++) {
        var rawHotel = rawHotels_1[_i];
        var hotel = rawHotel.hotel, content = rawHotel.content, offers = rawHotel.offers;
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
        var tags = (0, extract_1.extractTags)(hotel, content);
        var score = (0, score_1.scoreHotel)(hotel, content, offers);
        // Score threshold check
        if (!(0, score_1.meetsScoreThreshold)(score)) {
            continue;
        }
        stats.passedScoreThreshold++;
        // Create curated card
        var card = createCuratedCard(hotel, content, offers, tags, score);
        curatedCards.push(card);
        totalScore += score.total;
    }
    stats.finalCurated = curatedCards.length;
    stats.averageScore = curatedCards.length > 0 ? totalScore / curatedCards.length : 0;
    return {
        cards: curatedCards,
        stats: stats
    };
}
/**
 * Filter cards by specific criteria (for debugging/testing)
 */
function filterCards(cards, criteria) {
    return cards.filter(function (card) {
        // Score filter
        if (criteria.minScore && card.score.total < criteria.minScore) {
            return false;
        }
        // Price filter
        if (criteria.maxPrice) {
            var price = parseFloat(card.price.amount);
            if (price > criteria.maxPrice) {
                return false;
            }
        }
        // Required tags filter
        if (criteria.requiredTags && criteria.requiredTags.length > 0) {
            var cardTagIds_1 = card.tags.map(function (tag) { return tag.id; });
            var hasRequiredTag = criteria.requiredTags.some(function (tagId) {
                return cardTagIds_1.includes(tagId);
            });
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
function getCurationSummary(stats) {
    var photoGateRate = (stats.passedPhotoGate / stats.totalProcessed * 100).toFixed(1);
    var brandGateRate = (stats.passedBrandGate / stats.totalProcessed * 100).toFixed(1);
    var qualityGateRate = (stats.passedQualityGate / stats.totalProcessed * 100).toFixed(1);
    var priceGateRate = (stats.passedPriceGate / stats.totalProcessed * 100).toFixed(1);
    var scoreRate = (stats.passedScoreThreshold / stats.totalProcessed * 100).toFixed(1);
    var finalRate = (stats.finalCurated / stats.totalProcessed * 100).toFixed(1);
    return "\nCuration Pipeline Results:\n- Total Processed: ".concat(stats.totalProcessed, "\n- Photo Gate: ").concat(stats.passedPhotoGate, " (").concat(photoGateRate, "%)\n- Brand Gate: ").concat(stats.passedBrandGate, " (").concat(brandGateRate, "%)\n- Quality Gate: ").concat(stats.passedQualityGate, " (").concat(qualityGateRate, "%)\n- Price Gate: ").concat(stats.passedPriceGate, " (").concat(priceGateRate, "%)\n- Score Threshold: ").concat(stats.passedScoreThreshold, " (").concat(scoreRate, "%)\n- Final Curated: ").concat(stats.finalCurated, " (").concat(finalRate, "%)\n- Average Score: ").concat((stats.averageScore * 100).toFixed(1), "%\n  ").trim();
}
