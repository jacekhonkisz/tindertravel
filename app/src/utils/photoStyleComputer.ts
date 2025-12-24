/**
 * Photo Style Computer
 * Computes rendering styles for the 3-mode photo view system
 */

import {
  ViewMode,
  PhotoMetadata,
  ViewportMetadata,
  ComputedPhotoStyles,
} from '../types/photoView';
import { getFocalPoint, computeFocalOffset } from './photoAnchor';

/**
 * Balanced mode parameters
 */
const BALANCED_PARAMS = {
  // Default parameters for most images
  DEFAULT_M_TARGET: 1.45,
  DEFAULT_M_MIN: 1.30,
  MAX_CROP: 0.35,
  
  // Derived: mMax = 1 / (1 - maxCrop)
  get DEFAULT_M_MAX() {
    return 1 / (1 - this.MAX_CROP); // ≈ 1.538
  },

  // Special parameters for extreme panoramas
  EXTREME_PANORAMA_RATIO: 1.9,
  PANORAMA_M_TARGET: 1.35,
  PANORAMA_M_MAX: 1.40,
};

/**
 * Main function: compute photo rendering styles
 */
export function computePhotoStyles(
  photo: PhotoMetadata,
  viewport: ViewportMetadata,
  viewMode: ViewMode
): ComputedPhotoStyles {
  const { width: iw, height: ih } = photo;
  const { width: vw, height: vh } = viewport;

  const aspectRatio = iw / ih;
  const focalPoint = getFocalPoint(photo.tag, photo.focalPoint);

  // Base scales
  const scaleContain = Math.min(vw / iw, vh / ih);
  const scaleCover = Math.max(vw / iw, vh / ih);

  let scale: number;
  let cropPercentage: number;

  switch (viewMode) {
    case 'FULL_VERTICAL_SCREEN':
      scale = scaleCover;
      cropPercentage = calculateCropPercentage(scale, scaleContain);
      break;

    case 'ORIGINAL_FULL':
      scale = scaleContain;
      cropPercentage = 0;
      break;

    case 'BALANCED':
      scale = computeBalancedScale(aspectRatio, scaleContain, scaleCover);
      cropPercentage = calculateCropPercentage(scale, scaleContain);
      break;

    default:
      scale = scaleContain;
      cropPercentage = 0;
  }

  // Compute scaled dimensions
  const scaledWidth = iw * scale;
  const scaledHeight = ih * scale;

  // Compute position based on focal point
  const position = computeFocalOffset(
    { width: iw, height: ih },
    { width: vw, height: vh },
    focalPoint,
    scale
  );

  return {
    mode: viewMode,
    scale,
    imageWidth: scaledWidth,
    imageHeight: scaledHeight,
    containerWidth: vw,
    containerHeight: vh,
    position,
    focalPoint,
    aspectRatio,
    cropPercentage,
  };
}

/**
 * Compute balanced scale using bounded fill algorithm
 */
function computeBalancedScale(
  aspectRatio: number,
  scaleContain: number,
  scaleCover: number
): number {
  let mTarget: number;
  let mMax: number;

  // Use special parameters for extreme panoramas
  if (aspectRatio >= BALANCED_PARAMS.EXTREME_PANORAMA_RATIO) {
    mTarget = BALANCED_PARAMS.PANORAMA_M_TARGET;
    mMax = BALANCED_PARAMS.PANORAMA_M_MAX;
  } else {
    mTarget = BALANCED_PARAMS.DEFAULT_M_TARGET;
    mMax = BALANCED_PARAMS.DEFAULT_M_MAX;
  }

  // Clamp m to [mMin, mMax]
  const m = clamp(
    mTarget,
    BALANCED_PARAMS.DEFAULT_M_MIN,
    mMax
  );

  // Balanced scale is the minimum of cover and (contain * m)
  const scaleBalanced = Math.min(scaleCover, scaleContain * m);

  return scaleBalanced;
}

/**
 * Calculate crop percentage relative to contain mode
 */
function calculateCropPercentage(scale: number, scaleContain: number): number {
  if (scale <= scaleContain) {
    return 0;
  }

  // Crop percentage: how much more we're zooming beyond contain
  // crop = (scale - scaleContain) / scale
  const crop = ((scale - scaleContain) / scale) * 100;
  return Math.round(crop * 10) / 10; // Round to 1 decimal
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get mode display name
 */
export function getModeDisplayName(mode: ViewMode): string {
  switch (mode) {
    case 'FULL_VERTICAL_SCREEN':
      return 'Full';
    case 'ORIGINAL_FULL':
      return 'Fit';
    case 'BALANCED':
      return 'Balance';
    default:
      return 'Unknown';
  }
}

/**
 * Cycle to next view mode
 */
export function cycleViewMode(current: ViewMode): ViewMode {
  switch (current) {
    case 'FULL_VERTICAL_SCREEN':
      return 'ORIGINAL_FULL';
    case 'ORIGINAL_FULL':
      return 'BALANCED';
    case 'BALANCED':
      return 'FULL_VERTICAL_SCREEN';
    default:
      return 'BALANCED';
  }
}

