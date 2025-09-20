// Hotel Fetching Audit & Monitoring Tool
// Comprehensive status check and monitoring for the 1,500 hotel fetching process

import dotenv from 'dotenv';
import { SupabaseService } from './supabase';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

interface AuditReport {
  currentStatus: {
    totalHotels: number;
    targetProgress: number;
    remainingHotels: number;
  };
  processStatus: {
    isRunning: boolean;
    processId?: number;
    logFile: string;
    lastActivity?: string;
  };
  apiStatus: {
    amadeus: boolean;
    supabase: boolean;
    googlePlaces: boolean;
  };
  recentActivity: {
    newHotelsLast10Min: number;
    averageRate: number;
    eta: string;
  };
  recommendations: string[];
}

async function checkProcessStatus(): Promise<{ isRunning: boolean; processId?: number }> {
  try {
    const { stdout } = await execAsync('ps aux | grep "optimized-hotel-fetcher" | grep -v grep');
    if (stdout.trim()) {
      const processLine = stdout.trim().split('\n')[0];
      const processId = parseInt(processLine.split(/\s+/)[1]);
      return { isRunning: true, processId };
    }
  } catch (error) {
    // Process not found
  }
  return { isRunning: false };
}

async function getLogTail(): Promise<string> {
  try {
    const { stdout } = await execAsync('tail -10 /Users/ala/tindertravel/api/hotel-fetching.log 2>/dev/null || echo "No log file found"');
    return stdout.trim();
  } catch (error) {
    return 'Error reading log file';
  }
}

async function checkApiConnections(): Promise<{ amadeus: boolean; supabase: boolean; googlePlaces: boolean }> {
  const status = { amadeus: false, supabase: false, googlePlaces: false };
  
  try {
    // Check environment variables
    status.amadeus = !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
    status.supabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
    status.googlePlaces = !!(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY !== 'your_google_places_api_key_here');
  } catch (error) {
    console.error('Error checking API connections:', error);
  }
  
  return status;
}

async function generateAuditReport(): Promise<AuditReport> {
  console.log('🔍 Generating comprehensive audit report...\n');
  
  const supabase = new SupabaseService();
  
  // Get current hotel count
  const currentHotels = await supabase.getHotelCount();
  const targetProgress = (currentHotels / 1500) * 100;
  const remainingHotels = Math.max(0, 1500 - currentHotels);
  
  // Check process status
  const processStatus = await checkProcessStatus();
  const logTail = await getLogTail();
  
  // Check API status
  const apiStatus = await checkApiConnections();
  
  // Calculate recent activity (simplified for now)
  const recentActivity = {
    newHotelsLast10Min: 0, // Would need timestamp tracking
    averageRate: 0,
    eta: 'Calculating...'
  };
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!processStatus.isRunning) {
    recommendations.push('❌ No fetching process running - restart with: npx ts-node src/optimized-hotel-fetcher.ts');
  }
  
  if (!apiStatus.googlePlaces) {
    recommendations.push('⚠️ Google Places API key not configured - photos may be limited');
  }
  
  if (currentHotels < 100) {
    recommendations.push('🚀 Consider running global fetcher for faster initial population');
  }
  
  if (targetProgress > 80) {
    recommendations.push('🎉 Almost there! Consider quality review of existing hotels');
  }
  
  return {
    currentStatus: {
      totalHotels: currentHotels,
      targetProgress: Math.round(targetProgress * 10) / 10,
      remainingHotels
    },
    processStatus: {
      isRunning: processStatus.isRunning,
      processId: processStatus.processId,
      logFile: '/Users/ala/tindertravel/api/hotel-fetching.log',
      lastActivity: logTail.split('\n').pop()
    },
    apiStatus,
    recentActivity,
    recommendations
  };
}

async function displayReport(report: AuditReport) {
  console.log('🏨 HOTEL FETCHING AUDIT REPORT');
  console.log('==============================\n');
  
  // Current Status
  console.log('📊 CURRENT STATUS:');
  console.log(`   • Hotels in Database: ${report.currentStatus.totalHotels}/1,500`);
  console.log(`   • Progress: ${report.currentStatus.targetProgress}%`);
  console.log(`   • Remaining: ${report.currentStatus.remainingHotels} hotels needed\n`);
  
  // Process Status
  console.log('🔄 PROCESS STATUS:');
  if (report.processStatus.isRunning) {
    console.log(`   ✅ Fetching process ACTIVE (PID: ${report.processStatus.processId})`);
    console.log(`   📝 Log file: ${report.processStatus.logFile}`);
    console.log(`   🕐 Last activity: ${report.processStatus.lastActivity}\n`);
  } else {
    console.log('   ❌ No fetching process running\n');
  }
  
  // API Status
  console.log('🔌 API CONNECTIONS:');
  console.log(`   ${report.apiStatus.amadeus ? '✅' : '❌'} Amadeus API`);
  console.log(`   ${report.apiStatus.supabase ? '✅' : '❌'} Supabase Database`);
  console.log(`   ${report.apiStatus.googlePlaces ? '✅' : '⚠️'} Google Places API\n`);
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log('');
  }
  
  // Quick Actions
  console.log('⚡ QUICK ACTIONS:');
  console.log('   • Monitor live: npx ts-node src/live-monitor.ts');
  console.log('   • Check progress: npx ts-node src/monitor-progress.ts');
  console.log('   • View logs: tail -f hotel-fetching.log');
  console.log('   • Restart fetching: npx ts-node src/optimized-hotel-fetcher.ts');
  console.log('   • Run this audit: npx ts-node src/audit-fetching.ts\n');
}

async function main() {
  try {
    const report = await generateAuditReport();
    await displayReport(report);
    
    // Save report to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `/Users/ala/tindertravel/api/audit-report-${timestamp}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  main();
}

export { generateAuditReport, displayReport }; 