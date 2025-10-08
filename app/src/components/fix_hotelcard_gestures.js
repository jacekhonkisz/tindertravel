const fs = require('fs');

// Read the HotelCard file
let content = fs.readFileSync('HotelCard.tsx', 'utf8');

// Remove the main TouchableOpacity wrapper and replace with View
content = content.replace(
  /<TouchableOpacity\s+style={styles\.container}\s+onPress={onPress}\s+activeOpacity={0\.95}\s*>/,
  '<View style={styles.container}>'
);

content = content.replace(
  /<\/TouchableOpacity>$/,
  '</View>'
);

// Remove the TouchableOpacity tap areas and replace with gesture zones
content = content.replace(
  /{\/\* Left tap area for previous photo \*\/\s*}\s*{totalPhotos > 1 && \(\s*<TouchableOpacity\s+style={styles\.leftTapArea}\s+onPress={handleLeftTap}\s+activeOpacity={1}\s*\/>\s*\)\s*}/,
  `{/* Left gesture zone for previous photo */}
      {totalPhotos > 1 && (
        <View style={styles.leftTapArea} pointerEvents="none" />
      )}`
);

content = content.replace(
  /{\/\* Right tap area for next photo \*\/\s*}\s*{totalPhotos > 1 && \(\s*<TouchableOpacity\s+style={styles\.rightTapArea}\s+onPress={handleRightTap}\s+activeOpacity={1}\s*\/>\s*\)\s*}/,
  `{/* Right gesture zone for next photo */}
      {totalPhotos > 1 && (
        <View style={styles.rightTapArea} pointerEvents="none" />
      )}`
);

// Write the file back
fs.writeFileSync('HotelCard.tsx', content);
console.log('✅ Removed TouchableOpacity conflicts from HotelCard');
