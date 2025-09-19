export interface HotellookPhoto {
    url: string;
    width: number;
    height: number;
}
export interface HotellookHotel {
    id: number;
    cityId: number;
    stars: number;
    priceFrom: number;
    rating: number;
    popularity: number;
    propertyType: number;
    checkIn: string;
    checkOut: string;
    distance: number;
    yearOpened: number;
    yearRenovated: number;
    photoCount: number;
    photos: HotellookPhoto[];
    facilities: number[];
    shortFacilities: string[];
    location: {
        lat: number;
        lon: number;
    };
    name: {
        en: string;
        ru?: string;
    };
    cntFloors: number;
    cntRooms: number;
    address: {
        en: string;
        ru?: string;
    };
    link: string;
}
export interface HotellookHotelList {
    gen_timestamp: number;
    hotels: HotellookHotel[];
}
export interface HotellookLookupRequest {
    query: string;
    lang?: string;
    lookFor?: string;
    limit?: number;
    convertCase?: number;
}
export interface HotellookLookupResponse {
    status: string;
    results: {
        locations: Array<{
            cityName: string;
            fullName: string;
            countryCode?: string;
            countryName?: string;
            iata: string[];
            id: string;
            hotelsCount: string;
            location: {
                lat: string;
                lon: string;
            };
            _score?: number;
        }>;
        hotels: Array<{
            id: number | string;
            fullName: string;
            locationName: string;
            label: string;
            locationId: number;
            location: {
                lat: number;
                lon: number;
            };
            _score: number;
        }>;
    };
}
export declare class HotellookClient {
    private client;
    private cache;
    private token;
    private marker;
    constructor();
    private withSignature;
    private checkAccess;
    lookup(req: HotellookLookupRequest): Promise<HotellookLookupResponse | null>;
    fetchHotelList(locationId: string): Promise<HotellookHotelList | null>;
    generatePhotoLink(hotelId: number, photoId: number, size?: string): string;
    /**
     * Generate Agoda photo URL for a hotel
     * @param hotelId - The hotel ID
     * @param photoId - Photo number (1, 2, 3, etc.)
     * @param subdomain - CDN subdomain (pix1-pix10)
     * @returns Agoda photo URL
     */
    generateAgodaPhotoUrl(hotelId: number, photoId?: number, subdomain?: string): string;
    /**
     * Get multiple photo URLs for a hotel using Agoda CDN
     * @param hotelId - The hotel ID
     * @param maxPhotos - Maximum number of photos to return
     * @returns Array of photo URLs
     */
    getHotelPhotosByAgoda(hotelId: number, maxPhotos?: number): Promise<string[]>;
    getHotelPhotos(cityName: string): Promise<string[]>;
}
//# sourceMappingURL=hotellook.d.ts.map