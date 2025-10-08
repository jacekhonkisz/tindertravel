const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/src/screens/HotelCollectionScreen.tsx', 'utf8');

// Add React hooks imports
content = content.replace(
  "import React from 'react';",
  "import React, { useCallback, useMemo } from 'react';"
);

// Add FlatList import
content = content.replace(
  "import {\n  FlatList,\n  View,",
  "import {\n  View,"
);

// Add FlatList import properly
content = content.replace(
  "import {\n  View,",
  "import {\n  FlatList,\n  View,"
);

// Convert renderHotelCard to useCallback
content = content.replace(
  "const renderHotelCard = (hotel: HotelCard) => (",
  "const renderHotelCard = useCallback((hotel: HotelCard) => ("
);

// Add closing parenthesis for useCallback
content = content.replace(
  "    </TouchableOpacity>\n  );",
  "    </TouchableOpacity>\n  ), [type, handleHotelPress, handleRemoveHotel]);"
);

// Add keyExtractor
content = content.replace(
  "  const renderHotelCard = useCallback((hotel: HotelCard) => (",
  "  const keyExtractor = useCallback((item: HotelCard) => item.id, []);\n\n  const renderHotelCard = useCallback((hotel: HotelCard) => ("
);

// Add getItemLayout
content = content.replace(
  "  const keyExtractor = useCallback((item: HotelCard) => item.id, []);",
  "  const keyExtractor = useCallback((item: HotelCard) => item.id, []);\n\n  const getItemLayout = useCallback((data: any, index: number) => ({\n    length: 130, // Fixed height of each item\n    offset: 130 * index,\n    index,\n  }), []);"
);

// Replace ScrollView with FlatList and add performance props
content = content.replace(
  "        <FlatList style={styles.content} showsVerticalScrollIndicator={false}>\n          <View style={styles.hotelsGrid}>\n            {hotels.map(hotel => renderHotelCard(hotel))}\n          </View>\n          \n          {/* Instructions */}\n          <View style={styles.instructions}>\n            <Text style={styles.instructionText}>\n              Tap to view details • Long press to remove\n            </Text>\n          </View>\n        </FlatList>",
  "        <FlatList\n          data={hotels}\n          renderItem={({ item }) => renderHotelCard(item)}\n          keyExtractor={keyExtractor}\n          getItemLayout={getItemLayout}\n          initialNumToRender={10}\n          maxToRenderPerBatch={5}\n          windowSize={10}\n          removeClippedSubviews={true}\n          showsVerticalScrollIndicator={false}\n          decelerationRate=\"fast\"\n          scrollEventThrottle={16}\n          style={styles.content}\n          contentContainerStyle={styles.hotelsGrid}\n          ListFooterComponent={() => (\n            <View style={styles.instructions}>\n              <Text style={styles.instructionText}>\n                Tap to view details • Long press to remove\n              </Text>\n            </View>\n          )}\n        />"
);

// Write the optimized file
fs.writeFileSync('app/src/screens/HotelCollectionScreen.tsx', content);
console.log('✅ HotelCollectionScreen.tsx optimized with FlatList!');
