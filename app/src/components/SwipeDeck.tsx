import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { HotelCard, SwipeAction, RootStackParamList } from '../types';
import MonogramGlow from './MonogramGlow';
import HotelCardComponent from './HotelCard';
import IOSHaptics from '../utils/IOSHaptics';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60; // Further reduced for easier swipe detection
const SWIPE_OUT_DURATION = 220; // Faster, smoother swipe (was 250ms)
const DETAILS_ANIMATION_DURATION = 280; // Snappier details animation (was 300ms)

// True fullscreen card sizing - covers entire screen
const getCardDimensions = (insets: any) => {
  // Use 100% of screen width - truly edge to edge
  const cardWidth = SCREEN_WIDTH;
  
  // Use 100% of screen height for true full-screen photos
  // Photos should extend all the way to screen edges including safe areas
  const cardHeight = SCREEN_HEIGHT;
  
  return { width: cardWidth, height: cardHeight };
};

interface SwipeDeckProps {
  hotels: HotelCard[];
  currentIndex: number;
  onSwipe: (hotelId: string, action: SwipeAction) => void;
  loading?: boolean;
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({
  hotels,
  currentIndex,
  onSwipe,
  loading = false,
  navigation,
}) => {
  const theme = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const cardDimensions = getCardDimensions(insets);
  
  const [isActivelyGesturing, setIsActivelyGesturing] = useState(false);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload ALL photos for next cards - makes everything instant
  useEffect(() => {
    const preloadAllNextImages = async () => {
      // Preload ALL photos for current + next 2 cards
      const cardsToPreload = hotels.slice(currentIndex, currentIndex + 3);
      
      const allUrls: string[] = [];
      
      for (const hotel of cardsToPreload) {
        if (hotel.photos && hotel.photos.length > 0) {
          // Collect ALL photos from each card
          hotel.photos.forEach((photo: string) => {
            if (photo && photo.length > 0) {
              allUrls.push(photo);
            }
          });
        } else if (hotel.heroPhoto) {
          allUrls.push(hotel.heroPhoto);
        }
      }
      
      // Preload all in parallel for maximum speed
      await Promise.all(
        allUrls.map(url => Image.prefetch(url).catch(() => {}))
      );
    };

    preloadAllNextImages();
  }, [currentIndex, hotels]);

  // Simple card animation functions
  const animateCardOut = (direction: { x: number; y: number }, onComplete: () => void) => {
    Animated.parallel([
      Animated.timing(position, {
        toValue: direction,
        duration: SWIPE_OUT_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  };

  const snapCardBack = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        damping: 18,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        damping: 18,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Reset animations when currentIndex changes
  useEffect(() => {
    // Clear any pending gesture timeout
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = null;
    }
    
    // Reset card animations
    position.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    opacity.setValue(1);
    setIsActivelyGesturing(false);
  }, [currentIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);

const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Only capture if it's not a simple tap - let taps pass through to TouchableOpacity
      // We'll detect taps in onPanResponderRelease instead
      return false; // Don't capture on start - let TouchableOpacity handle taps
    },
    onMoveShouldSetPanResponder: (_, gesture: any) => {
      // Only capture if there's actual movement (swipe gesture)
      return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
    },
    onPanResponderTerminationRequest: () => false, // Don't allow other components to steal the gesture

    onPanResponderGrant: () => {
      // Clear any existing timeout
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
      
      // Mark that user is actively gesturing - show indicators
      setIsActivelyGesturing(true);
      
      // Safety timeout to prevent stuck state
      gestureTimeoutRef.current = setTimeout(() => {
        console.log('⚠️ Gesture timeout - forcing reset');
        setIsActivelyGesturing(false);
        position.setValue({ x: 0, y: 0 });
        rotate.setValue(0);
      }, 5000); // 5 second timeout
    },

    onPanResponderMove: (_, gesture: any) => {
      const { dx, dy } = gesture;
      
      // Determine primary gesture direction to avoid conflicts
      const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
      const isVerticalSwipe = Math.abs(dy) > Math.abs(dx);
      
      if (isHorizontalSwipe) {
        // Handle horizontal swiping (like/dismiss)
        position.setValue({ x: dx, y: 0 });
        const rotateValue = dx * 0.1;
        rotate.setValue(rotateValue);
      } else if (isVerticalSwipe) {
        // Handle vertical swiping (superlike)
        position.setValue({ x: 0, y: dy });
        rotate.setValue(0);
      } else {
        // Small movements - update position normally
        position.setValue({ x: dx, y: dy });
        const rotateValue = dx * 0.1;
        rotate.setValue(rotateValue);
      }
      
      // Provide haptic feedback at threshold
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) < SWIPE_THRESHOLD + 10) {
        IOSHaptics.cardSwipeThreshold();
      }
      if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD + 10) {
        IOSHaptics.cardSwipeThreshold();
      }
    },

    onPanResponderRelease: (evt, gesture: any) => {
      const { dx, dy, vx, vy } = gesture;
      
      // Clear gesture timeout
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
        gestureTimeoutRef.current = null;
      }
      
      // User released - stop showing indicators immediately
      setIsActivelyGesturing(false);
      
      // Check if this was just a tap (very small movement) - if so, handle photo navigation
      const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10 && Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3;
      
      if (isTap) {
        // This is a tap - check which side of screen was tapped for photo navigation
        const tapX = evt.nativeEvent.pageX;
        const screenMidpoint = SCREEN_WIDTH / 2;
        
        // Get current hotel to check if it has multiple photos
        const currentHotel = hotels[currentIndex];
        const hasMultiplePhotos = currentHotel && currentHotel.photos && currentHotel.photos.length > 1;
        
        if (hasMultiplePhotos) {
          if (tapX < screenMidpoint) {
            // Left half tapped - previous photo
            // We can't directly call HotelCard's handler, so we'll use a ref or event
            // For now, let's just log - the TouchableOpacity should handle this
            console.log('📸 Left tap detected (should go to previous photo)');
          } else {
            // Right half tapped - next photo
            console.log('📸 Right tap detected (should go to next photo)');
          }
        }
        
        // For taps, don't do any card animation - just return
        // The TouchableOpacity in HotelCard should handle the photo navigation
        return;
      }
      
      // Determine primary gesture direction to avoid conflicts
      const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy);
      const isVerticalSwipe = Math.abs(dy) > Math.abs(dx);
      
