/**
 * Font Loader Utility
 * 
 * Loads custom fonts from Adobe Fonts for use in the app.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Download font files from Adobe Fonts (jacek.h@students.opit.com)
 * 2. Place .otf or .ttf files in app/assets/fonts/
 * 3. Update the fontMap below with your font file names
 * 4. Import and call loadFonts() in App.tsx before rendering
 */

import * as Font from 'expo-font';

/**
 * Font mapping - Brandbook fonts from Adobe Fonts
 * 
 * Fonts from brandbook:
 * - Nautica Regular (script, decorative use only)
 * - Minion Pro (serif, headlines)
 * - Apparat (sans-serif, body text, captions)
 * 
 * Format: { fontFamilyName: require('path/to/font-file.otf') }
 * 
 * IMPORTANT: After downloading fonts from Adobe Fonts, uncomment and update the paths below
 */
export const fontMap = {
  // Display Script Font (decorative) - Nautica Regular from brandbook
  // 'Nautica-Regular': require('../../assets/fonts/nautica-regular.otf'),
  
  // Display Serif Font (headlines) - Minion Pro from brandbook
  // 'MinionPro-Regular': require('../../assets/fonts/minion-pro-regular.otf'),
  // 'MinionPro-Bold': require('../../assets/fonts/minion-pro-bold.otf'),
  
  // UI Sans Font (body text, captions) - Apparat from brandbook
  // 'Apparat-Regular': require('../../assets/fonts/apparat-regular.otf'),
  // 'Apparat-Medium': require('../../assets/fonts/apparat-medium.otf'),
  // 'Apparat-Bold': require('../../assets/fonts/apparat-bold.otf'),
};

/**
 * Load all custom fonts
 * Call this in App.tsx before rendering the app
 */
export const loadFonts = async (): Promise<void> => {
  try {
    await Font.loadAsync(fontMap);
    console.log('✅ Custom fonts loaded successfully');
  } catch (error) {
    console.error('❌ Error loading fonts:', error);
    // App will continue with system fonts as fallback
  }
};

/**
 * Check if fonts are loaded
 */
export const areFontsLoaded = (): boolean => {
  return Object.keys(fontMap).length > 0 && Font.isLoaded(Object.keys(fontMap)[0]);
};

