import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  COLOR_CARD, 
  RADIUS_L, 
  SHADOW_CARD, 
  BLUR_GLASS, 
  SPACING 
} from '../ui/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Reusable glass card container with blur effect
 * Used for forms and content overlays on AuthBackground
 */
const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return (
    <BlurView
      intensity={BLUR_GLASS}
      tint="extraLight"
      style={[styles.container, style]}
    >
      <View style={styles.content}>
        {children}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: RADIUS_L,
    backgroundColor: COLOR_CARD,
    overflow: 'hidden',
    ...SHADOW_CARD,
  },
  content: {
    padding: SPACING.xl,
  },
});

export default GlassCard;

