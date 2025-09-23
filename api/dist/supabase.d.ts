export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface SupabaseHotel {
    id: string;
    name: string;
    city: string;
    country: string;
    coords: {
        lat: number;
        lng: number;
    };
    price: {
        amount: string;
        currency: string;
    };
    description: string;
    amenity_tags: string[];
    photos: string[];
    hero_photo: string;
    booking_url: string;
    rating: number;
    created_at?: string;
    updated_at?: string;
}
export declare class SupabaseService {
    insertHotels(hotels: SupabaseHotel[]): Promise<void>;
    getHotels(limit?: number, offset?: number): Promise<SupabaseHotel[]>;
    getHotelById(id: string): Promise<SupabaseHotel | null>;
    getHotelCount(): Promise<number>;
    clearHotels(): Promise<void>;
    updateHotelCoordinates(id: string, coords: {
        lat: number;
        lng: number;
    }): Promise<void>;
}
//# sourceMappingURL=supabase.d.ts.map