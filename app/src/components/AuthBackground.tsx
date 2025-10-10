import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ImageBackground, 
  Animated, 
  View,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { BLUR_BG, DUR_MED, EASING_SMOOTH } from '../ui/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthBackgroundProps {
  imageSource: ImageSourcePropType;
  children?: React.ReactNode;
}

/**
 * Full-screen background with image + subtle blur overlay
 * Fades in smoothly when mounted
 */
const AuthBackground: React.FC<AuthBackgroundProps> = ({ imageSource, children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: DUR_MED,
      easing: EASING_SMOOTH,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Image with fade-in */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <ImageBackground
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        >
          {/* Darker blur overlay for premium look */}
          <BlurView
            intensity={BLUR_BG}
            tint="dark"
            style={styles.blurOverlay}
          />
          
          {/* Dark overlay to reduce brightness and add depth */}
          <View style={styles.darkOverlay} />
          
          {/* Subtle gradient for better text contrast */}
          <View style={styles.gradientOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* Content */}
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
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', // Dark overlay to reduce brightness
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)', // Subtle dark gradient for text contrast
  },
});

export default AuthBackground;

