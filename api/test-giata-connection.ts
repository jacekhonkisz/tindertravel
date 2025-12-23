/**
 * Test Script for Giata Partners API Connection
 * Run this to verify the second database connection is working
 */

import * as dotenv from 'dotenv';
import { giataPartnersApi, GiataPartner } from './src/services/giataPartnersApi';

// Load environment variables
dotenv.config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
  error?: string;
}

async function runTests(): Promise<void> {
  const results: TestResult[] = [];
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  GIATA PARTNERS API CONNECTION TEST (Second Database)       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Test 1: API Configuration
  console.log('📋 Test 1: Checking API Configuration...');
  const apiUrl = process.env.GIATA_API_BASE_URL;
  const apiKey = process.env.GIATA_API_KEY;
  
  if (!apiUrl || !apiKey) {
    results.push({
      test: 'API Configuration',
      status: 'FAIL',
      message: 'Environment variables not set',
      error: 'GIATA_API_BASE_URL or GIATA_API_KEY missing'
    });
    console.log('❌ FAIL: Environment variables not configured\n');
  } else {
    results.push({
      test: 'API Configuration',
      status: 'PASS',
      message: `API URL: ${apiUrl}`,
      data: { url: apiUrl, keyLength: apiKey.length }
    });
    console.log(`✅ PASS: API URL configured: ${apiUrl}\n`);
  }

  // Test 2: API Connection Test
  console.log('🔌 Test 2: Testing API Connection...');
  try {
    const connectionResult = await giataPartnersApi.testConnection();
    
    if (connectionResult.success) {
      results.push({
        test: 'API Connection',
        status: 'PASS',
        message: connectionResult.message,
        data: connectionResult.details
      });
      console.log('✅ PASS: Successfully connected to Giata Partners API');
      console.log(`   Details: ${JSON.stringify(connectionResult.details, null, 2)}\n`);
    } else {
      results.push({
        test: 'API Connection',
        status: 'FAIL',
        message: connectionResult.message,
        error: connectionResult.message
      });
      console.log(`❌ FAIL: ${connectionResult.message}\n`);
    }
  } catch (error) {
    results.push({
      test: 'API Connection',
      status: 'FAIL',
      message: 'Connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // Test 3: Fetch Partners List
  console.log('📝 Test 3: Fetching Partners List...');
  try {
    const partnersResponse = await giataPartnersApi.listPartners({
      page: 1,
      per_page: 10,
      partner_status: 'approved'
    });

    results.push({
      test: 'Fetch Partners',
      status: 'PASS',
      message: `Found ${partnersResponse.total} total partners, showing ${partnersResponse.partners.length}`,
      data: {
        total: partnersResponse.total,
        page: partnersResponse.page,
        per_page: partnersResponse.per_page,
        total_pages: partnersResponse.total_pages
      }
    });
    
    console.log(`✅ PASS: Retrieved ${partnersResponse.partners.length} partners`);
    console.log(`   Total partners: ${partnersResponse.total}`);
    console.log(`   Pages: ${partnersResponse.total_pages}\n`);

    // Show first 3 partners
    if (partnersResponse.partners.length > 0) {
      console.log('   Sample partners:');
      partnersResponse.partners.slice(0, 3).forEach((partner, idx) => {
        console.log(`   ${idx + 1}. ${partner.hotel_name} - ${partner.city_name}, ${partner.country_name}`);
        console.log(`      Status: ${partner.partner_status}, Photos: ${partner.selected_photo_count || 0}`);
      });
      console.log('');
    }
  } catch (error) {
    results.push({
      test: 'Fetch Partners',
      status: 'FAIL',
      message: 'Failed to fetch partners',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // Test 4: Fetch Partner Statistics
  console.log('📊 Test 4: Fetching Partner Statistics...');
  try {
    const statsResponse = await giataPartnersApi.getStats();

    results.push({
      test: 'Partner Statistics',
      status: 'PASS',
      message: 'Successfully retrieved statistics',
      data: statsResponse.stats
    });

    console.log('✅ PASS: Retrieved partner statistics');
    console.log(`   Total partners: ${statsResponse.stats.total}`);
    console.log(`   By status:`);
    console.log(`     - Approved: ${statsResponse.stats.by_status.approved}`);
    console.log(`     - Candidate: ${statsResponse.stats.by_status.candidate}`);
    console.log(`     - Rejected: ${statsResponse.stats.by_status.rejected}`);
    console.log(`     - Archived: ${statsResponse.stats.by_status.archived}`);
    
    if (statsResponse.stats.by_country && statsResponse.stats.by_country.length > 0) {
      console.log(`   Top countries:`);
      statsResponse.stats.by_country.slice(0, 5).forEach(([country, count]) => {
        console.log(`     - ${country}: ${count}`);
      });
    }
    console.log('');
  } catch (error) {
    results.push({
      test: 'Partner Statistics',
      status: 'FAIL',
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // Test 5: Fetch Photos for a Hotel
  console.log('📸 Test 5: Fetching Photos from Cloudflare...');
  try {
    // First, get a partner with photos
    const partnersResponse = await giataPartnersApi.listPartners({
      page: 1,
      per_page: 50,
      partner_status: 'approved'
    });

    const partnerWithPhotos = partnersResponse.partners.find(p => p.has_selected_photos && p.giata_id);

    if (partnerWithPhotos && partnerWithPhotos.giata_id) {
      const photosResponse = await giataPartnersApi.getSelectedPhotos(partnerWithPhotos.giata_id);

      results.push({
        test: 'Fetch Photos',
        status: 'PASS',
        message: `Retrieved ${photosResponse.count} photos for hotel`,
        data: {
          giata_id: photosResponse.giata_id,
          photo_count: photosResponse.count,
          has_hero: photosResponse.photos.some(p => p.is_hero)
        }
      });

      console.log(`✅ PASS: Retrieved ${photosResponse.count} photos`);
      console.log(`   Hotel: ${partnerWithPhotos.hotel_name}`);
      console.log(`   Giata ID: ${photosResponse.giata_id}`);
      console.log(`   Hero photo: ${photosResponse.photos.some(p => p.is_hero) ? 'Yes' : 'No'}`);
      console.log(`   Sample URL: ${photosResponse.photos[0]?.cloudflare_public_url?.substring(0, 60)}...`);
      console.log('');
    } else {
      results.push({
        test: 'Fetch Photos',
        status: 'SKIP',
        message: 'No partners with photos found'
      });
      console.log('⏭️  SKIP: No partners with photos available\n');
    }
  } catch (error) {
    results.push({
      test: 'Fetch Photos',
      status: 'FAIL',
      message: 'Failed to fetch photos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  // Print Summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`✅ Passed:  ${passed}/${results.length}`);
  console.log(`❌ Failed:  ${failed}/${results.length}`);
  console.log(`⏭️  Skipped: ${skipped}/${results.length}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Giata Partners API is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration and logs above.\n');
  }

  // Print detailed results
  console.log('Detailed Results:');
  console.log(JSON.stringify(results, null, 2));
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✨ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });

