// Live Monitor - Continuous Progress Updates
// Shows real-time progress of the 1,500 hotel fetching process

import dotenv from 'dotenv';
import { SupabaseService } from './supabase';

// Load environment variables
dotenv.config();

let lastCount = 0;
let startTime = Date.now();

async function showProgress() {
  const supabase = new SupabaseService();
  
  try {
    const hotels = await supabase.getHotels(2000, 0);
    const currentCount = hotels.length;
    const newHotels = currentCount - lastCount;
    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    
    // Clear screen and show header
    console.clear();
    console.log('🔴 LIVE HOTEL FETCHING MONITOR');
    console.log('============================');
    console.log(`⏰ Running for: ${elapsed.toFixed(1)} minutes`);
    console.log('');
    
    // Progress stats
    console.log(`🏨 Current Status: ${currentCount} hotels in database`);
    console.log(`🎯 Progress: ${((currentCount / 1500) * 100).toFixed(1)}% of target (1,500)`);
    console.log(`📈 Remaining: ${Math.max(0, 1500 - currentCount)} hotels needed`);
    
    if (newHotels > 0) {
      console.log(`🆕 New hotels since last check: +${newHotels}`);
    }
    
    console.log('');
    
    // Rate calculation
    if (elapsed > 0) {
      const rate = currentCount / elapsed;
      const eta = rate > 0 ? (1500 - currentCount) / rate : 0;
      console.log(`📊 Fetching Rate: ${rate.toFixed(1)} hotels/minute`);
      if (eta > 0 && eta < 1440) { // Less than 24 hours
        console.log(`⏱️  ETA to 1,500: ${eta.toFixed(0)} minutes (${(eta/60).toFixed(1)} hours)`);
      }
    }
    
    console.log('');
    
    // Top countries
    const byCountry = hotels.reduce((acc: Record<string, number>, hotel) => {
      acc[hotel.country] = (acc[hotel.country] || 0) + 1;
      return acc;
    }, {});

    console.log('🌍 Top Countries:');
    Object.entries(byCountry)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .forEach(([country, count]) => {
        const bar = '█'.repeat(Math.min(20, Math.floor((count as number) / Math.max(1, currentCount / 20))));
        console.log(`   ${country.padEnd(12)} ${count.toString().padStart(3)} ${bar}`);
      });

    console.log('');
    
    // Recent additions
    const recentHotels = hotels
      .filter(h => h.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 3);

    if (recentHotels.length > 0) {
      console.log('🆕 Most Recent Hotels:');
      recentHotels.forEach((hotel, i) => {
        const timeAgo = new Date(hotel.created_at!);
        const minutesAgo = (Date.now() - timeAgo.getTime()) / 1000 / 60;
        let timeStr = '';
        if (minutesAgo < 1) {
          timeStr = 'just now';
        } else if (minutesAgo < 60) {
          timeStr = `${Math.floor(minutesAgo)}m ago`;
        } else {
          timeStr = `${Math.floor(minutesAgo / 60)}h ago`;
        }
        console.log(`   ${i+1}. ${hotel.name} (${hotel.city}) - ${timeStr}`);
      });
    }
    
    console.log('');
    
    // Status message
    if (currentCount >= 1500) {
      console.log('🎉 TARGET ACHIEVED! 1,500+ boutique hotels collected!');
      console.log('✅ Mission accomplished - you have a world-class hotel collection!');
    } else if (currentCount > lastCount) {
      console.log('🚀 ACTIVELY FETCHING - New hotels being added!');
      console.log('✅ System is working perfectly - stay tuned for more updates!');
    } else {
      console.log('⏳ PROCESSING - System is working through API rate limits...');
      console.log('💡 The fetcher processes hotels in batches with intelligent delays');
    }
    
    console.log('');
    console.log('Press Ctrl+C to stop monitoring');
    
    lastCount = currentCount;
    
  } catch (error) {
    console.error('❌ Error monitoring progress:', (error as Error).message);
  }
}

async function startLiveMonitoring() {
  console.log('🔴 Starting live monitoring...');
  console.log('📊 Updates every 30 seconds');
  console.log('');
  
  // Initial check
  await showProgress();
  
  // Update every 30 seconds
  const interval = setInterval(async () => {
    await showProgress();
  }, 30000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n👋 Live monitoring stopped');
    console.log('💡 Run again anytime with: npx ts-node src/live-monitor.ts');
    process.exit(0);
  });
}

// CLI execution
if (require.main === module) {
  startLiveMonitoring()
    .catch(error => {
      console.error('❌ Live monitoring failed:', error);
      process.exit(1);
    });
}

export { startLiveMonitoring }; 