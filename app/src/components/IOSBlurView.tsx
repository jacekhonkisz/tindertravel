import React from 'react';
import { StyleSheet, ViewStyle, View, Platform } from 'react-native';

interface IOSBlurViewProps {
  children: React.ReactNode;
  blurType?: 'light' | 'dark' | 'default' | 'prominent' | 'regular' | 'extraDark';
  blurAmount?: number;
  style?: ViewStyle;
  reducedTransparencyFallbackColor?: string;
}

const IOSBlurView: React.FC<IOSBlurViewProps> = ({
  children,
  blurType = 'dark',
  blurAmount = 10,
  style,
  reducedTransparencyFallbackColor = 'rgba(0,0,0,0.8)',
}) => {
  // For now, use a simple semi-transparent background as fallback
  // This works in simulator and provides a similar visual effect
  const getFallbackColor = (type: string): string => {
    switch (type) {
      case 'light':
        return 'rgba(255,255,255,0.8)';
      case 'dark':
      case 'extraDark':
        return 'rgba(0,0,0,0.8)';
      case 'default':
      case 'regular':
      case 'prominent':
      default:
        return 'rgba(0,0,0,0.6)';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getFallbackColor(blurType),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default IOSBlurView; 