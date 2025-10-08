const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Remove the detailsPanResponder completely
content = content.replace(
  /\/\/ Pan responder for details view to allow swiping down to close\s*const detailsPanResponder = PanResponder\.create\(\{[\s\S]*?\}\);[\s]*/,
  ''
);

// Update the main panResponder to handle all gestures intelligently
const smartPanResponder = `const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true, // Always capture gestures
    onMoveShouldSetPanResponder: (_, gesture) => {
      // Smart gesture detection based on context and gesture type
      if (showingDetails) {
        // When details are open, prioritize vertical gestures for closing
        return Math.abs(gesture.dy) > Math.abs(gesture.dx);
      } else {
        // When details are closed, prioritize horizontal gestures for swiping
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      }
    },

    onPanResponderGrant: (_, gesture) => {
      if (showingDetails) return;
      
      const { x0, y0 } = gesture;
      const cardWidth = SCREEN_WIDTH;
      const leftZoneWidth = cardWidth * 0.15;
      const rightZoneWidth = cardWidth * 0.15;
      
      // Check if tap is in left or right photo navigation zones
      if (x0 < leftZoneWidth) {
        // Left tap - previous photo
        const currentHotel = hotels[currentIndex];
        if (currentHotel && currentHotel.photos && currentHotel.photos.length > 1) {
          IOSHaptics.buttonPress();
          // Handle photo navigation here - you'll need to add state for current photo index
        }
      } else if (x0 > cardWidth - rightZoneWidth) {
        // Right tap - next photo
        const currentHotel = hotels[currentIndex];
        if (currentHotel && currentHotel.photos && currentHotel.photos.length > 1) {
          IOSHaptics.buttonPress();
          // Handle photo navigation here - you'll need to add state for current photo index
        }
      }
    },`;

// Replace the existing panResponder with the smart one
content = content.replace(
  /const panResponder = PanResponder\.create\(\{[\s\S]*?\}\);[\s]*/,
  smartPanResponder + '\n  });\n'
);

// Update the onPanResponderMove to handle both card and details gestures
const smartMoveHandler = `onPanResponderMove: (_, gesture) => {
      const { dx, dy } = gesture;
      
      if (showingDetails) {
        // Handle details closing gesture
        if (dy > 0) {
          detailsTranslateY.setValue(dy);
          detailsOpacity.setValue(1 - (dy / SCREEN_HEIGHT) * 0.5);
        }
        return;
      }
      
      // Handle card swiping gestures
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
    },`;

// Replace the existing onPanResponderMove
content = content.replace(
  /onPanResponderMove: \(_, gesture\) => \{[\s\S]*?\},[\s]*/,
  smartMoveHandler
);

// Update the onPanResponderRelease to handle both card and details gestures
const smartReleaseHandler = `onPanResponderRelease: (_, gesture) => {
      const { dx, dy, vx, vy } = gesture;
      
      if (showingDetails) {
        // Handle details closing
        if (dy > SCREEN_HEIGHT * 0.3 || vy > 0.5) {
          hideDetails();
        } else {
          // Snap back to open position
          Animated.parallel([
            Animated.spring(detailsTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(detailsOpacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
        return;
      }
      
      // Handle card swiping
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
              useNativeDriver: true,
            }),
            Animated.timing(detailsOpacity, {
              toValue: 1,
              duration: DETAILS_ANIMATION_DURATION,
              useNativeDriver: true,
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
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: true,
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
            useNativeDriver: true,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: true,
          }),
          // Hide details preview if it was showing
          Animated.spring(detailsTranslateY, {
            toValue: SCREEN_HEIGHT,
            useNativeDriver: true,
          }),
          Animated.spring(detailsOpacity, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Clear details hotel if we were just previewing
          if (detailsHotel && !showingDetails) {
            setDetailsHotel(null);
          }
        });
      }
    },`;

// Replace the existing onPanResponderRelease
content = content.replace(
  /onPanResponderRelease: \(_, gesture\) => \{[\s\S]*?\},[\s]*/,
  smartReleaseHandler
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Consolidated PanResponders into single smart responder');
