/**
 * Debug Overlay Component
 * Shows photo view mode metrics during development
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ComputedPhotoStyles, COLORS } from '../types/photoView';

interface PhotoDebugOverlayProps {
  styles: ComputedPhotoStyles;
  visible?: boolean;
}

/**
 * Development-only overlay showing photo rendering metrics
 * Enable with __DEV__ flag or explicit prop
 */
export function PhotoDebugOverlay({
  styles,
  visible = __DEV__,
}: PhotoDebugOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={debugStyles.container}>
      <View style={debugStyles.panel}>
        <Text style={debugStyles.title}>Photo Debug</Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Mode:</Text> {styles.mode}
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Aspect:</Text> {styles.aspectRatio.toFixed(2)}
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Scale:</Text> {styles.scale.toFixed(3)}
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Crop:</Text> {styles.cropPercentage.toFixed(1)}%
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Focal:</Text> ({styles.focalPoint.x.toFixed(2)}, {styles.focalPoint.y.toFixed(2)})
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Image:</Text> {Math.round(styles.imageWidth)}×{Math.round(styles.imageHeight)}
        </Text>
        
        <Text style={debugStyles.row}>
          <Text style={debugStyles.label}>Viewport:</Text> {Math.round(styles.containerWidth)}×{Math.round(styles.containerHeight)}
        </Text>
      </View>
    </View>
  );
}

const debugStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 1000,
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.WHITE_TRANSLUCENT,
    minWidth: 200,
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.WHITE_TRANSLUCENT,
    paddingBottom: 4,
  },
  row: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  label: {
    fontWeight: 'bold',
    color: '#88CCFF',
  },
});
