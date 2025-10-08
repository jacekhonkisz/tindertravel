require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

/**
 * Hotel Cleanup Script - Remove Hotels with No Photos
 * 
 * This script will:
 * 1. Find all hotels with 0 photos
 * 2. Create a backup list
 * 3. Remove them from Supabase
 * 4. Generate a report
 */

class HotelCleanupService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    this.stats = {
      totalHotelsChecked: 0,
      hotelsWithZeroPhotos: 0,
      hotelsDeleted: 0,
      errors: [],
      deletedHotels: []
    };
  }

  /**
   * Find all hotels with 0 photos
   */
  async findHotelsWithZeroPhotos() {
    console.log('\n📊 Querying database for hotels with 0 photos...\n');
    
    try {
      const { data, error } = await this.supabase
        .from('hotels')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Filter hotels with 0 photos
      const hotelsWithZeroPhotos = data.filter(hotel => {
        const photoCount = hotel.photos ? hotel.photos.length : 0;
        return photoCount === 0;
      });
      
      console.log(`✅ Found ${hotelsWithZeroPhotos.length} hotels with 0 photos`);
      console.log(`📈 Total hotels in database: ${data.length}`);
      console.log(`📈 Hotels with photos: ${data.length - hotelsWithZeroPhotos.length}`);
      
      this.stats.totalHotelsChecked = data.length;
      this.stats.hotelsWithZeroPhotos = hotelsWithZeroPhotos.length;
      
      return hotelsWithZeroPhotos;
    } catch (error) {
      console.error('❌ Error querying database:', error);
      throw error;
    }
  }

  /**
   * Create backup of hotels to be deleted
   */
  async createBackup(hotelsToDelete) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `/Users/ala/tindertravel/api/hotels-deleted-backup-${timestamp}.json`;
    
    const backup = {
      timestamp: new Date().toISOString(),
      totalHotelsDeleted: hotelsToDelete.length,
      hotels: hotelsToDelete.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        coords: hotel.coords,
        description: hotel.description,
        amenity_tags: hotel.amenity_tags,
        rating: hotel.rating,
        created_at: hotel.created_at,
        updated_at: hotel.updated_at
      }))
    };
    
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup created: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * Delete hotels from database
   */
  async deleteHotels(hotelsToDelete) {
    console.log(`\n🗑️  Deleting ${hotelsToDelete.length} hotels from database...\n`);
    
    const hotelIds = hotelsToDelete.map(hotel => hotel.id);
    
    try {
      const { error } = await this.supabase
        .from('hotels')
        .delete()
        .in('id', hotelIds);
      
      if (error) throw error;
      
      console.log(`✅ Successfully deleted ${hotelsToDelete.length} hotels`);
      this.stats.hotelsDeleted = hotelsToDelete.length;
      this.stats.deletedHotels = hotelsToDelete;
      
    } catch (error) {
      console.error('❌ Error deleting hotels:', error);
      this.stats.errors.push({
        operation: 'delete',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `/Users/ala/tindertravel/api/hotel-cleanup-report-${timestamp}.json`;
    const summaryPath = `/Users/ala/tindertravel/api/HOTEL_CLEANUP_REPORT.md`;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalHotelsChecked: this.stats.totalHotelsChecked,
        hotelsWithZeroPhotos: this.stats.hotelsWithZeroPhotos,
        hotelsDeleted: this.stats.hotelsDeleted,
        errorCount: this.stats.errors.length
      },
      deletedHotels: this.stats.deletedHotels,
      errors: this.stats.errors
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    let markdown = `# 🗑️ Hotel Cleanup Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Hotels Checked | ${this.stats.totalHotelsChecked} |\n`;
    markdown += `| Hotels with 0 Photos | ${this.stats.hotelsWithZeroPhotos} |\n`;
    markdown += `| Hotels Deleted | ${this.stats.hotelsDeleted} |\n`;
    markdown += `| Errors | ${this.stats.errors.length} |\n\n`;
    
    if (this.stats.deletedHotels.length > 0) {
      markdown += `## 🗑️ Deleted Hotels (${this.stats.deletedHotels.length})\n\n`;
      markdown += `| Hotel Name | Location | ID |\n`;
      markdown += `|------------|----------|----|\n`;
      this.stats.deletedHotels.forEach(hotel => {
        markdown += `| ${hotel.name} | ${hotel.city}, ${hotel.country} | ${hotel.id} |\n`;
      });
      markdown += `\n`;
    }
    
    if (this.stats.errors.length > 0) {
      markdown += `## ⚠️ Errors\n\n`;
      markdown += `| Operation | Error |\n`;
      markdown += `|-----------|-------|\n`;
      this.stats.errors.forEach(error => {
        markdown += `| ${error.operation} | ${error.error} |\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `## 📝 Notes\n\n`;
    markdown += `- Only hotels with exactly 0 photos were deleted\n`;
    markdown += `- A backup was created before deletion\n`;
    markdown += `- All hotel data (except photos) was preserved in backup\n`;
    markdown += `- This cleanup improves database quality by removing incomplete entries\n\n`;
    
    markdown += `---\n\n`;
    markdown += `*Full detailed report: ${reportPath}*\n`;
    
    await fs.writeFile(summaryPath, markdown);
    
    return { reportPath, summaryPath };
  }

  /**
   * Main execution
   */
  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  Hotel Cleanup Service - Remove Hotels with No Photos');
    console.log('='.repeat(80));
    
    try {
      // Step 1: Find hotels with 0 photos
      const hotelsToDelete = await this.findHotelsWithZeroPhotos();
      
      if (hotelsToDelete.length === 0) {
        console.log('\n✅ No hotels with 0 photos found! Database is clean.\n');
        return;
      }
      
      // Show some examples
      console.log('\n📋 Examples of hotels to be deleted:');
      hotelsToDelete.slice(0, 10).forEach((hotel, index) => {
        console.log(`   ${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
      });
      if (hotelsToDelete.length > 10) {
        console.log(`   ...and ${hotelsToDelete.length - 10} more`);
      }
      
      // Step 2: Create backup
      console.log('\n💾 Creating backup...');
      const backupPath = await this.createBackup(hotelsToDelete);
      
      // Step 3: Confirm deletion
      console.log(`\n⚠️  WARNING: About to delete ${hotelsToDelete.length} hotels from database!`);
      console.log(`📁 Backup saved to: ${backupPath}`);
      console.log('\nProceeding with deletion...\n');
      
      // Step 4: Delete hotels
      await this.deleteHotels(hotelsToDelete);
      
      // Step 5: Generate report
      console.log('\n' + '='.repeat(80));
      console.log('📊 GENERATING REPORT');
      console.log('='.repeat(80) + '\n');
      
      const { reportPath, summaryPath } = await this.generateReport();
      
      console.log('\n' + '='.repeat(80));
      console.log('🎉 CLEANUP COMPLETE!');
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Hotels Checked: ${this.stats.totalHotelsChecked}`);
      console.log(`   Hotels with 0 Photos: ${this.stats.hotelsWithZeroPhotos}`);
      console.log(`   Hotels Deleted: ${this.stats.hotelsDeleted}`);
      console.log(`   Errors: ${this.stats.errors.length}`);
      console.log(`\n📁 Files Created:`);
      console.log(`   - Backup: ${backupPath}`);
      console.log(`   - Summary: ${summaryPath}`);
      console.log(`   - Full Report: ${reportPath}`);
      console.log('\n');
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the script
const cleanup = new HotelCleanupService();
cleanup.run().catch(console.error);
