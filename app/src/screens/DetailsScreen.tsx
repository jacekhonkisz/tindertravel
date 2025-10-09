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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import UnsplashImage from '../components/UnsplashImage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import IOSBlurView from '../components/IOSBlurView';
import IOSHaptics from '../utils/IOSHaptics';
import HotelMapView from '../components/HotelMapView';
import { useTheme } from '../theme';
import { Button, Card, Chip } from '../ui';
import { getImageSource } from '../utils/imageUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dynamic sizing for different iOS devices
const getResponsiveDimensions = () => {
  const isSmallDevice = SCREEN_HEIGHT < 700; // iPhone SE, etc.
  const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 900; // iPhone 12/13/14
  const isLargeDevice = SCREEN_HEIGHT >= 900; // iPhone 12/13/14 Pro Max, iPad

  return {
    photoHeight: SCREEN_HEIGHT * 0.6, // Increased to 60% of screen height for more immersive photos
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
  const theme = useTheme();
  
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
    // Only check if URL exists, don't validate format
    if (!hotel.bookingUrl || hotel.bookingUrl.trim() === '') {
      Alert.alert(
        'Booking',
        'This hotel is available for booking. In a real app, this would open the booking page.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('🔗 Attempting to open booking URL:', hotel.bookingUrl);

    try {
      // Try to open the URL directly first, as Linking.canOpenURL can be unreliable for web URLs
      await Linking.openURL(hotel.bookingUrl);
      console.log('✅ Successfully opened booking URL');
    } catch (error) {
      console.error('❌ Failed to open booking URL:', error);
      // Only show fallback if opening actually fails
      Alert.alert(
        'Booking',
        'This hotel is available for booking. In a real app, this would open the booking page.',
        [{ text: 'OK' }]
      );
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
          source={getImageSource(hotel.heroPhoto)}
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
          contentContainerStyle={{ flexGrow: 1 }} // Changed from alignItems: 'center' to flexGrow: 1
        >
          {hotel.photos.map((photo, index) => (
            <Image
              key={index}
              source={getImageSource(photo)}
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
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
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.l,
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
      gap: theme.spacing.m,
    },
    likeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.success,
    },
    likeButtonText: {
      fontSize: 20,
      color: theme.success,
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
      flexShrink: 0,
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
      bottom: theme.spacing.xl,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.s,
      zIndex: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    activeDot: {
      backgroundColor: '#fff',
    },
    infoSection: {
      padding: theme.spacing.xl,
    },
    hotelName: {
      fontSize: 28,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: theme.spacing.s,
    },
    location: {
      fontSize: 17,
      color: theme.textSecondary,
      marginBottom: theme.spacing.s,
    },
    price: {
      fontSize: 20,
      color: theme.accent,
      fontWeight: '600',
      marginBottom: theme.spacing.l,
    },
    statusContainer: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    statusBadge: {
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.chip,
      borderWidth: 1,
      borderColor: theme.success,
    },
    superlikedBadge: {
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: '#2196F3',
    },
    statusText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    mapSection: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    bookingSection: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.surface,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.l,
      borderTopWidth: 1,
      borderTopColor: theme.chipBorder,
      zIndex: 50,
      ...theme.shadow.card,
    },
    attributionText: {
      color: theme.textSecondary,
      fontSize: 11,
      textAlign: 'center',
      marginTop: theme.spacing.s,
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor={theme.bg} 
      />
      
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
          <Text style={styles.location}>
            {hotel.address || `${hotel.city}, ${hotel.country}`}
          </Text>
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
        <Button 
          title="Book Now"
          onPress={handleBookNow}
          variant="primary"
          fullWidth
        />
        
        {/* Attribution */}
        <Text style={styles.attributionText}>Data © Amadeus</Text>
      </View>
    </View>
  );
};



export default DetailsScreen; 