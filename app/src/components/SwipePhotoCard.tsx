/**
 * Swipe Photo Card Component
 * Premium full-screen photo card with 3-mode view system for Glintz
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ViewMode,
  PhotoMetadata,
  LAYOUT_RATIOS,
  COLORS,
} from '../types/photoView';
import { computePhotoStyles } from '../utils/photoStyleComputer';
import { PhotoViewModeToggle } from './PhotoViewModeToggle';
import { PhotoDebugOverlay } from './PhotoDebugOverlay';

export interface SwipePhotoCardProps {
  photo: PhotoMetadata;
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  hotelInfo?: React.ReactNode; // Bottom info area content
  showDebug?: boolean;
  style?: ViewStyle;
}

/**
 * Premium swipe card with intelligent photo rendering
 * Supports 3 view modes with global persistence
 */
export function SwipePhotoCard({
  photo,
  viewMode,
  onModeChange,
  hotelInfo,
  showDebug = false,
  style,
}: SwipePhotoCardProps) {
  const insets = useSafeAreaInsets();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Compute viewport dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const photoViewportHeight =
    screenHeight * LAYOUT_RATIOS.PHOTO_VIEWPORT - insets.top;
  const bottomInfoHeight =
    screenHeight * LAYOUT_RATIOS.BOTTOM_INFO - insets.bottom;

  const viewport = {
    width: screenWidth,
    height: photoViewportHeight,
  };

  // Compute photo styles based on current mode
  const photoStyles = useMemo(() => {
    if (!photo.width || !photo.height) {
      return null;
    }
    return computePhotoStyles(photo, viewport, viewMode);
  }, [photo, viewport.width, viewport.height, viewMode]);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  // Render loading state
  if (!photoStyles) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.photoViewport, { height: photoViewportHeight }]}>
          <View style={styles.loading} />
        </View>
      </View>
    );
  }

  // Build image transform styles
  const imageTransform: ViewStyle = {
    width: photoStyles.imageWidth,
    height: photoStyles.imageHeight,
    transform: [
      { translateX: photoStyles.position.x },
      { translateY: photoStyles.position.y },
    ],
  };

  return (
    <View style={[styles.container, style]}>
      {/* Photo Viewport */}
      <View
        style={[
          styles.photoViewport,
          {
            height: photoViewportHeight,
            backgroundColor: COLORS.NAVY_BLUE,
          },
        ]}
      >
        {/* Photo Container */}
        <View style={styles.photoContainer}>
          <Animated.View
            style={[
              styles.imageWrapper,
              imageTransform,
              { opacity: fadeAnim },
            ]}
          >
            <Image
              source={{ uri: photo.uri }}
              style={styles.image}
              resizeMode="cover"
              onLoad={handleImageLoad}
            />
          </Animated.View>
        </View>

        {/* Mode Toggle */}
        <PhotoViewModeToggle
          currentMode={viewMode}
          onModeChange={onModeChange}
        />

        {/* Debug Overlay */}
        <PhotoDebugOverlay styles={photoStyles} visible={showDebug} />
      </View>

      {/* Bottom Info Area */}
      {hotelInfo && (
        <View
          style={[
            styles.bottomInfo,
            {
              height: bottomInfoHeight,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {hotelInfo}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.NAVY_BLUE,
  },
  photoViewport: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.NAVY_BLUE,
  },
  bottomInfo: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
});
