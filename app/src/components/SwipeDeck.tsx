import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Text,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { HotelCard, SwipeAction } from '../types';
import HotelCardComponent from './HotelCard';
import IOSHaptics from '../utils/IOSHaptics';
import IOSBlurView from './IOSBlurView';
import IOSPerformance from '../utils/IOSPerformance';
import HotelMapView from './HotelMapView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;
const DETAILS_ANIMATION_DURATION = 300;

// True fullscreen card sizing - covers entire screen
const getCardDimensions = (insets: any) => {
  // Use 100% of screen width - truly edge to edge
  const cardWidth = SCREEN_WIDTH;
  
  // Use 100% of screen height minus only the safe areas
  // This ensures cards go edge-to-edge while respecting notches/home indicator
  const cardHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
  
  return { width: cardWidth, height: cardHeight };
};

interface SwipeDeckProps {
  hotels: HotelCard[];
  currentIndex: number;
  onSwipe: (hotelId: string, action: SwipeAction) => void;
  loading?: boolean;
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({
  hotels,
  currentIndex,
  onSwipe,
  loading = false,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const detailsTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const cardDimensions = getCardDimensions(insets);
  
  const [showingDetails, setShowingDetails] = useState(false);
  const [detailsHotel, setDetailsHotel] = useState<HotelCard | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoScrollViewRef = useRef<ScrollView>(null);

  // Reset animations when currentIndex changes
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    opacity.setValue(1);
    // Close details if open when switching cards
    if (showingDetails) {
      hideDetails();
    }
  }, [currentIndex]);

