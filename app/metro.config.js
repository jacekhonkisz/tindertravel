const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Force project root to be the app directory, not parent
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Set project root explicitly
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

// iOS-specific optimizations
config.transformer = {
  ...config.transformer,
  // Enable minification for production builds
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Optimize resolver for iOS and web
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'web'], // Support both iOS and web platforms
};

// Allow web serving for PWA
config.server = {
  ...config.server,
};

// Disable static rendering for React Navigation apps
config.transformer = {
  ...config.transformer,
  enableStaticRendering: false,
};

// Force disable static rendering
process.env.EXPO_NO_STATIC_RENDERING = 'true';

module.exports = config;
