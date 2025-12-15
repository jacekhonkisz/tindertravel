/**
 * Get all hotels in Preview stage
 * Run with: node api/get-preview-hotels.js
 */

const { hotelCrmApi } = require("./src/services/hotelCrmApi.js");

async function getPreviewHotels() {
  console.log("🔍 Fetching all hotels in Preview stage...\n");

  try {
    // First, let's check the stats to see preview-related stages
    const stats = await hotelCrmApi.getStats();
    console.log("📊 Preview-related stages from statistics:");
    
    if (stats.stage_counts) {
      Object.entries(stats.stage_counts).forEach(([stage, count]) => {
        if (stage.toLowerCase().includes("preview")) {
          console.log(`  - ${stage}: ${count} hotels`);
        }
      });
    }
    
    if (stats.funnel_metrics && stats.funnel_metrics.preview_sent) {
      console.log(`  - Preview Sent (funnel): ${stats.funnel_metrics.preview_sent} hotels`);
    }
    
    console.log("\n");

    // Try different possible stage names for preview
    const previewStages = [
      "Preview Sent",
      "preview sent",
      "Preview",
      "preview",
      "Preview Sent"
    ];

    let allPreviewHotels = [];

    for (const stage of previewStages) {
      try {
        console.log(`🔎 Fetching hotels with stage: "${stage}"...`);
        const hotels = await hotelCrmApi.getAllHotelsInStage(stage);
        
        if (hotels.length > 0) {
          console.log(`✅ Found ${hotels.length} hotels in "${stage}" stage\n`);
          allPreviewHotels = hotels;
          break; // Found hotels, no need to check other variations
        } else {
          console.log(`   No hotels found for "${stage}"\n`);
        }
      } catch (error) {
        console.log(`   Error fetching "${stage}": ${error.message}\n`);
      }
    }

    if (allPreviewHotels.length === 0) {
      // Try getting a sample to see what stage values exist
      console.log("🔍 Checking available stages by fetching sample hotels...\n");
      const sample = await hotelCrmApi.getHotels({ per_page: 100 });
      
      if (sample.hotels && sample.hotels.length > 0) {
        const uniqueStages = [...new Set(sample.hotels.map(h => h.stage).filter(Boolean))];
        console.log("Available stages found in sample:");
        uniqueStages.forEach(s => console.log(`  - "${s}"`));
        
        // Look for preview-related stages
        const previewRelated = uniqueStages.filter(s => 
          s.toLowerCase().includes("preview")
        );
        
        if (previewRelated.length > 0) {
          console.log(`\n🎯 Found preview-related stages: ${previewRelated.join(", ")}`);
          for (const stage of previewRelated) {
            const hotels = await hotelCrmApi.getAllHotelsInStage(stage);
            if (hotels.length > 0) {
              allPreviewHotels = hotels;
              console.log(`✅ Using stage: "${stage}" with ${hotels.length} hotels\n`);
              break;
            }
          }
        }
      }
    }

    if (allPreviewHotels.length > 0) {
      console.log(`\n📋 Total Preview Hotels: ${allPreviewHotels.length}\n`);
      console.log("=" .repeat(80));
      
      allPreviewHotels.forEach((hotel, index) => {
        console.log(`\n${index + 1}. ${hotel.hotel_name || "N/A"}`);
        console.log(`   Location: ${hotel.city || "N/A"}, ${hotel.country || "N/A"}`);
        console.log(`   Stage: ${hotel.stage || "N/A"}`);
        console.log(`   Email: ${hotel.email || "N/A"}`);
        if (hotel.id) console.log(`   ID: ${hotel.id}`);
        if (hotel.phone) console.log(`   Phone: ${hotel.phone}`);
        if (hotel.website) console.log(`   Website: ${hotel.website}`);
      });
      
      console.log("\n" + "=".repeat(80));
      console.log(`\n✅ Successfully retrieved ${allPreviewHotels.length} preview hotels`);
      
      // Save to JSON file
      const fs = require('fs');
      const filename = `preview-hotels-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(allPreviewHotels, null, 2));
      console.log(`💾 Saved to: ${filename}`);
      
    } else {
      console.log("\n❌ No preview hotels found. Check the stage name in the statistics above.");
    }

    return allPreviewHotels;
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the script
getPreviewHotels()
  .then(() => {
    console.log("\n✅ Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

