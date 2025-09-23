"use strict";
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
exports.HotellookClient = void 0;
var axios_1 = require("axios");
var node_cache_1 = require("node-cache");
var crypto = require("crypto-js");
var API_URL = 'http://engine.hotellook.com/api/v2/';
var HotellookClient = /** @class */ (function () {
    function HotellookClient() {
        this.token = process.env.HOTELLOOK_TOKEN || '';
        this.marker = parseInt(process.env.HOTELLOOK_MARKER || '0');
        // Cache for 1 hour
        this.cache = new node_cache_1.default({ stdTTL: 3600 });
        this.client = axios_1.default.create({
            baseURL: API_URL,
            timeout: 10000,
        });
    }
    HotellookClient.prototype.withSignature = function (params) {
        if (params === void 0) { params = {}; }
        var keys = Object.keys(params).sort();
        var src = "".concat(this.token, ":").concat(this.marker);
        var urlParams = new URLSearchParams();
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            src += ":".concat(params[key]);
            urlParams.append(key, params[key]);
        }
        var signature = crypto.MD5(src).toString();
        urlParams.append('marker', this.marker.toString());
        urlParams.append('signature', signature);
        return urlParams.toString();
    };
    HotellookClient.prototype.checkAccess = function () {
        return this.token !== '' && this.marker !== 0;
    };
    HotellookClient.prototype.lookup = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, params, response, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "lookup_".concat(req.query, "_").concat(req.lang || 'en');
                        cached = this.cache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        params = new URLSearchParams();
                        params.append('query', req.query);
                        params.append('lang', req.lang || 'en');
                        params.append('lookFor', req.lookFor || 'both');
                        if (req.limit)
                            params.append('limit', req.limit.toString());
                        if (req.convertCase)
                            params.append('convertCase', req.convertCase.toString());
                        return [4 /*yield*/, this.client.get("lookup.json?".concat(params.toString()))];
                    case 2:
                        response = _a.sent();
                        result = response.data;
                        this.cache.set(cacheKey, result);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Hotellook lookup failed:', error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    HotellookClient.prototype.fetchHotelList = function (locationId) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, params, response, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.checkAccess()) {
                            console.error('Hotellook: Invalid token or marker');
                            return [2 /*return*/, null];
                        }
                        cacheKey = "hotels_".concat(locationId);
                        cached = this.cache.get(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        params = { locationId: locationId };
                        return [4 /*yield*/, this.client.get("static/hotels.json?".concat(this.withSignature(params)))];
                    case 2:
                        response = _a.sent();
                        result = response.data;
                        this.cache.set(cacheKey, result);
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Hotellook hotel list failed:', error_2);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    HotellookClient.prototype.generatePhotoLink = function (hotelId, photoId, size) {
        if (size === void 0) { size = '640x480'; }
        return "https://photo.hotellook.com/image_v2/limit/h".concat(hotelId, "_").concat(photoId, "/").concat(size, ".jpg");
    };
    /**
     * Generate Agoda photo URL for a hotel
     * @param hotelId - The hotel ID
     * @param photoId - Photo number (1, 2, 3, etc.)
     * @param subdomain - CDN subdomain (pix1-pix10)
     * @returns Agoda photo URL
     */
    HotellookClient.prototype.generateAgodaPhotoUrl = function (hotelId, photoId, subdomain) {
        if (photoId === void 0) { photoId = 1; }
        if (subdomain === void 0) { subdomain = 'pix10'; }
        return "https://".concat(subdomain, ".agoda.net/hotelImages/").concat(hotelId, "/-1/").concat(photoId, ".jpg");
    };
    /**
     * Get multiple photo URLs for a hotel using Agoda CDN
     * @param hotelId - The hotel ID
     * @param maxPhotos - Maximum number of photos to return
     * @returns Array of photo URLs
     */
    HotellookClient.prototype.getHotelPhotosByAgoda = function (hotelId_1) {
        return __awaiter(this, arguments, void 0, function (hotelId, maxPhotos) {
            var photos, subdomains, photoId, _i, subdomains_1, subdomain, photoUrl, response, contentType, error_3, error_4;
            if (maxPhotos === void 0) { maxPhotos = 6; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        photos = [];
                        subdomains = ['pix10', 'pix1', 'pix2', 'pix3', 'pix4', 'pix5'];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        photoId = 1;
                        _a.label = 2;
                    case 2:
                        if (!(photoId <= 3 && photos.length < maxPhotos)) return [3 /*break*/, 9];
                        _i = 0, subdomains_1 = subdomains;
                        _a.label = 3;
                    case 3:
                        if (!(_i < subdomains_1.length)) return [3 /*break*/, 8];
                        subdomain = subdomains_1[_i];
                        if (photos.length >= maxPhotos)
                            return [3 /*break*/, 8];
                        photoUrl = this.generateAgodaPhotoUrl(hotelId, photoId, subdomain);
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, axios_1.default.head(photoUrl, {
                                timeout: 2000,
                                validateStatus: function (status) { return status < 500; }
                            })];
                    case 5:
                        response = _a.sent();
                        if (response.status === 200) {
                            contentType = response.headers['content-type'] || '';
                            if (contentType.startsWith('image/')) {
                                photos.push(photoUrl);
                                return [3 /*break*/, 8]; // Found photo for this photoId, try next photoId
                            }
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        // Photo doesn't exist, continue to next subdomain
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        photoId++;
                        return [3 /*break*/, 2];
                    case 9: return [2 /*return*/, photos];
                    case 10:
                        error_4 = _a.sent();
                        console.error("Failed to get Agoda photos for hotel ".concat(hotelId, ":"), error_4);
                        return [2 /*return*/, []];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    HotellookClient.prototype.getHotelPhotos = function (cityName) {
        return __awaiter(this, void 0, void 0, function () {
            var lookupResult, hotels, photosUrls, _i, hotels_1, hotel, hotelPhotos, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.lookup({
                                query: cityName,
                                lang: 'en',
                                lookFor: 'both', // Look for both locations and hotels
                                limit: 20
                            })];
                    case 1:
                        lookupResult = _a.sent();
                        if (!lookupResult || (!lookupResult.results.hotels || lookupResult.results.hotels.length === 0)) {
                            console.warn("No hotels found for city: ".concat(cityName));
                            return [2 /*return*/, []];
                        }
                        hotels = lookupResult.results.hotels.slice(0, 10);
                        photosUrls = [];
                        _i = 0, hotels_1 = hotels;
                        _a.label = 2;
                    case 2:
                        if (!(_i < hotels_1.length)) return [3 /*break*/, 5];
                        hotel = hotels_1[_i];
                        if (photosUrls.length >= 6)
                            return [3 /*break*/, 5]; // Limit total photos
                        return [4 /*yield*/, this.getHotelPhotosByAgoda(hotel.id, 2)];
                    case 3:
                        hotelPhotos = _a.sent();
                        photosUrls.push.apply(// Max 2 photos per hotel
                        photosUrls, hotelPhotos);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, photosUrls.slice(0, 6)]; // Return max 6 photos
                    case 6:
                        error_5 = _a.sent();
                        console.error("Failed to get photos for ".concat(cityName, ":"), error_5);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return HotellookClient;
}());
exports.HotellookClient = HotellookClient;
