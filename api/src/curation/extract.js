"use strict";
// Glintz Hotel Curation - Data Extraction Utilities
// Extract tags, validate photos, and analyze brands
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
exports.extractTags = extractTags;
exports.hasPhotoGate = hasPhotoGate;
exports.brandInfo = brandInfo;
exports.hasWowAmenities = hasWowAmenities;
exports.getHeroPhoto = getHeroPhoto;
exports.getPhotoUrls = getPhotoUrls;
exports.isInspirationCity = isInspirationCity;
exports.extractRating = extractRating;
var constants_1 = require("./constants");
/**
 * Extract visual and experiential tags from hotel amenities and description
 */
function extractTags(hotel, content) {
    var _a, _b;
    var tags = [];
    var description = ((_b = (_a = content.description) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
    var amenities = content.amenities || [];
    var hotelName = hotel.name.toLowerCase();
    // Beach/Island detection
    if (amenities.includes('BEACH') ||
        description.includes('beach') ||
        description.includes('island') ||
        description.includes('oceanfront') ||
        description.includes('beachfront')) {
        tags.push({
            id: 'beach-island',
            label: 'Beach/Island',
            category: 'location'
        });
    }
    // Infinity & Rooftop pools
    if (amenities.some(function (a) { return ['POOL', 'OUTDOOR_POOL', 'SWIMMING_POOL'].includes(a); }) &&
        (description.includes('infinity') || description.includes('rooftop') || description.includes('roof top'))) {
        tags.push({
            id: 'infinity-rooftop',
            label: 'Infinity & Rooftop',
            category: 'amenity'
        });
    }
    else if (amenities.some(function (a) { return ['POOL', 'OUTDOOR_POOL', 'SWIMMING_POOL'].includes(a); })) {
        // Regular pool if no infinity/rooftop
        tags.push({
            id: 'pool',
            label: 'Pool',
            category: 'amenity'
        });
    }
    // Design/Heritage
    var designKeywords = constants_1.DESCRIPTION_KEYWORDS.design;
    if (designKeywords.some(function (keyword) { return description.includes(keyword) || hotelName.includes(keyword); })) {
        tags.push({
            id: 'design-heritage',
            label: 'Design/Heritage',
            category: 'style'
        });
    }
    // Wellness
    if (amenities.some(function (a) { return ['SPA', 'SAUNA', 'STEAM_ROOM', 'HEALTH_CLUB', 'MASSAGE'].includes(a); }) ||
        description.includes('wellness') ||
        description.includes('spa') ||
        description.includes('retreat')) {
        tags.push({
            id: 'wellness',
            label: 'Wellness',
            category: 'amenity'
        });
    }
    // Scenic Nature
    var natureKeywords = constants_1.DESCRIPTION_KEYWORDS.nature;
    if (natureKeywords.some(function (keyword) { return description.includes(keyword); }) ||
        description.includes('mountain') ||
        description.includes('forest') ||
        description.includes('vineyard')) {
        tags.push({
            id: 'scenic-nature',
            label: 'Scenic Nature',
            category: 'location'
        });
    }
    // City View
    var viewKeywords = ['city view', 'skyline', 'urban', 'downtown', 'metropolitan'];
    if (viewKeywords.some(function (keyword) { return description.includes(keyword); })) {
        tags.push({
            id: 'city-view',
            label: 'City View',
            category: 'location'
        });
    }
    // Villas/Suites
    if (amenities.some(function (a) { return ['2BEDROOM', '3BEDROOM', '4BEDROOM'].includes(a); }) ||
        description.includes('villa') ||
        description.includes('suite') ||
        description.includes('apartment') ||
        hotelName.includes('villa') ||
        hotelName.includes('suite')) {
        tags.push({
            id: 'villas-suites',
            label: 'Villas/Suites',
            category: 'accommodation'
        });
    }
    // Adults Only
    if (description.includes('adults only') ||
        description.includes('adults-only') ||
        description.includes('18+') ||
        hotelName.includes('adults only')) {
        tags.push({
            id: 'adults-only',
            label: 'Adults Only',
            category: 'style'
        });
    }
    // Golf
    if (amenities.includes('GOLF') || description.includes('golf')) {
        tags.push({
            id: 'golf',
            label: 'Golf',
            category: 'amenity'
        });
    }
    // All Inclusive
    if (amenities.includes('ALL_INCLUSIVE') || description.includes('all inclusive')) {
        tags.push({
            id: 'all-inclusive',
            label: 'All Inclusive',
            category: 'service'
        });
    }
    return tags;
}
/**
 * Check if hotel passes photo gate requirements
 */
function hasPhotoGate(content) {
    var media = content.media || [];
    // Must have at least 3 photos
    if (media.length < constants_1.SCORING_THRESHOLDS.minPhotos) {
        return false;
    }
    // Must have at least one EXTERIOR or ROOM photo
    var hasExteriorOrRoom = media.some(function (item) {
        return item.category === 'EXTERIOR' ||
            item.category === 'ROOM' ||
            item.category === 'SUITE';
    });
    return hasExteriorOrRoom;
}
/**
 * Analyze brand information from chain code and hotel name
 */
function brandInfo(hotel) {
    var chainCode = hotel.chainCode;
    var hotelName = hotel.name.toLowerCase();
    // Check blacklist first
    if (chainCode && constants_1.BLACKLIST_CHAINS.includes(chainCode)) {
        return {
            premium: false,
            boutique: false,
            blacklisted: true,
            chainCode: chainCode
        };
    }
    // Check blacklist by name
    var isBlacklistedByName = constants_1.BRAND_KEYWORDS.blacklist.some(function (brand) {
        return hotelName.includes(brand);
    });
    if (isBlacklistedByName) {
        return {
            premium: false,
            boutique: false,
            blacklisted: true,
            chainCode: chainCode
        };
    }
    // Check premium brands
    var isPremiumChain = chainCode && constants_1.PREMIUM_CHAINS.includes(chainCode);
    var isPremiumByName = constants_1.BRAND_KEYWORDS.premium.some(function (brand) {
        return hotelName.includes(brand);
    });
    if (isPremiumChain || isPremiumByName) {
        return {
            premium: true,
            boutique: false,
            blacklisted: false,
            chainCode: chainCode
        };
    }
    // Check boutique programs
    var isBoutiqueChain = chainCode && constants_1.BOUTIQUE_PROGRAMS.includes(chainCode);
    var isBoutiqueByName = constants_1.BRAND_KEYWORDS.boutique.some(function (brand) {
        return hotelName.includes(brand);
    });
    if (isBoutiqueChain || isBoutiqueByName) {
        return {
            premium: false,
            boutique: true,
            blacklisted: false,
            chainCode: chainCode
        };
    }
    // Default - independent or unknown chain
    return {
        premium: false,
        boutique: false,
        blacklisted: false,
        chainCode: chainCode
    };
}
/**
 * Check if hotel has "wow" amenities for quality gate
 */
function hasWowAmenities(hotel, content) {
    var _a, _b;
    var amenities = content.amenities || [];
    var description = ((_b = (_a = content.description) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
    // Check for wow amenity codes
    var hasWowAmenityCode = amenities.some(function (amenity) {
        return constants_1.WOW_AMENITY_CODES.includes(amenity);
    });
    if (hasWowAmenityCode)
        return true;
    // Check for wow keywords in description
    var wowKeywords = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], constants_1.DESCRIPTION_KEYWORDS.views, true), constants_1.DESCRIPTION_KEYWORDS.design, true), constants_1.DESCRIPTION_KEYWORDS.luxury, true), constants_1.DESCRIPTION_KEYWORDS.romance, true);
    var hasWowKeyword = wowKeywords.some(function (keyword) {
        return description.includes(keyword);
    });
    return hasWowKeyword;
}
/**
 * Get the best quality photo for hero image
 */
