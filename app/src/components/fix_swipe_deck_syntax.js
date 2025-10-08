const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Fix the missing line break
content = content.replace(
  '}, [currentIndex]);const panResponder = PanResponder.create({',
  '}, [currentIndex]);\n\nconst panResponder = PanResponder.create({'
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Fixed syntax error in SwipeDeck.tsx');
