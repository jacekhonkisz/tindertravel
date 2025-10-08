const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Add a centralized animation controller
const animationController = `
  // Centralized Animation Controller
  const animationController = {
    // Details animations
    showDetails: (hotel: HotelCard) => {
      setDetailsHotel(hotel);
      setShowingDetails(true);
      setCurrentPhotoIndex(0);
      
      IOSHaptics.navigationTransition();
      
      Animated.parallel([
        Animated.timing(detailsTranslateY, {
          toValue: 0,
          duration: DETAILS_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: DETAILS_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    },

    hideDetails: () => {
      setShowingDetails(false);
      
      Animated.parallel([
        Animated.timing(detailsTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: DETAILS_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailsOpacity, {
          toValue: 0,
          duration: DETAILS_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDetailsHotel(null);
      });
    },

    // Preview animations
    updateDetailsPreview: (progress: number) => {
      const detailsPreviewY = SCREEN_HEIGHT - (progress * SCREEN_HEIGHT * 0.6);
      detailsTranslateY.setValue(detailsPreviewY);
      detailsOpacity.setValue(progress * 0.9);
    },

    resetDetailsPreview: () => {
      detailsTranslateY.setValue(SCREEN_HEIGHT);
      detailsOpacity.setValue(0);
    },

    // Card animations
    animateCardOut: (direction: { x: number; y: number }, action: SwipeAction, onComplete: () => void) => {
      Animated.parallel([
        Animated.timing(position, {
          toValue: direction,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(onComplete);
    },

    snapCardBack: () => {
      Animated.parallel([
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }),
        Animated.spring(rotate, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(detailsTranslateY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
        }),
        Animated.spring(detailsOpacity, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (detailsHotel && !showingDetails) {
          setDetailsHotel(null);
        }
      });
    },

    // Reset all animations
    resetAll: () => {
      position.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
      opacity.setValue(1);
      detailsTranslateY.setValue(SCREEN_HEIGHT);
      detailsOpacity.setValue(0);
    }
  };`;

// Insert the animation controller after the state declarations
content = content.replace(
  /const photoScrollViewRef = useRef<ScrollView>\(null\);/,
  `const photoScrollViewRef = useRef<ScrollView>(null);
${animationController}`
);

// Remove the old showDetails and hideDetails functions
content = content.replace(
  /const showDetails = \(hotel: HotelCard\) => \{[\s\S]*?\};[\s]*/,
  ''
);

content = content.replace(
  /const hideDetails = \(\) => \{[\s\S]*?\};[\s]*/,
  ''
);

// Update the useEffect to use the animation controller
content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[currentIndex\]\);[\s]*/,
  `useEffect(() => {
    animationController.resetAll();
    if (showingDetails) {
      animationController.hideDetails();
    }
  }, [currentIndex]);`
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Centralized animation control with single controller');
