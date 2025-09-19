import { HotelCard, PersonalizationData } from './types';
export declare class DatabaseService {
    private supabase;
    constructor();
    initializeTables(): Promise<void>;
    storeHotels(hotels: HotelCard[]): Promise<void>;
    getHotels(params?: {
        limit?: number;
        offset?: number;
        excludeIds?: string[];
    }): Promise<{
        hotels: HotelCard[];
        total: number;
        hasMore: boolean;
    }>;
    getHotelById(id: string): Promise<HotelCard | null>;
    storePersonalization(userId: string, data: PersonalizationData): Promise<void>;
    getPersonalization(userId: string): Promise<PersonalizationData | null>;
    isSeeded(): Promise<boolean>;
    private createTablesManually;
}
export default DatabaseService;
//# sourceMappingURL=database.d.ts.map