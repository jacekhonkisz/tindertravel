// Test the photo source extraction logic
function getPhotoSource(photo) {
  // If it's an object with source property
  if (typeof photo === 'object' && photo && photo.source) {
    return photo.source;
  }
  
  // If it's a string URL, try to detect source
  if (typeof photo === 'string') {
    if (photo.includes('maps.googleapis.com')) {
      return 'Google Places';
    } else if (photo.includes('unsplash.com')) {
      return 'Unsplash';
    } else if (photo.includes('serpapi')) {
      return 'SerpAPI';
    }
  }
  
  return 'Unknown';
}

// Test cases
const testCases = [
  // Object with source
  { url: 'https://example.com/photo.jpg', source: 'Google Places', width: 1920, height: 1080 },
  
  // String URLs
  'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1920&maxheight=1080&photoreference=ABC123&key=xyz',
  'https://images.unsplash.com/photo-1234567890?w=1920&h=1080',
  'https://serpapi.com/search?q=hotel&tbm=isch',
  
  // Unknown URLs
  'https://example.com/unknown-photo.jpg',
  
  // Edge cases
  null,
  undefined,
  {},
  ''
];

console.log('🧪 TESTING PHOTO SOURCE EXTRACTION LOGIC');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
  const result = getPhotoSource(testCase);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${JSON.stringify(testCase).substring(0, 80)}...`);
  console.log(`  Result: ${result}`);
  console.log('');
});

console.log('✅ Test completed!');
