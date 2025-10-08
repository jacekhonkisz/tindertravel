const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/google-places.ts', 'utf8');

// Fix undefined property issues
content = content.replace(
  'results = results.filter((hotel: any) => hotel.rating >= criteria.minRating);',
  'results = results.filter((hotel: any) => hotel.rating >= (criteria.minRating || 0));'
);

content = content.replace(
  '!hotel.price_level || hotel.price_level <= criteria.maxPrice',
  '!hotel.price_level || hotel.price_level <= (criteria.maxPrice || 4)'
);

// Write the file back
fs.writeFileSync('src/google-places.ts', content);
console.log('✅ Fixed undefined property issues in google-places.ts');
