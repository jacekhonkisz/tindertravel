"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var DatabaseService = /** @class */ (function () {
    function DatabaseService() {
        var supabaseUrl = process.env.SUPABASE_URL;
        var supabaseKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials not provided. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    // Initialize database tables
    DatabaseService.prototype.initializeTables = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hotelError, prefError, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.supabase.rpc('create_hotels_table_if_not_exists')];
                    case 1:
                        hotelError = (_a.sent()).error;
                        if (hotelError && !hotelError.message.includes('already exists')) {
                            console.warn('Hotels table creation warning:', hotelError.message);
                        }
                        return [4 /*yield*/, this.supabase.rpc('create_user_preferences_table_if_not_exists')];
                    case 2:
                        prefError = (_a.sent()).error;
                        if (prefError && !prefError.message.includes('already exists')) {
                            console.warn('User preferences table creation warning:', prefError.message);
                        }
                        console.log('✅ Database tables initialized');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Database initialization error:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Store hotels in Supabase
    DatabaseService.prototype.storeHotels = function (hotels) {
        return __awaiter(this, void 0, void 0, function () {
            var error, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // First, let's try to create the table structure manually
                        return [4 /*yield*/, this.createTablesManually()];
                    case 1:
                        // First, let's try to create the table structure manually
                        _a.sent();
                        return [4 /*yield*/, this.supabase
                                .from('hotels')
                                .upsert(hotels.map(function (hotel) { return ({
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
                            }); }), {
                                onConflict: 'id',
                                ignoreDuplicates: false
                            })];
                    case 2:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('Error storing hotels:', error);
                            throw error;
                        }
                        console.log("\u2705 Stored ".concat(hotels.length, " hotels in Supabase"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to store hotels:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Get hotels from Supabase with pagination and filtering
    DatabaseService.prototype.getHotels = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var _a, limit, _b, offset, _c, excludeIds, query, _d, data, error, count, hotels, total, hasMore, error_3;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        _a = params.limit, limit = _a === void 0 ? 20 : _a, _b = params.offset, offset = _b === void 0 ? 0 : _b, _c = params.excludeIds, excludeIds = _c === void 0 ? [] : _c;
                        query = this.supabase
                            .from('hotels')
                            .select('*', { count: 'exact' });
                        // Exclude seen hotels
                        if (excludeIds.length > 0) {
                            query = query.not('id', 'in', "(".concat(excludeIds.map(function (id) { return "\"".concat(id, "\""); }).join(','), ")"));
                        }
                        return [4 /*yield*/, query
                                .range(offset, offset + limit - 1)
                                .order('created_at', { ascending: false })];
                    case 1:
                        _d = _e.sent(), data = _d.data, error = _d.error, count = _d.count;
                        if (error) {
                            console.error('Error fetching hotels:', error);
                            throw error;
                        }
                        hotels = (data || []).map(function (row) { return ({
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
                        }); });
                        total = count || 0;
                        hasMore = offset + limit < total;
                        return [2 /*return*/, { hotels: hotels, total: total, hasMore: hasMore }];
                    case 2:
                        error_3 = _e.sent();
                        console.error('Failed to fetch hotels:', error_3);
                        return [2 /*return*/, { hotels: [], total: 0, hasMore: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get single hotel by ID
    DatabaseService.prototype.getHotelById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.supabase
                                .from('hotels')
                                .select('*')
                                .eq('id', id)
                                .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            console.error('Error fetching hotel:', error);
                            return [2 /*return*/, null];
                        }
                        if (!data)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
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
                            }];
                    case 2:
                        error_4 = _b.sent();
                        console.error('Failed to fetch hotel by ID:', error_4);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Store user personalization data
    DatabaseService.prototype.storePersonalization = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var error, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.supabase
                                .from('user_preferences')
                                .upsert({
                                user_id: userId,
                                country_affinity: data.countryAffinity,
                                amenity_affinity: data.amenityAffinity,
                                seen_hotels: data.seenHotels,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' })];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('Error storing personalization:', error);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Failed to store personalization:', error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get user personalization data
    DatabaseService.prototype.getPersonalization = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.supabase
                                .from('user_preferences')
                                .select('*')
                                .eq('user_id', userId)
                                .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error || !data) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, {
                                countryAffinity: data.country_affinity || {},
                                amenityAffinity: data.amenity_affinity || {},
                                seenHotels: data.seen_hotels || []
                            }];
                    case 2:
                        error_6 = _b.sent();
                        console.error('Failed to fetch personalization:', error_6);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Check if database is seeded
    DatabaseService.prototype.isSeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, count, error, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.supabase
                                .from('hotels')
                                .select('*', { count: 'exact', head: true })];
                    case 1:
                        _a = _b.sent(), count = _a.count, error = _a.error;
                        if (error) {
                            console.error('Error checking if seeded:', error);
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, (count || 0) > 0];
                    case 2:
                        error_7 = _b.sent();
                        console.error('Failed to check if seeded:', error_7);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Create tables manually if RPC functions don't exist
    DatabaseService.prototype.createTablesManually = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Create hotels table
                        return [4 /*yield*/, this.supabase.rpc('exec_sql', {
                                sql: "\n          CREATE TABLE IF NOT EXISTS hotels (\n            id TEXT PRIMARY KEY,\n            name TEXT NOT NULL,\n            city TEXT NOT NULL,\n            country TEXT NOT NULL,\n            coords JSONB,\n            price JSONB,\n            description TEXT,\n            amenity_tags TEXT[],\n            photos TEXT[],\n            hero_photo TEXT,\n            booking_url TEXT,\n            rating REAL,\n            created_at TIMESTAMPTZ DEFAULT NOW(),\n            updated_at TIMESTAMPTZ DEFAULT NOW()\n          );\n        "
                            })];
                    case 1:
                        // Create hotels table
                        _a.sent();
                        // Create user preferences table
                        return [4 /*yield*/, this.supabase.rpc('exec_sql', {
                                sql: "\n          CREATE TABLE IF NOT EXISTS user_preferences (\n            user_id TEXT PRIMARY KEY,\n            country_affinity JSONB DEFAULT '{}',\n            amenity_affinity JSONB DEFAULT '{}',\n            seen_hotels TEXT[] DEFAULT '{}',\n            created_at TIMESTAMPTZ DEFAULT NOW(),\n            updated_at TIMESTAMPTZ DEFAULT NOW()\n          );\n        "
                            })];
                    case 2:
                        // Create user preferences table
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        // If RPC doesn't work, we'll handle table creation differently
                        console.log('Manual table creation not available, tables may need to be created via Supabase dashboard');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseService;
}());
exports.DatabaseService = DatabaseService;
exports.default = DatabaseService;
