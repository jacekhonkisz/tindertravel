/**
 * R2 Photo Mapping Service
 * Loads and provides R2 photo URLs for partners from sync results
 */

import * as fs from 'fs';
import * as path from 'path';

const R2_PUBLIC_URL = 'https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev';

interface SyncResult {
  partnerId: string;
  partnerName?: string;
  photos: string[];
  count?: number;
  skipped?: boolean;
  error?: string;
}

let photoMapping: Map<string, string[]> | null = null;
let lastLoadTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (was 5 min - too frequent)

/**
 * Load R2 photo mapping from sync results file
 */
function loadPhotoMapping(): Map<string, string[]> {
  const now = Date.now();
  
  // Return cached mapping if still valid
  if (photoMapping && (now - lastLoadTime) < CACHE_DURATION) {
    return photoMapping;
  }
  
  photoMapping = new Map<string, string[]>();
  
  try {
    // Try to find the latest sync results file
    // __dirname in compiled JS will be dist/services/, so go up 2 levels to api/
    const apiDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(apiDir)
      .filter(f => f.startsWith('sync-results') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
    
    if (files.length === 0) {
      console.warn('⚠️  No sync results file found. R2 photos will not be available.');
      console.warn(`   Searched in: ${apiDir}`);
      return photoMapping;
    }
    
    // Try final results first, then most recent
    const finalFile = path.join(apiDir, 'sync-results-final.json');
    const fileToLoad = fs.existsSync(finalFile) 
      ? finalFile 
      : path.join(apiDir, files[0]);
    
    console.log(`📸 Loading R2 photo mapping from: ${path.basename(fileToLoad)}`);
    const data = fs.readFileSync(fileToLoad, 'utf8');
    const results: SyncResult[] = JSON.parse(data);
    
    results.forEach(result => {
      if (result.partnerId && result.photos && Array.isArray(result.photos)) {
        photoMapping!.set(result.partnerId, result.photos);
      }
    });
    
    lastLoadTime = now;
    console.log(`✅ Loaded R2 photos for ${photoMapping.size} partners`);
    
  } catch (error) {
    console.error('❌ Failed to load R2 photo mapping:', error);
  }
  
  return photoMapping;
}

/**
 * Get R2 photo URLs for a partner
 */
export function getPartnerR2Photos(partnerId: string): string[] {
  const mapping = loadPhotoMapping();
  return mapping.get(partnerId) || [];
}

/**
 * Check if partner has R2 photos
 */
export function hasR2Photos(partnerId: string): boolean {
  const mapping = loadPhotoMapping();
  return mapping.has(partnerId) && (mapping.get(partnerId)?.length || 0) > 0;
}

/**
 * Get R2 base URL
 */
export function getR2BaseUrl(): string {
  return R2_PUBLIC_URL;
}

/**
 * Force reload the photo mapping (useful after sync)
 */
export function reloadPhotoMapping(): void {
  photoMapping = null;
  lastLoadTime = 0;
  loadPhotoMapping();
}

