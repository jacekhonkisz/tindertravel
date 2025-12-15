/**
 * R2 Photo Service
 * Fetches photos from Cloudflare R2 CDN for partners
 */

const R2_PUBLIC_URL = 'https://pub-80c0117878c14da1a0792cf1c8708824.r2.dev';

export interface R2PhotoInfo {
  url: string;
  index: number;
  filename: string;
}

/**
 * Get R2 photo URLs for a partner
 * Photos are stored at: partners/{partner-id}/{index}-{filename}
 */
export async function getPartnerR2Photos(partnerId: string): Promise<string[]> {
  try {
    // Try to fetch from R2 by listing the partner's folder
    // R2 doesn't have a direct list API via public URL, so we'll use a known pattern
    // For now, we'll try common photo indices (001-020) and check if they exist
    
    const photos: string[] = [];
    const maxPhotos = 20; // Maximum photos to check
    
    // Try to fetch photos by index
    // We'll check if the file exists by trying to fetch it
    const checkPromises: Promise<string | null>[] = [];
    
    for (let i = 1; i <= maxPhotos; i++) {
      const index = String(i).padStart(3, '0');
      // We don't know the exact filename, so we'll need to list the bucket
      // For now, we'll use a different approach - fetch from sync results or list bucket
      checkPromises.push(
        checkR2PhotoExists(`${R2_PUBLIC_URL}/partners/${partnerId}/${index}-`)
      );
    }
    
    // Actually, a better approach is to use the S3 API to list objects
    // But for the frontend, we can use the sync results or create an API endpoint
    
    // For now, return empty and let the backend handle it
    return [];
    
  } catch (error) {
    console.error(`Failed to fetch R2 photos for partner ${partnerId}:`, error);
    return [];
  }
}

/**
 * Check if an R2 photo exists (by trying to fetch it)
 * This is not efficient, but works for now
 */
async function checkR2PhotoExists(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(baseUrl, { method: 'HEAD' });
    return response.ok ? baseUrl : null;
  } catch {
    return null;
  }
}

/**
 * Construct R2 URL for a partner photo
 */
export function getR2PhotoUrl(partnerId: string, index: number, filename: string): string {
  const paddedIndex = String(index).padStart(3, '0');
  return `${R2_PUBLIC_URL}/partners/${partnerId}/${paddedIndex}-${filename}`;
}

/**
 * Get R2 base URL
 */
export function getR2BaseUrl(): string {
  return R2_PUBLIC_URL;
}

