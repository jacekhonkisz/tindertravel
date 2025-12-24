import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { StackNavigationProp } from '@react-navigation/stack';
import { HotelCard as HotelCardType, RootStackParamList } from '../types';
import IOSHaptics from '../utils/IOSHaptics';
import Icon from '../ui/Icon';
import { useTheme } from '../theme';
import { GradientOverlay } from '../ui';
import { getImageSource } from '../utils/imageUtils';
import { useAppStore } from '../store';
import { usePhotoViewMode } from '../hooks/usePhotoViewMode';
import { cycleViewMode, getModeDisplayName } from '../utils/photoStyleComputer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// BALANCED mode parameters (from photo view system spec)
const BALANCED_PARAMS = {
  DEFAULT_M_TARGET: 1.45,
  DEFAULT_M_MIN: 1.35,
  MAX_CROP: 0.35,
  get DEFAULT_M_MAX() {
    return 1 / (1 - this.MAX_CROP); // ≈ 1.538
  },
  EXTREME_PANORAMA_RATIO: 1.9,
  PANORAMA_M_TARGET: 1.35,
  PANORAMA_M_MAX: 1.40,
};

/**
 * Compute balanced scale using bounded fill algorithm
 * This is the sweet spot between cover and contain
 */
const computeBalancedScale = (
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): number => {
  if (!imageWidth || !imageHeight || !viewportWidth || !viewportHeight) {
    return 1; // Fallback to no scaling
  }

  const aspectRatio = imageWidth / imageHeight;
  
  // Base scales
  const scaleContain = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const scaleCover = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);

  // Determine multiplier based on aspect ratio
  let mTarget: number;
  let mMax: number;

  if (aspectRatio >= BALANCED_PARAMS.EXTREME_PANORAMA_RATIO) {
    // Extreme panoramas: more conservative
    mTarget = BALANCED_PARAMS.PANORAMA_M_TARGET;
    mMax = BALANCED_PARAMS.PANORAMA_M_MAX;
  } else {
    // Standard images
    mTarget = BALANCED_PARAMS.DEFAULT_M_TARGET;
    mMax = BALANCED_PARAMS.DEFAULT_M_MAX;
  }

  // Clamp m to [mMin, mMax]
  const m = Math.min(Math.max(mTarget, BALANCED_PARAMS.DEFAULT_M_MIN), mMax);

  // Compute balanced scale
  const scaleBalanced = Math.min(scaleCover, scaleContain * m);

  return scaleBalanced;
};

interface HotelCardProps {
  hotel: HotelCardType;
  navigation?: StackNavigationProp<RootStackParamList, 'Home'>;
}

