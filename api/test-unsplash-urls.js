// Test Unsplash URL patterns
const testUrls = [
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop'
];

console.log('🧪 TESTING UNSPLASH URL PATTERNS');
console.log('='.repeat(60));

testUrls.forEach((url, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log(`URL: ${url}`);
  
  // Check URL structure
  const urlObj = new URL(url);
  console.log(`Domain: ${urlObj.hostname}`);
  console.log(`Path: ${urlObj.pathname}`);
  console.log(`Query: ${urlObj.search}`);
  
  // Check if it's a valid Unsplash URL
  if (url.includes('images.unsplash.com')) {
    console.log('✅ Valid Unsplash domain');
  } else {
    console.log('❌ Invalid Unsplash domain');
  }
  
  // Check photo ID format
  const photoIdMatch = url.match(/photo-(\d+)/);
  if (photoIdMatch) {
    console.log(`Photo ID: ${photoIdMatch[1]}`);
    console.log('✅ Valid photo ID format');
  } else {
    console.log('❌ Invalid photo ID format');
  }
  
  // Check parameters
  const params = new URLSearchParams(urlObj.search);
  console.log(`Width: ${params.get('w')}`);
  console.log(`Height: ${params.get('h')}`);
  console.log(`Fit: ${params.get('fit')}`);
  
  // Test if URL is accessible
  fetch(url, { method: 'HEAD' })
    .then(response => {
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${response.headers.get('content-length')}`);
      
      if (response.status === 200) {
        console.log('✅ URL is accessible');
      } else {
        console.log('❌ URL is not accessible');
      }
    })
    .catch(error => {
      console.log(`❌ Error: ${error.message}`);
    });
});

console.log('\n🔍 POTENTIAL ISSUES:');
console.log('1. Unsplash URLs might require proper headers');
console.log('2. React Native might have issues with query parameters');
console.log('3. CORS issues might prevent loading');
console.log('4. Image caching might be interfering');

console.log('\n💡 SOLUTIONS TO TRY:');
console.log('1. Add proper headers to image requests');
console.log('2. Try different image loading libraries');
console.log('3. Check React Native image component settings');
console.log('4. Test with simpler URLs first');
