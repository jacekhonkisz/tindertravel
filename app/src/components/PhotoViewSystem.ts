/**
 * Photo View System - Barrel Export
 * Premium 3-mode photo rendering for Glintz swipe cards
 */

// Core Component
export { SwipePhotoCard } from './SwipePhotoCard';

// Sub-components
export { PhotoViewModeToggle } from './PhotoViewModeToggle';
export { PhotoDebugOverlay } from './PhotoDebugOverlay';

// Hooks
export { usePhotoViewMode } from '../hooks/usePhotoViewMode';

// Types
export type {
  ViewMode,
  PhotoTag,
  FocalPoint,
  PhotoMetadata,
  ViewportMetadata,
  ComputedPhotoStyles,
  ModeToggleConfig,
} from '../types/photoView';

export {
  VIEW_MODES,
  DEFAULT_VIEW_MODE,
  MODE_TOGGLE_CONFIG,
  LAYOUT_RATIOS,
  COLORS,
} from '../types/photoView';

// Utilities
export {
  computePhotoStyles,
  getModeDisplayName,
  cycleViewMode,
} from '../utils/photoStyleComputer';

export {
  getFocalPoint,
  computeFocalOffset,
  inferPhotoTag,
  detectFocalPoint,
} from '../utils/photoAnchor';

