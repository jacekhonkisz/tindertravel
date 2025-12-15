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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
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