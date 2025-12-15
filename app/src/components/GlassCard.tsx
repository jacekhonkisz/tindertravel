import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  SHADOW_CARD, 
  BLUR_GLASS, 
  SPACING 
} from '../ui/tokens';
import { useTheme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Reusable glass card container with blur effect
 * Used for forms and content overlays on AuthBackground
 * Uses brandbook colors and radius from theme
 */
const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  const theme = useTheme();
  
  const dynamicStyles = StyleSheet.create({
    container: {
      width: '100%',
      borderRadius: 24, // 24px from brandbook
      backgroundColor: '#E5DED5', // Sand color from brandbook (solid, not transparent)
      overflow: 'hidden',
      ...SHADOW_CARD,
    },
    content: {
      padding: SPACING.xl,
    },
  });
  
  return (
    <BlurView
      intensity={BLUR_GLASS}
      tint="extraLight"
      style={[dynamicStyles.container, style]}
    >
      <View style={dynamicStyles.content}>
        {children}
      </View>
    </BlurView>
  );
};

export default GlassCard;

