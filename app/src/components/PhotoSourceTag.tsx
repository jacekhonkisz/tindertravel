import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PhotoSourceTagProps {
  source: string;
  visible?: boolean;
}

const PhotoSourceTag: React.FC<PhotoSourceTagProps> = ({ 
  source, 
  visible = true 
}) => {
  if (!visible) return null;
  
  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google places':
      case 'unsplash_curated':
        return '#4285F4'; // Google Blue
      case 'unsplash':
        return '#000000'; // Unsplash Black
      case 'serpapi':
        return '#FF6B35'; // SerpAPI Orange
      default:
        return '#666666'; // Gray for unknown
    }
  };
  
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google places':
      case 'unsplash_curated':
        return '📸';
      case 'unsplash':
        return '🎨';
      case 'serpapi':
        return '🔍';
      default:
        return '❓';
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: getSourceColor(source) }]}>
      <Text style={styles.icon}>{getSourceIcon(source)}</Text>
      <Text style={styles.text}>{source}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PhotoSourceTag;
