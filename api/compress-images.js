#!/usr/bin/env node
/**
 * Image Compression Script for R2
 * 
 * This script downloads images from R2, compresses them, and re-uploads.
 * Run this ONCE to optimize all images.
 * 
 * Prerequisites:
 * - npm install sharp aws-sdk
 * - Set R2 credentials in environment
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('📦 sharp not installed. Run: npm install sharp');
  console.log('');
  console.log('After installing, run this script again to compress images.');
  console.log('');
  console.log('=== MANUAL COMPRESSION ALTERNATIVE ===');
  console.log('');
  console.log('If you prefer, you can manually compress images:');
  console.log('1. Download images from R2');
  console.log('2. Use ImageMagick or online tools to resize to 1920x1080, JPEG 80%');
  console.log('3. Re-upload to R2');
  console.log('');
  console.log('Target size: ~500KB per image (currently 20MB each!)');
  process.exit(0);
}

const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// R2 Configuration
const R2_ACCOUNT_ID = 'fc8c79f7a7f22afb1c05bf249c052823';
const R2_ACCESS_KEY = 'd3dcb80dbc77f2da7a5cba0e2a730ef4';
const R2_SECRET_KEY = '2c34eb8e94b37a6f2f5c3e14c9a34e16e01b8b9742f4c4e8a5d6b7c8d9e0f1a2';
const R2_BUCKET = 'glintz-hotels';
const R2_PUBLIC_URL = 'https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// Target dimensions and quality
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;
const JPEG_QUALITY = 80;

async function listAllImages() {
  const images = [];
  let continuationToken;
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: 'partners/',
      ContinuationToken: continuationToken,
    });
    
    const response = await s3Client.send(command);
    
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && (obj.Key.endsWith('.jpg') || obj.Key.endsWith('.jpeg') || obj.Key.endsWith('.png'))) {
          images.push({
            key: obj.Key,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
          });
        }
      }
    }
    
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  
  return images;
}

async function compressImage(imageKey) {
  console.log(`📸 Processing: ${imageKey}`);
  
  // Download
  const getCommand = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: imageKey,
  });
  
  const response = await s3Client.send(getCommand);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  const imageBuffer = Buffer.concat(chunks);
  const originalSize = imageBuffer.length;
  
  // Compress
  const compressedBuffer = await sharp(imageBuffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();
  
  const newSize = compressedBuffer.length;
  const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
  
  console.log(`   Original: ${(originalSize / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`   Compressed: ${(newSize / (1024 * 1024)).toFixed(2)}MB (${savings}% smaller)`);
  
  // Upload compressed version
  const putCommand = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: imageKey,
    Body: compressedBuffer,
    ContentType: 'image/jpeg',
  });
  
  await s3Client.send(putCommand);
  console.log(`   ✅ Uploaded compressed version`);
  
  return { originalSize, newSize };
}

async function main() {
  console.log('🔍 Scanning R2 for images...\n');
  
  const images = await listAllImages();
  console.log(`Found ${images.length} images\n`);
  
  // Show current sizes
  const totalSizeMB = images.reduce((sum, img) => sum + parseFloat(img.sizeMB), 0);
  const largeImages = images.filter(img => parseFloat(img.sizeMB) > 1);
  
  console.log('=== CURRENT STATE ===');
  console.log(`Total images: ${images.length}`);
  console.log(`Total size: ${totalSizeMB.toFixed(1)}MB`);
  console.log(`Large images (>1MB): ${largeImages.length}`);
  console.log('');
  
  if (largeImages.length === 0) {
    console.log('✅ All images are already optimized!');
    return;
  }
  
  console.log('Large images to compress:');
  largeImages.slice(0, 5).forEach(img => {
    console.log(`  - ${img.key}: ${img.sizeMB}MB`);
  });
  if (largeImages.length > 5) {
    console.log(`  ... and ${largeImages.length - 5} more`);
  }
  console.log('');
  
  // Check if running in dry-run mode
  if (process.argv.includes('--dry-run')) {
    console.log('DRY RUN - no changes made');
    console.log('Run without --dry-run to compress images');
    return;
  }
  
  console.log('=== COMPRESSING ===\n');
  
  let totalSaved = 0;
  for (const img of largeImages) {
    try {
      const result = await compressImage(img.key);
      totalSaved += result.originalSize - result.newSize;
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('=== COMPLETE ===');
  console.log(`Total space saved: ${(totalSaved / (1024 * 1024)).toFixed(1)}MB`);
}

main().catch(console.error);

