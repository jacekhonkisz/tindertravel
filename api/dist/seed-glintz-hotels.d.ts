declare function seedGlintzHotels(): Promise<{
    name: string;
    city: string;
    country: string;
    score: number;
    tags: string[];
    photoCount: number;
}[]>;
export declare const PHOTO_QUALITY_REQUIREMENTS: {
    minPhotos: number;
    maxPhotos: number;
    minWidth: number;
    minHeight: number;
    preferredTypes: string[];
    aspectRatios: {
        landscape: {
            min: number;
            max: number;
        };
        portrait: {
            min: number;
            max: number;
        };
    };
};
export { seedGlintzHotels };
//# sourceMappingURL=seed-glintz-hotels.d.ts.map