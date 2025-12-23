import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { StackNavigationProp } from '@react-navigation/stack';
import { HotelCard as HotelCardType, RootStackParamList } from '../types';
import IOSHaptics from '../utils/IOSHaptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { GradientOverlay } from '../ui';
import { getImageSource } from '../utils/imageUtils';
import { useAppStore } from '../store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HotelCardProps {
  hotel: HotelCardType;
  navigation?: StackNavigationProp<RootStackParamList, 'Home'>;
}

const HotelCard: React.FC<HotelCardProps> = memo(({ hotel, navigation }) => {
  const theme = useTheme();
  // Use selectors to prevent unnecessary re-renders - only re-render when THIS hotel's saved status changes
  const saveHotel = useAppStore((state) => state.saveHotel);
  const isSaved = useAppStore((state) => state.savedHotels.liked.some(h => h.id === hotel.id));
  const isSuperliked = useAppStore((state) => state.savedHotels.superliked.some(h => h.id === hotel.id));
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = useMemo(() => 
    hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto], 
    [hotel.photos, hotel.heroPhoto]
  );
  
  const totalPhotos = useMemo(() => photos.length, [photos.length]);

  // Preload ALL photos in background - no dimension fetching needed (always full screen)
  useEffect(() => {
    if (!photos || photos.length === 0) return;
    
    // Preload images in parallel (fire and forget - don't block render)
    photos.forEach((photo: string) => {
      if (photo && photo.length > 0) {
        Image.prefetch(photo).catch(() => {});
      }
    });
  }, [photos]);


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

  // Get image source with fallback
  const currentPhoto = photos[currentPhotoIndex];
  const imageSource = currentPhoto ? getImageSource(currentPhoto) : null;
  const hasValidImage = imageSource && imageSource.uri && imageSource.uri.length > 0;

  // SIMPLIFIED: Always use full screen - no dimension calculations = no flickering
  // All photos fill the entire screen with 'cover' mode for maximum smoothness

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
      {/* Photo Carousel - OPTIMIZED: No transitions, no dimension checks = zero flicker */}
      <View style={styles.imageContainer}>
        <Image
          source={hasValidImage ? imageSource : { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920' }}
          style={styles.heroImage}
          contentFit="cover"
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
});

export default HotelCard; 