import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../theme';

interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  variant?: 'default' | 'accent';
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  variant = 'default',
  style,
  ...props
}) => {
  const theme = useTheme();

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.chip,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (selected) {
      return {
        ...baseStyle,
        backgroundColor: theme.accent,
        borderColor: theme.accent,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: theme.chipBg,
      borderColor: theme.chipBorder,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      fontSize: theme.typography?.captionSize || 13,
      fontWeight: '500',
      letterSpacing: theme.typography?.letterSpacing || 0.01,
      color: selected ? '#FFFFFF' : theme.textPrimary,
    };
  };

  return (
    <TouchableOpacity
      style={[getChipStyle(), style]}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
};

export default Chip; 