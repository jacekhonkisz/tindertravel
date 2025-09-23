"use strict";
// Start Global Hotel Fetching
// Launch comprehensive worldwide hotel collection
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
exports.startGlobalFetch = startGlobalFetch;
exports.quickFetch = quickFetch;
var global_hotel_fetcher_1 = require("./global-hotel-fetcher");
function startGlobalFetch() {
    return __awaiter(this, void 0, void 0, function () {
        var fetcher, currentStats, europeResults, asiaResults, northAmericaResults, southAmericaResults, africaResults, oceaniaResults, finalStats, totalAdded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌍 LAUNCHING GLOBAL HOTEL COLLECTION');
                    console.log('=====================================');
                    console.log('Target: Thousands of boutique hotels from EVERY country globally');
                    console.log('Coverage: All 6 continents, 195+ countries, 1000+ cities');
                    console.log('');
                    fetcher = new global_hotel_fetcher_1.GlobalHotelFetcher();
                    // Get current stats
                    console.log('📊 Current Database Status:');
                    return [4 /*yield*/, fetcher.getGlobalStats()];
                case 1:
                    currentStats = _a.sent();
                    console.log("   \u2022 Total Hotels: ".concat(currentStats.totalHotels));
                    console.log("   \u2022 Countries: ".concat(currentStats.countriesRepresented));
                    console.log("   \u2022 Cities: ".concat(currentStats.citiesRepresented));
                    console.log('');
                    // Start with Europe (most reliable data)
                    console.log('🇪🇺 Phase 1: Starting with EUROPE (47 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['europe'],
                            maxHotelsPerCity: 15,
                            batchSize: 30,
                            skipExisting: true
                        })];
                case 2:
                    europeResults = _a.sent();
                    console.log('\n🇪🇺 EUROPE COMPLETE!');
                    console.log("   \u2022 Added: ".concat(europeResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(europeResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(europeResults.cities.length));
                    // Continue with Asia
                    console.log('\n🌏 Phase 2: Continuing with ASIA (50 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['asia'],
                            maxHotelsPerCity: 12,
                            batchSize: 25,
                            skipExisting: true
                        })];
                case 3:
                    asiaResults = _a.sent();
                    console.log('\n🌏 ASIA COMPLETE!');
                    console.log("   \u2022 Added: ".concat(asiaResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(asiaResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(asiaResults.cities.length));
                    // Continue with North America
                    console.log('\n🌎 Phase 3: Continuing with NORTH AMERICA (23 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['northAmerica'],
                            maxHotelsPerCity: 20,
                            batchSize: 35,
                            skipExisting: true
                        })];
                case 4:
                    northAmericaResults = _a.sent();
                    console.log('\n🌎 NORTH AMERICA COMPLETE!');
                    console.log("   \u2022 Added: ".concat(northAmericaResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(northAmericaResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(northAmericaResults.cities.length));
                    // Continue with South America
                    console.log('\n🌎 Phase 4: Continuing with SOUTH AMERICA (12 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['southAmerica'],
                            maxHotelsPerCity: 10,
                            batchSize: 20,
                            skipExisting: true
                        })];
                case 5:
                    southAmericaResults = _a.sent();
                    console.log('\n🌎 SOUTH AMERICA COMPLETE!');
                    console.log("   \u2022 Added: ".concat(southAmericaResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(southAmericaResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(southAmericaResults.cities.length));
                    // Continue with Africa
                    console.log('\n🌍 Phase 5: Continuing with AFRICA (54 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['africa'],
                            maxHotelsPerCity: 8,
                            batchSize: 15,
                            skipExisting: true
                        })];
                case 6:
                    africaResults = _a.sent();
                    console.log('\n🌍 AFRICA COMPLETE!');
                    console.log("   \u2022 Added: ".concat(africaResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(africaResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(africaResults.cities.length));
                    // Finish with Oceania
                    console.log('\n🌏 Phase 6: Finishing with OCEANIA (14 countries)...');
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: ['oceania'],
                            maxHotelsPerCity: 15,
                            batchSize: 25,
                            skipExisting: true
                        })];
                case 7:
                    oceaniaResults = _a.sent();
                    console.log('\n🌏 OCEANIA COMPLETE!');
                    console.log("   \u2022 Added: ".concat(oceaniaResults.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(oceaniaResults.countries.length));
                    console.log("   \u2022 Cities: ".concat(oceaniaResults.cities.length));
                    return [4 /*yield*/, fetcher.getGlobalStats()];
                case 8:
                    finalStats = _a.sent();
                    console.log('\n🎉 GLOBAL HOTEL COLLECTION COMPLETE!');
                    console.log('=====================================');
                    console.log('📊 FINAL RESULTS:');
                    console.log("   \u2022 Total Hotels: ".concat(finalStats.totalHotels));
                    console.log("   \u2022 Countries Represented: ".concat(finalStats.countriesRepresented));
                    console.log("   \u2022 Cities Represented: ".concat(finalStats.citiesRepresented));
                    console.log('');
                    console.log('🌍 Continental Breakdown:');
                    Object.entries(finalStats.continentBreakdown).forEach(function (_a) {
                        var continent = _a[0], count = _a[1];
                        console.log("   \u2022 ".concat(continent, ": ").concat(count, " hotels"));
                    });
                    console.log('');
                    totalAdded = europeResults.added + asiaResults.added + northAmericaResults.added +
                        southAmericaResults.added + africaResults.added + oceaniaResults.added;
                    console.log("\u2705 Successfully added ".concat(totalAdded, " new boutique hotels!"));
                    console.log("\uD83C\uDFAF All hotels meet Glintz curation criteria:");
                    console.log("   \u2022 High-quality photos (4+ images)");
                    console.log("   \u2022 Boutique/luxury positioning");
                    console.log("   \u2022 Great reviews (4.0+ rating)");
                    console.log("   \u2022 Unique experiences & amenities");
                    console.log("   \u2022 Instagram-worthy visual appeal");
                    console.log('');
                    console.log('🚀 Ready for thousands of users to discover amazing stays worldwide!');
                    return [2 /*return*/];
            }
        });
    });
}
// Quick fetch for testing (single continent)
function quickFetch() {
    return __awaiter(this, arguments, void 0, function (continent) {
        var fetcher, results;
        if (continent === void 0) { continent = 'europe'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\uD83D\uDE80 Quick fetch from ".concat(continent.toUpperCase(), "..."));
                    fetcher = new global_hotel_fetcher_1.GlobalHotelFetcher();
                    return [4 /*yield*/, fetcher.fetchGlobalHotels({
                            continents: [continent],
                            maxHotelsPerCity: 5,
                            batchSize: 10,
                            skipExisting: true
                        })];
                case 1:
                    results = _a.sent();
                    console.log('\n✅ Quick fetch complete!');
                    console.log("   \u2022 Added: ".concat(results.added, " hotels"));
                    console.log("   \u2022 Countries: ".concat(results.countries.length));
                    console.log("   \u2022 Cities: ".concat(results.cities.length));
                    return [2 /*return*/, results];
            }
        });
    });
}
// CLI execution
if (require.main === module) {
    var args = process.argv.slice(2);
    var mode = args[0] || 'full';
    if (mode === 'quick') {
        var continent = args[1] || 'europe';
        quickFetch(continent)
            .then(function () { return process.exit(0); })
            .catch(function (error) {
            console.error('❌ Quick fetch failed:', error);
            process.exit(1);
        });
    }
    else {
        startGlobalFetch()
            .then(function () { return process.exit(0); })
            .catch(function (error) {
            console.error('❌ Global fetch failed:', error);
            process.exit(1);
        });
    }
}
