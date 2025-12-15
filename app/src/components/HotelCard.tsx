import React, { useState, useCallback, useMemo, memo, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { StackNavigationProp } from '@react-navigation/stack';
import { HotelCard as HotelCardType, RootStackParamList } from '../types';
import IOSHaptics from '../utils/IOSHaptics';
import { PhotoManager } from './PhotoManager';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { useTheme } from '../theme';
import { GradientOverlay, DebugBadge, Chip } from '../ui';
import { getImageSource } from '../utils/imageUtils';
import { useAppStore } from '../store';
import { dimensionCache } from '../utils/dimensionCache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HotelCardProps {
  hotel: HotelCardType;
  onPress?: () => void;
  navigation?: StackNavigationProp<RootStackParamList, 'Home'>;
  isDevelopment?: boolean;
}

const HotelCard: React.FC<HotelCardProps> = memo(({ hotel, onPress, navigation, isDevelopment = false }) => {
  const theme = useTheme();
  const { saveHotel, savedHotels } = useAppStore();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoManagerVisible, setPhotoManagerVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [dimensionsReady, setDimensionsReady] = useState(false);
  const fadeAnim = new Animated.Value(1);
  
  // Check if hotel is already saved
  const isSaved = savedHotels.liked.some(h => h.id === hotel.id);
  const isSuperliked = savedHotels.superliked.some(h => h.id === hotel.id);

  const photos = useMemo(() => 
    hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto], 
    [hotel.photos, hotel.heroPhoto]
  );
  
  const totalPhotos = useMemo(() => photos.length, [photos.length]);

  // Preload ALL photos AND their dimensions ONCE using global cache - prevents flicker and duplicate loading
  useEffect(() => {
    const preloadAllPhotos = async () => {
      if (!photos || photos.length === 0) {
        setDimensionsReady(true);
        return;
      }
      
      setDimensionsReady(false);
      
      // Preload images in parallel
      const imagePrefetchPromises = photos.map((photo: string) => 
        photo && photo.length > 0 ? Image.prefetch(photo).catch(() => {}) : Promise.resolve()
      );
      
      // Preload dimensions using global cache (prevents duplicate calls)
      const dimensionsMap = await dimensionCache.preload(photos);
      
      // Wait for image prefetch to complete
      await Promise.all(imagePrefetchPromises);
      
      // Set dimensions for current photo immediately (prevents flicker)
      const currentPhoto = photos[currentPhotoIndex];
      if (currentPhoto) {
        const dimensions = dimensionCache.get(currentPhoto);
        setImageDimensions(dimensions || null);
      }
      
      setDimensionsReady(true);
    };
    
    preloadAllPhotos();
  }, [photos]); // Only run when photos change, not on photo index change
  
  // Use useLayoutEffect to update dimensions BEFORE browser paint (prevents flicker)
  // This runs synchronously after DOM updates but before paint
  useLayoutEffect(() => {
    const currentPhoto = photos[currentPhotoIndex];
    if (currentPhoto) {
      const dimensions = dimensionCache.get(currentPhoto);
      // Only update if dimensions are different (prevents unnecessary re-renders)
      const currentDimsStr = JSON.stringify(imageDimensions);
      const newDimsStr = JSON.stringify(dimensions);
      if (currentDimsStr !== newDimsStr) {
        setImageDimensions(dimensions || null);
      }
    } else {
      if (imageDimensions !== null) {
        setImageDimensions(null);
      }
    }
  }, [currentPhotoIndex, photos]); // imageDimensions deliberately excluded from deps


  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null;
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `from ${currency}${Math.round(amount)}/night`;
  };

  const changePhoto = useCallback((direction: 'next' | 'prev') => {
    // Haptic feedback - instant
    IOSHaptics.buttonPress();

    // Calculate new index
    const newIndex = direction === 'next' 
      ? (currentPhotoIndex + 1) % totalPhotos
      : (currentPhotoIndex - 1 + totalPhotos) % totalPhotos;
    
    // Get dimensions for new photo from cache BEFORE updating state
    const nextPhoto = photos[newIndex];
    if (nextPhoto) {
      const dimensions = dimensionCache.get(nextPhoto);
      // Update dimensions first to prevent jump
      setImageDimensions(dimensions || null);
    }
    
    // Then update photo index - this prevents intermediate render with wrong dimensions
    setCurrentPhotoIndex(newIndex);
  }, [totalPhotos, currentPhotoIndex, photos]);

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

  const handlePhotoSave = async (updatedPhotos: any[]) => {
    try {
      console.log('Saving photo changes for hotel:', hotel.id, updatedPhotos);
      
      // Convert to API format
      const curatedPhotos = updatedPhotos.map(photo => ({
        url: photo.url,
        order: photo.order,
        is_removed: false, // Photos in updatedPhotos are not removed
      }));

      // Get original photos (current photos before curation)
      const originalPhotos = photos;

      // Save to API
      await apiClient.savePhotoCuration(hotel.id, {
        originalPhotos,
        curatedPhotos,
      });

      console.log('✅ Photo curation saved successfully');
      setPhotoManagerVisible(false);
    } catch (error) {
      console.error('❌ Failed to save photo curation:', error);
      // Keep modal open on error so user can retry
    }
  };

  const convertPhotosToManagerFormat = () => {
    return photos.map((url, index) => ({
      id: `${hotel.id}_photo_${index}`,
      url,
      order: index,
    }));
  };

  const handleDirectRemovePhoto = async () => {
    try {
      console.log('Directly removing photo at index:', currentPhotoIndex, 'for hotel:', hotel.id);
      
      // Haptic feedback
      IOSHaptics.buttonPress();
      
      // Get the original hotel ID (remove the timestamp suffix if it exists)
      const originalHotelId = hotel.id.split('-')[0];
      
      // Call API to remove photo directly
      await apiClient.removePhotoDirectly(originalHotelId, currentPhotoIndex);
      
      console.log('✅ Photo removed directly from backend');
      
      // Update local hotel data immediately for instant UI feedback
      const updatedPhotos = photos.filter((_, index) => index !== currentPhotoIndex);
      
      // Update the hotel object (this is a local update for immediate UI feedback)
      hotel.photos = updatedPhotos;
      
      // Adjust current photo index if needed
      if (currentPhotoIndex >= updatedPhotos.length && updatedPhotos.length > 0) {
        setCurrentPhotoIndex(updatedPhotos.length - 1);
      } else if (updatedPhotos.length === 0) {
        setCurrentPhotoIndex(0);
      }
      
      console.log('✅ UI updated immediately with new photo count:', updatedPhotos.length);
      
    } catch (error) {
      console.error('❌ Failed to remove photo directly:', error);
    }
  };

  const handleSave = useCallback(() => {
    IOSHaptics.likeAction();
    saveHotel(hotel, 'like');
  }, [hotel, saveHotel]);

  // Get image source with fallback
  const currentPhoto = photos[currentPhotoIndex];
  const imageSource = currentPhoto ? getImageSource(currentPhoto) : null;
  const hasValidImage = imageSource && imageSource.uri && imageSource.uri.length > 0;

  // Simple two-category system: horizontal (wide) vs vertical/square
  const getPhotoDisplaySize = useCallback((dimensions: { width: number; height: number } | null) => {
    if (!dimensions) return { height: SCREEN_HEIGHT, isHorizontal: false, shouldCenter: false };
    
    const aspectRatio = dimensions.width / dimensions.height;
    
    // Horizontal (landscape) photos: wider than 1.15:1 ratio
    // Examples: 1920x1080 (1.78), 1600x1200 (1.33), 1200x1000 (1.2)
    if (aspectRatio > 1.15) {
      return { 
        height: SCREEN_HEIGHT * 0.6, 
        isHorizontal: true,
        shouldCenter: true  // Center horizontally-oriented photos
      };
    }
    
    // Vertical/Square photos: 1.15:1 ratio or less
    // Examples: 1080x1920 (0.56), 1000x1200 (0.83), 1080x1080 (1.0)
    return { 
      height: SCREEN_HEIGHT, 
      isHorizontal: false,
      shouldCenter: false  // Fill screen for vertical photos
    };
  }, []);
  
  const displaySize = getPhotoDisplaySize(imageDimensions);
  const imageHeight = displaySize.height;
  const isHorizontal = displaySize.isHorizontal;
  const shouldCenter = displaySize.shouldCenter;
  const imageWidth = '100%';
  const contentFit = 'cover'; // Use 'cover' for both to fill screen completely (no black bars)
  
  // Use placeholder height that matches final image height to prevent layout shift
  const placeholderHeight = imageHeight;
  
  // Calculate marginTop for centering horizontal photos
  const imageMarginTop = shouldCenter ? (SCREEN_HEIGHT - imageHeight) / 2 : 0;

  // Create styles with theme access
  const dynamicStyles = StyleSheet.create({
    hotelName: {
      fontSize: 30,
      fontWeight: '600',
      fontFamily: theme.typography.displayFont, // Minion Pro for headlines (from brandbook)
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
      fontFamily: theme.typography.bodyFont, // Apparat for body text (from brandbook)
      color: '#fff',
      opacity: 0.95,
      marginBottom: 12,
      letterSpacing: 0.01,
      lineHeight: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
  });

  return (
    <View style={styles.container}>
      {/* Photo Carousel - no fade animation for instant response */}
      <View style={[
        styles.imageContainer,
        { backgroundColor: isHorizontal ? '#1a1a1a' : '#000' } // Background for horizontal images
      ]}>
        {hasValidImage && dimensionsReady ? (
          <Image
            source={imageSource}
            style={[
              {
                width: imageWidth,
                height: imageHeight,
                alignSelf: 'center',
                marginTop: imageMarginTop, // Center horizontal images, fill screen for vertical
              }
            ]}
            contentFit={contentFit}
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        ) : (
          // Placeholder with correct height to prevent layout shift
          <View style={[
            styles.heroImage, 
            { 
              backgroundColor: isHorizontal ? '#1a1a1a' : '#000',
              height: placeholderHeight,
              marginTop: imageMarginTop,  // Match image centering
              justifyContent: 'center', 
              alignItems: 'center' 
            }
          ]}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', padding: 20 }}>
              {hotel.name}
            </Text>
          </View>
        )}
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
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={20} 
          color={isSaved ? theme.accent : "#fff"} 
        />
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
        <Text style={styles.profileButtonText}>👤</Text>
      </TouchableOpacity>

      {/* Photo counter - Bottom right */}
      {totalPhotos > 1 && (
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>
            {currentPhotoIndex + 1}/{totalPhotos}
          </Text>
        </View>
      )}

      {/* Development Photo Manager Button */}
      {isDevelopment && (
        <TouchableOpacity
          style={styles.devPhotoButton}
          onPress={() => {
            IOSHaptics.buttonPress();
            setPhotoManagerVisible(true);
          }}
          accessible={true}
          accessibilityLabel="Manage photos (Development only)"
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={16} color="#fff" />
          <Text style={styles.devPhotoButtonText}>Photos</Text>
        </TouchableOpacity>
      )}

      {/* Development Direct Remove Photo Button */}
      {isDevelopment && totalPhotos > 1 && (
        <TouchableOpacity
          style={styles.devRemoveButton}
          onPress={handleDirectRemovePhoto}
          accessible={true}
          accessibilityLabel="Remove current photo (Development only)"
          accessibilityRole="button"
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.devRemoveButtonText}>Remove</Text>
        </TouchableOpacity>
      )}

      {/* Photo Manager Modal */}
      <PhotoManager
        visible={photoManagerVisible}
        onClose={() => setPhotoManagerVisible(false)}
        hotelId={hotel.id}
        hotelName={hotel.name}
        photos={convertPhotosToManagerFormat()}
        onSave={handlePhotoSave}
      />
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
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.5, // 50% of screen width - left half
    zIndex: 100, // High z-index to ensure it's above other elements
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.5, // 50% of screen width - right half
    zIndex: 100, // High z-index to ensure it's above other elements (same as left)
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
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  devPhotoButton: {
    position: 'absolute',
    bottom: 20, // Moved much lower
    left: '50%', // Center horizontally
    transform: [{ translateX: -90 }], // Use transform instead of marginLeft
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 3,
  },
  devPhotoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  devRemoveButton: {
    position: 'absolute',
    bottom: 20, // Same bottom position
    left: '50%', // Center horizontally
    transform: [{ translateX: 10 }], // Position to the right with proper spacing
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 3,
  },
  devRemoveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default HotelCard; 