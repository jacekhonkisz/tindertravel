import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Animated, 
  View,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { DUR_MED, EASING_SMOOTH } from '../ui/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthBackgroundProps {
  imageSource: ImageSourcePropType;
  children?: React.ReactNode;
}

/**
 * Full-screen background with image + subtle blur overlay
 * Uses expo-image for instant caching and progressive loading
 * Shows UI immediately, fades in image when ready
 */
const AuthBackground: React.FC<AuthBackgroundProps> = ({ imageSource, children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    // Extract URI from imageSource
    if (imageSource && typeof imageSource === 'object' && 'uri' in imageSource) {
      setImageUri((imageSource as { uri: string }).uri);
    }
  }, [imageSource]);

  useEffect(() => {
    // Fade in when image loads (or immediately if no image)
    if (imageLoaded || !imageUri) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: DUR_MED,
        easing: EASING_SMOOTH,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoaded, imageUri]);

  return (
    <View style={styles.container}>
      {/* Placeholder gradient background - shows immediately */}
      <View style={styles.placeholderGradient} />
      
      {/* Background Image with fade-in - uses expo-image for caching */}
      {imageUri && (
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk" // Cache to disk for instant loads
            priority="high" // High priority for background
            onLoad={() => {
              setImageLoaded(true);
            }}
          />
          {/* Dark overlay to reduce brightness and add depth */}
          <View style={styles.darkOverlay} />
          
          {/* Subtle gradient for better text contrast */}
          <View style={styles.gradientOverlay} />
        </Animated.View>
      )}

      {/* Content - always visible, not blocked by image loading */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  placeholderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a', // Dark background as placeholder
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', // Darker overlay as requested
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)', // Slightly darker gradient
  },
});

export default AuthBackground;

