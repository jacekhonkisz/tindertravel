import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HotelCard, PersonalizationData } from './types';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not provided. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Initialize database tables
  async initializeTables(): Promise<void> {
    try {
      // Create hotels table if it doesn't exist
      const { error: hotelError } = await this.supabase.rpc('create_hotels_table_if_not_exists');
      if (hotelError && !hotelError.message.includes('already exists')) {
        console.warn('Hotels table creation warning:', hotelError.message);
      }

      // Create user_preferences table if it doesn't exist
      const { error: prefError } = await this.supabase.rpc('create_user_preferences_table_if_not_exists');
      if (prefError && !prefError.message.includes('already exists')) {
        console.warn('User preferences table creation warning:', prefError.message);
      }

      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
      // Don't throw - let the app continue with basic functionality
    }
  }

  // Store hotels in Supabase
  async storeHotels(hotels: HotelCard[]): Promise<void> {
    try {
      // First, let's try to create the table structure manually
      await this.createTablesManually();

      const { error } = await this.supabase
        .from('hotels')
        .upsert(hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          coords: hotel.coords,
          price: hotel.price,
          description: hotel.description,
          amenity_tags: hotel.amenityTags,
          photos: hotel.photos,
          hero_photo: hotel.heroPhoto,
          booking_url: hotel.bookingUrl,
          rating: hotel.rating,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })), { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error storing hotels:', error);
        throw error;
      }

      console.log(`✅ Stored ${hotels.length} hotels in Supabase`);
    } catch (error) {
      console.error('Failed to store hotels:', error);
      throw error;
    }
  }

  // Get hotels from Supabase with pagination and filtering
  async getHotels(params: {
    limit?: number;
    offset?: number;
    excludeIds?: string[];
  } = {}): Promise<{ hotels: HotelCard[]; total: number; hasMore: boolean }> {
    try {
      const { limit = 20, offset = 0, excludeIds = [] } = params;

      let query = this.supabase
        .from('hotels')
        .select('*', { count: 'exact' });

      // Exclude seen hotels
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching hotels:', error);
        throw error;
      }

      const hotels: HotelCard[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        country: row.country,
        coords: row.coords,
        price: row.price,
        description: row.description,
        amenityTags: row.amenity_tags || [],
        photos: row.photos || [],
        heroPhoto: row.hero_photo,
        bookingUrl: row.booking_url,
        rating: row.rating
      }));

      const total = count || 0;
      const hasMore = offset + limit < total;

      return { hotels, total, hasMore };
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
      return { hotels: [], total: 0, hasMore: false };
    }
  }

  // Get single hotel by ID
  async getHotelById(id: string): Promise<HotelCard | null> {
    try {
      const { data, error } = await this.supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching hotel:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        city: data.city,
        country: data.country,
        coords: data.coords,
        price: data.price,
        description: data.description,
        amenityTags: data.amenity_tags || [],
        photos: data.photos || [],
        heroPhoto: data.hero_photo,
        bookingUrl: data.booking_url,
        rating: data.rating
      };
    } catch (error) {
      console.error('Failed to fetch hotel by ID:', error);
      return null;
    }
  }

  // Store user personalization data
  async storePersonalization(userId: string, data: PersonalizationData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          country_affinity: data.countryAffinity,
          amenity_affinity: data.amenityAffinity,
          seen_hotels: data.seenHotels,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error storing personalization:', error);
      }
    } catch (error) {
      console.error('Failed to store personalization:', error);
    }
  }

  // Get user personalization data
  async getPersonalization(userId: string): Promise<PersonalizationData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        countryAffinity: data.country_affinity || {},
        amenityAffinity: data.amenity_affinity || {},
        seenHotels: data.seen_hotels || []
      };
    } catch (error) {
      console.error('Failed to fetch personalization:', error);
      return null;
    }
  }

  // Check if database is seeded
  async isSeeded(): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error checking if seeded:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Failed to check if seeded:', error);
      return false;
    }
  }

  // Create tables manually if RPC functions don't exist
  private async createTablesManually(): Promise<void> {
    try {
      // Create hotels table
      await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS hotels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT NOT NULL,
            coords JSONB,
            price JSONB,
            description TEXT,
            amenity_tags TEXT[],
            photos TEXT[],
            hero_photo TEXT,
            booking_url TEXT,
            rating REAL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });

      // Create user preferences table
      await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS user_preferences (
            user_id TEXT PRIMARY KEY,
            country_affinity JSONB DEFAULT '{}',
            amenity_affinity JSONB DEFAULT '{}',
            seen_hotels TEXT[] DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
    } catch (error) {
      // If RPC doesn't work, we'll handle table creation differently
      console.log('Manual table creation not available, tables may need to be created via Supabase dashboard');
    }
  }
}

export default DatabaseService; 