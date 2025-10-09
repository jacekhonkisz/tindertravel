import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ViewProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated';
  withBlur?: boolean;
  blurIntensity?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  withBlur = false,
  blurIntensity = 30,
  style,
  ...props
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.card,
      overflow: 'hidden',
      ...theme.shadow.card,
    };

    switch (variant) {
      case 'surface':
        return {
          ...baseStyle,
          backgroundColor: theme.surface,
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.surfaceElev,
        };
      default:
        return baseStyle;
    }
  };

  // Fake glass panel style (pre-rendered background, not live blur)
  const getGlassStyle = (): ViewStyle => {
    return {
      backgroundColor: theme.glassBg || 'rgba(255,255,255,0.65)',
      borderWidth: 1,
      borderColor: theme.glassBorder || 'rgba(255,255,255,0.4)',
      ...theme.shadow.subtle,
    };
  };

  if (withBlur) {
    return (
      <BlurView
        intensity={blurIntensity}
        tint="systemThinMaterial"
        style={[getCardStyle(), getGlassStyle(), style]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card; 