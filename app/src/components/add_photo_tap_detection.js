const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Add photo tap detection to the PanResponder
const photoTapDetection = `
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

// Insert the photo tap detection after onMoveShouldSetPanResponder
content = content.replace(
  /onMoveShouldSetPanResponder: \(\) => !showingDetails,/,
  `onMoveShouldSetPanResponder: () => !showingDetails,
${photoTapDetection}`
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Added photo tap detection to SwipeDeck');
