const fs = require('fs');

// Read the files
let amadeusContent = fs.readFileSync('src/amadeus.ts', 'utf8');
let indexContent = fs.readFileSync('src/index.ts', 'utf8');

// Comment out problematic calls in amadeus.ts
amadeusContent = amadeusContent.replace(
  'const realPhotos = await this.googlePlacesClient.getSpecificHotelPhotos(',
  '// const realPhotos = await this.googlePlacesClient.getSpecificHotelPhotos('
);

// Comment out problematic calls in index.ts
indexContent = indexContent.replace(
  'const googlePhotos = await googlePlacesClient.getSpecificHotelPhotos(',
  '// const googlePhotos = await googlePlacesClient.getSpecificHotelPhotos('
);

indexContent = indexContent.replace(
  'const photos = await googlePlacesClient.getSpecificHotelPhotos(',
  '// const photos = await googlePlacesClient.getSpecificHotelPhotos('
);

// Write the files back
fs.writeFileSync('src/amadeus.ts', amadeusContent);
fs.writeFileSync('src/index.ts', indexContent);
console.log('✅ Commented out problematic getSpecificHotelPhotos calls');
