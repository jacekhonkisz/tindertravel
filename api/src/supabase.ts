import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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

export class SupabaseService {
  async insertHotels(hotels: SupabaseHotel[]): Promise<void> {
    const { error } = await supabase
      .from('hotels')
      .insert(hotels);

    if (error) {
      throw new Error(`Failed to insert hotels: ${error.message}`);
    }
  }

  async getHotels(limit: number = 20, offset: number = 0): Promise<SupabaseHotel[]> {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch hotels: ${error.message}`);
    }

    return data || [];
  }

  async getHotelById(id: string): Promise<SupabaseHotel | null> {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch hotel: ${error.message}`);
    }

    return data;
  }

  async getHotelCount(): Promise<number> {
    const { count, error } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to count hotels: ${error.message}`);
    }

    return count || 0;
  }

  async clearHotels(): Promise<void> {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .neq('id', ''); // Delete all records

    if (error) {
      throw new Error(`Failed to clear hotels: ${error.message}`);
    }
  }
} 