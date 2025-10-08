const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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

// Optimize resolver for iOS-only
config.resolver = {
  ...config.resolver,
  platforms: ['ios'], // Only resolve iOS platform
  // Resolve native modules efficiently
  resolveRequest: (context, moduleName, platform) => {
    // Skip web-specific modules for main app
    if (moduleName.includes('react-native-web') || moduleName.includes('react-dom')) {
      return {
        type: 'empty',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

// More selective web blocking - allow DevTools but block main app web serving
config.server = {
  ...config.server,
  // Enhanced URL rewriting for better control
  rewriteRequestUrl: (url) => {
    // Allow web requests for DevTools interface (but not main app)
    if (url.includes('platform=web') && !url.includes('dev=true')) {
      // This is likely a main app web request - block it
      console.log('🚫 Blocking main app web bundle request:', url);
      return null; // Block the request
    }
    // Allow DevTools web requests to pass through
    return url;
  },
};

module.exports = config;
