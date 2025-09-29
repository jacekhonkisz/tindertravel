import { useColorScheme } from 'react-native';
import { light, dark, ThemeTokens } from './tokens';

export const useTheme = (): ThemeTokens => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
};

export { light, dark };
export type { ThemeTokens }; 