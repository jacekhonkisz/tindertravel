"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePlacesClient = void 0;
var axios_1 = require("axios");
var node_cache_1 = require("node-cache");
var GooglePlacesClient = /** @class */ (function () {
    function GooglePlacesClient() {
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
        // Cache for 24 hours (Google Places data doesn't change often)
        this.cache = new node_cache_1.default({ stdTTL: 86400 });
        this.client = axios_1.default.create({
            timeout: 10000,
        });
    }
    GooglePlacesClient.prototype.checkAccess = function () {
        return this.apiKey !== '';
    };
    /**
     * Search for hotels in a city using Google Places Text Search
     */
    GooglePlacesClient.prototype.searchHotels = function (cityName_1) {
        return __awaiter(this, arguments, void 0, function (cityName, limit) {
            var cacheKey, cached, searchUrl, params, response, hotels, error_1;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.checkAccess()) {
                            console.warn('Google Places API key not configured');
                            return [2 /*return*/, []];
                        }
                        cacheKey = "hotels_".concat(cityName, "_").concat(limit);
                        cached = this.cache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        searchUrl = "".concat(this.baseUrl, "/textsearch/json");
                        params = {
                            query: "hotels in ".concat(cityName),
                            type: 'lodging',
                            key: this.apiKey
                        };
                        return [4 /*yield*/, this.client.get(searchUrl, { params: params })];
                    case 2:
                        response = _a.sent();
                        if (response.data.status === 'OK') {
                            hotels = response.data.results.slice(0, limit).map(function (hotel) { return ({
                                id: hotel.place_id,
                                name: hotel.name,
                                address: hotel.formatted_address,
                                rating: hotel.rating,
                                priceLevel: hotel.price_level,
                                photos: (hotel.photos || []).map(function (photo) { return ({
                                    url: '', // Will be generated when needed
                                    width: 0,
                                    height: 0,
                                    photoReference: photo.photo_reference
                                }); }),
                                location: hotel.geometry.location
                            }); });
                            this.cache.set(cacheKey, hotels);
                            return [2 /*return*/, hotels];
                        }
                        else {
                            console.warn("Google Places search failed: ".concat(response.data.status));
                            return [2 /*return*/, []];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Google Places search error:', error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate high-quality photo URL from Google Places API
     */
    GooglePlacesClient.prototype.generatePhotoUrl = function (photoReference, maxWidth) {
        if (maxWidth === void 0) { maxWidth = 1600; }
        if (!this.checkAccess()) {
            return '';
        }
        // Google Places API supports up to 1600px width for maximum quality
        // Also add maxheight parameter for better aspect ratio control
        return "".concat(this.baseUrl, "/photo?maxwidth=").concat(maxWidth, "&maxheight=1200&photoreference=").concat(photoReference, "&key=").concat(this.apiKey);
    };
    /**
     * Get photo URLs for a specific hotel (enhanced with smart selection)
     */
    GooglePlacesClient.prototype.getHotelPhotoUrls = function (hotel, maxPhotos) {
        var _this = this;
        if (maxPhotos === void 0) { maxPhotos = 6; }
        if (!hotel.photos || hotel.photos.length === 0) {
            return [];
        }
        // Use smart photo selection
        var bestPhotos = this.selectBestPhotos(hotel.photos, maxPhotos);
        return bestPhotos.map(function (photo) { return ({
            url: _this.generatePhotoUrl(photo.photoReference, 1600),
            width: 1600,
            height: 1200,
            photoReference: photo.photoReference
        }); });
    };
    /**
     * Smart photo selection - prioritize high-quality, Instagram-worthy photos
     */
    GooglePlacesClient.prototype.selectBestPhotos = function (photos, maxPhotos) {
        var _this = this;
        if (maxPhotos === void 0) { maxPhotos = 6; }
        if (!photos || photos.length === 0)
            return [];
        // Score each photo based on quality criteria
        var scoredPhotos = photos.map(function (photo) { return (__assign(__assign({}, photo), { score: _this.calculatePhotoScore(photo) })); });
        // Sort by score (highest first) and take the best ones
        return scoredPhotos
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, maxPhotos);
    };
    /**
     * Calculate photo quality score based on various criteria
     */
    GooglePlacesClient.prototype.calculatePhotoScore = function (photo) {
        var score = 0;
        // High resolution bonus (Instagram prefers high-res)
        if (photo.width >= 1600)
            score += 50;
        else if (photo.width >= 1200)
            score += 30;
        else if (photo.width >= 800)
            score += 10;
        // Landscape orientation bonus (better for hotel photos)
        var aspectRatio = photo.width / photo.height;
        if (aspectRatio >= 1.2 && aspectRatio <= 1.8)
            score += 25; // Good landscape ratio
        else if (aspectRatio >= 0.8 && aspectRatio <= 1.2)
            score += 15; // Square-ish
        // Minimum quality threshold
        if (photo.width < 600 || photo.height < 400)
            score -= 100; // Penalize low-res
        // Prefer photos with attributions (often higher quality)
        if (photo.html_attributions && photo.html_attributions.length > 0) {
            score += 10;
        }
        return score;
    };
    /**
     * Analyze photo content to detect Instagram-worthy features
     * This is a placeholder for future AI/ML integration
     */
    GooglePlacesClient.prototype.analyzePhotoContent = function (photoUrl) {
        // TODO: Integrate with Google Vision API or similar service
        // For now, return a basic analysis based on URL patterns
        return Promise.resolve({
            isInstagramWorthy: true, // Default to true for now
            contentType: 'unknown',
            qualityScore: 0.8
        });
    };
    /**
     * Enhanced photo selection with content analysis
     */
    GooglePlacesClient.prototype.selectInstagramPhotos = function (photos_1) {
        return __awaiter(this, arguments, void 0, function (photos, maxPhotos) {
            var qualityFiltered, instagramPriority;
            if (maxPhotos === void 0) { maxPhotos = 6; }
            return __generator(this, function (_a) {
                if (!photos || photos.length === 0)
                    return [2 /*return*/, []];
                qualityFiltered = this.selectBestPhotos(photos, Math.min(photos.length, maxPhotos * 2));
                instagramPriority = qualityFiltered.map(function (photo) {
                    var priority = photo.score || 0;
                    // Instagram prefers certain aspect ratios
                    var aspectRatio = photo.width / photo.height;
                    if (aspectRatio >= 1.0 && aspectRatio <= 1.91) { // Instagram-friendly ratios
                        priority += 20;
                    }
                    // Prioritize larger, high-quality images
                    if (photo.width >= 1080 && photo.height >= 1080) {
                        priority += 15;
                    }
                    return __assign(__assign({}, photo), { instagramPriority: priority });
                });
                return [2 /*return*/, instagramPriority
                        .sort(function (a, b) { return b.instagramPriority - a.instagramPriority; })
                        .slice(0, maxPhotos)];
            });
        });
    };
    /**
     * Validate photo URL accessibility and quality
     */
    GooglePlacesClient.prototype.validatePhotoUrl = function (photoUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response, contentType, contentLength, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.head(photoUrl, {
                                timeout: 3000,
                                validateStatus: function (status) { return status < 500; } // Accept redirects
                            })];
                    case 1:
                        response = _a.sent();
                        contentType = response.headers['content-type'];
                        if (!contentType || !contentType.startsWith('image/')) {
                            return [2 /*return*/, false];
                        }
                        contentLength = parseInt(response.headers['content-length'] || '0');
                        if (contentLength > 0 && contentLength < 10000) { // Less than 10KB is probably too small
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                    case 2:
                        error_2 = _a.sent();
                        console.warn("Photo validation failed for ".concat(photoUrl, ":"), error_2.message);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Filter and validate photos for Instagram quality
     */
    GooglePlacesClient.prototype.getValidatedInstagramPhotos = function (photos_1) {
        return __awaiter(this, arguments, void 0, function (photos, maxPhotos) {
            var instagramPhotos, validatedUrls, _i, instagramPhotos_1, photo, photoUrl, isValid;
            if (maxPhotos === void 0) { maxPhotos = 6; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!photos || photos.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.selectInstagramPhotos(photos, maxPhotos * 2)];
                    case 1:
                        instagramPhotos = _a.sent();
                        validatedUrls = [];
                        _i = 0, instagramPhotos_1 = instagramPhotos;
                        _a.label = 2;
                    case 2:
                        if (!(_i < instagramPhotos_1.length)) return [3 /*break*/, 5];
                        photo = instagramPhotos_1[_i];
                        if (validatedUrls.length >= maxPhotos)
                            return [3 /*break*/, 5];
                        photoUrl = this.generatePhotoUrl(photo.photo_reference, 1600);
                        return [4 /*yield*/, this.validatePhotoUrl(photoUrl)];
                    case 3:
                        isValid = _a.sent();
                        if (isValid) {
                            validatedUrls.push(photoUrl);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, validatedUrls];
                }
            });
        });
    };
    /**
     * Get hotel photos for a city (main method for integration) - ENHANCED
     */
    GooglePlacesClient.prototype.getHotelPhotos = function (cityName_1) {
        return __awaiter(this, arguments, void 0, function (cityName, maxPhotos) {
            var hotels, photoUrls, _i, hotels_1, hotel, instagramPhotos, error_3;
            if (maxPhotos === void 0) { maxPhotos = 6; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.searchHotels(cityName, 5)];
                    case 1:
                        hotels = _a.sent();
                        if (hotels.length === 0) {
                            return [2 /*return*/, []];
                        }
                        photoUrls = [];
                        _i = 0, hotels_1 = hotels;
                        _a.label = 2;
                    case 2:
                        if (!(_i < hotels_1.length)) return [3 /*break*/, 5];
                        hotel = hotels_1[_i];
                        if (photoUrls.length >= maxPhotos)
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getValidatedInstagramPhotos(hotel.photos, 3)];
                    case 3:
                        instagramPhotos = _a.sent();
                        photoUrls.push.apply(// Max 3 Instagram-quality photos per hotel
                        photoUrls, instagramPhotos);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, photoUrls.slice(0, maxPhotos)];
                    case 6:
                        error_3 = _a.sent();
                        console.error("Failed to get Google Places photos for ".concat(cityName, ":"), error_3);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Search for a specific hotel by name and get its photos (enhanced for more photos) - ENHANCED
     */
    GooglePlacesClient.prototype.getSpecificHotelPhotos = function (hotelName_1, cityName_1) {
        return __awaiter(this, arguments, void 0, function (hotelName, cityName, maxPhotos) {
            var cacheKey, cached, allPhotoUrls, searchQueries, _i, searchQueries_1, query, searchUrl, params, response, _a, _b, place, bestPhotos, photoUrls, _c, photoUrls_1, url, detailedPhotos, _d, detailedPhotos_1, url, error_4, error_5;
            var _this = this;
            if (maxPhotos === void 0) { maxPhotos = 8; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.checkAccess()) {
                            return [2 /*return*/, []];
                        }
                        cacheKey = "specific_hotel_".concat(hotelName, "_").concat(cityName, "_").concat(maxPhotos);
                        cached = this.cache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 13, , 14]);
                        allPhotoUrls = [];
                        searchQueries = [
                            "".concat(hotelName, " ").concat(cityName),
                            "".concat(hotelName, " hotel ").concat(cityName),
                            "".concat(hotelName, " luxury hotel ").concat(cityName),
                            "".concat(hotelName, " resort ").concat(cityName)
                        ];
                        _i = 0, searchQueries_1 = searchQueries;
                        _e.label = 2;
                    case 2:
                        if (!(_i < searchQueries_1.length)) return [3 /*break*/, 12];
                        query = searchQueries_1[_i];
                        if (allPhotoUrls.length >= maxPhotos)
                            return [3 /*break*/, 12];
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 10, , 11]);
                        searchUrl = "".concat(this.baseUrl, "/textsearch/json");
                        params = {
                            query: query,
                            type: 'lodging',
                            key: this.apiKey
                        };
                        return [4 /*yield*/, this.client.get(searchUrl, { params: params })];
                    case 4:
                        response = _e.sent();
                        if (!(response.data.status === 'OK' && response.data.results.length > 0)) return [3 /*break*/, 8];
                        _a = 0, _b = response.data.results.slice(0, 3);
                        _e.label = 5;
                    case 5:
                        if (!(_a < _b.length)) return [3 /*break*/, 8];
                        place = _b[_a];
                        if (allPhotoUrls.length >= maxPhotos)
                            return [3 /*break*/, 8];
                        if (!this.isHotelMatch(place.name, hotelName)) return [3 /*break*/, 7];
                        if (place.photos && place.photos.length > 0) {
                            bestPhotos = this.selectBestPhotos(place.photos, 4);
                            photoUrls = bestPhotos.map(function (photo) {
                                return _this.generatePhotoUrl(photo.photo_reference, 1600);
                            });
                            // Add unique photos only
                            for (_c = 0, photoUrls_1 = photoUrls; _c < photoUrls_1.length; _c++) {
                                url = photoUrls_1[_c];
                                if (!allPhotoUrls.includes(url) && allPhotoUrls.length < maxPhotos) {
                                    allPhotoUrls.push(url);
                                }
                            }
                        }
                        if (!place.place_id) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.getPlacePhotos(place.place_id, maxPhotos - allPhotoUrls.length)];
                    case 6:
                        detailedPhotos = _e.sent();
                        for (_d = 0, detailedPhotos_1 = detailedPhotos; _d < detailedPhotos_1.length; _d++) {
                            url = detailedPhotos_1[_d];
                            if (!allPhotoUrls.includes(url) && allPhotoUrls.length < maxPhotos) {
                                allPhotoUrls.push(url);
                            }
                        }
                        _e.label = 7;
                    case 7:
                        _a++;
                        return [3 /*break*/, 5];
                    case 8: 
                    // Small delay between requests to respect rate limits
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 9:
                        // Small delay between requests to respect rate limits
                        _e.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        error_4 = _e.sent();
                        console.warn("Failed search query \"".concat(query, "\":"), error_4.message);
                        return [3 /*break*/, 11];
                    case 11:
                        _i++;
                        return [3 /*break*/, 2];
                    case 12:
                        // Cache the results
                        this.cache.set(cacheKey, allPhotoUrls);
                        return [2 /*return*/, allPhotoUrls];
                    case 13:
                        error_5 = _e.sent();
                        console.error("Failed to get photos for ".concat(hotelName, ":"), error_5);
                        return [2 /*return*/, []];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a place name matches the target hotel name
     */
    GooglePlacesClient.prototype.isHotelMatch = function (placeName, targetName) {
        var normalize = function (str) { return str.toLowerCase().replace(/[^a-z0-9]/g, ''); };
        var normalizedPlace = normalize(placeName);
        var normalizedTarget = normalize(targetName);
        // Check if they share significant common words
        var placeWords = normalizedPlace.split(/\s+/).filter(function (w) { return w.length > 2; });
        var targetWords = normalizedTarget.split(/\s+/).filter(function (w) { return w.length > 2; });
        var commonWords = placeWords.filter(function (word) { return targetWords.includes(word); });
        return commonWords.length >= Math.min(2, Math.floor(targetWords.length / 2));
    };
    /**
     * Get photos for a specific place ID
     */
    GooglePlacesClient.prototype.getPlacePhotos = function (placeId, maxPhotos) {
        return __awaiter(this, void 0, void 0, function () {
            var detailsUrl, params, response, error_6;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        detailsUrl = "".concat(this.baseUrl, "/details/json");
                        params = {
                            place_id: placeId,
                            fields: 'photos',
                            key: this.apiKey
                        };
                        return [4 /*yield*/, this.client.get(detailsUrl, { params: params })];
                    case 1:
                        response = _b.sent();
                        if (response.data.status === 'OK' && ((_a = response.data.result) === null || _a === void 0 ? void 0 : _a.photos)) {
                            return [2 /*return*/, response.data.result.photos.slice(0, maxPhotos).map(function (photo) {
                                    return _this.generatePhotoUrl(photo.photo_reference, 1600);
                                })];
                        }
                        return [2 /*return*/, []];
                    case 2:
                        error_6 = _b.sent();
                        console.warn("Failed to get place photos for ".concat(placeId, ":"), error_6.message);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get hotel details including photos by place ID
     */
    GooglePlacesClient.prototype.getHotelDetails = function (placeId) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, detailsUrl, params, response, result, hotel, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.checkAccess()) {
                            return [2 /*return*/, null];
                        }
                        cacheKey = "hotel_details_".concat(placeId);
                        cached = this.cache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        detailsUrl = "".concat(this.baseUrl, "/details/json");
                        params = {
                            place_id: placeId,
                            fields: 'name,formatted_address,rating,price_level,photos,geometry',
                            key: this.apiKey
                        };
                        return [4 /*yield*/, this.client.get(detailsUrl, { params: params })];
                    case 2:
                        response = _a.sent();
                        if (response.data.status === 'OK') {
                            result = response.data.result;
                            hotel = {
                                id: placeId,
                                name: result.name,
                                address: result.formatted_address,
                                rating: result.rating,
                                priceLevel: result.price_level,
                                photos: (result.photos || []).map(function (photo) { return ({
                                    url: _this.generatePhotoUrl(photo.photo_reference, 1600),
                                    width: 1600,
                                    height: 1200,
                                    photoReference: photo.photo_reference
                                }); }),
                                location: result.geometry.location
                            };
                            this.cache.set(cacheKey, hotel);
                            return [2 /*return*/, hotel];
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_7 = _a.sent();
                        console.error("Failed to get hotel details for ".concat(placeId, ":"), error_7);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GooglePlacesClient;
}());
exports.GooglePlacesClient = GooglePlacesClient;
