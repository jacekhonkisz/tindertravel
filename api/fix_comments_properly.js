const fs = require('fs');

// Read the files
let amadeusContent = fs.readFileSync('src/amadeus.ts', 'utf8');
let indexContent = fs.readFileSync('src/index.ts', 'utf8');

// Fix amadeus.ts - comment out the entire problematic block
amadeusContent = amadeusContent.replace(
  /\/\/ const realPhotos = await this\.googlePlacesClient\.getSpecificHotelPhotos\([\s\S]*?\);[\s]*$/m,
  '// const realPhotos = await this.googlePlacesClient.getSpecificHotelPhotos(hotelName, cityName, 6);'
);

// Fix index.ts - comment out the problematic calls and add return statements
indexContent = indexContent.replace(
  /\/\/ const googlePhotos = await googlePlacesClient\.getSpecificHotelPhotos\([\s\S]*?\);[\s]*$/m,
  '// const googlePhotos = await googlePlacesClient.getSpecificHotelPhotos(hotelName, cityName, 6);\n      return [];'
);

indexContent = indexContent.replace(
  /\/\/ const photos = await googlePlacesClient\.getSpecificHotelPhotos\([\s\S]*?\);[\s]*$/m,
  '// const photos = await googlePlacesClient.getSpecificHotelPhotos(hotelName, cityName, 6);\n      return [];'
);

// Write the files back
fs.writeFileSync('src/amadeus.ts', amadeusContent);
fs.writeFileSync('src/index.ts', indexContent);
console.log('✅ Fixed commenting properly');
