// Test the updated photo source extraction logic
function getPhotoSource(photo) {
  // If it's a JSON string, try to parse it
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.source) {
        return parsed.source;
      }
    } catch (e) {
      // If parsing fails, fall through to URL detection
    }
  }
  
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

// Test cases based on actual database data
const testCases = [
  // JSON string with source
  '{"url":"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop","width":1920,"height":1080,"source":"unsplash_curated","description":"Palazzo Margherita curated photo 1","photoReference":"unsplash_curated_1","taggedAt":"2024-01-15T10:30:00Z"}',
  
  // Plain Google Places URL
  'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&maxheight=1200&photoreference=AciIO2exRlbY6IeKxxrlEYsw7HSltmbS_C3flhFoOGARwoWLaBrqtHysFCG4XviPPrQ3OOYoEkkgX8xLOKzM3a7nI6PnOe7rtCczGQhpVY',
  
  // Plain Unsplash URL
  'https://images.unsplash.com/photo-1234567890?w=1920&h=1080',
  
  // Invalid JSON string
  '{"invalid": json}',
  
  // Object with source
  { url: 'https://example.com/photo.jpg', source: 'Google Places', width: 1920, height: 1080 },
  
  // Unknown URL
  'https://example.com/unknown-photo.jpg'
];

console.log('🧪 TESTING UPDATED PHOTO SOURCE EXTRACTION LOGIC');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
  const result = getPhotoSource(testCase);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${typeof testCase === 'string' ? testCase.substring(0, 80) + '...' : JSON.stringify(testCase).substring(0, 80) + '...'}`);
  console.log(`  Result: ${result}`);
  console.log('');
});

console.log('✅ Test completed!');
