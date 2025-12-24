/**
 * Hotel to Photo Metadata Converter
 * Transforms HotelCard data to PhotoMetadata for the photo view system
 */

import { PhotoMetadata, PhotoTag } from '../types/photoView';
import { inferPhotoTag } from './photoAnchor';
import { HotelCard } from '../types';
import { Image as RNImage } from 'react-native';

/**
 * Convert hotel photo URLs to PhotoMetadata array
 * Uses default dimensions if real ones aren't available
 */
export function hotelPhotosToMeta(
  photoUrls: string[],
  defaultWidth = 1920,
  defaultHeight = 1080
): PhotoMetadata[] {
  return photoUrls.map(uri => ({
    uri,
    width: defaultWidth,
    height: defaultHeight,
    tag: inferPhotoTag(uri),
  }));
}

/**
 * Convert single hotel hero photo to PhotoMetadata
 */
export function hotelHeroToMeta(
  hotel: HotelCard,
  defaultWidth = 1920,
  defaultHeight = 1080
): PhotoMetadata {
  return {
    uri: hotel.heroPhoto,
    width: defaultWidth,
    height: defaultHeight,
    tag: inferPhotoTag(hotel.heroPhoto),
  };
}

/**
 * Get image dimensions from URL
 * Returns a promise with actual width/height
 */
export function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // For React Native Image component
    if (typeof RNImage !== 'undefined' && RNImage.getSize) {
      RNImage.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        reject
      );
    } else if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
      // Fallback for web
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = uri;
    } else {
      // Ultimate fallback - return default dimensions
      resolve({ width: 1920, height: 1080 });
    }
  });
}

/**
 * Convert hotel photo with dimension fetching
 * Async version that gets real image dimensions
 */
export async function hotelPhotoToMetaAsync(
  uri: string,
  tag?: PhotoTag
): Promise<PhotoMetadata> {
  try {
    const dimensions = await getImageDimensions(uri);
    return {
      uri,
      width: dimensions.width,
      height: dimensions.height,
      tag: tag || inferPhotoTag(uri),
    };
  } catch (error) {
    console.warn('Failed to get image dimensions, using defaults:', error);
    // Fallback to defaults
    return {
      uri,
      width: 1920,
      height: 1080,
      tag: tag || inferPhotoTag(uri),
    };
  }
}

/**
 * Batch convert multiple hotel photos with dimension fetching
 */
export async function hotelPhotosToMetaAsync(
  photoUrls: string[]
): Promise<PhotoMetadata[]> {
  const promises = photoUrls.map(uri => hotelPhotoToMetaAsync(uri));
  return Promise.all(promises);
}

/**
 * Preload images for better performance
 * Call this for upcoming cards in the deck
 */
export function preloadImages(urls: string[]): void {
  if (typeof Image !== 'undefined' && Image.prefetch) {
    // React Native
    urls.forEach(url => {
      Image.prefetch(url).catch(err => {
        console.warn('Image preload failed:', err);
      });
    });
  } else if (typeof window !== 'undefined') {
    // Web
    urls.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }
}

