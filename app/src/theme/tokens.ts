export const light = {
  // Base tones - Brandbook colors
  bg: '#E5DED5', // Sand - main background (from brandbook)
  surface: '#F4EFE8', // Sand light - card/panel backgrounds
  surfaceElev: '#EFEAE3', // Elevated surfaces
  overlay: 'rgba(0,0,0,0.55)',
  
  // Typography colors - using brandbook deep navy
  textPrimary: '#10233B', // Deep Navy - main text (from brandbook)
  textSecondary: 'rgba(16, 35, 59, 0.65)', // Deep Navy with opacity
  textTertiary: 'rgba(16, 35, 59, 0.45)',
  
  // Brandbook accent color - Terracotta
  accent: '#9D5049', // Terracotta - CTAs, important highlights (from brandbook)
  accentGradientStart: '#9D5049', // Terracotta (gradient start)
  accentGradientEnd: '#7C3B35',   // Terracotta dark (gradient end)
  accentPressed: '#7C3B35', // Terracotta dark - pressed state
  
  // Supporting colors
  chipBg: '#A1BAC7', // Coastal Blue - secondary sections (from brandbook)
  chipBorder: 'rgba(16, 35, 59, 0.15)', // Deep Navy with opacity
  success: '#3CCB7F',
  danger: '#FF6B6B',
  
  // Glass panel colors (fake glass - pre-rendered)
  glassBg: 'rgba(229, 222, 213, 0.85)', // Sand with opacity
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
      // No shadow for premium flat design
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
  
  // Typography scale - Brandbook fonts with system fallbacks
  // NOTE: When brandbook fonts are downloaded, they will override system fonts
  typography: {
    // Display titles - Minion Pro (serif headlines from brandbook)
    // Fallback: Georgia (iOS serif)
    displaySize: 30,
    displayLineHeight: 38,
    displayFont: 'Georgia', // Will be 'MinionPro-Regular' when font is loaded
    displayWeight: '600' as any,
    
    // Section titles - Minion Pro (serif)
    titleSize: 22,
    titleLineHeight: 28,
    titleFont: 'Georgia', // Will be 'MinionPro-Regular' when font is loaded
    titleWeight: '600' as any,
    
    // Subtitles - Apparat (sans-serif from brandbook)
    // Fallback: System (SF Pro on iOS)
    subtitleSize: 18,
    subtitleLineHeight: 24,
    subtitleFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    subtitleWeight: '500' as any,
    
    // Body text - Apparat (sans-serif from brandbook)
    bodySize: 16,
    bodyLineHeight: 24,
    bodyFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    bodyWeight: '400' as any,
    
    // Captions - Apparat (sans-serif from brandbook)
    captionSize: 14,
    captionLineHeight: 20,
    captionFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    captionWeight: '400' as any,
    
    // Script font - Nautica Regular (decorative use only from brandbook)
    scriptFont: 'Georgia', // Will be 'Nautica-Regular' when font is loaded
    scriptSize: 18,
    scriptLineHeight: 24,
    
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
  
  // Typography scale - Brandbook fonts with system fallbacks
  typography: {
    // Display titles - Minion Pro (serif headlines from brandbook)
    displaySize: 30,
    displayLineHeight: 38,
    displayFont: 'Georgia', // Will be 'MinionPro-Regular' when font is loaded
    displayWeight: '600' as any,
    
    // Section titles - Minion Pro (serif)
    titleSize: 22,
    titleLineHeight: 28,
    titleFont: 'Georgia', // Will be 'MinionPro-Regular' when font is loaded
    titleWeight: '600' as any,
    
    // Subtitles - Apparat (sans-serif from brandbook)
    subtitleSize: 18,
    subtitleLineHeight: 24,
    subtitleFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    subtitleWeight: '500' as any,
    
    // Body text - Apparat (sans-serif from brandbook)
    bodySize: 16,
    bodyLineHeight: 24,
    bodyFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    bodyWeight: '400' as any,
    
    // Captions - Apparat (sans-serif from brandbook)
    captionSize: 14,
    captionLineHeight: 20,
    captionFont: 'System', // Will be 'Apparat-Regular' when font is loaded
    captionWeight: '400' as any,
    
    // Script font - Nautica Regular (decorative use only from brandbook)
    scriptFont: 'Georgia', // Will be 'Nautica-Regular' when font is loaded
    scriptSize: 18,
    scriptLineHeight: 24,
    
    letterSpacing: 0.01,
  }
};

export type ThemeTokens = typeof light; 