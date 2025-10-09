export const light = {
  // Base tones - Editorial warmth
  bg: '#FAF8F5',
  surface: '#F4F2EE',
  surfaceElev: '#EFEAE3',
  overlay: 'rgba(0,0,0,0.55)',
  
  // Typography colors
  textPrimary: 'rgba(0,0,0,0.85)',
  textSecondary: 'rgba(0,0,0,0.55)',
  textTertiary: 'rgba(0,0,0,0.35)',
  
  // Warm amber accent - boutique luxury (gradient: 145deg)
  accent: '#FDBA74',
  accentGradientStart: '#FBCB8A', // Lighter warm tone (gradient start)
  accentGradientEnd: '#FDBA74',   // Main accent (gradient end)
  accentPressed: '#F5A957',
  
  // Supporting colors
  chipBg: '#EADAC8',
  chipBorder: 'rgba(0,0,0,0.08)',
  success: '#3CCB7F',
  danger: '#FF6B6B',
  
  // Glass panel colors (fake glass - pre-rendered)
  glassBg: 'rgba(255,255,255,0.65)',
  glassBorder: 'rgba(255,255,255,0.4)',
  
  // Border radius system
  radius: { 
    card: 24, 
    btn: 22, 
    chip: 18, 
    input: 16,
    pill: 32 
  },
  
  // Spacing scale (4pt grid)
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 },
  
  // Shadow system - light, editorial shadows with warm glow
  shadow: { 
    card: { 
      shadowColor: 'rgba(0,0,0,0.06)', // Soft elevation
      shadowOpacity: 1, 
      shadowRadius: 12, 
      shadowOffset: { width: 0, height: 4 } 
    },
    button: {
      shadowColor: 'rgba(255,180,100,0.25)', // Warm glow
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }
    },
    glow: {
      shadowColor: 'rgba(255,180,100,0.35)', // Warm highlight glow
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }
    },
    subtle: {
      shadowColor: 'rgba(0,0,0,0.06)',
      shadowOpacity: 1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 2 }
    }
  },
  
  // Typography scale
  typography: {
    // Display titles - Editorial serif feel
    displaySize: 30,
    displayLineHeight: 38,
    displayFont: 'Georgia', // Serif fallback (iOS: New York, Android: Serif)
    displayWeight: '600' as any,
    
    // Section titles - Editorial serif
    titleSize: 22,
    titleLineHeight: 28,
    titleFont: 'Georgia',
    titleWeight: '600' as any,
    
    // Subtitles - Sans serif
    subtitleSize: 18,
    subtitleLineHeight: 24,
    subtitleWeight: '500' as any,
    
    // Body text
    bodySize: 16,
    bodyLineHeight: 24,
    bodyWeight: '400' as any,
    
    // Captions
    captionSize: 14,
    captionLineHeight: 20,
    captionWeight: '400' as any,
    
    letterSpacing: 0.01,
  }
};

export const dark = {
  // Base tones - Dark mode
  bg: '#0E1012',
  surface: '#14171A',
  surfaceElev: '#1A1F24',
  overlay: 'rgba(0,0,0,0.65)',
  
  // Typography colors
  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.65)',
  textTertiary: 'rgba(255,255,255,0.45)',
  
  // Warm amber accent - brighter for dark mode
  accent: '#FFC07A',
  accentGradientStart: '#FFC07A',
  accentGradientEnd: '#FFD79E',
  accentPressed: '#E2A85F',
  
  // Supporting colors
  chipBg: '#1B1F23',
  chipBorder: 'rgba(255,255,255,0.08)',
  success: '#3CCB7F',
  danger: '#FF6B6B',
  
  // Glass panel colors (fake glass - pre-rendered)
  glassBg: 'rgba(20,23,26,0.75)',
  glassBorder: 'rgba(255,255,255,0.1)',
  
  // Border radius system
  radius: { 
    card: 24, 
    btn: 22, 
    chip: 18, 
    input: 16,
    pill: 32 
  },
  
  // Spacing scale (4pt grid)
  spacing: { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 },
  
  // Shadow system - subtle for dark mode
  shadow: { 
    card: { 
      shadowColor: '#000', 
      shadowOpacity: 0.4, 
      shadowRadius: 24, 
      shadowOffset: { width: 0, height: 12 } 
    },
    button: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }
    },
    subtle: {
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 2 }
    }
  },
  
  // Typography scale (same as light)
  typography: {
    // Display titles - Editorial serif feel
    displaySize: 30,
    displayLineHeight: 38,
    displayFont: 'Georgia',
    displayWeight: '600' as any,
    
    // Section titles - Editorial serif
    titleSize: 22,
    titleLineHeight: 28,
    titleFont: 'Georgia',
    titleWeight: '600' as any,
    
    // Subtitles - Sans serif
    subtitleSize: 18,
    subtitleLineHeight: 24,
    subtitleWeight: '500' as any,
    
    // Body text
    bodySize: 16,
    bodyLineHeight: 24,
    bodyWeight: '400' as any,
    
    // Captions
    captionSize: 14,
    captionLineHeight: 20,
    captionWeight: '400' as any,
    
    letterSpacing: 0.01,
  }
};

export type ThemeTokens = typeof light; 