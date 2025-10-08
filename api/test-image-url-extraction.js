// Test the getImageUrl function
function getImageUrl(photo) {
  // If it's a JSON string, try to parse it and extract URL
  if (typeof photo === 'string' && photo.startsWith('{')) {
    try {
      const parsed = JSON.parse(photo);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (e) {
      // If parsing fails, fall through to direct usage
    }
  }
  
  // If it's an object with url property
  if (typeof photo === 'object' && photo && photo.url) {
    return photo.url;
  }
  
  // If it's already a string URL, use it directly
  if (typeof photo === 'string') {
    return photo;
  }
  
  // Fallback
  return '';
}

// Test cases based on actual database data
const testCases = [
  // JSON string with URL (from database)
  '{"url":"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop","width":1920,"height":1080,"source":"unsplash_curated","description":"Palazzo Margherita curated photo 1","photoReference":"unsplash_curated_1","taggedAt":"2024-01-15T10:30:00Z"}',
  
  // Plain Google Places URL
  'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&maxheight=1200&photoreference=AciIO2exRlbY6IeKxxrlEYsw7HSltmbS_C3flhFoOGARwoWLaBrqtHysFCG4XviPPrQ3OOYoEkkgX8xLOKzM3a7nI6PnOe7rtCczGQhpVY',
  
  // Plain Unsplash URL
  'https://images.unsplash.com/photo-1234567890?w=1920&h=1080',
  
  // Object with URL
  { url: 'https://example.com/photo.jpg', source: 'Google Places', width: 1920, height: 1080 },
  
  // Invalid JSON string
  '{"invalid": json}',
  
  // Unknown URL
  'https://example.com/unknown-photo.jpg'
];

console.log('🧪 TESTING IMAGE URL EXTRACTION');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
  const result = getImageUrl(testCase);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${typeof testCase === 'string' ? testCase.substring(0, 80) + '...' : JSON.stringify(testCase).substring(0, 80) + '...'}`);
  console.log(`  Extracted URL: ${result.substring(0, 80)}${result.length > 80 ? '...' : ''}`);
  console.log(`  Valid URL: ${result.startsWith('http') ? '✅' : '❌'}`);
  console.log('');
});

console.log('✅ Test completed!');