      // Handle card swiping based on primary direction
      let action: SwipeAction | null = null;
      let animateDirection = { x: 0, y: 0 };

      if (isHorizontalSwipe && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5)) {
        if (dx > 0) {
          // Swipe right - Like
          action = 'like';
          animateDirection = { x: SCREEN_WIDTH + 100, y: 0 };
        } else {
          // Swipe left - Dismiss
          action = 'dismiss';
          animateDirection = { x: -SCREEN_WIDTH - 100, y: 0 };
        }
      } else if (isVerticalSwipe && (Math.abs(dy) > SWIPE_THRESHOLD || Math.abs(vy) > 0.3)) {
        if (dy < -SWIPE_THRESHOLD || vy < -0.3) {
          // Swipe up - Navigate to DetailsScreen
          console.log('⬆️ Swipe up detected! Opening details for:', hotels[currentIndex]?.name);
          const currentHotel = hotels[currentIndex];
          if (currentHotel) {
            // Navigate to DetailsScreen instead of showing overlay
            navigation.navigate('Details', { hotel: currentHotel });
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
      }

      if (action) {
        // Animate card out
        animateCardOut(animateDirection, () => {
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
        console.log('🔄 Snapping back to center');
        snapCardBack();
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
      inputRange: [-SWIPE_THRESHOLD, -20, 0],
      outputRange: [1, 0.3, 0],
      extrapolate: 'clamp',
    });
  };

  const renderCard = (hotel: HotelCard, index: number) => {
    const isCurrentCard = index === currentIndex;
    const isNextCard = index === currentIndex + 1;
    const isAfterNextCard = index === currentIndex + 2;

    // Removed excessive debug logging to prevent performance issues

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
        <HotelCardComponent 
          hotel={hotel} 
          navigation={navigation} 
          isDevelopment={__DEV__}
          onPress={undefined} // Explicitly no tap handler - swipe up is the only way to open details
        />
        
        {/* Swipe indicators - only show on current card during active gesture */}
        {isCurrentCard && isActivelyGesturing && (
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


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MonogramGlow 
          letter="G" 
          size={120} 
          tone="light"
        />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Removed alignItems: 'center' and justifyContent: 'center' for true edge-to-edge
    // Removed all padding - true edge-to-edge
  },
  card: {
    position: 'absolute',
    top: 0, // Ensure cards start at the very top
    left: 0, // Ensure cards start at the very left
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
    backgroundColor: '#FAF8F5',
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
    padding: 20,
    borderRadius: 20,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  likeIndicator: {
    top: '45%', // Centered vertically
    right: '30%', // More toward center
    borderColor: 'rgba(76, 175, 80, 1)',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    transform: [{ rotate: '15deg' }],
  },
  dislikeIndicator: {
    top: '45%', // Centered vertically
    left: '30%', // More toward center
    borderColor: 'rgba(244, 67, 54, 1)',
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    transform: [{ rotate: '-15deg' }],
  },
  superlikeIndicator: {
    top: '50%', // Centered vertically
    alignSelf: 'center',
    borderColor: 'rgba(33, 150, 243, 1)',
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    paddingHorizontal: 24,
  },
  detailsIndicator: {
    top: '40%', // Centered vertically
    alignSelf: 'center',
    borderColor: 'rgba(255, 152, 0, 1)',
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    paddingHorizontal: 20,
  },
  indicatorText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },

});

export default SwipeDeck; 