export const light = {
  bg: '#FAF7F2',
  surface: '#F2ECE5',
  surfaceElev: '#EDE6DE',
  overlay: 'rgba(0,0,0,0.55)', // na gradient stop
  textPrimary: '#0F1215',
  textSecondary: '#5F646B',
  accent: '#FFB86B',
  accentPressed: '#E69E54',
  chipBg: '#EFE8E0',
  chipBorder: '#E3DBD2',
  success: '#3CCB7F',
  danger: '#FF6B6B',
  radius: { card: 24, btn: 22, chip: 18, input: 16 },
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 },
  shadow: { 
    card: { 
      shadowColor: '#000', 
      shadowOpacity: 0.08, 
      shadowRadius: 24, 
      shadowOffset: { width: 0, height: 12 } 
    } 
  }
};

export const dark = {
  bg: '#0E1012',
  surface: '#14171A',
  surfaceElev: '#1A1F24',
  overlay: 'rgba(0,0,0,0.55)',
  textPrimary: '#ECEAE5',
  textSecondary: '#9BA3AC',
  accent: '#FFC07A',
  accentPressed: '#E2A85F',
  chipBg: '#1B1F23',
  chipBorder: '#2A2F34',
  success: '#3CCB7F',
  danger: '#FF6B6B',
  radius: { card: 24, btn: 22, chip: 18, input: 16 },
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 },
  shadow: { 
    card: { 
      shadowColor: '#000', 
      shadowOpacity: 0.4, 
      shadowRadius: 24, 
      shadowOffset: { width: 0, height: 12 } 
    } 
  }
};

export type ThemeTokens = typeof light; 