const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

class SimplePhotoAuditor {
  constructor() {
    this.supabaseUrl = "https://qlpxseihykemsblusojx.supabase.co";
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY_HERE";
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.stats = { totalHotels: 0, totalPhotos: 0, lowResPhotos: 0, highResPhotos: 0, hotelsUpdated: 0 };
    this.minResolution = 1280 * 900;
  }

  async auditAllPhotos() {
    console.log("🔍 AUDITING ALL HOTEL PHOTOS");
    console.log("=".repeat(50));
    console.log("🎯 Target: ALL hotels in database");
    console.log("📏 Minimum resolution: 1280x900");
    console.log("🗑️ Action: Remove photos below minimum resolution");
    
    const hotels = await this.getAllHotels();
    if (hotels.length === 0) {
      console.log("❌ No hotels found");
      return;
    }
    
    console.log(`
📋 Found ${hotels.length} hotels`);
    console.log("
🚀 Starting audit...
");
    
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      console.log(`
🏨 [${i + 1}/${hotels.length}] ${hotel.name}`);
      console.log(`📍 ${hotel.city}, ${hotel.country}`);
      await this.auditHotel(hotel);
      await this.sleep(1000);
    }
    
    this.generateReport();
  }

  async getAllHotels() {
    try {
      const { data, error } = await this.supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Error:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Failed:", error);
      return [];
    }
  }

  async auditHotel(hotel) {
    this.stats.totalHotels++;
    const photos = hotel.photos || [];
    console.log(`  📸 Photos: ${photos.length}`);
    
    if (photos.length === 0) {
      console.log(`  ⏭️ No photos`);
      return;
    }
    
    const analysis = await this.analyzePhotos(photos);
    console.log(`  📊 Analysis:`);
    console.log(`     • Total: ${analysis.total}`);
    console.log(`     • High-res (≥1280x900): ${analysis.highRes}`);
    console.log(`     • Low-res (<1280x900): ${analysis.lowRes}`);
    
    this.stats.totalPhotos += analysis.total;
    this.stats.highResPhotos += analysis.highRes;
    this.stats.lowResPhotos += analysis.lowRes;
    
    if (analysis.lowRes > 0) {
      console.log(`  🗑️ Removing ${analysis.lowRes} low-res photos`);
      const cleanedPhotos = analysis.highResPhotos.map(p => p.url);
      const heroPhoto = cleanedPhotos[0] || null;
      
      const { error } = await this.supabase.from("hotels").update({
        photos: cleanedPhotos,
        hero_photo: heroPhoto,
        updated_at: new Date().toISOString()
      }).eq("id", hotel.id);

      if (error) {
        console.log(`  ⚠️ Update failed: ${error.message}`);
      } else {
        console.log(`  ✅ Updated: ${cleanedPhotos.length} photos kept`);
        this.stats.hotelsUpdated++;
      }
    } else {
      console.log(`  ✅ All photos are high-res`);
    }
  }

  async analyzePhotos(photoUrls) {
    const analysis = { total: photoUrls.length, highRes: 0, lowRes: 0, highResPhotos: [], lowResPhotos: [] };
    for (const url of photoUrls) {
      try {
        const resolution = this.getResolutionFromUrl(url);
        if (resolution.pixels >= this.minResolution) {
          analysis.highRes++;
          analysis.highResPhotos.push({ url: url, width: resolution.width, height: resolution.height, pixels: resolution.pixels });
        } else {
          analysis.lowRes++;
          analysis.lowResPhotos.push({ url: url, width: resolution.width, height: resolution.height, pixels: resolution.pixels });
        }
      } catch (error) {
        console.log(`    ⚠️ Could not analyze ${url}`);
        analysis.lowRes++;
        analysis.lowResPhotos.push({ url: url, width: 0, height: 0, pixels: 0 });
      }
    }
    return analysis;
  }

  getResolutionFromUrl(url) {
    const patterns = [/(\d+)x(\d+)/, /max(\d+)x(\d+)/, /(\d+)x(\d+)\.jpg/, /_(\d+)x(\d+)_/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        return { width: width, height: height, pixels: width * height };
      }
    }
    return { width: 800, height: 600, pixels: 480000 };
  }

  generateReport() {
    console.log("
📊 PHOTO AUDIT REPORT");
    console.log("=".repeat(50));
    console.log(`📈 Hotels audited: ${this.stats.totalHotels}`);
    console.log(`📸 Photos analyzed: ${this.stats.totalPhotos}`);
    console.log(`✅ High-res kept: ${this.stats.highResPhotos}`);
    console.log(`🗑️ Low-res removed: ${this.stats.lowResPhotos}`);
    console.log(`🏨 Hotels updated: ${this.stats.hotelsUpdated}`);
    
    if (this.stats.lowResPhotos > 0) {
      console.log(`
✅ Successfully removed ${this.stats.lowResPhotos} low-resolution photos`);
      console.log(`✅ Kept ${this.stats.highResPhotos} high-resolution photos (≥1280x900)`);
    } else {
      console.log(`
✅ All photos were already high-resolution`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runAudit() {
  const auditor = new SimplePhotoAuditor();
  await auditor.auditAllPhotos();
}

runAudit().catch(console.error);
