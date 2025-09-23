import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import IOSBlurView from '../components/IOSBlurView';
import IOSHaptics from '../utils/IOSHaptics';
import HotelMapView from '../components/HotelMapView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dynamic sizing for different iOS devices
const getResponsiveDimensions = () => {
  const isSmallDevice = SCREEN_HEIGHT < 700; // iPhone SE, etc.
  const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 900; // iPhone 12/13/14
  const isLargeDevice = SCREEN_HEIGHT >= 900; // iPhone 12/13/14 Pro Max, iPad

  return {
    photoHeight: isSmallDevice ? Math.min(SCREEN_HEIGHT * 0.4, 300) : 
                 isMediumDevice ? Math.min(SCREEN_HEIGHT * 0.45, 350) : 
                 Math.min(SCREEN_HEIGHT * 0.5, 400),
    headerHeight: 44 + (Platform.OS === 'ios' ? 44 : 0), // Status bar + header
    bookingButtonHeight: 80, // Button + attribution + padding
    bottomPadding: isSmallDevice ? 180 : 200, // Increased to prevent button overlap
  };
};

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;
type DetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Details'>;

const DetailsScreen: React.FC = () => {
  const navigation = useNavigation<DetailsScreenNavigationProp>();
  const route = useRoute<DetailsScreenRouteProp>();
  const { hotel } = route.params;
  const insets = useSafeAreaInsets();
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoScrollViewRef = React.useRef<ScrollView>(null);
  const { saveHotel, savedHotels } = useAppStore();

  const isLiked = savedHotels.liked.some(h => h.id === hotel.id);
  const isSuperliked = savedHotels.superliked.some(h => h.id === hotel.id);

  const dimensions = getResponsiveDimensions();

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return 'Price on request';
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `from ${currency}${Math.round(amount)}/night`;
  };

  const handleBookNow = async () => {
    try {
      const supported = await Linking.canOpenURL(hotel.bookingUrl);
      if (supported) {
        await Linking.openURL(hotel.bookingUrl);
      } else {
        Alert.alert(
          'Booking',
          'This hotel is available for booking. In a real app, this would open the booking page.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to open booking URL:', error);
      Alert.alert('Error', 'Could not open booking page');
    }
  };

  const handleSave = (type: 'like' | 'superlike') => {
    if (type === 'superlike') {
      IOSHaptics.superlikeAction();
    } else {
      IOSHaptics.likeAction();
    }
    
    saveHotel(hotel, type);
    Alert.alert(
      'Saved!',
      `Hotel ${type === 'superlike' ? 'super liked' : 'liked'} and saved to your favorites.`,
      [{ text: 'OK' }]
    );
  };

  const renderPhotoCarousel = () => {
    if (hotel.photos.length <= 1) {
      return (
        <Image
          source={{ uri: hotel.heroPhoto }}
          style={[styles.singlePhoto, { height: dimensions.photoHeight }]}
          contentFit="cover"
        />
      );
    }

    return (
      <View style={[styles.photoCarousel, { height: dimensions.photoHeight }]}>
        <ScrollView
          ref={photoScrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
          directionalLockEnabled={true}
          alwaysBounceHorizontal={false}
          contentInsetAdjustmentBehavior="never"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentPhotoIndex(index);
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {hotel.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={[styles.carouselPhoto, { 
                height: dimensions.photoHeight,
                width: SCREEN_WIDTH 
              }]}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPhotoDots = () => {
    if (hotel.photos.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {hotel.photos.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentPhotoIndex && styles.activeDot,
            ]}
            onPress={() => {
              // Allow users to tap dots to navigate photos
              if (photoScrollViewRef.current) {
                photoScrollViewRef.current.scrollTo({
                  x: index * SCREEN_WIDTH,
                  animated: true,
                });
              }
              setCurrentPhotoIndex(index);
            }}
            accessible={true}
            accessibilityLabel={`Photo ${index + 1} of ${hotel.photos.length}`}
            accessibilityRole="button"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with iOS blur */}
      <IOSBlurView 
        blurType="dark" 
        blurAmount={20} 
        style={[styles.headerBlur, { paddingTop: insets.top }] as any}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              IOSHaptics.navigationTransition();
              navigation.goBack();
            }}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {!isLiked && (
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleSave('like')}
              accessible={true}
              accessibilityLabel="Like hotel"
              accessibilityRole="button"
            >
              <Text style={styles.likeButtonText}>♡</Text>
            </TouchableOpacity>
          )}
          
          {!isSuperliked && (
            <TouchableOpacity
              style={styles.superlikeButton}
              onPress={() => handleSave('superlike')}
              accessible={true}
              accessibilityLabel="Super like hotel"
              accessibilityRole="button"
            >
              <Text style={styles.superlikeButtonText}>★</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      </IOSBlurView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: dimensions.bottomPadding + insets.bottom,
            minHeight: SCREEN_HEIGHT + 200, // Ensure enough scrollable content
            paddingTop: insets.top + 70, // Account for header height
          }
        ]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={true}
        decelerationRate="normal"
        scrollIndicatorInsets={{ top: insets.top + 70, bottom: dimensions.bottomPadding }}
      >
        {/* Photo Carousel */}
        <View style={[styles.photoSection, { height: dimensions.photoHeight }]}>
          {renderPhotoCarousel()}
          {renderPhotoDots()}
        </View>

        {/* Hotel Information */}
        <View style={styles.infoSection}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <Text style={styles.location}>{hotel.city}, {hotel.country}</Text>
          <Text style={styles.price}>{formatPrice(hotel.price)}</Text>
          
          {/* Status indicators */}
          <View style={styles.statusContainer}>
            {isLiked && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>♡ Liked</Text>
              </View>
            )}
            {isSuperliked && (
              <View style={[styles.statusBadge, styles.superlikedBadge]}>
                <Text style={styles.statusText}>★ Super Liked</Text>
              </View>
            )}
          </View>
        </View>

        {/* Amenities */}
        {hotel.amenityTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              {hotel.amenityTags.map((tag, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Map View (if coordinates available) */}
        {hotel.coords && (
          <View style={styles.mapSection}>
            <HotelMapView
              coords={hotel.coords}
              hotelName={hotel.name}
              city={hotel.city}
              country={hotel.country}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed Book Now Button - positioned to avoid map overlap */}
      <View style={[
        styles.bookingSection, 
        { 
          paddingBottom: Math.max(insets.bottom + 10, 20),
          bottom: 0,
        }
      ]}>
        <TouchableOpacity 
          style={styles.bookButton} 
          onPress={handleBookNow}
          accessible={true}
          accessibilityLabel="Book this hotel now"
          accessibilityRole="button"
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
        
        {/* Attribution */}
        <Text style={styles.attributionText}>Data © Amadeus</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  likeButtonText: {
    fontSize: 20,
    color: '#4CAF50',
  },
  superlikeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  superlikeButtonText: {
    fontSize: 20,
    color: '#2196F3',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
  },
  photoSection: {
    position: 'relative',
    width: SCREEN_WIDTH,
    flexShrink: 0, // Prevent photo section from shrinking
  },
  singlePhoto: {
    width: SCREEN_WIDTH,
  },
  photoCarousel: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  carouselPhoto: {
    width: SCREEN_WIDTH,
    resizeMode: 'cover',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  infoSection: {
    padding: 20,
  },
  hotelName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  location: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  superlikedBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: '#2196F3',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  amenityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  mapSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookingSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50, // Ensure it stays on top
    // Add backdrop blur effect for iOS
    ...(Platform.OS === 'ios' && {
      backdropFilter: 'blur(20px)',
    }),
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attributionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default DetailsScreen; 