  const showDetails = (hotel: HotelCard) => {
    setDetailsHotel(hotel);
    setShowingDetails(true);
    setCurrentPhotoIndex(0);
    
    IOSHaptics.navigationTransition();
    
    Animated.parallel([
      Animated.timing(detailsTranslateY, {
        toValue: 0,
        duration: DETAILS_ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(detailsOpacity, {
        toValue: 1,
        duration: DETAILS_ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const hideDetails = () => {
    IOSHaptics.navigationTransition();
    
    Animated.parallel([
      Animated.timing(detailsTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: DETAILS_ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(detailsOpacity, {
        toValue: 0,
        duration: DETAILS_ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowingDetails(false);
      setDetailsHotel(null);
      // Reset card position to ensure smooth swiping continues
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
      opacity.setValue(1);
    });
  };

  // Pan responder for details view to allow swiping down to close
  const detailsPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => showingDetails,
    onMoveShouldSetPanResponder: (_, gesture) => {
      // Only respond to vertical swipes when details are showing
      return showingDetails && Math.abs(gesture.dy) > Math.abs(gesture.dx);
    },

    onPanResponderMove: (_, gesture) => {
      if (!showingDetails) return;
      
      const { dy } = gesture;
      
      // Only allow downward swipes to close
      if (dy > 0) {
        detailsTranslateY.setValue(dy);
        detailsOpacity.setValue(1 - (dy / SCREEN_HEIGHT) * 0.5);
      }
    },

    onPanResponderRelease: (_, gesture) => {
      if (!showingDetails) return;
      
      const { dy, vy } = gesture;
      
      // Close if swiped down enough or with enough velocity
      if (dy > SCREEN_HEIGHT * 0.3 || vy > 0.5) {
        hideDetails();
      } else {
        // Snap back to open position
        Animated.parallel([
          Animated.spring(detailsTranslateY, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(detailsOpacity, {
            toValue: 1,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !showingDetails,
    onMoveShouldSetPanResponder: () => !showingDetails,

    onPanResponderMove: (_, gesture) => {
      if (showingDetails) return;
      
      const { dx, dy } = gesture;
      
      // Update position
      position.setValue({ x: dx, y: dy });
      
      // Calculate rotation based on horizontal movement
      const rotateValue = dx * 0.1;
      rotate.setValue(rotateValue);
      
      // Handle upward swipe - show details preview
      if (dy < 0) {
        const progress = Math.min(Math.abs(dy) / SWIPE_THRESHOLD, 1);
        // Show more of the details as user swipes up
        const detailsPreviewY = SCREEN_HEIGHT - (progress * SCREEN_HEIGHT * 0.6);
        detailsTranslateY.setValue(detailsPreviewY);
        detailsOpacity.setValue(progress * 0.9);
        
        // Set details hotel for preview
        if (!detailsHotel) {
          const currentHotel = hotels[currentIndex];
          if (currentHotel) {
            setDetailsHotel(currentHotel);
          }
        }
      } else {
        // Reset details preview when not swiping up
        detailsTranslateY.setValue(SCREEN_HEIGHT);
        detailsOpacity.setValue(0);
      }
      
      // Provide haptic feedback at threshold
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) < SWIPE_THRESHOLD + 10) {
        IOSHaptics.cardSwipeThreshold();
      }
      if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD + 10) {
        IOSHaptics.cardSwipeThreshold();
      }
    },

    onPanResponderRelease: (_, gesture) => {
      if (showingDetails) return;
      
      const { dx, dy, vx, vy } = gesture;
      
      // Determine swipe action based on direction and velocity
      let action: SwipeAction | null = null;
      let animateDirection = { x: 0, y: 0 };

      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5) {
        if (dx > 0) {
          // Swipe right - Like
          action = 'like';
          animateDirection = { x: SCREEN_WIDTH + 100, y: dy };
        } else {
          // Swipe left - Dismiss
          action = 'dismiss';
          animateDirection = { x: -SCREEN_WIDTH - 100, y: dy };
        }
      } else if (dy < -SWIPE_THRESHOLD || vy < -0.5) {
        // Swipe up - Details (complete the rolling animation)
        const currentHotel = hotels[currentIndex];
        if (currentHotel) {
          setShowingDetails(true);
          setDetailsHotel(currentHotel);
          setCurrentPhotoIndex(0);
          
          IOSHaptics.navigationTransition();
          
          // Complete the rolling animation
          Animated.parallel([
            Animated.timing(detailsTranslateY, {
              toValue: 0,
              duration: DETAILS_ANIMATION_DURATION,
              useNativeDriver: false,
            }),
            Animated.timing(detailsOpacity, {
              toValue: 1,
              duration: DETAILS_ANIMATION_DURATION,
              useNativeDriver: false,
            }),
          ]).start();
          
          // Reset card position
          position.setValue({ x: 0, y: 0 });
          rotate.setValue(0);
        }
        return;
      } else if (dy > SWIPE_THRESHOLD || vy > 0.5) {
        // Swipe down - Superlike
        action = 'superlike';
        animateDirection = { x: 0, y: SCREEN_HEIGHT + 100 };
      }

      if (action) {
        // Animate card out
        Animated.parallel([
          Animated.timing(position, {
            toValue: animateDirection,
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // Trigger swipe callback
          const currentHotel = hotels[currentIndex];
          if (currentHotel) {
            onSwipe(currentHotel.id, action!);
          }
        });

        // Haptic feedback for successful swipe
        if (action === 'like') {
          IOSHaptics.likeAction();
        } else if (action === 'superlike') {
          IOSHaptics.superlikeAction();
        } else if (action === 'dismiss') {
          IOSHaptics.dismissAction();
        }
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: false,
          }),
          // Hide details preview if it was showing
          Animated.spring(detailsTranslateY, {
            toValue: SCREEN_HEIGHT,
            useNativeDriver: false,
          }),
          Animated.spring(detailsOpacity, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // Clear details hotel if we were just previewing
          if (detailsHotel && !showingDetails) {
            setDetailsHotel(null);
          }
        });
      }
    },
  });

  const getRotateStyle = () => {
    return rotate.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ['-15deg', '0deg', '15deg'],
      extrapolate: 'clamp',
    });
  };

  const getLikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  const getDislikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  const getSuperlikeOpacity = () => {
    return position.y.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  const getDetailsOpacity = () => {
    return position.y.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  const renderCard = (hotel: HotelCard, index: number) => {
    const isCurrentCard = index === currentIndex;
    const isNextCard = index === currentIndex + 1;
    const isAfterNextCard = index === currentIndex + 2;

    if (index < currentIndex) {
      return null; // Don't render past cards
    }

    let cardStyle = {};
    let zIndex = hotels.length - index;

    if (isCurrentCard) {
      // Current card - fully interactive
      cardStyle = {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: getRotateStyle() },
        ],
        opacity,
        zIndex: zIndex + 10,
      };
    } else if (isNextCard) {
      // Next card - slightly smaller and behind
      cardStyle = {
        transform: [{ scale: 0.99 }],
        opacity: 0.95,
        zIndex,
      };
    } else if (isAfterNextCard) {
      // Card after next - even smaller
      cardStyle = {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
        zIndex,
      };
    } else {
      // Hidden cards
      cardStyle = {
        opacity: 0,
        zIndex,
      };
    }

    return (
      <Animated.View
        key={hotel.id}
        style={[
          styles.card,
          {
            width: cardDimensions.width,
            height: cardDimensions.height,
          },
          cardStyle,
        ]}
        {...(isCurrentCard ? panResponder.panHandlers : {})}
      >
        <HotelCardComponent hotel={hotel} />
        
        {/* Swipe indicators - only show on current card */}
        {isCurrentCard && (
          <>
            {/* Like indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.likeIndicator,
                { opacity: getLikeOpacity() },
              ]}
            >
              <Text style={styles.indicatorText}>LIKE</Text>
            </Animated.View>

            {/* Dislike indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.dislikeIndicator,
                { opacity: getDislikeOpacity() },
              ]}
            >
              <Text style={styles.indicatorText}>PASS</Text>
            </Animated.View>

            {/* Superlike indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.superlikeIndicator,
                { opacity: getSuperlikeOpacity() },
              ]}
            >
              <Text style={styles.indicatorText}>SUPER LIKE</Text>
            </Animated.View>

            {/* Details indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.detailsIndicator,
                { opacity: getDetailsOpacity() },
              ]}
            >
              <Text style={styles.indicatorText}>DETAILS</Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    );
  };

  const formatPrice = (price?: { amount: string; currency: string }) => {
    if (!price) return 'Price on request';
    
    const amount = parseFloat(price.amount);
    const currency = price.currency === 'EUR' ? '€' : price.currency;
    
    return `from ${currency}${Math.round(amount)}/night`;
  };

  const handleBookNow = async () => {
    if (!detailsHotel) return;
    
    try {
      const supported = await Linking.canOpenURL(detailsHotel.bookingUrl);
      if (supported) {
        await Linking.openURL(detailsHotel.bookingUrl);
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

  const renderPhotoCarousel = () => {
    if (!detailsHotel) return null;
    
    if (detailsHotel.photos.length <= 1) {
      return (
        <Image
          source={{ uri: detailsHotel.heroPhoto }}
          style={styles.singlePhoto}
          contentFit="cover"
        />
      );
    }

    return (
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
        nestedScrollEnabled={true}
        scrollEnabled={true}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
          setCurrentPhotoIndex(Math.max(0, Math.min(index, detailsHotel.photos.length - 1)));
        }}
        style={styles.photoCarousel}
      >
        {detailsHotel.photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.carouselPhoto}
            contentFit="cover"
          />
        ))}
      </ScrollView>
    );
  };

  const renderPhotoDots = () => {
    if (!detailsHotel || detailsHotel.photos.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {detailsHotel.photos.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentPhotoIndex && styles.activeDot,
            ]}
            onPress={() => {
              setCurrentPhotoIndex(index);
              if (photoScrollViewRef.current) {
                photoScrollViewRef.current.scrollTo({
                  x: index * (SCREEN_WIDTH - 40),
                  animated: true,
                });
              }
            }}
            accessible={true}
            accessibilityLabel={`Photo ${index + 1} of ${detailsHotel.photos.length}`}
            accessibilityRole="button"
          />
        ))}
      </View>
    );
  };

  const renderDetailsContent = () => {
    // Always render the container for smooth animations, but only show content when we have a hotel
    return (
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            transform: [{ translateY: detailsTranslateY }],
            opacity: detailsOpacity,
          },
        ]}
      >
        {/* Swipe indicator */}
        <View style={styles.swipeIndicatorContainer} {...detailsPanResponder.panHandlers}>
          <View style={styles.swipeIndicatorBar} />
        </View>

        {/* Header with close button */}
        <IOSBlurView 
          blurType="dark" 
          blurAmount={20} 
          style={[styles.detailsHeader, { paddingTop: insets.top }] as any}
          {...detailsPanResponder.panHandlers}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideDetails}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Hotel Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </IOSBlurView>

        <ScrollView 
          style={styles.detailsContent} 
          showsVerticalScrollIndicator={true}
          bounces={true}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: insets.bottom + 20 } // Reduced since Book Now moved up
          ]}
        >
          {detailsHotel && (
            <>
              {/* Photo Carousel */}
              <View style={styles.photoSection} pointerEvents="box-none">
                <View style={styles.photoCarouselContainer} pointerEvents="auto">
                  {renderPhotoCarousel()}
                </View>
                {renderPhotoDots()}
              </View>

              {/* Hotel Information */}
              <View style={styles.infoSection}>
                <Text style={styles.hotelName}>{detailsHotel.name}</Text>
                <Text style={styles.location}>{detailsHotel.city}, {detailsHotel.country}</Text>
                <Text style={styles.price}>{formatPrice(detailsHotel.price)}</Text>
              </View>

              {/* Book Now Button - moved after price info */}
              <View style={styles.bookingSection}>
                <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>

              {/* Amenities */}
              {detailsHotel.amenityTags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <View style={styles.amenitiesContainer}>
                    {detailsHotel.amenityTags.map((tag, index) => (
                      <View key={index} style={styles.amenityTag}>
                        <Text style={styles.amenityText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Map View (if coordinates available) */}
              {detailsHotel.coords && (
                <View style={styles.mapContainer}>
                  <HotelMapView
                    coords={detailsHotel.coords}
                    hotelName={detailsHotel.name}
                    city={detailsHotel.city}
                    country={detailsHotel.country}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading amazing hotels...</Text>
      </View>
    );
  }

  if (hotels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No more hotels to discover!</Text>
        <Text style={styles.emptySubtext}>Check your saved hotels or try refreshing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hotels.slice(currentIndex, currentIndex + 3).map((hotel, index) =>
        renderCard(hotel, currentIndex + index)
      )}
      {renderDetailsContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed all padding - true edge-to-edge
  },
  card: {
    position: 'absolute',
    borderRadius: 0, // Remove border radius for true fullscreen
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    padding: 12,
    borderRadius: 15,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  likeIndicator: {
    top: 100,
    right: 50,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    transform: [{ rotate: '15deg' }],
  },
  dislikeIndicator: {
    top: 100,
    left: 50,
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    transform: [{ rotate: '-15deg' }],
  },
  superlikeIndicator: {
    bottom: 150,
    alignSelf: 'center',
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingHorizontal: 20,
  },
  detailsIndicator: {
    top: 70,
    alignSelf: 'center',
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 16,
  },
  indicatorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 100,
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 201,
  },
  swipeIndicatorBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  detailsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    paddingHorizontal: 20,
    paddingVertical: 8, // Further reduced for more compact header
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8, // Reduced for more compact header
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 24, // Reduced font size to be less prominent
    fontWeight: '600', // Slightly lighter weight
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50,
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 125, // Increased further to ensure complete clearance
  },
  scrollContentContainer: {
    paddingBottom: 10, // Reduced to prevent excessive bottom space
    flexGrow: 1,
  },
  mapContainer: {
    marginBottom: 12, // Consistent with other sections
  },
  photoSection: {
    height: 200, // Reduced height to save space
    marginBottom: 12, // Consistent with other sections
    position: 'relative',
    zIndex: 1, // Ensure photos are above background but below header
  },
  singlePhoto: {
    width: SCREEN_WIDTH - 40,
    height: 200,
  },
  photoCarousel: {
    width: SCREEN_WIDTH - 40,
    height: 200,
  },
  photoCarouselContainer: {
    width: SCREEN_WIDTH - 40,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
  },
  photoCarouselContent: {
    alignItems: 'center',
  },
  carouselPhoto: {
    width: SCREEN_WIDTH - 40,
    height: 200,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'box-none', // Allow touches to pass through container
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
    pointerEvents: 'auto', // Ensure dots are tappable
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
  },
  infoSection: {
    marginBottom: 12, // Standardized margin
  },
  hotelName: {
    color: '#fff',
    fontSize: 28, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 6, // Slightly increased for better spacing
  },
  location: {
    color: '#999',
    fontSize: 16, // Reduced font size
    marginBottom: 6, // Consistent spacing
  },
  price: {
    color: '#FFD700',
    fontSize: 20, // Reduced font size
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 6, // Consistent spacing
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6, // Consistent with other spacing
  },
  amenityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    color: '#fff',
    fontSize: 14,
  },

  spacer: {
    height: 80,
  },
  bookingSection: {
    paddingHorizontal: 0,
    paddingTop: 12, // Standardized margin
    paddingBottom: 12, // Standardized margin
  },
  bookButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SwipeDeck; 