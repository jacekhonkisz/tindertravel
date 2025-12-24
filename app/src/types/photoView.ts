/**
 * Photo View Mode System Types
 * Defines the 3-mode view system for Glintz swipe cards
 */

export type ViewMode = 'FULL_VERTICAL_SCREEN' | 'ORIGINAL_FULL' | 'BALANCED';

export const VIEW_MODES: Record<ViewMode, ViewMode> = {
  FULL_VERTICAL_SCREEN: 'FULL_VERTICAL_SCREEN',
  ORIGINAL_FULL: 'ORIGINAL_FULL',
  BALANCED: 'BALANCED',
};

export const DEFAULT_VIEW_MODE: ViewMode = 'BALANCED';

/**
 * Photo type tags for smart anchoring
 */
export type PhotoTag = 
  | 'room' 
  | 'bathroom' 
  | 'exterior' 
  | 'pool' 
  | 'lobby' 
  | 'food' 
  | 'unknown';

/**
 * Focal point coordinates (normalized 0-1)
 */
export interface FocalPoint {
  x: number; // 0 (left) to 1 (right)
  y: number; // 0 (top) to 1 (bottom)
}

/**
 * Photo metadata for rendering
 */
export interface PhotoMetadata {
  uri: string;
  width: number;
  height: number;
  tag?: PhotoTag;
  focalPoint?: FocalPoint;
}

/**
 * Viewport metadata (photo display area)
 */
export interface ViewportMetadata {
  width: number;
  height: number;
}

/**
 * Computed photo styles for rendering
 */
export interface ComputedPhotoStyles {
  mode: ViewMode;
  scale: number;
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  position: {
    x: number;
    y: number;
  };
  focalPoint: FocalPoint;
  aspectRatio: number;
  cropPercentage: number; // Percentage of image cropped (for debug)
}

/**
 * Mode toggle button configuration
 */
export interface ModeToggleConfig {
  size: number;
  top: number;
  right: number;
  hitSlop: number;
}

export const MODE_TOGGLE_CONFIG: ModeToggleConfig = {
  size: 36,
  top: 14,
  right: 14,
  hitSlop: 10,
};

/**
 * Screen layout ratios
 */
export const LAYOUT_RATIOS = {
  PHOTO_VIEWPORT: 0.68,
  BOTTOM_INFO: 0.32,
} as const;

/**
 * Brand colors
 */
export const COLORS = {
  NAVY_BLUE: '#0A1929',
  NAVY_BLUE_TRANSLUCENT: 'rgba(10, 25, 41, 0.7)',
  WHITE: '#FFFFFF',
  WHITE_TRANSLUCENT: 'rgba(255, 255, 255, 0.9)',
} as const;

