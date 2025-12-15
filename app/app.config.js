module.exports = {
  name: 'Glintz',
  slug: 'glintz-travel',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  owner: 'jachon',
  extra: {
    eas: {
      projectId: '82cc888a-3814-4b97-afd7-a2f8312df9be'
    }
  },
  // Temporarily disabled for Expo Go testing
  // updates: {
  //   url: 'https://u.expo.dev/glintz-travel'
  // },
  // runtimeVersion: {
  //   policy: 'appVersion'
  // },
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.glintz.travel',
    buildNumber: '1',
    infoPlist: {
      UIBackgroundModes: ['background-processing'],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      },
      UIRequiredDeviceCapabilities: [
        'arm64'
      ],
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
      UIViewControllerBasedStatusBarAppearance: false,
      UIStatusBarHidden: false
    },
    associatedDomains: ['applinks:glintz.travel'],
    usesAppleSignIn: false,
    config: {
      usesNonExemptEncryption: false,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
    }
  },
  plugins: [
    [
      'expo-screen-orientation',
      {
        initialOrientation: 'PORTRAIT_UP'
      }
    ]
  ],
  scheme: 'glintz',
  platforms: ['ios', 'web'],
  primaryColor: '#000000',
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
    build: {
      babel: {
        include: ['@react-navigation']
      }
    },
    name: 'Glintz Travel',
    shortName: 'Glintz',
    description: 'Discover your perfect hotel with swipe-based browsing',
    themeColor: '#000000',
    backgroundColor: '#000000',
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    lang: 'en',
    scope: '/'
  }
};

