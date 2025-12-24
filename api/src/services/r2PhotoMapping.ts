/**
 * R2 Photo Mapping Service
 * Loads R2 photo URLs for partners from sync-results.json
 * 
 * NOTE: Direct R2 bucket listing via S3 API is disabled due to credential issues.
 * Partners table photos require sync-results.json file to be present.
 * Giata table photos work via CRM API (no R2 needed).
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
let hasWarnedAboutMissingFile = false;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Load R2 photo mapping from sync results file
 */
async function loadPhotoMapping(): Promise<Map<string, string[]>> {
  const now = Date.now();
  
  // Return cached mapping if still valid
  if (photoMapping && (now - lastLoadTime) < CACHE_DURATION) {
    return photoMapping;
  }
  
  photoMapping = new Map<string, string[]>();
  
  try {
    // Try to find the latest sync results file
    const apiDir = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(apiDir)
      .filter(f => f.startsWith('sync-results') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      // Load from sync file
      const finalFile = path.join(apiDir, 'sync-results-final.json');
      const fileToLoad = fs.existsSync(finalFile) ? finalFile : path.join(apiDir, files[0]);
      
      console.log(`📸 Loading R2 photo mapping from: ${path.basename(fileToLoad)}`);
      const data = fs.readFileSync(fileToLoad, 'utf8');
      const results: SyncResult[] = JSON.parse(data);
      
      results.forEach(result => {
        if (result.partnerId && result.photos && Array.isArray(result.photos)) {
          photoMapping!.set(result.partnerId, result.photos);
        }
      });
      
      lastLoadTime = now;
      console.log(`✅ Loaded R2 photos for ${photoMapping.size} partners from sync file`);
    } else {
      // No sync file - warn once only
      if (!hasWarnedAboutMissingFile) {
        console.warn('⚠️  No sync-results.json found. Partners table photos not available.');
        console.warn('   Run the photo sync script to generate sync-results.json');
        console.warn('   Giata table photos work independently via CRM API.');
        hasWarnedAboutMissingFile = true;
      }
      lastLoadTime = now;
    }
    
  } catch (error) {
    console.error('❌ Failed to load R2 photo mapping:', error);
  }
  
  return photoMapping;
}

/**
 * Get R2 photo URLs for a partner
 * Only works if sync-results.json is present
 */
export async function getPartnerR2Photos(partnerId: string): Promise<string[]> {
  const mapping = await loadPhotoMapping();
  return mapping.get(partnerId) || [];
}

/**
 * Check if partner has R2 photos
 */
export async function hasR2Photos(partnerId: string): Promise<boolean> {
  const photos = await getPartnerR2Photos(partnerId);
  return photos.length > 0;
}

/**
 * Get R2 base URL
 */
export function getR2BaseUrl(): string {
  return R2_PUBLIC_URL;
}

/**
 * Force reload the photo mapping
 */
export function reloadPhotoMapping(): void {
  photoMapping = null;
  lastLoadTime = 0;
}