function getHeroPhoto(content) {
    var media = content.media || [];
    if (media.length === 0)
        return null;
    // Prefer EXTERIOR photos first
    var exteriorPhoto = media.find(function (item) { return item.category === 'EXTERIOR'; });
    if (exteriorPhoto)
        return exteriorPhoto.uri;
    // Then ROOM/SUITE photos
    var roomPhoto = media.find(function (item) {
        return item.category === 'ROOM' || item.category === 'SUITE';
    });
    if (roomPhoto)
        return roomPhoto.uri;
    // Then any photo with good dimensions
    var goodPhoto = media.find(function (item) {
        return item.width && item.height && item.width >= 800 && item.height >= 600;
    });
    if (goodPhoto)
        return goodPhoto.uri;
    // Fallback to first photo
    return media[0].uri;
}
/**
 * Extract all photo URLs for the hotel
 */
function getPhotoUrls(content) {
    var media = content.media || [];
    return media.map(function (item) { return item.uri; }).filter(Boolean);
}
/**
 * Check if location is in top inspiration cities
 */
function isInspirationCity(cityName) {
    var city = cityName.toLowerCase();
    return constants_1.DESCRIPTION_KEYWORDS.views.some(function (inspoCity) {
        return city.includes(inspoCity) || inspoCity.includes(city);
    });
}
/**
 * Extract numeric rating from various rating providers
 */
function extractRating(content) {
    if (!content.ratings || content.ratings.length === 0) {
        return null;
    }
    // Prefer TripAdvisor or Google ratings
    var preferredRating = content.ratings.find(function (r) {
        return r.provider.toLowerCase().includes('tripadvisor') ||
            r.provider.toLowerCase().includes('google');
    });
    if (preferredRating) {
        var rating = parseFloat(preferredRating.rating);
        return isNaN(rating) ? null : rating;
    }
    // Fallback to first available rating
    var firstRating = parseFloat(content.ratings[0].rating);
    return isNaN(firstRating) ? null : firstRating;
}
