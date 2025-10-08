const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Update the PanResponder to use the animation controller
content = content.replace(
  /\/\/ Handle upward swipe - show details preview\s*if \(dy < 0\) \{[\s\S]*?\} else \{[\s\S]*?\}/,
  `// Handle upward swipe - show details preview
      if (dy < 0) {
        const progress = Math.min(Math.abs(dy) / SWIPE_THRESHOLD, 1);
        animationController.updateDetailsPreview(progress);
        
        // Set details hotel for preview
        if (!detailsHotel) {
          const currentHotel = hotels[currentIndex];
          if (currentHotel) {
            setDetailsHotel(currentHotel);
          }
        }
      } else {
        // Reset details preview when not swiping up
        animationController.resetDetailsPreview();
      }`
);

// Update the card swipe animations
content = content.replace(
  /\/\/ Swipe up - Details \(complete the rolling animation\)\s*const currentHotel = hotels\[currentIndex\];[\s\S]*?rotate\.setValue\(0\);\s*\}\s*return;/,
  `// Swipe up - Details (complete the rolling animation)
        const currentHotel = hotels[currentIndex];
        if (currentHotel) {
          animationController.showDetails(currentHotel);
          // Reset card position
          position.setValue({ x: 0, y: 0 });
          rotate.setValue(0);
        }
        return;`
);

// Update the card out animations
content = content.replace(
  /\/\/ Animate card out\s*Animated\.parallel\(\[[\s\S]*?\]\)\.start\(\(\) => \{[\s\S]*?\}\);/,
  `// Animate card out
        animationController.animateCardOut(animateDirection, action!, () => {
          // Trigger swipe callback
          const currentHotel = hotels[currentIndex];
          if (currentHotel) {
            onSwipe(currentHotel.id, action!);
          }
        });`
);

// Update the snap back animations
content = content.replace(
  /\/\/ Snap back to center\s*Animated\.parallel\(\[[\s\S]*?\]\)\.start\(\(\) => \{[\s\S]*?\}\);/,
  `// Snap back to center
        animationController.snapCardBack();`
);

// Update the details closing animations
content = content.replace(
  /\/\/ Handle details closing\s*if \(dy > SCREEN_HEIGHT \* 0\.3 \|\| vy > 0\.5\) \{[\s\S]*?return;/,
  `// Handle details closing
        if (dy > SCREEN_HEIGHT * 0.3 || vy > 0.5) {
          animationController.hideDetails();
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
        return;`
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Updated PanResponder to use centralized animation controller');
