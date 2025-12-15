import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface MonogramGlowProps {
  letter?: 'G' | 'H';
  size?: number;
  accentColor?: string;
  strokeColor?: string;
  tone?: 'light' | 'dark';
  style?: ViewStyle;
}

const MonogramGlow: React.FC<MonogramGlowProps> = ({
  letter = 'G',
  size = 96,
  accentColor = '#FDBA74',
  strokeColor,
  tone = 'light',
  style,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite shimmer animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();

    return () => animation.stop();
  }, [shimmerAnimation]);

  // Determine colors based on tone
  const backgroundColor = tone === 'dark' ? '#0F0F10' : '#FAF8F5';
  const finalStrokeColor = strokeColor || (tone === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)');

  // Calculate shimmer position
  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-size * 0.5, 0, size * 0.5],
  });

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {/* Base letter outline */}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={styles.svg}
      >
        <SvgText
          x="50"
          y="50"
          fontSize="60"
          fontWeight="700"
          textAnchor="middle"
          alignmentBaseline="central"
          fill="none"
          stroke={finalStrokeColor}
          strokeWidth="3"
          opacity={0.3}
        >
          {letter}
        </SvgText>
      </Svg>

      {/* Animated shimmer layer */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            opacity: shimmerOpacity,
            transform: [{ translateX: shimmerTranslateX }],
          },
        ]}
      >
        <Svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={styles.svg}
        >
          <Defs>
            <LinearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={accentColor} stopOpacity="0" />
              <Stop offset="50%" stopColor={accentColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Shimmer glow effect */}
          <SvgText
            x="50"
            y="50"
            fontSize="60"
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="central"
            fill="none"
            stroke="url(#shimmerGradient)"
            strokeWidth="3.5"
          >
            {letter}
          </SvgText>
        </Svg>
      </Animated.View>

      {/* Subtle halo glow effect */}
      <Animated.View
        style={[
          styles.haloContainer,
          {
            opacity: shimmerOpacity.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
      >
        <Svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={styles.svg}
        >
          <SvgText
            x="50"
            y="50"
            fontSize="60"
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="central"
            fill={accentColor}
            fillOpacity="0.15"
          >
            {letter}
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  svg: {
    position: 'absolute',
  },
  shimmerContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  haloContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MonogramGlow;

