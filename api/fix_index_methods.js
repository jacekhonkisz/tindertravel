const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/index.ts', 'utf8');

// Fix method name from getHotelPhotos to getHotelPhotoUrls
content = content.replace(
  'const photos = await googlePlacesClient.getHotelPhotos(cityName, parseInt(limit as string));',
  'const photos = await googlePlacesClient.getHotelPhotoUrls({ name: cityName, photos: [] }, parseInt(limit as string));'
);

// Write the file back
fs.writeFileSync('src/index.ts', content);
console.log('✅ Fixed method name issue in index.ts');
