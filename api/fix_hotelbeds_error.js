const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/hotelbeds.ts', 'utf8');

// Fix error type issue
content = content.replace(
  'status: error.response?.status',
  'status: (error as any).response?.status'
);

// Write the file back
fs.writeFileSync('src/hotelbeds.ts', content);
console.log('✅ Fixed error type issue in hotelbeds.ts');
