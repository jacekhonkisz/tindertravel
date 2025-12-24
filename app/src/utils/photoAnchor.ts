/**
 * Photo Anchoring & Focal Point System
 * Intelligently positions photos to show the most important content
 */

import { PhotoTag, FocalPoint } from '../types/photoView';

/**
 * Tag-based anchor points for common hotel photo types
 * These are optimized focal points based on typical composition
 */
const TAG_BASED_ANCHORS: Record<PhotoTag, FocalPoint> = {
  room: { x: 0.5, y: 0.62 },        // Slightly below center (bed area)
  bathroom: { x: 0.5, y: 0.55 },    // Center-ish (fixtures)
  exterior: { x: 0.5, y: 0.42 },    // Above center (building/sky)
  pool: { x: 0.5, y: 0.5 },         // Dead center
  lobby: { x: 0.5, y: 0.52 },       // Slightly below center
  food: { x: 0.5, y: 0.5 },         // Center
  unknown: { x: 0.5, y: 0.5 },      // Default center
};

/**
 * Get focal point for a photo
 * Priority: explicit focalPoint > tag-based > default center
 */
export function getFocalPoint(
  tag?: PhotoTag,
  explicitFocalPoint?: FocalPoint
): FocalPoint {
  if (explicitFocalPoint) {
    return {
      x: clamp(explicitFocalPoint.x, 0, 1),
      y: clamp(explicitFocalPoint.y, 0, 1),
    };
  }

  if (tag && TAG_BASED_ANCHORS[tag]) {
    return TAG_BASED_ANCHORS[tag];
  }

  return TAG_BASED_ANCHORS.unknown;
}

/**
 * Compute position offset for cropped images based on focal point
 * Returns percentage offsets for positioning
 */
export function computeFocalOffset(
  imageSize: { width: number; height: number },
  containerSize: { width: number; height: number },
  focalPoint: FocalPoint,
  scale: number
): { x: number; y: number } {
  const scaledImageWidth = imageSize.width * scale;
  const scaledImageHeight = imageSize.height * scale;

  // How much extra space we have (negative if cropped)
  const excessWidth = scaledImageWidth - containerSize.width;
  const excessHeight = scaledImageHeight - containerSize.height;

  // If no excess, center it
  if (excessWidth <= 0 && excessHeight <= 0) {
    return { x: 0, y: 0 };
  }

  // Calculate offset to center the focal point
  // focal point 0.5 = center, 0 = left/top, 1 = right/bottom
  let x = 0;
  let y = 0;

  if (excessWidth > 0) {
    // Image is wider than container - shift to show focal point
    // focal 0.5 should center: offset = -excessWidth / 2
    // focal 0 should show left: offset = 0
    // focal 1 should show right: offset = -excessWidth
    x = -excessWidth * focalPoint.x;
  }

  if (excessHeight > 0) {
    // Image is taller than container - shift to show focal point
    y = -excessHeight * focalPoint.y;
  }

  return { x, y };
}

/**
 * Heuristic focal point detection (lightweight, no ML)
 * This is a placeholder for future implementation if needed
 * For now, returns center with slight bias toward upper-center
 */
export function detectFocalPoint(
  imageUri: string,
  imageSize: { width: number; height: number }
): Promise<FocalPoint> {
  // Future: implement lightweight edge detection or saliency
  // For now, return a safe default with slight upward bias
  // (most hotel photos have interesting content in upper-middle)
  return Promise.resolve({
    x: 0.5,
    y: 0.45, // Slightly above center
  });
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Infer photo tag from metadata or filename
 * This is a simple heuristic - can be enhanced with ML
 */
export function inferPhotoTag(
  uri: string,
  metadata?: Record<string, any>
): PhotoTag {
  const lowerUri = uri.toLowerCase();
  
  if (metadata?.tag) {
    return metadata.tag as PhotoTag;
  }

  // Simple keyword matching
  if (lowerUri.includes('room') || lowerUri.includes('bedroom') || lowerUri.includes('suite')) {
    return 'room';
  }
  if (lowerUri.includes('bath')) {
    return 'bathroom';
  }
  if (lowerUri.includes('exterior') || lowerUri.includes('facade') || lowerUri.includes('building')) {
    return 'exterior';
  }
  if (lowerUri.includes('pool')) {
    return 'pool';
  }
  if (lowerUri.includes('lobby') || lowerUri.includes('reception')) {
    return 'lobby';
  }
  if (lowerUri.includes('food') || lowerUri.includes('restaurant') || lowerUri.includes('dining')) {
    return 'food';
  }

  return 'unknown';
}

