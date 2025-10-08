const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/src/components/HotelCard.tsx', 'utf8');

// Add React hooks imports
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useCallback, useMemo, memo } from 'react';"
);

// Wrap component with memo
content = content.replace(
  "const HotelCard: React.FC<HotelCardProps> = ({ hotel, onPress, navigation, isDevelopment = false }) => {",
  "const HotelCard: React.FC<HotelCardProps> = memo(({ hotel, onPress, navigation, isDevelopment = false }) => {"
);

// Add closing parenthesis for memo
content = content.replace(
  "export default HotelCard;",
  "});\n\nexport default HotelCard;"
);

// Memoize expensive calculations
content = content.replace(
  "  const photos = hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto];\n  const totalPhotos = photos.length;",
  "  const photos = useMemo(() => \n    hotel.photos && hotel.photos.length > 0 ? hotel.photos : [hotel.heroPhoto], \n    [hotel.photos, hotel.heroPhoto]\n  );\n  \n  const totalPhotos = useMemo(() => photos.length, [photos.length]);"
);

// Memoize callbacks
content = content.replace(
  "  const handleLeftTap = () => {",
  "  const handleLeftTap = useCallback(() => {"
);

content = content.replace(
  "  const handleRightTap = () => {",
  "  const handleRightTap = useCallback(() => {"
);

// Add closing parentheses for useCallback
content = content.replace(
  "    }\n  };",
  "    }\n  }, [totalPhotos]);"
);

// Add image optimization props
content = content.replace(
  "        <Image\n          source={getImageSource(photos[currentPhotoIndex])}\n          style={styles.heroImage}\n          contentFit=\"cover\"\n          transition={200}\n        />",
  "        <Image\n          source={getImageSource(photos[currentPhotoIndex])}\n          style={styles.heroImage}\n          contentFit=\"cover\"\n          transition={200}\n          cachePolicy=\"memory-disk\"\n          recyclingKey={hotel.id}\n        />"
);

// Write the optimized file
fs.writeFileSync('app/src/components/HotelCard.tsx', content);
console.log('✅ HotelCard.tsx optimized with React.memo and performance enhancements!');
