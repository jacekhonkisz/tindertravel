import { Image as RNImage } from 'react-native';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Global dimension cache for image dimensions
 * Prevents duplicate getSize() calls and provides instant dimension lookup
 */
class DimensionCache {
  private cache: Map<string, Dimensions> = new Map();
  private loadingPromises: Map<string, Promise<Dimensions | null>> = new Map();

  /**
   * Get dimensions for a photo URL
   * Returns cached dimensions if available, null otherwise
   */
  get(url: string): Dimensions | null {
    return this.cache.get(url) || null;
  }

  /**
   * Check if dimensions are cached for a URL
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Set dimensions for a photo URL
   */
  set(url: string, dimensions: Dimensions): void {
    this.cache.set(url, dimensions);
  }

  /**
   * Load dimensions for a single photo URL
   * Returns cached dimensions if available, otherwise loads and caches
   */
  async load(url: string): Promise<Dimensions | null> {
    if (!url || url.trim() === '') {
      return null;
    }

    // Return cached dimensions if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // If already loading, return the existing promise
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Start loading dimensions
    const promise = new Promise<Dimensions | null>((resolve) => {
      RNImage.getSize(
        url,
        (width, height) => {
          const dimensions = { width, height };
          this.cache.set(url, dimensions);
          this.loadingPromises.delete(url);
          resolve(dimensions);
        },
        () => {
          // Failed to load dimensions
          this.loadingPromises.delete(url);
          resolve(null);
        }
      );
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  /**
   * Preload dimensions for multiple photo URLs in parallel
   * Returns a map of URL -> dimensions
   */
  async preload(urls: string[]): Promise<Map<string, Dimensions>> {
    const validUrls = urls.filter(url => url && url.trim() !== '');
    
    if (validUrls.length === 0) {
      return new Map();
    }

    // Load all dimensions in parallel
    const promises = validUrls.map(async (url) => {
      const dimensions = await this.load(url);
      return { url, dimensions };
    });

    const results = await Promise.all(promises);
    const dimensionsMap = new Map<string, Dimensions>();

    results.forEach(({ url, dimensions }) => {
      if (dimensions) {
        dimensionsMap.set(url, dimensions);
      }
    });

    return dimensionsMap;
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const dimensionCache = new DimensionCache();

