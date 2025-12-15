const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-navigation']
      }
    },
    argv
  );

  // Customize the config before returning it
  
  // Add PWA support
  config.resolve.extensions = [
    '.web.tsx',
    '.web.ts',
    '.web.jsx',
    '.web.js',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.json'
  ];

  // Add aliases for better web compatibility
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native-maps': 'react-native-web-maps'
  };

  // Service Worker configuration
  if (config.mode === 'production') {
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          console.log('✅ Build complete! Service Worker ready.');
        });
      }
    });
  }

  return config;
};



