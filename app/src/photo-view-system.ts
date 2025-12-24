/**
 * Photo View System - Complete Export
 * Import everything you need from this single file
 */

// Main Component
export { SwipePhotoCard } from './components/SwipePhotoCard';
export type { SwipePhotoCardProps } from './components/SwipePhotoCard';

// Sub-components
export { PhotoViewModeToggle } from './components/PhotoViewModeToggle';
export { PhotoDebugOverlay } from './components/PhotoDebugOverlay';

// Hook
export { usePhotoViewMode } from './hooks/usePhotoViewMode';

// Types
export type {
  ViewMode,
  PhotoTag,
  FocalPoint,
  PhotoMetadata,
  ViewportMetadata,
  ComputedPhotoStyles,
  ModeToggleConfig,
} from './types/photoView';

export {
  VIEW_MODES,
  DEFAULT_VIEW_MODE,
  MODE_TOGGLE_CONFIG,
  LAYOUT_RATIOS,
  COLORS,
} from './types/photoView';

// Utilities - Photo Style Computation
export {
  computePhotoStyles,
  getModeDisplayName,
  cycleViewMode,
} from './utils/photoStyleComputer';

// Utilities - Focal Point & Anchoring
export {
  getFocalPoint,
  computeFocalOffset,
  inferPhotoTag,
  detectFocalPoint,
} from './utils/photoAnchor';

// Utilities - Hotel Data Conversion
export {
  hotelPhotosToMeta,
  hotelHeroToMeta,
  getImageDimensions,
  hotelPhotoToMetaAsync,
  hotelPhotosToMetaAsync,
  preloadImages,
} from './utils/hotelPhotoConverter';

/**
 * Quick Start Example:
 * 
 * import { SwipePhotoCard, usePhotoViewMode, hotelHeroToMeta } from './photo-view-system';
 * 
 * function MyScreen({ hotel }) {
 *   const { viewMode, setViewMode } = usePhotoViewMode();
 *   const photo = hotelHeroToMeta(hotel);
 *   
 *   return (
 *     <SwipePhotoCard
 *       photo={photo}
 *       viewMode={viewMode}
 *       onModeChange={setViewMode}
 *       hotelInfo={<YourHotelInfo />}
 *     />
 *   );
 * }
 */

