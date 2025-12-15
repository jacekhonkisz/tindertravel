/**
 * Sync Photos from Dropbox to Cloudflare R2 - WITH AUTOMATIC COMPRESSION
 * 
 * This script:
 * 1. Fetches all partners from Partners API
 * 2. Downloads photos from Dropbox folders
 * 3. COMPRESSES images to 1920x1080 @ 85% quality (phone-optimized)
 * 4. Uploads optimized images to Cloudflare R2
 * 5. Returns R2 URLs for use in app
 * 
 * Run: node sync-dropbox-to-r2-optimized.js
 * 
 * Result: 20MB images → ~500KB (40x smaller, same visual quality on phones)
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Check for sharp (image compression)
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Sharp loaded - images will be compressed');
} catch (e) {
  console.log('⚠️  Sharp not installed - run: npm install sharp');
  console.log('   Images will be uploaded without compression (not recommended)');
}

// Use native fetch if available (Node 18+)
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  fetch = require('node-fetch');
}

// ===== CONFIGURATION =====
const DROPBOX_TOKEN = 'sl.u.AGKdm_CD8U48C_CowVBuHsoEhnxqC0B_XxLU_0cz1u3iPwwUeNzmENwGX_VeUiPphrifwuZ_wN1sD86iEd1KZW7lOJg_Gn48SmntYQI22YHygSKm9hpkBII7nCM23Qk2Iw9JaN2C-8nB8oVwj3Iwd_jZ8hsJSwhaV9qUjNLHcM40hQJrJA8wd8JSS4SNvfwinJpmXGnim7eO9bQXDIu6xmhExswozB4JRBf0oKq2BK6Z0U1_JDXKZbHJeTqnrBiQstIIX51AF4836OL0ycr336Vc_Bvxqpy-0hI5J_JmxneRlKn_j67OhyVgBz1tTzouKccgEGPLUdKFg0AIr_fYHZu5Cty2Vaw677WTt19HAsZ0yQiIeVkHsQXG5d5MLTtmSWUInpZ47hOFWiAtXu49OrfX84iN02B2RCf77yAsz9-Zn_RMLTQLLV3W08jpcnjVIhPVDflL3hPk42LW6MKvSHjvmlHBa_EP1k7H-LgGJgqSn-pIVeglQEf2K5BZoOswc3i9LiWJMKvR31SdG3LJJJ74UwusoXYNyBN4OZrvT_k2tSrcDoqJiPambmYyP9CkG7MkJzXZU3L8IleTz9xwpJEtWme_nxhRN-lKSIb-R_fFkG60TjQ_1h1af_qAmRai8YgsKYS847vGHjxns9TVb70xoqP97BLoM8U1Blm4TJSELQZl2qaasq-T7pCmcNB7ZohrYSY0ljukhovOvTBxr_qQKjtX5CVdrA5lyzQMpi2PmYyTIf5qM3Ql2p0RyPwHHXT5u1TqqzSPcQ-CWIxOn9KEXXhOHzfQB9vf-87JLJhaCRdcrklrBzxManWr2IMx2w7xaNRRcPWJQkDi-3v5wxpwdZjpEafMB4elya4WbEsKGOlsbFzX7gQSsHDGiG1JcqwOmVAv-gx8IG0Qqi8A65vkNrBrjq2p7w0r1SdDxfjVsmUAwh0ReSz5i8wwBzzpEOG9DX6IUFgdareL1OeWXbpkETJngBCjmxcsxtnnYihvXjlPj7-EGw8DyTRQtmeNdn7cawDGjnXWRO4Pl3eZZIYDt97jE17-iV2s9fQahD-cWTaQnRPDuYZ8WrTwZlh-k5MGRVouKhRKqT4yfQeuX9f7BfBLSYsgiqcNW5RhBo0huQIaWVRmO3NLQwATOfwqTH9lCL41Hnn0_NVahrR3ikis4B5Umdby6r7gVXyVzwSnUff6WKib3T-DPNmGN8PLtSpUN2B5JwCR4QX8GMmAVhK6dtsbZzyFw8tnmivhD6QDQ8Sb2TJ84_85SYfiydwRj1Fsu-kI-XfekPa_7aYsfZ3cVs-K0xSNBHcPbwt_SnXMlLIGHHJDCptIkLVf5wAT6nO4kn2sEqMD8haZHTLxuC72nMq0alKf1vkJATcnEWFlJVH4jHcdKYULOGwWt0UvA8abL_MWdV-_AgFaOEA5Hjjh';

const R2_CONFIG = {
  accessKeyId: '186c0c52ecc9c21cb4173997b488b748',
  secretAccessKey: '77a6724c613f33498b00334100a63183def4c95184bac4a04356e1a9fb8d08fd',
  endpoint: 'https://1aa4ad77f22f19fa066c9b9327298076.r2.cloudflarestorage.com',
  region: 'auto',
  bucket: 'glintz-hotel-photos',
};

const R2_PUBLIC_URL = 'https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev';

const PARTNERS_API_URL = 'https://web-production-b200.up.railway.app';
const PARTNERS_API_KEY = 'javq6PUgEBDpmKXtasxQkaKpmeKrPqGueqlwOgjXXe8';

// ===== IMAGE OPTIMIZATION SETTINGS =====
// Perfect for phones: covers all iPhone/Android screens with room to spare
const IMAGE_CONFIG = {
  maxWidth: 1920,   // 1080p width - perfect for phones
  maxHeight: 1080,  // 1080p height
  quality: 85,      // JPEG quality (85 = high quality, ~500KB per image)
  format: 'jpeg',   // Output format
};

const s3Client = new S3Client({
  region: R2_CONFIG.region,
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

// ===== HELPER FUNCTIONS =====

async function listDropboxFolder(folderPath) {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DROPBOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path: folderPath })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox API error: ${error}`);
  }
  
  return response.json();
}

async function downloadFromDropbox(filePath) {
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DROPBOX_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify({ path: filePath })
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox download error: ${error}`);
  }
  
  if (response.arrayBuffer) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    return response.buffer();
  }
}

/**
 * COMPRESS IMAGE - The key optimization function
 * 
 * Takes a large image (10-30MB) and compresses to ~500KB
 * while maintaining excellent visual quality on phones.
 */
