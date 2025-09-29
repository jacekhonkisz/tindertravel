import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ViewProps,
  DimensionValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface GradientOverlayProps extends ViewProps {
  height?: DimensionValue;
  colors?: [string, string, ...string[]];
  locations?: [number, number, ...number[]];
}

const GradientOverlay: React.FC<GradientOverlayProps> = ({
  height = '50%',
  colors,
  locations,
  style,
  ...props
}) => {
  const theme = useTheme();

  const defaultColors = colors || (['transparent', theme.overlay] as [string, string]);
  const defaultLocations = locations || ([0, 1] as [number, number]);

  const overlayStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 1,
  };

  return (
    <LinearGradient
      colors={defaultColors}
      locations={defaultLocations}
      style={[overlayStyle, style]}
      {...props}
    />
  );
};

export default GradientOverlay; 