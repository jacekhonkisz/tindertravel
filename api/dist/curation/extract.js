"use strict";
// Glintz Hotel Curation - Data Extraction Utilities
// Extract tags, validate photos, and analyze brands
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTags = extractTags;
exports.hasPhotoGate = hasPhotoGate;
exports.brandInfo = brandInfo;
exports.hasWowAmenities = hasWowAmenities;
exports.getHeroPhoto = getHeroPhoto;
exports.getPhotoUrls = getPhotoUrls;
exports.isInspirationCity = isInspirationCity;
exports.extractRating = extractRating;
const constants_1 = require("./constants");
/**
 * Extract visual and experiential tags from hotel amenities and description
 */
function extractTags(hotel, content) {
    const tags = [];
    const description = content.description?.text?.toLowerCase() || '';
    const amenities = content.amenities || [];
    const hotelName = hotel.name.toLowerCase();
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
    if (amenities.some(a => ['POOL', 'OUTDOOR_POOL', 'SWIMMING_POOL'].includes(a)) &&
        (description.includes('infinity') || description.includes('rooftop') || description.includes('roof top'))) {
        tags.push({
            id: 'infinity-rooftop',
            label: 'Infinity & Rooftop',
            category: 'amenity'
        });
    }
    else if (amenities.some(a => ['POOL', 'OUTDOOR_POOL', 'SWIMMING_POOL'].includes(a))) {
        // Regular pool if no infinity/rooftop
        tags.push({
            id: 'pool',
            label: 'Pool',
            category: 'amenity'
        });
    }
    // Design/Heritage
    const designKeywords = constants_1.DESCRIPTION_KEYWORDS.design;
    if (designKeywords.some(keyword => description.includes(keyword) || hotelName.includes(keyword))) {
        tags.push({
            id: 'design-heritage',
            label: 'Design/Heritage',
            category: 'style'
        });
    }
    // Wellness
    if (amenities.some(a => ['SPA', 'SAUNA', 'STEAM_ROOM', 'HEALTH_CLUB', 'MASSAGE'].includes(a)) ||
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
    const natureKeywords = constants_1.DESCRIPTION_KEYWORDS.nature;
    if (natureKeywords.some(keyword => description.includes(keyword)) ||
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
    const viewKeywords = ['city view', 'skyline', 'urban', 'downtown', 'metropolitan'];
    if (viewKeywords.some(keyword => description.includes(keyword))) {
        tags.push({
            id: 'city-view',
            label: 'City View',
            category: 'location'
        });
    }
    // Villas/Suites
    if (amenities.some(a => ['2BEDROOM', '3BEDROOM', '4BEDROOM'].includes(a)) ||
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
    const media = content.media || [];
    // Must have at least 3 photos
    if (media.length < constants_1.SCORING_THRESHOLDS.minPhotos) {
        return false;
    }
    // Must have at least one EXTERIOR or ROOM photo
    const hasExteriorOrRoom = media.some(item => item.category === 'EXTERIOR' ||
        item.category === 'ROOM' ||
        item.category === 'SUITE');
    return hasExteriorOrRoom;
}
/**
 * Analyze brand information from chain code and hotel name
 */
function brandInfo(hotel) {
    const chainCode = hotel.chainCode;
    const hotelName = hotel.name.toLowerCase();
    // Check blacklist first
    if (chainCode && constants_1.BLACKLIST_CHAINS.includes(chainCode)) {
        return {
            premium: false,
            boutique: false,
            blacklisted: true,
            chainCode
        };
    }
    // Check blacklist by name
    const isBlacklistedByName = constants_1.BRAND_KEYWORDS.blacklist.some(brand => hotelName.includes(brand));
    if (isBlacklistedByName) {
        return {
            premium: false,
            boutique: false,
            blacklisted: true,
            chainCode
        };
    }
    // Check premium brands
    const isPremiumChain = chainCode && constants_1.PREMIUM_CHAINS.includes(chainCode);
    const isPremiumByName = constants_1.BRAND_KEYWORDS.premium.some(brand => hotelName.includes(brand));
    if (isPremiumChain || isPremiumByName) {
        return {
            premium: true,
            boutique: false,
            blacklisted: false,
            chainCode
        };
    }
    // Check boutique programs
    const isBoutiqueChain = chainCode && constants_1.BOUTIQUE_PROGRAMS.includes(chainCode);
    const isBoutiqueByName = constants_1.BRAND_KEYWORDS.boutique.some(brand => hotelName.includes(brand));
    if (isBoutiqueChain || isBoutiqueByName) {
        return {
            premium: false,
            boutique: true,
            blacklisted: false,
            chainCode
        };
    }
    // Default - independent or unknown chain
    return {
        premium: false,
        boutique: false,
        blacklisted: false,
        chainCode
    };
}
/**
 * Check if hotel has "wow" amenities for quality gate
 */
function hasWowAmenities(hotel, content) {
    const amenities = content.amenities || [];
    const description = content.description?.text?.toLowerCase() || '';
    // Check for wow amenity codes
    const hasWowAmenityCode = amenities.some(amenity => constants_1.WOW_AMENITY_CODES.includes(amenity));
    if (hasWowAmenityCode)
        return true;
    // Check for wow keywords in description
    const wowKeywords = [
        ...constants_1.DESCRIPTION_KEYWORDS.views,
        ...constants_1.DESCRIPTION_KEYWORDS.design,
        ...constants_1.DESCRIPTION_KEYWORDS.luxury,
        ...constants_1.DESCRIPTION_KEYWORDS.romance
    ];
    const hasWowKeyword = wowKeywords.some(keyword => description.includes(keyword));
    return hasWowKeyword;
}
/**
 * Get the best quality photo for hero image
 */
function getHeroPhoto(content) {
    const media = content.media || [];
    if (media.length === 0)
        return null;
    // Prefer EXTERIOR photos first
    const exteriorPhoto = media.find(item => item.category === 'EXTERIOR');
    if (exteriorPhoto)
        return exteriorPhoto.uri;
    // Then ROOM/SUITE photos
    const roomPhoto = media.find(item => item.category === 'ROOM' || item.category === 'SUITE');
    if (roomPhoto)
        return roomPhoto.uri;
    // Then any photo with good dimensions
    const goodPhoto = media.find(item => item.width && item.height && item.width >= 800 && item.height >= 600);
    if (goodPhoto)
        return goodPhoto.uri;
    // Fallback to first photo
    return media[0].uri;
}
/**
 * Extract all photo URLs for the hotel
 */
function getPhotoUrls(content) {
    const media = content.media || [];
    return media.map(item => item.uri).filter(Boolean);
}
/**
 * Check if location is in top inspiration cities
 */
function isInspirationCity(cityName) {
    const city = cityName.toLowerCase();
    return constants_1.DESCRIPTION_KEYWORDS.views.some(inspoCity => city.includes(inspoCity) || inspoCity.includes(city));
}
/**
 * Extract numeric rating from various rating providers
 */
function extractRating(content) {
    if (!content.ratings || content.ratings.length === 0) {
        return null;
    }
    // Prefer TripAdvisor or Google ratings
    const preferredRating = content.ratings.find(r => r.provider.toLowerCase().includes('tripadvisor') ||
        r.provider.toLowerCase().includes('google'));
    if (preferredRating) {
        const rating = parseFloat(preferredRating.rating);
        return isNaN(rating) ? null : rating;
    }
    // Fallback to first available rating
    const firstRating = parseFloat(content.ratings[0].rating);
    return isNaN(firstRating) ? null : firstRating;
}
//# sourceMappingURL=extract.js.map