import React, { useState } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelCardProps {
  hotel: HotelCardType;
  onPress?: () => void;
  navigation?: StackNavigationProp<RootStackParamList, 'Home'>;
  isDevelopment?: boolean;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onPress, navigation, isDevelopment = false }) => {
  const theme = useTheme();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoManagerVisible, setPhotoManagerVisible] = useState(false);
  const fadeAnim = new Animated.Value(1);

  const photos = hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto];
  const totalPhotos = photos.length;

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null;
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `from ${currency}${Math.round(amount)}/night`;
  };

  const changePhoto = (direction: 'next' | 'prev') => {
    // Haptic feedback
    IOSHaptics.buttonPress();

    // Fade animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (direction === 'next') {
      setCurrentPhotoIndex((prev) => (prev + 1) % totalPhotos);
    } else {
      setCurrentPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    }
  };

  const handleLeftTap = () => {
    if (totalPhotos > 1) {
      changePhoto('prev');
    }
  };

  const handleRightTap = () => {
    if (totalPhotos > 1) {
      changePhoto('next');
    }
  };

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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Photo Carousel */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: photos[currentPhotoIndex] }}
          style={styles.heroImage}
          contentFit="cover"
          transition={200}
        />
      </Animated.View>

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
          <Text style={styles.hotelName} numberOfLines={2}>
            {hotel.name}
          </Text>
          <Text style={styles.location}>
            {hotel.city}, {hotel.country}
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

      {/* Photo counter */}
      {totalPhotos > 1 && (
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>
            {currentPhotoIndex + 1}/{totalPhotos}
          </Text>
        </View>
      )}

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

      {/* Amadeus Attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>Data © Amadeus</Text>
      </View>

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
    </TouchableOpacity>
  );
};

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
    width: SCREEN_WIDTH * 0.15, // 15% of screen width
    zIndex: 1,
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.15, // 15% of screen width
    zIndex: 1,
  },
  photoIndicators: {
    position: 'absolute',
    top: 50, // Moved higher to avoid collision with content
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 1.0)',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  photoCounter: {
    position: 'absolute',
    top: 20, // Moved up slightly
    right: 15, // Moved closer to edge
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    zIndex: 2,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25, // Increased padding for fullscreen
    paddingBottom: 40, // More bottom padding for fullscreen
  },
  mainInfo: {
    marginBottom: 15,
  },
  hotelName: {
    fontSize: 32, // Larger font for fullscreen
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  location: {
    fontSize: 20, // Larger font for fullscreen
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  attribution: {
    position: 'absolute',
    bottom: 12, // Moved up slightly
    right: 15, // Moved closer to edge
  },
  attributionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.6,
  },
  profileButton: {
    position: 'absolute',
    top: 20,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 3,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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