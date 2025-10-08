const fs = require('fs');

// Read the SwipeDeck file
let content = fs.readFileSync('SwipeDeck.tsx', 'utf8');

// Update the ScrollView to have conditional behavior
content = content.replace(
  /<ScrollView \s*style={styles\.detailsContent} \s*showsVerticalScrollIndicator={true}\s*bounces={true}\s*contentContainerStyle={\[[\s\S]*?\]}\s*>/,
  `<ScrollView 
          style={styles.detailsContent} 
          showsVerticalScrollIndicator={showingDetails}
          bounces={showingDetails}
          scrollEnabled={showingDetails}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: insets.bottom + 20 }
          ]}
        >`
);

// Write the file back
fs.writeFileSync('SwipeDeck.tsx', content);
console.log('✅ Fixed ScrollView conditional behavior');
