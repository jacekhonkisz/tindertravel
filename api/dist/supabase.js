"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class SupabaseService {
    async insertHotels(hotels) {
        const { error } = await exports.supabase
            .from('hotels')
            .insert(hotels);
        if (error) {
            throw new Error(`Failed to insert hotels: ${error.message}`);
        }
    }
    async getHotels(limit = 20, offset = 0) {
        const { data, error } = await exports.supabase
            .from('hotels')
            .select('*')
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch hotels: ${error.message}`);
        }
        return data || [];
    }
    async getHotelById(id) {
        const { data, error } = await exports.supabase
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
    async getHotelCount() {
        const { count, error } = await exports.supabase
            .from('hotels')
            .select('*', { count: 'exact', head: true });
        if (error) {
            throw new Error(`Failed to count hotels: ${error.message}`);
        }
        return count || 0;
    }
    async clearHotels() {
        const { error } = await exports.supabase
            .from('hotels')
            .delete()
            .neq('id', ''); // Delete all records
        if (error) {
            throw new Error(`Failed to clear hotels: ${error.message}`);
        }
    }
    async updateHotelCoordinates(id, coords) {
        const { error } = await exports.supabase
            .from('hotels')
            .update({ coords })
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to update hotel coordinates: ${error.message}`);
        }
    }
}
exports.SupabaseService = SupabaseService;
//# sourceMappingURL=supabase.js.map