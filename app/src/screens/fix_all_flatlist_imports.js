const fs = require('fs');

// Read the HotelCollectionScreen file
let content = fs.readFileSync('HotelCollectionScreen.tsx', 'utf8');

// Fix ALL duplicate FlatList imports
const fixedImports = `import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, HotelCard } from '../types';
import { useAppStore } from '../store';`;

// Replace the entire import section
content = content.replace(
  /import React, { useCallback, useMemo } from 'react';[\s\S]*?import { useAppStore } from '\.\.\/store';/,
  fixedImports
);

// Write the file back
fs.writeFileSync('HotelCollectionScreen.tsx', content);
console.log('✅ Fixed ALL duplicate FlatList imports in HotelCollectionScreen');
