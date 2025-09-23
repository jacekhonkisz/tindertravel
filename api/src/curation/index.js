"use strict";
// Glintz Hotel Curation - Main Module
// Export all curation functionality
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.glintzCurate = glintzCurate;
__exportStar(require("./constants"), exports);
__exportStar(require("./extract"), exports);
__exportStar(require("./score"), exports);
__exportStar(require("./filter"), exports);
__exportStar(require("./diversify"), exports);
// Main curation function for easy integration
var filter_1 = require("./filter");
var diversify_1 = require("./diversify");
/**
 * Complete Glintz curation pipeline
 * Apply hard gates → score → threshold → diversify
 */
function glintzCurate(rawHotels) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, cards, curationStats, diversifiedCards, diversityStats, summary;
        return __generator(this, function (_b) {
            console.log("\uD83C\uDFAF Starting Glintz curation for ".concat(rawHotels.length, " hotels..."));
            _a = (0, filter_1.curate)(rawHotels), cards = _a.cards, curationStats = _a.stats;
            console.log("\u2705 Curation complete: ".concat(cards.length, " cards passed all gates"));
            diversifiedCards = (0, diversify_1.diversify)(cards);
            console.log("\uD83D\uDD00 Diversification complete: ".concat(diversifiedCards.length, " cards arranged"));
            diversityStats = (0, diversify_1.calculateDiversityStats)(diversifiedCards);
            summary = "\nGlintz Curation Results:\n- Input Hotels: ".concat(rawHotels.length, "\n- Final Curated Cards: ").concat(diversifiedCards.length, "\n- Success Rate: ").concat(((diversifiedCards.length / rawHotels.length) * 100).toFixed(1), "%\n- Average Score: ").concat((curationStats.averageScore * 100).toFixed(1), "%\n- Diversity Score: ").concat((diversityStats.diversityScore * 100).toFixed(1), "%\n- Unique Cities: ").concat(diversityStats.uniqueCities, "\n- Unique Brands: ").concat(diversityStats.uniqueBrands, "\n  ").trim();
            console.log(summary);
            return [2 /*return*/, {
                    cards: diversifiedCards,
                    curationStats: curationStats,
                    diversityStats: diversityStats,
                    summary: summary
                }];
        });
    });
}
