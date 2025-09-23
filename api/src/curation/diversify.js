"use strict";
// Glintz Hotel Curation - Diversification Algorithm
// Bucket shuffle to avoid >2 same city/brand in a row
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diversify = diversify;
exports.diversifyAdvanced = diversifyAdvanced;
exports.calculateDiversityStats = calculateDiversityStats;
exports.getDiversitySummary = getDiversitySummary;
/**
 * Diversify cards to avoid repetition using bucket shuffle
 * No more than 2 consecutive cards from same city or brand
 */
function diversify(cards) {
    if (cards.length <= 2)
        return cards;
    // Sort by score first (highest first)
    var sortedCards = __spreadArray([], cards, true).sort(function (a, b) { return b.score.total - a.score.total; });
    var result = [];
    var remaining = __spreadArray([], sortedCards, true);
    while (remaining.length > 0) {
        var bestIndex = 0;
        var bestCard = remaining[0];
        // If we have at least 2 cards in result, check for diversity
        if (result.length >= 2) {
            var lastCard = result[result.length - 1];
            var secondLastCard = result[result.length - 2];
            // Find the best card that doesn't create 3 in a row
            for (var i = 0; i < remaining.length; i++) {
                var candidate = remaining[i];
                // Check if this would create 3 same cities in a row
                var wouldCreate3Cities = lastCard.city === secondLastCard.city &&
                    candidate.city === lastCard.city;
                // Check if this would create 3 same brands in a row
                var wouldCreate3Brands = lastCard.chainCode && secondLastCard.chainCode && candidate.chainCode &&
                    lastCard.chainCode === secondLastCard.chainCode &&
                    candidate.chainCode === lastCard.chainCode;
                // If this candidate doesn't create 3 in a row, prefer it
                if (!wouldCreate3Cities && !wouldCreate3Brands) {
                    bestIndex = i;
                    bestCard = candidate;
                    break;
                }
            }
        }
        else if (result.length === 1) {
            var lastCard = result[result.length - 1];
            // Try to find a card from different city/brand for variety
            for (var i = 0; i < remaining.length; i++) {
                var candidate = remaining[i];
                var differentCity = candidate.city !== lastCard.city;
                var differentBrand = candidate.chainCode !== lastCard.chainCode;
                // Prefer different city/brand, but don't sacrifice too much score
                var scoreDiff = bestCard.score.total - candidate.score.total;
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
function diversifyAdvanced(cards) {
    if (cards.length <= 3)
        return cards;
    // Create score-based buckets
    var buckets = createScoreBuckets(cards);
    var result = [];
    // Process each bucket and interleave results
    for (var _i = 0, buckets_1 = buckets; _i < buckets_1.length; _i++) {
        var bucket = buckets_1[_i];
        var diversifiedBucket = diversifyBucket(bucket);
        result.push.apply(result, diversifiedBucket);
    }
    // Final pass to ensure no 3 consecutive same city/brand
    return finalDiversityPass(result);
}
/**
 * Create buckets based on score ranges
 */
function createScoreBuckets(cards) {
    var sorted = __spreadArray([], cards, true).sort(function (a, b) { return b.score.total - a.score.total; });
    var buckets = [];
    var bucketSize = Math.ceil(sorted.length / 5); // 5 score tiers
    for (var i = 0; i < sorted.length; i += bucketSize) {
        var bucket = sorted.slice(i, i + bucketSize);
        if (bucket.length > 0) {
            buckets.push(bucket);
        }
    }
    return buckets;
}
/**
 * Diversify within a single bucket
 */
function diversifyBucket(bucket) {
    if (bucket.length <= 2)
        return bucket;
    // Group by city and brand for round-robin selection
    var cityGroups = groupBy(bucket, function (card) { return card.city; });
    var brandGroups = groupBy(bucket, function (card) { return card.chainCode || 'independent'; });
    var result = [];
    var used = new Set();
    // Round-robin selection prioritizing diversity
    while (result.length < bucket.length) {
        var added = false;
        // Try to add from different cities first
        for (var _i = 0, _a = Object.entries(cityGroups); _i < _a.length; _i++) {
            var _b = _a[_i], city = _b[0], cityCards = _b[1];
            var availableCards = cityCards.filter(function (card) { return !used.has(card.id); });
            if (availableCards.length > 0) {
                var card = availableCards[0];
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
            for (var _c = 0, _d = Object.entries(brandGroups); _c < _d.length; _c++) {
                var _e = _d[_c], brand = _e[0], brandCards = _e[1];
                var availableCards = brandCards.filter(function (card) { return !used.has(card.id); });
                if (availableCards.length > 0) {
                    var card = availableCards[0];
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
            var remaining = bucket.filter(function (card) { return !used.has(card.id); });
            if (remaining.length > 0) {
                result.push(remaining[0]);
                used.add(remaining[0].id);
            }
            else {
                break;
            }
        }
    }
    return result;
}
/**
 * Check if a card can be added without violating diversity rules
 */
function canAddCard(result, candidate) {
    if (result.length < 2)
        return true;
    var lastCard = result[result.length - 1];
    var secondLastCard = result[result.length - 2];
    // Check for 3 consecutive same cities
    var wouldCreate3Cities = lastCard.city === secondLastCard.city &&
        candidate.city === lastCard.city;
    // Check for 3 consecutive same brands
    var wouldCreate3Brands = lastCard.chainCode && secondLastCard.chainCode && candidate.chainCode &&
        lastCard.chainCode === secondLastCard.chainCode &&
        candidate.chainCode === lastCard.chainCode;
    return !wouldCreate3Cities && !wouldCreate3Brands;
}
/**
 * Final pass to fix any remaining diversity issues
 */
function finalDiversityPass(cards) {
    var _a, _b;
    var result = __spreadArray([], cards, true);
    // Look for violations and try to fix them
    for (var i = 2; i < result.length; i++) {
        var current = result[i];
        var prev = result[i - 1];
        var prevPrev = result[i - 2];
        // Check for 3 consecutive same cities
        if (current.city === prev.city && prev.city === prevPrev.city) {
            // Try to swap with a later card
            for (var j = i + 1; j < result.length; j++) {
                if (result[j].city !== prev.city) {
                    // Swap
                    _a = [result[j], result[i]], result[i] = _a[0], result[j] = _a[1];
                    break;
                }
            }
        }
        // Check for 3 consecutive same brands
        if (current.chainCode && prev.chainCode && prevPrev.chainCode &&
            current.chainCode === prev.chainCode &&
            prev.chainCode === prevPrev.chainCode) {
            // Try to swap with a later card
            for (var j = i + 1; j < result.length; j++) {
                if (result[j].chainCode !== prev.chainCode) {
                    // Swap
                    _b = [result[j], result[i]], result[i] = _b[0], result[j] = _b[1];
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
function calculateDiversityStats(cards) {
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
    var uniqueCities = new Set(cards.map(function (card) { return card.city; })).size;
    var uniqueBrands = new Set(cards.map(function (card) { return card.chainCode || 'independent'; })).size;
    // Calculate max consecutive runs
    var maxConsecutiveSameCity = 1;
    var maxConsecutiveSameBrand = 1;
    var currentCityRun = 1;
    var currentBrandRun = 1;
    for (var i = 1; i < cards.length; i++) {
        // City runs
        if (cards[i].city === cards[i - 1].city) {
            currentCityRun++;
            maxConsecutiveSameCity = Math.max(maxConsecutiveSameCity, currentCityRun);
        }
        else {
            currentCityRun = 1;
        }
        // Brand runs
        var currentBrand = cards[i].chainCode || 'independent';
        var prevBrand = cards[i - 1].chainCode || 'independent';
        if (currentBrand === prevBrand) {
            currentBrandRun++;
            maxConsecutiveSameBrand = Math.max(maxConsecutiveSameBrand, currentBrandRun);
        }
        else {
            currentBrandRun = 1;
        }
    }
    // Calculate diversity score (0-1, higher is better)
    var cityDiversity = uniqueCities / Math.min(cards.length, 10); // Normalize to max 10 cities
    var brandDiversity = uniqueBrands / Math.min(cards.length, 8); // Normalize to max 8 brands
    var consecutivePenalty = Math.max(0, 1 - (maxConsecutiveSameCity - 2) * 0.2 - (maxConsecutiveSameBrand - 2) * 0.2);
    var diversityScore = (cityDiversity + brandDiversity + consecutivePenalty) / 3;
    return {
        totalCards: cards.length,
        uniqueCities: uniqueCities,
        uniqueBrands: uniqueBrands,
        maxConsecutiveSameCity: maxConsecutiveSameCity,
        maxConsecutiveSameBrand: maxConsecutiveSameBrand,
        diversityScore: Math.max(0, Math.min(1, diversityScore))
    };
}
/**
 * Utility function to group array by key
 */
function groupBy(array, keyFn) {
    return array.reduce(function (groups, item) {
        var key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
/**
 * Get diversity summary for debugging
 */
function getDiversitySummary(stats) {
    return "\nDiversity Analysis:\n- Total Cards: ".concat(stats.totalCards, "\n- Unique Cities: ").concat(stats.uniqueCities, "\n- Unique Brands: ").concat(stats.uniqueBrands, "\n- Max Consecutive Same City: ").concat(stats.maxConsecutiveSameCity, "\n- Max Consecutive Same Brand: ").concat(stats.maxConsecutiveSameBrand, "\n- Diversity Score: ").concat((stats.diversityScore * 100).toFixed(1), "%\n  ").trim();
}
