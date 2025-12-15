/**
 * Quick check for Preview Sent hotels count
 * Run with: node api/check-preview-count.js
 */

const { hotelCrmApi } = require("./src/services/hotelCrmApi.js");

async function checkPreviewCount() {
  console.log("🔍 Checking Preview Sent hotels count...\n");

  try {
    // Get statistics
    const stats = await hotelCrmApi.getStats();
    
    console.log("📊 Statistics:");
    if (stats.stage_counts && stats.stage_counts["Preview Sent"]) {
      console.log(`   Preview Sent: ${stats.stage_counts["Preview Sent"]} hotels`);
    }
    if (stats.funnel_metrics && stats.funnel_metrics.preview_sent) {
      console.log(`   Preview Sent (funnel): ${stats.funnel_metrics.preview_sent} hotels`);
    }
    
    // Actually fetch the hotels to get exact count
    console.log("\n🔎 Fetching all Preview Sent hotels...");
    const previewHotels = await hotelCrmApi.getAllHotelsInStage("Preview Sent");
    
    console.log(`\n✅ Total Preview Sent hotels: ${previewHotels.length}\n`);
    
    if (previewHotels.length > 0) {
      console.log("Hotels list:");
      previewHotels.forEach((hotel, index) => {
        console.log(`   ${index + 1}. ${hotel.hotel_name} - ${hotel.city}, ${hotel.country}`);
      });
    }
    
    return previewHotels.length;
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// Run the check
checkPreviewCount()
  .then((count) => {
    console.log(`\n✅ Check completed! Found ${count} Preview Sent hotels.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });

