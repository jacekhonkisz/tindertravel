const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

class PhotoAuditorAndCleaner {
  constructor() {
    this.supabaseUrl = "https://qlpxseihykemsblusojx.supabase.co";
    this.supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscHhzZWloeWtlbXNibHVzb2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODIzMjQsImV4cCI6MjA3Mzg1ODMyNH0.yuTwUGivtnorQX1WIgvzalscVPqTh3iVNY6yqId1xMs";
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.stats = { totalHotels: 0, totalPhotos: 0, lowResPhotos: 0, highResPhotos: 0, hotelsUpdated: 0, photosRemoved: 0 };
    this.minResolution = 1280 * 900;
  }

  async auditAndCleanAllPhotos() {
    console.log("🔍 AUDITING ALL HOTEL PHOTOS");
    console.log("=".repeat(60));
    console.log("🎯 Target: ALL hotels in database");
    console.log("📏 Minimum resolution: 1280x900 (1,152,000 pixels)");
    console.log("🗑️ Action: Remove ALL photos below minimum resolution");
    
    const hotels = await this.getAllHotelsFromSupabase();
    if (hotels.length === 0) {
      console.log("❌ No hotels found in Supabase database");
      return;
    }
    
    console.log(`
📋 Found ${hotels.length} hotels in database`);
    console.log("
🚀 Starting photo audit and cleanup...
");
    
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      console.log(`
🏨 [${i + 1}/${hotels.length}] Auditing: ${hotel.name}`);
      console.log(`📍 Location: ${hotel.city}, ${hotel.country}`);
      await this.auditAndCleanHotel(hotel);
      if (i < hotels.length - 1) {
        console.log("⏳ Waiting 1 second before next hotel...");
        await this.sleep(1000);
      }
    }
    this.generateAuditReport();
  }

  async getAllHotelsFromSupabase() {
    try {
      const { data, error } = await this.supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching hotels:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
      return [];
    }
  }

  async auditAndCleanHotel(hotel) {
    this.stats.totalHotels++;
    try {
      const currentPhotos = hotel.photos || [];
      console.log(`  📸 Current photos: ${currentPhotos.length}`);
      if (currentPhotos.length === 0) {
        console.log(`  ⏭️ No photos to audit`);
        return;
      }
      
      const photoAnalysis = await this.analyzePhotoResolutions(currentPhotos);
      console.log(`  📊 Photo analysis:`);
      console.log(`     • Total photos: ${photoAnalysis.total}`);
      console.log(`     • High-res photos (≥1280x900): ${photoAnalysis.highRes}`);
      console.log(`     • Low-res photos (<1280x900): ${photoAnalysis.lowRes}`);
      
      this.stats.totalPhotos += photoAnalysis.total;
      this.stats.highResPhotos += photoAnalysis.highRes;
      this.stats.lowResPhotos += photoAnalysis.lowRes;
      
      if (photoAnalysis.lowRes > 0) {
        console.log(`  🗑️ Removing ${photoAnalysis.lowRes} low-resolution photos...`);
        const cleanedPhotos = photoAnalysis.highResPhotos.map(p => p.url);
        const cleanedHeroPhoto = cleanedPhotos[0] || null;
        
        const { error } = await this.supabase.from("hotels").update({
          photos: cleanedPhotos,
          hero_photo: cleanedHeroPhoto,
          updated_at: new Date().toISOString()
        }).eq("id", hotel.id);

        if (error) {
          console.log(`  ⚠️ Database update failed: ${error.message}`);
        } else {
          console.log(`  ✅ Updated: ${cleanedPhotos.length} high-res photos kept`);
          this.stats.hotelsUpdated++;
          this.stats.photosRemoved += photoAnalysis.lowRes;
        }
      } else {
        console.log(`  ✅ All photos are high-resolution, no cleanup needed`);
      }
    } catch (error) {
      console.log(`  ❌ Error auditing ${hotel.name}: ${error.message}`);
    }
  }

  async analyzePhotoResolutions(photoUrls) {
    const analysis = { total: photoUrls.length, highRes: 0, lowRes: 0, highResPhotos: [], lowResPhotos: [] };
    for (const url of photoUrls) {
      try {
        const resolution = await this.getPhotoResolution(url);
        if (resolution.pixels >= this.minResolution) {
          analysis.highRes++;
          analysis.highResPhotos.push({ url: url, width: resolution.width, height: resolution.height, pixels: resolution.pixels });
        } else {
          analysis.lowRes++;
          analysis.lowResPhotos.push({ url: url, width: resolution.width, height: resolution.height, pixels: resolution.pixels });
        }
      } catch (error) {
        console.log(`    ⚠️ Could not determine resolution for ${url}: ${error.message}`);
        analysis.lowRes++;
        analysis.lowResPhotos.push({ url: url, width: 0, height: 0, pixels: 0 });
      }
    }
    return analysis;
  }

  async getPhotoResolution(url) {
    try {
      const urlResolution = this.extractResolutionFromUrl(url);
      if (urlResolution) return urlResolution;
      
      const response = await axios.head(url, { timeout: 5000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
      const contentType = response.headers["content-type"] || "";
      if (!contentType.startsWith("image/")) throw new Error("Not an image");
      
      const width = response.headers["x-image-width"] || response.headers["image-width"];
      const height = response.headers["x-image-height"] || response.headers["image-height"];
      if (width && height) {
        return { width: parseInt(width), height: parseInt(height), pixels: parseInt(width) * parseInt(height) };
      }
      
      return { width: 800, height: 600, pixels: 480000 };
    } catch (error) {
      const urlResolution = this.extractResolutionFromUrl(url);
      if (urlResolution) return urlResolution;
      throw new Error(`Failed to get resolution: ${error.message}`);
    }
  }

  extractResolutionFromUrl(url) {
    const patterns = [/(\d+)x(\d+)/, /max(\d+)x(\d+)/, /(\d+)x(\d+)\.jpg/, /_(\d+)x(\d+)_/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        return { width: width, height: height, pixels: width * height };
      }
    }
    return null;
  }

  generateAuditReport() {
    console.log("
📊 PHOTO AUDIT AND CLEANUP REPORT");
    console.log("=".repeat(60));
    console.log(`📈 Total hotels audited: ${this.stats.totalHotels}`);
    console.log(`📸 Total photos analyzed: ${this.stats.totalPhotos}`);
    console.log(`✅ High-res photos kept: ${this.stats.highResPhotos}`);
    console.log(`🗑️ Low-res photos removed: ${this.stats.lowResPhotos}`);
    console.log(`�� Hotels updated: ${this.stats.hotelsUpdated}`);
    console.log(`📊 Cleanup rate: ${Math.round((this.stats.photosRemoved / this.stats.totalPhotos) * 100)}%`);
    
    console.log("
🎯 RESULTS:");
    if (this.stats.photosRemoved > 0) {
      console.log(`✅ Successfully removed ${this.stats.photosRemoved} low-resolution photos`);
      console.log(`✅ Kept ${this.stats.highResPhotos} high-resolution photos (≥1280x900)`);
      console.log(`✅ Updated ${this.stats.hotelsUpdated} hotels`);
    } else {
      console.log(`✅ All photos were already high-resolution`);
    }
    
    console.log("
💰 COST ANALYSIS:");
    console.log(`• Database operations: FREE`);
    console.log(`• Photo analysis: FREE`);
    console.log(`• Total cost: $0`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runAudit() {
  const auditor = new PhotoAuditorAndCleaner();
  await auditor.auditAndCleanAllPhotos();
}

runAudit().catch(console.error);
