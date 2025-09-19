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
Object.defineProperty(exports, "__esModule", { value: true });
exports.glintzCurate = glintzCurate;
__exportStar(require("./constants"), exports);
__exportStar(require("./extract"), exports);
__exportStar(require("./score"), exports);
__exportStar(require("./filter"), exports);
__exportStar(require("./diversify"), exports);
// Main curation function for easy integration
const filter_1 = require("./filter");
const diversify_1 = require("./diversify");
/**
 * Complete Glintz curation pipeline
 * Apply hard gates → score → threshold → diversify
 */
async function glintzCurate(rawHotels) {
    console.log(`🎯 Starting Glintz curation for ${rawHotels.length} hotels...`);
    // Step 1: Apply hard gates and scoring
    const { cards, stats: curationStats } = (0, filter_1.curate)(rawHotels);
    console.log(`✅ Curation complete: ${cards.length} cards passed all gates`);
    // Step 2: Diversify to avoid repetition
    const diversifiedCards = (0, diversify_1.diversify)(cards);
    console.log(`🔀 Diversification complete: ${diversifiedCards.length} cards arranged`);
    // Step 3: Calculate diversity statistics
    const diversityStats = (0, diversify_1.calculateDiversityStats)(diversifiedCards);
    // Step 4: Create summary
    const summary = `
Glintz Curation Results:
- Input Hotels: ${rawHotels.length}
- Final Curated Cards: ${diversifiedCards.length}
- Success Rate: ${((diversifiedCards.length / rawHotels.length) * 100).toFixed(1)}%
- Average Score: ${(curationStats.averageScore * 100).toFixed(1)}%
- Diversity Score: ${(diversityStats.diversityScore * 100).toFixed(1)}%
- Unique Cities: ${diversityStats.uniqueCities}
- Unique Brands: ${diversityStats.uniqueBrands}
  `.trim();
    console.log(summary);
    return {
        cards: diversifiedCards,
        curationStats,
        diversityStats,
        summary
    };
}
//# sourceMappingURL=index.js.map