async function compressImage(buffer, filename) {
  if (!sharp) {
    console.log('     ⚠️  Sharp not available - uploading original');
    return buffer;
  }
  
  try {
    const originalSize = buffer.length;
    
    // Compress: resize to max 1920x1080, convert to JPEG 85%
    const compressed = await sharp(buffer)
      .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
        fit: 'inside',           // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      })
      .jpeg({ 
        quality: IMAGE_CONFIG.quality,
        progressive: true,       // Progressive JPEG loads better
        mozjpeg: true           // Better compression algorithm
      })
      .toBuffer();
    
    const newSize = compressed.length;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(0);
    
    const originalMB = (originalSize / (1024 * 1024)).toFixed(1);
    const newKB = (newSize / 1024).toFixed(0);
    
    console.log(`     📦 ${originalMB}MB → ${newKB}KB (${savings}% smaller)`);
    
    return compressed;
  } catch (error) {
    console.log(`     ⚠️  Compression failed: ${error.message}, uploading original`);
    return buffer;
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
    return { partnerId: partner.id, partnerName: partner.hotel_name, photos: [], skipped: true };
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
      return { partnerId: partner.id, partnerName: partner.hotel_name, photos: [], skipped: false };
    }
    
    console.log(`   📸 Found ${imageFiles.length} photos`);
    
    if (dryRun) {
      console.log('   🔍 DRY RUN - would sync:');
      imageFiles.forEach((f, i) => console.log(`      ${i + 1}. ${f.name}`));
      return { partnerId: partner.id, partnerName: partner.hotel_name, photos: [], dryRun: true };
    }
    
    const r2Urls = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileIndex = String(i + 1).padStart(3, '0');
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `partners/${partner.id}/${fileIndex}-${safeFilename}`;
      
      console.log(`   [${i + 1}/${imageFiles.length}] ${file.name}`);
      
      try {
        // Download from Dropbox
        console.log('     ⬇️  Downloading...');
        const originalBuffer = await downloadFromDropbox(file.path_display);
        
        // COMPRESS the image (this is the key optimization!)
        console.log('     🔄 Compressing...');
        const optimizedBuffer = await compressImage(originalBuffer, file.name);
        
        // Upload to R2
        console.log('     ⬆️  Uploading...');
        const r2Url = await uploadToR2(r2Key, optimizedBuffer, 'image/jpeg');
        
        r2Urls.push(r2Url);
        console.log(`     ✅ ${r2Url}`);
        
      } catch (error) {
        console.log(`     ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Synced ${r2Urls.length}/${imageFiles.length} photos`);
    
    return {
      partnerId: partner.id,
      partnerName: partner.hotel_name,
      photos: r2Urls,
      count: r2Urls.length
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { partnerId: partner.id, partnerName: partner.hotel_name, photos: [], error: error.message };
  }
}

// ===== RUN SYNC =====

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const specificPartner = process.argv.find(arg => arg.startsWith('--partner='))?.split('=')[1];
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   📸 Dropbox → R2 Photo Sync (WITH COMPRESSION)            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║   Compression: ${IMAGE_CONFIG.maxWidth}x${IMAGE_CONFIG.maxHeight} @ ${IMAGE_CONFIG.quality}% JPEG               ║`);
  console.log('║   Result: 20MB originals → ~500KB optimized                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Fetch partners
  console.log('\n📋 Fetching partners...');
  const partnersData = await fetchPartners();
  let partners = partnersData.partners;
  
  if (specificPartner) {
    partners = partners.filter(p => 
      p.hotel_name.toLowerCase().includes(specificPartner.toLowerCase()) ||
      p.id === specificPartner
    );
    console.log(`   Filtered to: ${partners.length} partners matching "${specificPartner}"`);
  }
  
  console.log(`   Found ${partners.length} active partners`);
  
  // Sync each partner
  const results = [];
  for (const partner of partners) {
    const result = await syncPartnerPhotos(partner, dryRun);
    results.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SYNC COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const synced = results.filter(r => r.photos && r.photos.length > 0);
  const totalPhotos = synced.reduce((sum, r) => sum + r.photos.length, 0);
  
  console.log(`✅ Partners synced: ${synced.length}`);
  console.log(`📸 Total photos: ${totalPhotos}`);
  
  if (!dryRun) {
    // Save results
    const filename = `sync-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved: ${filename}`);
    
    // Also save as latest
    fs.writeFileSync('sync-results-final.json', JSON.stringify(synced, null, 2));
    console.log('💾 Updated: sync-results-final.json');
  }
  
  console.log('\n✨ Done! Images are now optimized for mobile (~500KB each)');
}

main().catch(console.error);

