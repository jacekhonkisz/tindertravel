interface PhotoValidationResult {
    isValid: boolean;
    width: number;
    height: number;
    size: number;
    quality: 'excellent' | 'good' | 'poor' | 'invalid';
    reason?: string;
}
interface ValidatedPhoto {
    url: string;
    width: number;
    height: number;
    size: number;
    quality: 'excellent' | 'good';
    category: 'exterior' | 'interior' | 'amenity' | 'view' | 'room';
}
export declare class PhotoValidator {
    private static readonly MIN_WIDTH;
    private static readonly MIN_HEIGHT;
    private static readonly MIN_PIXELS;
    private static readonly EXCELLENT_WIDTH;
    private static readonly EXCELLENT_HEIGHT;
    private static readonly EXCELLENT_PIXELS;
    /**
     * Validate a single photo URL for resolution and quality
     */
    static validatePhoto(photoUrl: string): Promise<PhotoValidationResult>;
    /**
     * Extract dimensions from Google Photos URL parameters
     */
    private static extractDimensionsFromUrl;
    /**
     * Get image dimensions by downloading minimal data
     */
    private static getImageDimensions;
    /**
     * Parse JPEG image dimensions from buffer
     */
    private static parseJPEGDimensions;
    /**
     * Parse PNG image dimensions from buffer
     */
    private static parsePNGDimensions;
    /**
     * Parse WebP image dimensions from buffer
     */
    private static parseWebPDimensions;
    /**
     * Evaluate photo quality based on dimensions and size
     */
    private static evaluatePhotoQuality;
    /**
     * Validate multiple photos and return only high-quality ones
     */
    static validatePhotos(photoUrls: string[]): Promise<ValidatedPhoto[]>;
    /**
     * Categorize photo based on URL and position
     */
    private static categorizePhoto;
    /**
     * Optimize Google Photos URL for maximum quality
     */
    static optimizePhotoUrl(originalUrl: string, targetWidth?: number, targetHeight?: number): string;
    /**
     * Check if we have enough high-quality photos for a hotel
     */
    static hasEnoughQualityPhotos(validatedPhotos: ValidatedPhoto[], minimumCount?: number): boolean;
    /**
     * Get photo quality summary
     */
    static getPhotoQualitySummary(validatedPhotos: ValidatedPhoto[]): {
        total: number;
        excellent: number;
        good: number;
        averageResolution: string;
        categories: Record<string, number>;
    };
}
export { ValidatedPhoto, PhotoValidationResult };
//# sourceMappingURL=photo-validator.d.ts.map