/**
 * Standardized Icon Component
 * Matches brandbook design guidelines with consistent styling
 * Uses Ionicons with brand colors: Beige, Navy Blue, Coastal Blue, Terracotta
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export type IconName = 
  | 'bookmark'
  | 'bookmark-outline'
  | 'person'
  | 'person-outline'
  | 'close'
  | 'close-circle'
  | 'refresh'
  | 'menu'
  | 'chevron-up'
  | 'chevron-down'
  | 'checkmark'
  | 'expand'
  | 'contract'
  | 'balance'
  | 'camera'
  | 'image'
  | 'search'
  | 'help-circle';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  variant?: 'default' | 'accent' | 'navy' | 'coastal' | 'beige' | 'white';
  style?: any;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  variant = 'default',
  style,
}) => {
  const theme = useTheme();

  // Get color based on variant
  const getColor = (): string => {
    if (color) return color;
    
    switch (variant) {
      case 'accent':
        return theme.accent; // Terracotta #9D5049
      case 'navy':
        return theme.textPrimary; // Navy Blue #10233B
      case 'coastal':
        return theme.chipBg; // Coastal Blue #A1BAC7
      case 'beige':
        return theme.bg; // Beige #E5DED5
      case 'white':
        return '#FFFFFF';
      case 'default':
      default:
        return theme.textPrimary; // Navy Blue as default
    }
  };

  // Map custom icon names to Ionicons
  const getIoniconName = (iconName: IconName): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<IconName, keyof typeof Ionicons.glyphMap> = {
      'bookmark': 'bookmark',
      'bookmark-outline': 'bookmark-outline',
      'person': 'person',
      'person-outline': 'person-outline',
      'close': 'close',
      'close-circle': 'close-circle',
      'refresh': 'refresh',
      'menu': 'menu',
      'chevron-up': 'chevron-up',
      'chevron-down': 'chevron-down',
      'checkmark': 'checkmark',
      'expand': 'expand-outline', // Full screen / expand
      'contract': 'scan-outline', // Fit / contract (using scan as frame/fit alternative)
      'balance': 'albums-outline', // Balance icon
      'camera': 'camera',
      'image': 'image',
      'search': 'search',
      'help-circle': 'help-circle',
    };
    return iconMap[iconName] || 'help-circle';
  };

  return (
    <Ionicons
      name={getIoniconName(name)}
      size={size}
      color={getColor()}
      style={style}
    />
  );
};

export default Icon;

