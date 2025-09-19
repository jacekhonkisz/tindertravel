"use strict";
// Photo Validator - Ensure High-Quality Images Only
// Validates photo resolution and quality for hotel images
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoValidator = void 0;
const axios_1 = __importDefault(require("axios"));
class PhotoValidator {
    /**
     * Validate a single photo URL for resolution and quality
     */
    static async validatePhoto(photoUrl) {
        try {
            // Get image metadata without downloading the full image
            const response = await axios_1.default.head(photoUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            const contentLength = parseInt(response.headers['content-length'] || '0');
            const contentType = response.headers['content-type'] || '';
            // Check if it's actually an image
            if (!contentType.startsWith('image/')) {
                return {
                    isValid: false,
                    width: 0,
                    height: 0,
                    size: contentLength,
                    quality: 'invalid',
                    reason: 'Not an image file'
                };
            }
            // For Google Photos, we can extract dimensions from URL parameters
            const dimensions = this.extractDimensionsFromUrl(photoUrl);
            if (dimensions) {
                return this.evaluatePhotoQuality(dimensions.width, dimensions.height, contentLength);
            }
            // If we can't get dimensions from URL, download a small portion to check
            const imageInfo = await this.getImageDimensions(photoUrl);
            return this.evaluatePhotoQuality(imageInfo.width, imageInfo.height, contentLength);
        }
        catch (error) {
            console.error(`Failed to validate photo ${photoUrl}:`, error);
            return {
                isValid: false,
                width: 0,
                height: 0,
                size: 0,
                quality: 'invalid',
                reason: 'Failed to load image'
            };
        }
    }
    /**
     * Extract dimensions from Google Photos URL parameters
     */
    static extractDimensionsFromUrl(url) {
        try {
            // Google Photos URLs often contain size parameters like =w1920-h1080
            const sizeMatch = url.match(/=w(\d+)-h(\d+)/);
            if (sizeMatch) {
                return {
                    width: parseInt(sizeMatch[1]),
                    height: parseInt(sizeMatch[2])
                };
            }
            // Alternative format: =s1920 (square) or other patterns
            const squareMatch = url.match(/=s(\d+)/);
            if (squareMatch) {
                const size = parseInt(squareMatch[1]);
                return { width: size, height: size };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get image dimensions by downloading minimal data
     */
    static async getImageDimensions(url) {
        try {
            // Download first 2KB to get image headers
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'Range': 'bytes=0-2048',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            const buffer = Buffer.from(response.data);
            // Parse JPEG dimensions
            if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                return this.parseJPEGDimensions(buffer);
            }
            // Parse PNG dimensions
            if (buffer.toString('ascii', 1, 4) === 'PNG') {
                return this.parsePNGDimensions(buffer);
            }
            // Parse WebP dimensions
            if (buffer.toString('ascii', 8, 12) === 'WEBP') {
                return this.parseWebPDimensions(buffer);
            }
            throw new Error('Unsupported image format');
        }
        catch (error) {
            console.error('Failed to get image dimensions:', error);
            return { width: 0, height: 0 };
        }
    }
    /**
     * Parse JPEG image dimensions from buffer
     */
    static parseJPEGDimensions(buffer) {
        let offset = 2;
        while (offset < buffer.length) {
            if (buffer[offset] === 0xFF) {
                const marker = buffer[offset + 1];
                // SOF0, SOF1, SOF2 markers contain dimensions
                if (marker >= 0xC0 && marker <= 0xC3) {
                    const height = buffer.readUInt16BE(offset + 5);
                    const width = buffer.readUInt16BE(offset + 7);
                    return { width, height };
                }
                // Skip to next marker
                const length = buffer.readUInt16BE(offset + 2);
                offset += 2 + length;
            }
            else {
                offset++;
            }
        }
        return { width: 0, height: 0 };
    }
    /**
     * Parse PNG image dimensions from buffer
     */
    static parsePNGDimensions(buffer) {
        if (buffer.length < 24)
            return { width: 0, height: 0 };
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
    }
    /**
     * Parse WebP image dimensions from buffer
     */
    static parseWebPDimensions(buffer) {
        if (buffer.length < 30)
            return { width: 0, height: 0 };
        // WebP VP8 format
        if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
            const width = buffer.readUInt16LE(26) & 0x3FFF;
            const height = buffer.readUInt16LE(28) & 0x3FFF;
            return { width, height };
        }
        return { width: 0, height: 0 };
    }
    /**
     * Evaluate photo quality based on dimensions and size
     */
    static evaluatePhotoQuality(width, height, size) {
        const pixels = width * height;
        // Check minimum requirements
        if (width < this.MIN_WIDTH || height < this.MIN_HEIGHT || pixels < this.MIN_PIXELS) {
            return {
                isValid: false,
                width,
                height,
                size,
                quality: 'poor',
                reason: `Resolution too low: ${width}x${height} (minimum: ${this.MIN_WIDTH}x${this.MIN_HEIGHT})`
            };
        }
        // Determine quality level
        let quality = 'good';
        if (pixels >= this.EXCELLENT_PIXELS && width >= this.EXCELLENT_WIDTH && height >= this.EXCELLENT_HEIGHT) {
            quality = 'excellent';
        }
        // Additional quality checks
        const aspectRatio = width / height;
        if (aspectRatio < 0.5 || aspectRatio > 3.0) {
            return {
                isValid: false,
                width,
                height,
                size,
                quality: 'poor',
                reason: `Invalid aspect ratio: ${aspectRatio.toFixed(2)}`
            };
        }
        // Check file size (too small might indicate low quality)
        const bytesPerPixel = size / pixels;
        if (bytesPerPixel < 0.1) {
            return {
                isValid: false,
                width,
                height,
                size,
                quality: 'poor',
                reason: 'File size too small for resolution (likely over-compressed)'
            };
        }
        return {
            isValid: true,
            width,
            height,
            size,
            quality
        };
    }
    /**
     * Validate multiple photos and return only high-quality ones
     */
    static async validatePhotos(photoUrls) {
        console.log(`🔍 Validating ${photoUrls.length} photos for quality...`);
        const validatedPhotos = [];
        const validationPromises = photoUrls.map(async (url, index) => {
            const result = await this.validatePhoto(url);
            if (result.isValid) {
                const category = this.categorizePhoto(url, index);
                validatedPhotos.push({
                    url,
                    width: result.width,
                    height: result.height,
                    size: result.size,
                    quality: result.quality,
                    category
                });
                console.log(`✅ Photo ${index + 1}: ${result.width}x${result.height} (${result.quality})`);
            }
            else {
                console.log(`❌ Photo ${index + 1}: ${result.reason}`);
            }
        });
        await Promise.all(validationPromises);
        // Sort by quality (excellent first) and resolution
        validatedPhotos.sort((a, b) => {
            if (a.quality !== b.quality) {
                return a.quality === 'excellent' ? -1 : 1;
            }
            return (b.width * b.height) - (a.width * a.height);
        });
        console.log(`📊 Validation complete: ${validatedPhotos.length}/${photoUrls.length} photos passed quality check`);
        return validatedPhotos;
    }
    /**
     * Categorize photo based on URL and position
     */
    static categorizePhoto(url, index) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('exterior') || urlLower.includes('facade') || urlLower.includes('building')) {
            return 'exterior';
        }
        if (urlLower.includes('room') || urlLower.includes('bedroom') || urlLower.includes('suite')) {
            return 'room';
        }
        if (urlLower.includes('pool') || urlLower.includes('spa') || urlLower.includes('gym') || urlLower.includes('restaurant')) {
            return 'amenity';
        }
        if (urlLower.includes('view') || urlLower.includes('balcony') || urlLower.includes('terrace')) {
            return 'view';
        }
        // Default categorization based on position
        if (index === 0)
            return 'exterior';
        if (index === 1)
            return 'room';
        if (index >= 2)
            return 'amenity';
        return 'interior';
    }
    /**
     * Optimize Google Photos URL for maximum quality
     */
    static optimizePhotoUrl(originalUrl, targetWidth = 1920, targetHeight = 1080) {
        try {
            // Remove existing size parameters
            let optimizedUrl = originalUrl.replace(/=w\d+-h\d+/g, '');
            optimizedUrl = optimizedUrl.replace(/=s\d+/g, '');
            optimizedUrl = optimizedUrl.replace(/=w\d+/g, '');
            optimizedUrl = optimizedUrl.replace(/=h\d+/g, '');
            // Add high-quality parameters
            const separator = optimizedUrl.includes('?') ? '&' : '?';
            optimizedUrl += `${separator}w=${targetWidth}&h=${targetHeight}&c`;
            return optimizedUrl;
        }
        catch (error) {
            console.error('Failed to optimize photo URL:', error);
            return originalUrl;
        }
    }
    /**
     * Check if we have enough high-quality photos for a hotel
     */
    static hasEnoughQualityPhotos(validatedPhotos, minimumCount = 4) {
        return validatedPhotos.length >= minimumCount;
    }
    /**
     * Get photo quality summary
     */
    static getPhotoQualitySummary(validatedPhotos) {
        const excellent = validatedPhotos.filter(p => p.quality === 'excellent').length;
        const good = validatedPhotos.filter(p => p.quality === 'good').length;
        const totalPixels = validatedPhotos.reduce((sum, p) => sum + (p.width * p.height), 0);
        const avgPixels = totalPixels / validatedPhotos.length;
        const avgWidth = Math.sqrt(avgPixels * (16 / 9)); // Assume 16:9 aspect ratio
        const avgHeight = avgPixels / avgWidth;
        const categories = {};
        validatedPhotos.forEach(photo => {
            categories[photo.category] = (categories[photo.category] || 0) + 1;
        });
        return {
            total: validatedPhotos.length,
            excellent,
            good,
            averageResolution: `${Math.round(avgWidth)}x${Math.round(avgHeight)}`,
            categories
        };
    }
}
exports.PhotoValidator = PhotoValidator;
// Minimum resolution requirements
PhotoValidator.MIN_WIDTH = 1200;
PhotoValidator.MIN_HEIGHT = 800;
PhotoValidator.MIN_PIXELS = PhotoValidator.MIN_WIDTH * PhotoValidator.MIN_HEIGHT;
// Preferred resolution thresholds
PhotoValidator.EXCELLENT_WIDTH = 1920;
PhotoValidator.EXCELLENT_HEIGHT = 1080;
PhotoValidator.EXCELLENT_PIXELS = PhotoValidator.EXCELLENT_WIDTH * PhotoValidator.EXCELLENT_HEIGHT;
//# sourceMappingURL=photo-validator.js.map