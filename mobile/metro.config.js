const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    // Fix for React Native 0.79+ asset resolver issues
    assetExts: [...defaultConfig.resolver.assetExts, 'bin'],
    // Add .cjs support for Firebase and other packages that use CommonJS exports
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    // Enable package exports support (required for many modern packages)
    unstable_enablePackageExports: true,
    // Disable package exports temporarily if causing issues
    // unstable_enablePackageExports: false,
  },
  watchFolders: [
    // Include parent node_modules for monorepo setup
    path.resolve(__dirname, '..', 'node_modules'),
  ],
};

module.exports = mergeConfig(defaultConfig, config);
