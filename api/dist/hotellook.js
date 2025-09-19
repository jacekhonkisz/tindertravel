"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotellookClient = void 0;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const crypto = __importStar(require("crypto-js"));
const API_URL = 'http://engine.hotellook.com/api/v2/';
class HotellookClient {
    constructor() {
        this.token = process.env.HOTELLOOK_TOKEN || '';
        this.marker = parseInt(process.env.HOTELLOOK_MARKER || '0');
        // Cache for 1 hour
        this.cache = new node_cache_1.default({ stdTTL: 3600 });
        this.client = axios_1.default.create({
            baseURL: API_URL,
            timeout: 10000,
        });
    }
    withSignature(params = {}) {
        const keys = Object.keys(params).sort();
        let src = `${this.token}:${this.marker}`;
        const urlParams = new URLSearchParams();
        for (const key of keys) {
            src += `:${params[key]}`;
            urlParams.append(key, params[key]);
        }
        const signature = crypto.MD5(src).toString();
        urlParams.append('marker', this.marker.toString());
        urlParams.append('signature', signature);
        return urlParams.toString();
    }
    checkAccess() {
        return this.token !== '' && this.marker !== 0;
    }
    async lookup(req) {
        const cacheKey = `lookup_${req.query}_${req.lang || 'en'}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const params = new URLSearchParams();
            params.append('query', req.query);
            params.append('lang', req.lang || 'en');
            params.append('lookFor', req.lookFor || 'both');
            if (req.limit)
                params.append('limit', req.limit.toString());
            if (req.convertCase)
                params.append('convertCase', req.convertCase.toString());
            const response = await this.client.get(`lookup.json?${params.toString()}`);
            const result = response.data;
            this.cache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('Hotellook lookup failed:', error);
            return null;
        }
    }
    async fetchHotelList(locationId) {
        if (!this.checkAccess()) {
            console.error('Hotellook: Invalid token or marker');
            return null;
        }
        const cacheKey = `hotels_${locationId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const params = { locationId };
            const response = await this.client.get(`static/hotels.json?${this.withSignature(params)}`);
            const result = response.data;
            this.cache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('Hotellook hotel list failed:', error);
            return null;
        }
    }
    generatePhotoLink(hotelId, photoId, size = '640x480') {
        return `https://photo.hotellook.com/image_v2/limit/h${hotelId}_${photoId}/${size}.jpg`;
    }
    /**
     * Generate Agoda photo URL for a hotel
     * @param hotelId - The hotel ID
     * @param photoId - Photo number (1, 2, 3, etc.)
     * @param subdomain - CDN subdomain (pix1-pix10)
     * @returns Agoda photo URL
     */
    generateAgodaPhotoUrl(hotelId, photoId = 1, subdomain = 'pix10') {
        return `https://${subdomain}.agoda.net/hotelImages/${hotelId}/-1/${photoId}.jpg`;
    }
    /**
     * Get multiple photo URLs for a hotel using Agoda CDN
     * @param hotelId - The hotel ID
     * @param maxPhotos - Maximum number of photos to return
     * @returns Array of photo URLs
     */
    async getHotelPhotosByAgoda(hotelId, maxPhotos = 6) {
        const photos = [];
        const subdomains = ['pix10', 'pix1', 'pix2', 'pix3', 'pix4', 'pix5'];
        try {
            // Try different photo IDs (1, 2, 3) and subdomains
            for (let photoId = 1; photoId <= 3 && photos.length < maxPhotos; photoId++) {
                for (const subdomain of subdomains) {
                    if (photos.length >= maxPhotos)
                        break;
                    const photoUrl = this.generateAgodaPhotoUrl(hotelId, photoId, subdomain);
                    try {
                        // Quick check if photo exists
                        const response = await axios_1.default.head(photoUrl, {
                            timeout: 2000,
                            validateStatus: (status) => status < 500
                        });
                        if (response.status === 200) {
                            const contentType = response.headers['content-type'] || '';
                            if (contentType.startsWith('image/')) {
                                photos.push(photoUrl);
                                break; // Found photo for this photoId, try next photoId
                            }
                        }
                    }
                    catch (error) {
                        // Photo doesn't exist, continue to next subdomain
                        continue;
                    }
                }
            }
            return photos;
        }
        catch (error) {
            console.error(`Failed to get Agoda photos for hotel ${hotelId}:`, error);
            return [];
        }
    }
    async getHotelPhotos(cityName) {
        try {
            // First, lookup the city to get hotels
            const lookupResult = await this.lookup({
                query: cityName,
                lang: 'en',
                lookFor: 'both', // Look for both locations and hotels
                limit: 20
            });
            if (!lookupResult || (!lookupResult.results.hotels || lookupResult.results.hotels.length === 0)) {
                console.warn(`No hotels found for city: ${cityName}`);
                return [];
            }
            // Get hotel IDs from lookup results
            const hotels = lookupResult.results.hotels.slice(0, 10); // Take top 10 hotels
            const photosUrls = [];
            // Use Agoda photo URLs for each hotel
            for (const hotel of hotels) {
                if (photosUrls.length >= 6)
                    break; // Limit total photos
                const hotelPhotos = await this.getHotelPhotosByAgoda(hotel.id, 2); // Max 2 photos per hotel
                photosUrls.push(...hotelPhotos);
            }
            return photosUrls.slice(0, 6); // Return max 6 photos
        }
        catch (error) {
            console.error(`Failed to get photos for ${cityName}:`, error);
            return [];
        }
    }
}
exports.HotellookClient = HotellookClient;
//# sourceMappingURL=hotellook.js.map