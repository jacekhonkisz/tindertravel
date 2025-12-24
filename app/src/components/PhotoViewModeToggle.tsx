/**
 * Photo View Mode Toggle Component
 * Circular button in top-right of photo viewport to cycle through view modes
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ViewMode, MODE_TOGGLE_CONFIG, COLORS } from '../types/photoView';
import { getModeDisplayName, cycleViewMode } from '../utils/photoStyleComputer';
import Icon from '../ui/Icon';

interface PhotoViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  style?: ViewStyle;
}

/**
 * Toggle button to cycle through photo view modes
 * Positioned absolutely in top-right of photo viewport
 */
export function PhotoViewModeToggle({
  currentMode,
  onModeChange,
  style,
}: PhotoViewModeToggleProps) {
  const handlePress = () => {
    const nextMode = cycleViewMode(currentMode);
    onModeChange(nextMode);
  };

  const displayName = getModeDisplayName(currentMode);
  const iconName = getModeIconName(currentMode);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      activeOpacity={0.7}
      hitSlop={{
        top: MODE_TOGGLE_CONFIG.hitSlop,
        bottom: MODE_TOGGLE_CONFIG.hitSlop,
        left: MODE_TOGGLE_CONFIG.hitSlop,
        right: MODE_TOGGLE_CONFIG.hitSlop,
      }}
    >
      <View style={styles.button}>
        <Icon name={iconName} size={16} variant="white" style={styles.icon} />
        <Text style={styles.label}>{displayName}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Get icon name for view mode
 */
function getModeIconName(mode: ViewMode): 'expand' | 'contract' | 'balance' {
  switch (mode) {
    case 'FULL_VERTICAL_SCREEN':
      return 'expand'; // Full screen icon
    case 'ORIGINAL_FULL':
      return 'contract'; // Fit/frame icon
    case 'BALANCED':
      return 'balance'; // Balance icon
    default:
      return 'balance';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: MODE_TOGGLE_CONFIG.top,
    right: MODE_TOGGLE_CONFIG.right,
    zIndex: 100,
  },
  button: {
    width: MODE_TOGGLE_CONFIG.size,
    height: MODE_TOGGLE_CONFIG.size,
    borderRadius: MODE_TOGGLE_CONFIG.size / 2,
    backgroundColor: COLORS.NAVY_BLUE_TRANSLUCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.WHITE_TRANSLUCENT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginBottom: -2,
  },
  label: {
    fontSize: 7,
    color: COLORS.WHITE,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