const HotelCard: React.FC<HotelCardProps> = memo(({ hotel, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Use selectors to prevent unnecessary re-renders - only re-render when THIS hotel's saved status changes
  const saveHotel = useAppStore((state) => state.saveHotel);
  const isSaved = useAppStore((state) => state.savedHotels.liked.some(h => h.id === hotel.id));
  const isSuperliked = useAppStore((state) => state.savedHotels.superliked.some(h => h.id === hotel.id));
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);
  
  // Photo view mode
  const { viewMode, setViewMode } = usePhotoViewMode();

  // Compute photo viewport (68% of screen height minus safe area top)
  const photoViewportHeight = SCREEN_HEIGHT * 0.68 - insets.top;
  const photoViewportWidth = SCREEN_WIDTH;

  const photos = useMemo(() => 
    hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto], 
    [hotel.photos, hotel.heroPhoto]
  );
  
  const totalPhotos = useMemo(() => photos.length, [photos.length]);

  // Preload ALL photos in background and fetch dimensions for BALANCED mode
  useEffect(() => {
    if (!photos || photos.length === 0) return;
    
    // Preload images in parallel (fire and forget - don't block render)
    photos.forEach((photo: string) => {
      if (photo && photo.length > 0) {
        Image.prefetch(photo).catch(() => {});
      }
    });

    // Fetch current image dimensions for BALANCED mode calculation
    const currentPhoto = photos[currentPhotoIndex];
    if (currentPhoto && currentPhoto.length > 0) {
      RNImage.getSize(
        currentPhoto,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          console.log('Could not get image size:', error);
          // Fallback to common hotel photo dimensions
          setImageDimensions({ width: 1920, height: 1080 });
        }
      );
    }
  }, [photos, currentPhotoIndex]);


  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null;
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `from ${currency}${Math.round(amount)}/night`;
  };

  const changePhoto = useCallback((direction: 'next' | 'prev') => {
    // Haptic feedback - instant
    IOSHaptics.buttonPress();

    // Calculate new index - simple and fast
    const newIndex = direction === 'next' 
      ? (currentPhotoIndex + 1) % totalPhotos
      : (currentPhotoIndex - 1 + totalPhotos) % totalPhotos;
    
    // Update photo index immediately - no dimension calculations = instant
    setCurrentPhotoIndex(newIndex);
  }, [totalPhotos, currentPhotoIndex]);

  const handleLeftTap = useCallback(() => {
    if (totalPhotos > 1) {
      changePhoto('prev');
    }
  }, [totalPhotos, changePhoto]);

  const handleRightTap = useCallback(() => {
    if (totalPhotos > 1) {
      changePhoto('next');
    }
  }, [totalPhotos, changePhoto]);


  const handleSave = useCallback(() => {
    IOSHaptics.likeAction();
    saveHotel(hotel, 'like');
  }, [hotel, saveHotel]);

  const handleModeToggle = useCallback(() => {
    IOSHaptics.buttonPress();
    const nextMode = cycleViewMode(viewMode);
    setViewMode(nextMode);
  }, [viewMode, setViewMode]);

  // Get image source with fallback
  const currentPhoto = photos[currentPhotoIndex];
  const imageSource = currentPhoto ? getImageSource(currentPhoto) : null;
  const hasValidImage = imageSource && imageSource.uri && imageSource.uri.length > 0;

  // Compute proper rendering based on view mode
  const renderingConfig = useMemo(() => {
    if (viewMode === 'FULL_VERTICAL_SCREEN') {
      // FULL: cover mode, fills entire viewport
      return {
        contentFit: 'cover' as const,
        style: {},
      };
    }

    if (viewMode === 'ORIGINAL_FULL') {
      // FIT: contain mode, shows complete image
      return {
        contentFit: 'contain' as const,
        style: {},
      };
    }

    // BALANCED: Use bounded fill algorithm
    if (imageDimensions) {
      const { width: imgW, height: imgH } = imageDimensions;
      
      // Calculate base scales
      const scaleContain = Math.min(photoViewportWidth / imgW, photoViewportHeight / imgH);
      const scaleCover = Math.max(photoViewportWidth / imgW, photoViewportHeight / imgH);
      
      // Get balanced scale from algorithm (this is the scale we want the image to be)
      const balancedScale = computeBalancedScale(
        imgW,
        imgH,
        photoViewportWidth,
        photoViewportHeight
      );

      // For BALANCED mode: use contain as base, then scale UP to show more than contain
      // balancedScale is between scaleContain and scaleCover
      // finalScale = balancedScale / scaleContain (will be > 1.0, showing less letterboxing)
      // This scales up from contain mode, which naturally shows the full image
      const finalScale = balancedScale / scaleContain;

      return {
        contentFit: 'contain' as const,
        style: {
          transform: [{ scale: finalScale }],
        },
      };
    }

    // Fallback if dimensions not loaded yet
    return {
      contentFit: 'contain' as const,
      style: { transform: [{ scale: 1.15 }] }, // Temporary fallback - slight zoom from contain
    };
  }, [viewMode, imageDimensions, photoViewportWidth, photoViewportHeight]);

  // Memoize dynamic styles to prevent recreation on every render
  const dynamicStyles = useMemo(() => StyleSheet.create({
    hotelName: {
      fontSize: 30,
      fontWeight: '600',
      fontFamily: theme.typography.displayFont,
      color: '#fff',
      marginBottom: 8,
      letterSpacing: 0.01,
      lineHeight: 38,
      textShadowColor: 'rgba(0, 0, 0, 0.35)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    location: {
      fontSize: 18,
      fontWeight: '400',
      fontFamily: theme.typography.bodyFont,
      color: '#fff',
      opacity: 0.95,
      marginBottom: 12,
      letterSpacing: 0.01,
      lineHeight: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
  }), [theme.typography.displayFont, theme.typography.bodyFont]); // Only recreate if fonts change

  return (
    <View style={styles.container}>
      {/* Photo Carousel - Uses proper bounded fill algorithm for BALANCED mode */}
      <View style={[
        styles.imageContainer,
        (viewMode === 'ORIGINAL_FULL' || viewMode === 'BALANCED') && { backgroundColor: '#0A1929' } // Navy blue background
      ]}>
        <Image
          source={hasValidImage ? imageSource : { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920' }}
          style={[
            styles.heroImage,
            renderingConfig.style
          ]}
          contentFit={renderingConfig.contentFit}
          transition={0}
          cachePolicy="memory-disk"
          priority="high"
          placeholder={null}
        />
      </View>

      {/* Left tap area for previous photo */}
      {totalPhotos > 1 && (
        <TouchableOpacity
          style={styles.leftTapArea}
          onPress={handleLeftTap}
          activeOpacity={1}
        />
      )}

      {/* Right tap area for next photo */}
      {totalPhotos > 1 && (
        <TouchableOpacity
          style={styles.rightTapArea}
          onPress={handleRightTap}
          activeOpacity={1}
        />
      )}

      {/* Photo indicators */}
      {totalPhotos > 1 && (
        <View style={styles.photoIndicators}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPhotoIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      )}

      {/* Gradient Overlay */}
      <GradientOverlay height="55%" />

      {/* Hotel Information Overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.mainInfo}>
          <Text style={dynamicStyles.hotelName} numberOfLines={2}>
            {hotel.name}
          </Text>
          <Text style={dynamicStyles.location} numberOfLines={2}>
            {hotel.address || `${hotel.city}, ${hotel.country}`}
          </Text>
          {hotel.price && (
            <View style={[styles.pricePill, { backgroundColor: theme.accent }]}>
              <Text style={styles.priceText}>
                {formatPrice(hotel.price)}
              </Text>
            </View>
          )}
        </View>

      </View>

      {/* Save button - Top right */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        accessible={true}
        accessibilityLabel={isSaved ? "Hotel already saved" : "Save hotel"}
        accessibilityRole="button"
      >
        <Icon 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={20} 
          variant={isSaved ? "accent" : "white"}
        />
      </TouchableOpacity>

      {/* Photo view mode toggle button - Top right, below save button */}
      <TouchableOpacity
        style={styles.viewModeButton}
        onPress={handleModeToggle}
        accessible={true}
        accessibilityLabel={`Change photo view mode. Current: ${getModeDisplayName(viewMode)}`}
        accessibilityRole="button"
      >
        <Icon 
          name={
            viewMode === 'FULL_VERTICAL_SCREEN' ? 'expand' : 
            viewMode === 'ORIGINAL_FULL' ? 'contract' : 
            'balance'
          }
          size={16}
          variant="white"
        />
        <Text style={styles.viewModeLabel}>{getModeDisplayName(viewMode)}</Text>
      </TouchableOpacity>

      {/* Profile button */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => {
          IOSHaptics.navigationTransition();
          navigation?.navigate('Saved');
        }}
        accessible={true}
        accessibilityLabel="View profile and saved hotels"
        accessibilityRole="button"
      >
        <Icon name="person" size={20} variant="white" />
      </TouchableOpacity>

      {/* Photo counter - Bottom right */}
      {totalPhotos > 1 && (
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>
            {currentPhotoIndex + 1}/{totalPhotos}
          </Text>
        </View>
      )}

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 0, // Remove border radius for true fullscreen
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#000', // Base background
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  leftTapArea: {
    position: 'absolute',
    left: 0,
    top: 100, // Start below top buttons
    bottom: 150, // End above bottom info
    width: SCREEN_WIDTH * 0.3, // 30% of screen width - smaller area
    zIndex: 5, // Lower z-index to not block swipe gestures
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 100, // Start below top buttons
    bottom: 150, // End above bottom info
    width: SCREEN_WIDTH * 0.3, // 30% of screen width - smaller area
    zIndex: 5, // Lower z-index to not block swipe gestures
  },
  photoIndicators: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  indicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 1.0)',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 73, // Aligned with location text height
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  saveButton: {
    position: 'absolute',
    top: 28,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 101,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  viewModeButton: {
    position: 'absolute',
    top: 78, // Below save button
    right: 20,
    backgroundColor: 'rgba(10, 25, 41, 0.7)', // Navy blue translucent
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 101,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  viewModeLabel: {
    fontSize: 7,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.02,
  },

  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25, // Increased padding for fullscreen
    paddingBottom: 40, // More bottom padding for fullscreen
    zIndex: 3, // Ensure text renders above gradient overlay
  },
  mainInfo: {
    marginBottom: 15,
  },
  price: {
    fontSize: 18, // Larger font for fullscreen
    color: '#4CAF50',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pricePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 32,
    alignSelf: 'flex-start',
    shadowColor: '#FFBE82',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  priceText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.01,
  },
  profileButton: {
    position: 'absolute',
    top: 28,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 101, // Higher than tap areas (zIndex: 100) to ensure it's clickable
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default HotelCard; 