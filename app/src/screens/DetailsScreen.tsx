import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanResponder,
  Image as RNImage,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import UnsplashImage from '../components/UnsplashImage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
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
    photoHeight: SCREEN_HEIGHT * 0.3, // Reduced to 30% of screen height for smaller photos
    headerHeight: 44 + (Platform.OS === 'ios' ? 44 : 0), // Status bar + header
    bookingButtonHeight: 80, // Button + padding
    bottomPadding: isSmallDevice ? 120 : 140, // Reduced from 250/280 to account for smaller booking section
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
  
  // Debug logging
  console.log('📱 DetailsScreen opened with hotel:', hotel?.name || 'No hotel data');
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  // Store all preloaded dimensions in a Map to prevent duplicate loading and flicker
  const [dimensionsMap, setDimensionsMap] = useState<Map<string, { width: number; height: number }>>(new Map());
  const photoScrollViewRef = React.useRef<ScrollView>(null);
  const { saveHotel, savedHotels } = useAppStore();
  
  const photos = hotel.photos || [];
  const totalPhotos = photos.length > 0 ? photos.length : (hotel.heroPhoto ? 1 : 0);
  
  // Infinite carousel navigation - tap left half for previous, right half for next
  const changePhoto = useCallback((direction: 'next' | 'prev') => {
    if (totalPhotos <= 1) return;
    
    IOSHaptics.buttonPress();
    
    setCurrentPhotoIndex((prev) => {
      const newIndex = direction === 'next' 
        ? (prev + 1) % totalPhotos
        : (prev - 1 + totalPhotos) % totalPhotos;
      
      // Scroll to new photo
      photoScrollViewRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
      
      return newIndex;
    });
  }, [totalPhotos]);
  
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

  // Preload ALL photo dimensions ONCE when screen loads - prevents flicker
  useEffect(() => {
    const photos = hotel.photos || [];
    if (photos.length === 0 && hotel.heroPhoto) {
      photos.push(hotel.heroPhoto);
    }
    
    if (photos.length === 0) return;
    
    const preloadDimensions = async () => {
      const preloadPromises = photos.map(async (photo: string) => {
        if (!photo || photo.length === 0) return { photo, dimensions: null };
        
        // Preload image
        await Image.prefetch(photo).catch(() => {});
        
        // Preload dimensions
        const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
          RNImage.getSize(
            photo,
            (width, height) => resolve({ width, height }),
            () => resolve(null)
          );
        });
        
        return { photo, dimensions };
      });
      
      const results = await Promise.all(preloadPromises);
      const newDimensionsMap = new Map<string, { width: number; height: number }>();
      
      results.forEach(({ photo, dimensions }) => {
        if (dimensions) {
          newDimensionsMap.set(photo, dimensions);
        }
      });
      
      setDimensionsMap(newDimensionsMap);
      
      // Set dimensions for current photo immediately
      const currentPhoto = photos[currentPhotoIndex] || photos[0];
      if (currentPhoto && newDimensionsMap.has(currentPhoto)) {
        setImageDimensions(newDimensionsMap.get(currentPhoto)!);
      }
    };
    
    preloadDimensions();
  }, [hotel.photos, hotel.heroPhoto]); // Only run when hotel changes
  
  // Update dimensions when photo index changes - use preloaded Map (no flicker!)
  useEffect(() => {
    const photos = hotel.photos || [];
    const currentPhoto = photos.length > 0 ? photos[currentPhotoIndex] : (hotel.heroPhoto || '');
    
    if (currentPhoto && dimensionsMap.has(currentPhoto)) {
      // Use preloaded dimensions - instant, no flicker!
      setImageDimensions(dimensionsMap.get(currentPhoto)!);
    } else {
      // Fallback: if dimensions not preloaded yet
      setImageDimensions(null);
    }
  }, [currentPhotoIndex, hotel.photos, hotel.heroPhoto, dimensionsMap]);

  const isLiked = savedHotels.liked.some(h => h.id === hotel.id);
  const isSuperliked = savedHotels.superliked.some(h => h.id === hotel.id);

  // Gesture handling for swipe down to go back using PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if gesture starts from the top 100px of the screen
        return evt.nativeEvent.pageY < 100;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if gesture starts from the top 100px and moves down
        return evt.nativeEvent.pageY < 100 && gestureState.dy > 50;
      },
      onPanResponderGrant: () => {
        // Gesture started
      },
      onPanResponderMove: (evt, gestureState) => {
        // Gesture is moving
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Check if it's a valid swipe down gesture
        if (evt.nativeEvent.pageY < 100 && gestureState.dy > 50) {
          IOSHaptics.navigationTransition();
          navigation.goBack();
        }
      },
    })
  ).current;

  const dimensions = getResponsiveDimensions();

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return null; // No price display
    
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
    const displayPhoto = photos.length > 0 ? photos[currentPhotoIndex] : (hotel.heroPhoto || '');
    
    // Removed excessive debug logging to prevent performance issues

    if (!displayPhoto) {
      console.warn('⚠️ No photos available for hotel:', hotel.name);
      // Show placeholder with hotel name
      return (
        <View style={[styles.singlePhoto, { 
          height: dimensions.photoHeight,
          backgroundColor: '#1a1a1a',
          justifyContent: 'center',
          alignItems: 'center',
        }]}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {hotel.name}
          </Text>
        </View>
      );
    }

    const imageSource = getImageSource(displayPhoto);

    // Smart display based on orientation
    // - Vertical images: Calculate proper size to show full image without cropping
    // - Horizontal images: 60% of FULL SCREEN height with "cover" (good coverage, not too big)
    const isHorizontal = imageDimensions && imageDimensions.width > imageDimensions.height;
    
    // For vertical images: Use full container height with 'cover' to fill screen (no black bars)
    // For horizontal images: Use 60% height with 'cover' for better coverage
    const photoHeight = isHorizontal ? SCREEN_HEIGHT * 0.6 : dimensions.photoHeight;
    const contentFit = 'cover'; // Use 'cover' for both to fill screen completely (no black bars)

    // If single photo or no carousel needed
    if (photos.length <= 1) {
      return (
        <View style={[
          styles.singlePhoto, 
          { 
            height: dimensions.photoHeight,
            justifyContent: 'center',
            backgroundColor: isHorizontal ? '#1a1a1a' : 'transparent' // Single background layer
          }
        ]}>
          <Image
            source={imageSource}
            style={[
              styles.singlePhoto, 
              { 
                height: photoHeight,
                width: '100%',
                alignSelf: 'center'
              }
            ]}
            contentFit={contentFit}
            cachePolicy="memory-disk"
            transition={200}
            onLoad={() => {
              console.log('✅ Photo loaded successfully');
              // Dimensions are already preloaded - no need to load again (prevents flicker)
            }}
            onError={(error) => {
              console.error('❌ Photo load error:', error);
              console.error('❌ Failed URL:', imageSource.uri);
            }}
          />
        </View>
      );
    }

    // Multiple photos - carousel with 50/50 tap areas
    return (
      <View style={[styles.photoCarousel, { height: dimensions.photoHeight, position: 'relative' }]}>
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
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {photos.map((photo, index) => {
            const photoSource = getImageSource(photo);
            // Detect orientation for this photo
            const isPhotoHorizontal = imageDimensions && imageDimensions.width > imageDimensions.height;
            
            // For vertical images: Use full container height with 'cover' to fill screen (no black bars)
            // For horizontal images: Use 60% height with 'cover' for better coverage
            const photoHeight = isPhotoHorizontal ? SCREEN_HEIGHT * 0.6 : dimensions.photoHeight;
            const photoContentFit = 'cover'; // Use 'cover' for both to fill screen completely (no black bars)
            
            return (
              <View 
                key={index}
                style={[
                  styles.carouselPhoto, 
                  { 
                    height: dimensions.photoHeight,
                    width: SCREEN_WIDTH,
                    justifyContent: 'center',
                    backgroundColor: isPhotoHorizontal ? '#1a1a1a' : 'transparent' // Single background layer
                  }
                ]}
              >
                <Image
                  source={photoSource}
                  style={[styles.carouselPhoto, { 
                    height: photoHeight,
                    width: SCREEN_WIDTH,
                    alignSelf: 'center'
                  }]}
                  contentFit={photoContentFit}
                  cachePolicy="memory-disk"
                  transition={200}
                  onLoad={() => {
                    console.log(`✅ Photo ${index} loaded`);
                    // Dimensions are already preloaded - no need to load again (prevents flicker)
                  }}
                  onError={(error) => {
                    console.error(`❌ Photo ${index} load error:`, error);
                    console.error('❌ Failed URL:', photoSource.uri);
                  }}
                />
              </View>
            );
          })}
        </ScrollView>
        
        {/* Left tap area for previous photo (50% of screen) */}
        {totalPhotos > 1 && (
          <TouchableOpacity
            style={styles.leftTapArea}
            onPress={handleLeftTap}
            activeOpacity={1}
          />
        )}
        
        {/* Right tap area for next photo (50% of screen) */}
        {totalPhotos > 1 && (
          <TouchableOpacity
            style={styles.rightTapArea}
            onPress={handleRightTap}
            activeOpacity={1}
          />
        )}
      </View>
    );
  };

  const renderPhotoDots = () => {
    const photos = hotel.photos || [];
    if (photos.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {(hotel.photos || []).map((_, index) => (
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
              accessibilityLabel={`Photo ${index + 1} of ${(hotel.photos || []).length}`}
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
    viewRatesButton: {
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignSelf: 'flex-start',
      marginTop: 12,
      shadowColor: '#FFBE82',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    viewRatesText: {
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '600',
      letterSpacing: 0.01,
    },
    stickyBackButton: {
      position: 'absolute',
      left: theme.spacing.l,
      zIndex: 100,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    backButtonText: {
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
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
    leftTapArea: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: SCREEN_WIDTH * 0.5, // 50% of screen width - left half
      zIndex: 10,
    },
    rightTapArea: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: SCREEN_WIDTH * 0.5, // 50% of screen width - right half
      zIndex: 10,
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
      color: '#000000', // Changed to black instead of theme.textSecondary
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
      paddingBottom: theme.spacing.s,
      marginTop: theme.spacing.l, // Add top margin to separate from hotel info
      minHeight: 200, // Ensure map has minimum height
    },
    bookingSection: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.surface,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.s,
      paddingBottom: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.chipBorder,
      zIndex: 50,
      ...theme.shadow.card,
      justifyContent: 'flex-end',
      minHeight: 'auto',
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor={theme.bg} 
      />
      
      {/* Sticky Back Button */}
      <View style={[styles.stickyBackButton, { top: insets.top + 10 }]}>
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
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        directionalLockEnabled={false}
        scrollsToTop={true}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: dimensions.bottomPadding + insets.bottom,
            minHeight: SCREEN_HEIGHT, // Reduced from SCREEN_HEIGHT + 200
            paddingTop: 0, // No padding needed since we removed the header
          }
        ]}
        alwaysBounceVertical={true}
        decelerationRate="normal"
        scrollIndicatorInsets={{ top: 0, bottom: dimensions.bottomPadding }}
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
          {/* Price removed - No pricing display at all */}
          
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
              hotel={hotel}
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
      </View>
    </View>
  );
};



export default DetailsScreen; 