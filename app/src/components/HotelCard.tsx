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
import { HotelCard as HotelCardType } from '../types';
import IOSHaptics from '../utils/IOSHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelCardProps {
  hotel: HotelCardType;
  onPress?: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onPress }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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
      <View style={styles.gradientOverlay} />

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
            <Text style={styles.price}>
              {formatPrice(hotel.price)}
            </Text>
          )}
        </View>

        {/* Amenity Tags */}
        {hotel.amenityTags.length > 0 && (
          <View style={styles.amenityContainer}>
            {hotel.amenityTags.slice(0, 4).map((tag, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{tag}</Text>
              </View>
            ))}
            {hotel.amenityTags.length > 4 && (
              <View style={styles.amenityTag}>
                <Text style={styles.amenityText}>+{hotel.amenityTags.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Photo counter */}
      {totalPhotos > 1 && (
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>
            {currentPhotoIndex + 1}/{totalPhotos}
          </Text>
        </View>
      )}

      {/* Dev mode indicator for looped hotels */}
      {hotel.id.split('-').length > 3 && (
        <View style={styles.devIndicator}>
          <Text style={styles.devIndicatorText}>LOOP</Text>
        </View>
      )}

      {/* Amadeus Attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>Data © Amadeus</Text>
      </View>
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
    top: 30, // Moved down slightly for better visibility
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
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
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
    // iOS-style gradient with better shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -120 },
    shadowOpacity: 0.9,
    shadowRadius: 120,
    elevation: 0, // Remove Android elevation
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
  amenityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  amenityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  attribution: {
    position: 'absolute',
    bottom: 12, // Moved up slightly
    right: 15, // Moved closer to edge
  },
  attributionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '400',
  },
  devIndicator: {
    position: 'absolute',
    top: 20, // Moved up slightly
    left: 15, // Moved closer to edge
    backgroundColor: 'red',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 3,
  },
  devIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HotelCard; 