import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import IOSHaptics from '../utils/IOSHaptics';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  gradient?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  gradient = true,
  style,
  ...props
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    IOSHaptics.buttonPress();
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.btn,
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      paddingHorizontal: theme.spacing.xl,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.accent,
          ...theme.shadow.button,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.chipBorder,
          ...theme.shadow.subtle,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.danger,
          ...theme.shadow.button,
        };
      default:
        return baseStyle;
    }
  };

  const getPressedStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.accentPressed };
      case 'secondary':
        return { backgroundColor: theme.surfaceElev };
      case 'danger':
        return { backgroundColor: '#E55A5A' };
      default:
        return {};
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography?.bodySize || 17,
      fontWeight: '600',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
    };

    switch (variant) {
      case 'primary':
      case 'danger':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: theme.textPrimary,
        };
      default:
        return baseStyle;
    }
  };

  // Primary button with gradient
  if (variant === 'primary' && gradient) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : 'auto' }}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          {...props}
        >
          <LinearGradient
            colors={[theme.accentGradientStart || '#FBCB8A', theme.accentGradientEnd || '#FDBA74']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              getButtonStyle(),
              {
                shadowColor: 'rgba(255,180,100,0.35)',
                shadowOpacity: 1,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              },
              style,
            ]}
          >
            <Text style={getTextStyle()}>{title}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Standard button (secondary, danger, or primary without gradient)
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : 'auto' }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        {...props}
      >
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button; 