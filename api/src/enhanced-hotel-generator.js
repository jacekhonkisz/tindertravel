"use strict";
// Enhanced Hotel Data Generator
// Generates realistic amenities and longer descriptions based on hotel characteristics
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
exports.enhancedHotelGenerator = exports.EnhancedHotelGenerator = void 0;
var EnhancedHotelGenerator = /** @class */ (function () {
    function EnhancedHotelGenerator() {
    }
    /**
     * Generate comprehensive hotel data based on characteristics
     */
    EnhancedHotelGenerator.prototype.generateEnhancedData = function (characteristics) {
        var category = this.inferCategory(characteristics);
        var location = this.inferLocation(characteristics);
        return {
            amenityTags: this.generateAmenities(category, location, characteristics),
            description: this.generateLongDescription(characteristics, category, location),
            highlights: this.generateHighlights(characteristics, category),
            nearbyAttractions: this.generateNearbyAttractions(characteristics.city, characteristics.country)
        };
    };
    /**
     * Infer hotel category from name and chain code
     */
    EnhancedHotelGenerator.prototype.inferCategory = function (characteristics) {
        var _a;
        var name = characteristics.name.toLowerCase();
        var chainCode = ((_a = characteristics.chainCode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        // Luxury indicators
        if (name.includes('four seasons') || name.includes('ritz') || name.includes('st. regis') ||
            name.includes('mandarin') || name.includes('peninsula') || name.includes('aman') ||
            chainCode === 'fs' || chainCode === 'rc' || chainCode === 'lx') {
            return 'luxury';
        }
        // Boutique indicators
        if (name.includes('boutique') || name.includes('design') || name.includes('collection') ||
            name.includes('autograph') || name.includes('curio')) {
            return 'boutique';
        }
        // Resort indicators
        if (name.includes('resort') || name.includes('spa') || name.includes('beach') ||
            name.includes('island') || name.includes('club')) {
            return 'resort';
        }
        // Business indicators
        if (name.includes('marriott') || name.includes('hilton') || name.includes('hyatt') ||
            name.includes('sheraton') || chainCode === 'mc' || chainCode === 'hi') {
            return 'business';
        }
        // Heritage indicators
        if (name.includes('historic') || name.includes('heritage') || name.includes('palace') ||
            name.includes('grand') || name.includes('royal')) {
            return 'heritage';
        }
        return 'urban';
    };
    /**
     * Infer location type from city and hotel name
     */
    EnhancedHotelGenerator.prototype.inferLocation = function (characteristics) {
        var name = characteristics.name.toLowerCase();
        var city = characteristics.city.toLowerCase();
        if (name.includes('beach') || name.includes('ocean') || name.includes('sea') ||
            name.includes('island') || name.includes('bay')) {
            return 'beachfront';
        }
        if (name.includes('airport') || name.includes('terminal')) {
            return 'airport';
        }
        if (name.includes('mountain') || name.includes('alpine') || name.includes('ski') ||
            city.includes('aspen') || city.includes('zermatt') || city.includes('chamonix')) {
            return 'mountain';
        }
        if (name.includes('park') || name.includes('garden') || name.includes('countryside')) {
            return 'countryside';
        }
        return 'city-center';
    };
    /**
     * Generate realistic amenities based on category and location
     */
    EnhancedHotelGenerator.prototype.generateAmenities = function (category, location, characteristics) {
        var baseAmenities = ['wifi', 'concierge', '24-hour-reception'];
        var categoryAmenities = {
            luxury: ['spa-sanctuary', 'michelin-dining', 'butler-service', 'private-pool', 'wine-cellar', 'golf-course'],
            boutique: ['design-hotel', 'artisan-dining', 'rooftop-bar', 'local-experiences', 'unique-design'],
            business: ['business-center', 'meeting-rooms', 'fitness-center', 'restaurant', 'bar', 'parking'],
            resort: ['multiple-pools', 'spa', 'beach-access', 'water-sports', 'kids-club', 'tennis-court'],
            heritage: ['historic-building', 'heritage-rooms', 'traditional-dining', 'cultural-tours', 'antique-furnishing'],
            urban: ['city-views', 'restaurant', 'fitness-center', 'business-facilities', 'parking']
        };
        var locationAmenities = {
            beachfront: ['private-beach', 'beach-club', 'water-sports', 'sunset-views', 'beach-bar'],
            'city-center': ['city-views', 'shopping-nearby', 'cultural-attractions', 'public-transport'],
            airport: ['airport-shuttle', 'express-checkin', 'business-lounge', 'parking'],
            mountain: ['mountain-views', 'ski-access', 'hiking-trails', 'fireplace', 'alpine-spa'],
            countryside: ['garden-views', 'nature-walks', 'peaceful-setting', 'local-cuisine']
        };
        var chainSpecificAmenities = {
            'mc': ['marriott-rewards', 'executive-lounge', 'premium-bedding'],
            'hi': ['hilton-honors', 'digital-key', 'fitness-center'],
            'hy': ['world-of-hyatt', 'grand-club', 'spa-services'],
            'fs': ['four-seasons-service', 'luxury-spa', 'fine-dining'],
            'rc': ['ritz-carlton-service', 'club-level', 'luxury-amenities']
        };
        var amenities = __spreadArray([], baseAmenities, true);
        // Add category-specific amenities
        if (categoryAmenities[category]) {
            amenities.push.apply(amenities, categoryAmenities[category].slice(0, 4));
        }
        // Add location-specific amenities
        if (locationAmenities[location]) {
            amenities.push.apply(amenities, locationAmenities[location].slice(0, 3));
        }
        // Add chain-specific amenities
        if (characteristics.chainCode && chainSpecificAmenities[characteristics.chainCode.toLowerCase()]) {
            amenities.push.apply(amenities, chainSpecificAmenities[characteristics.chainCode.toLowerCase()].slice(0, 2));
        }
        // Remove duplicates and limit to 8 amenities
        return __spreadArray([], new Set(amenities), true).slice(0, 8);
    };
    /**
     * Generate long, detailed description (2-3x longer than current)
     */
    EnhancedHotelGenerator.prototype.generateLongDescription = function (characteristics, category, location) {
        var name = characteristics.name, city = characteristics.city, country = characteristics.country;
        var introTemplates = {
            luxury: "Experience unparalleled luxury at ".concat(name, ", an exquisite ").concat(category, " hotel nestled in the heart of ").concat(city, ", ").concat(country, "."),
            boutique: "Discover the unique charm of ".concat(name, ", a distinctive ").concat(category, " hotel that captures the essence of ").concat(city, ", ").concat(country, "."),
            business: "".concat(name, " offers sophisticated accommodations and world-class business facilities in ").concat(city, ", ").concat(country, "."),
            resort: "Escape to ".concat(name, ", a stunning ").concat(category, " destination that showcases the natural beauty of ").concat(city, ", ").concat(country, "."),
            heritage: "Step into history at ".concat(name, ", a magnificent ").concat(category, " hotel that preserves the cultural heritage of ").concat(city, ", ").concat(country, "."),
            urban: "".concat(name, " provides contemporary comfort and convenience in the vibrant city of ").concat(city, ", ").concat(country, ".")
        };
        var locationDescriptions = {
            beachfront: "With direct access to pristine beaches and breathtaking ocean views, guests can enjoy water sports, beachside dining, and spectacular sunsets. The hotel's beachfront location offers the perfect blend of relaxation and adventure.",
            'city-center': "Located in the bustling city center, guests have easy access to major attractions, shopping districts, and cultural landmarks. The hotel serves as an ideal base for exploring the rich history and vibrant culture of the area.",
            airport: "Strategically positioned near the airport, this hotel offers unmatched convenience for business and leisure travelers. Despite its proximity to transportation hubs, guests enjoy a peaceful retreat with soundproof rooms and premium amenities.",
            mountain: "Surrounded by majestic mountains and pristine nature, the hotel offers breathtaking alpine views and access to outdoor activities. Guests can enjoy hiking trails, ski slopes, and the tranquil beauty of the mountain landscape.",
            countryside: "Set amidst rolling hills and peaceful countryside, this hotel provides a serene escape from urban life. Guests can explore local vineyards, enjoy farm-to-table dining, and experience the authentic charm of rural hospitality."
        };
        var amenityDescriptions = {
            luxury: "The hotel features world-class amenities including a luxury spa sanctuary, Michelin-starred dining, private pools, and personalized butler service. Every detail has been carefully crafted to exceed the expectations of discerning travelers.",
            boutique: "Thoughtfully designed spaces showcase local artistry and culture, while the hotel's restaurant serves innovative cuisine using locally-sourced ingredients. Each room is uniquely decorated, offering guests an authentic and memorable experience.",
            business: "Professional facilities include state-of-the-art meeting rooms, a fully-equipped business center, and high-speed internet throughout the property. The hotel's executive floors offer additional privacy and exclusive amenities for business travelers.",
            resort: "Resort amenities include multiple swimming pools, a full-service spa, championship golf course, and various recreational activities. Families will appreciate the kids' club and teen programs, while adults can enjoy the adults-only pool area.",
            heritage: "The hotel preserves its historical architecture while offering modern comforts. Guests can dine in restored heritage rooms, explore the hotel's museum, and participate in cultural tours that showcase the property's rich history.",
            urban: "Modern amenities include a rooftop fitness center with city views, contemporary dining options, and flexible meeting spaces. The hotel's design reflects the dynamic energy of the city while providing a comfortable retreat."
        };
        var closingTemplates = {
            luxury: "Whether visiting for business or leisure, ".concat(name, " promises an unforgettable experience where luxury meets exceptional service, creating memories that will last a lifetime."),
            boutique: "At ".concat(name, ", every stay is a unique journey that celebrates local culture, artistic expression, and personalized hospitality in an intimate and stylish setting."),
            business: "".concat(name, " combines professional excellence with comfortable accommodations, ensuring that both business and leisure travelers enjoy a productive and relaxing stay."),
            resort: "From sunrise to sunset, ".concat(name, " offers endless opportunities for relaxation, adventure, and creating cherished memories with family and friends."),
            heritage: "Experience the perfect harmony of historical grandeur and modern luxury at ".concat(name, ", where every guest becomes part of the hotel's continuing story."),
            urban: "".concat(name, " stands as a beacon of contemporary hospitality, offering guests a sophisticated urban experience with easy access to everything the city has to offer.")
        };
        return [
            introTemplates[category] || introTemplates.urban,
            locationDescriptions[location] || locationDescriptions['city-center'],
            amenityDescriptions[category] || amenityDescriptions.urban,
            closingTemplates[category] || closingTemplates.urban
        ].join(' ');
    };
    /**
     * Generate hotel highlights
     */
    EnhancedHotelGenerator.prototype.generateHighlights = function (characteristics, category) {
        var highlights = [];
        if (category === 'luxury') {
            highlights.push('Michelin-starred dining', 'Luxury spa treatments', 'Personalized concierge service');
        }
        else if (category === 'boutique') {
            highlights.push('Unique design elements', 'Local cultural experiences', 'Artisan dining');
        }
        else if (category === 'resort') {
            highlights.push('Multiple pools and water features', 'Championship golf course', 'Full-service spa');
        }
        return highlights;
    };
    /**
     * Generate nearby attractions based on city
     */
    EnhancedHotelGenerator.prototype.generateNearbyAttractions = function (city, country) {
        var cityAttractions = {
            'paris': ['Eiffel Tower', 'Louvre Museum', 'Champs-Élysées', 'Notre-Dame Cathedral'],
            'london': ['Big Ben', 'Tower of London', 'British Museum', 'Buckingham Palace'],
            'rome': ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum'],
            'new york': ['Central Park', 'Times Square', 'Statue of Liberty', 'Empire State Building'],
            'tokyo': ['Senso-ji Temple', 'Tokyo Skytree', 'Imperial Palace', 'Shibuya Crossing']
        };
        return cityAttractions[city.toLowerCase()] || ['City Center', 'Local Museums', 'Shopping District', 'Cultural Sites'];
    };
    return EnhancedHotelGenerator;
}());
exports.EnhancedHotelGenerator = EnhancedHotelGenerator;
// Export singleton instance
exports.enhancedHotelGenerator = new EnhancedHotelGenerator();
