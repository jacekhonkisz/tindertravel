import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme';

interface DebugBadgeProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const DebugBadge: React.FC<DebugBadgeProps> = ({
  visible = __DEV__,
  position = 'top-left',
}) => {
  const theme = useTheme();

  if (!visible) return null;

  const getPositionStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: 50, left: 20 };
      case 'top-right':
        return { ...baseStyle, top: 50, right: 20 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 50, left: 20 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 50, right: 20 };
      default:
        return { ...baseStyle, top: 50, left: 20 };
    }
  };

  const badgeStyle: ViewStyle = {
    backgroundColor: theme.danger,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.chip,
    opacity: 0.8,
  };

  const textStyle: TextStyle = {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  };

  return (
    <View style={[getPositionStyle(), badgeStyle]}>
      <Text style={textStyle}>DEV</Text>
    </View>
  );
};

export default DebugBadge; 