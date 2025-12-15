/**
 * Sync Photos from Dropbox to Cloudflare R2
 * 
 * This script:
 * 1. Fetches all partners from Partners API
 * 2. Downloads photos from Dropbox folders
 * 3. Uploads to Cloudflare R2
 * 4. Returns R2 URLs for use in app
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Use native fetch if available (Node 18+), otherwise use node-fetch
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  fetch = require('node-fetch');
}

// ===== CONFIGURATION =====
// Load environment variables from .env file
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'DROPBOX_ACCESS_TOKEN',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
  'PARTNERS_API_URL',
  'PARTNERS_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Please create a .env file in the api/ directory with these variables.');
  console.error('   See .env.example for reference.\n');
  process.exit(1);
}

const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

const R2_CONFIG = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  bucket: process.env.R2_BUCKET,
};

// Public R2 URL for serving photos
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const PARTNERS_API_URL = process.env.PARTNERS_API_URL;
const PARTNERS_API_KEY = process.env.PARTNERS_API_KEY;

const s3Client = new S3Client({
  region: R2_CONFIG.region,
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

// ===== HELPER FUNCTIONS =====

async function listDropboxFolder(path) {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DROPBOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox API error: ${error}`);
  }
  
  return response.json();
}

async function downloadFromDropbox(path) {
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DROPBOX_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify({ path })
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox download error: ${error}`);
  }
  
  // Handle both native fetch and node-fetch
  if (response.arrayBuffer) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    return response.buffer();
  }
}

async function uploadToR2(key, buffer, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  }));
  
  return `${R2_PUBLIC_URL}/${key}`;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

async function fetchPartners() {
  const response = await fetch(`${PARTNERS_API_URL}/api/partners?page=1&per_page=100&status=active`, {
    headers: {
      'X-API-Key': PARTNERS_API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Partners API error: ${response.status}`);
  }
  
  return response.json();
}

// ===== MAIN SYNC FUNCTION =====

async function syncPartnerPhotos(partner, dryRun = false) {
  console.log(`\n🏨 ${partner.hotel_name} (${partner.id})`);
  console.log(`   Dropbox: ${partner.dropbox_path || 'NOT SET'}`);
  
  if (!partner.dropbox_path) {
    console.log('   ⚠️  Skipping - no Dropbox folder');
    return { partnerId: partner.id, photos: [], skipped: true };
  }
  
  try {
    // List photos in Dropbox folder
    const folderContents = await listDropboxFolder(partner.dropbox_path);
    const imageFiles = folderContents.entries.filter(f => 
      f['.tag'] === 'file' && 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    );
    
    if (imageFiles.length === 0) {
      console.log('   ⚠️  No photos found');
      return { partnerId: partner.id, photos: [], skipped: false };
    }
    
    console.log(`   📸 Found ${imageFiles.length} photos`);
    
    const r2Urls = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filePath = file.path_display;
      const fileName = file.name;
      const fileIndex = String(i + 1).padStart(3, '0');
      
      // R2 key: partners/{partner-id}/{index}-{filename}
      const r2Key = `partners/${partner.id}/${fileIndex}-${fileName}`;
      
      if (dryRun) {
        console.log(`      [DRY RUN] Would upload: ${r2Key}`);
        r2Urls.push(`https://r2.dev/${r2Key}`); // Placeholder for dry run
        continue;
      }
      
      try {
        // Download from Dropbox
        console.log(`      📥 Downloading: ${fileName}...`);
        const imageBuffer = await downloadFromDropbox(filePath);
        
        // Upload to R2
        console.log(`      📤 Uploading to R2: ${r2Key}...`);
        const contentType = getContentType(fileName);
        const r2Url = await uploadToR2(r2Key, imageBuffer, contentType);
        
        r2Urls.push(r2Url);
        console.log(`      ✅ ${r2Url}`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`      ❌ Error with ${fileName}: ${error.message}`);
      }
    }
    
    return {
      partnerId: partner.id,
      partnerName: partner.hotel_name,
      photos: r2Urls,
      count: r2Urls.length,
    };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { partnerId: partner.id, photos: [], error: error.message };
  }
}

// ===== MAIN =====

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('='.repeat(60));
  console.log('DROPBOX → CLOUDFLARE R2 SYNC');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be uploaded');
  }
  console.log();
  
  if (!dryRun && R2_PUBLIC_URL.includes('YOUR-PUBLIC-URL')) {
    console.warn('⚠️  WARNING: R2_PUBLIC_URL not set - using placeholder URLs');
    console.warn('   Photos will be uploaded but URLs will need to be updated later');
    console.warn('   Get public URL from: Cloudflare R2 dashboard → Your bucket → Settings → Public access');
    console.log();
  }
  
  try {
    // Fetch all partners
    console.log('📋 Fetching partners from API...');
    const partnersResponse = await fetchPartners();
    const partners = partnersResponse.partners;
    console.log(`✅ Found ${partners.length} active partners\n`);
    
    const results = [];
    let totalPhotos = 0;
    
    // Sync each partner
    for (const partner of partners) {
      const result = await syncPartnerPhotos(partner, dryRun);
      results.push(result);
      if (result.count) {
        totalPhotos += result.count;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Partners: ${partners.length}`);
    console.log(`Total Photos Synced: ${totalPhotos}`);
    console.log();
    
    const successful = results.filter(r => r.count > 0);
    const skipped = results.filter(r => r.skipped);
    const errors = results.filter(r => r.error);
    
    if (successful.length > 0) {
      console.log('✅ Successfully synced:');
      successful.forEach(r => {
        console.log(`   ${r.partnerName}: ${r.count} photos`);
      });
    }
    
    if (skipped.length > 0) {
      console.log('\n⚠️  Skipped (no Dropbox folder):');
      skipped.forEach(r => {
        const partner = partners.find(p => p.id === r.partnerId);
        console.log(`   ${partner?.hotel_name || r.partnerId}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(r => {
        const partner = partners.find(p => p.id === r.partnerId);
        console.log(`   ${partner?.hotel_name || r.partnerId}: ${r.error}`);
      });
    }
    
    // Save results to file
    const resultsFile = `sync-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

