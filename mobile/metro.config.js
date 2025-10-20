const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Use Expo's metro config instead of React Native's
const config = getDefaultConfig(__dirname);

// Add custom resolver options
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Add asset and source extensions
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('cjs');

// Remove parent node_modules watching to avoid conflicts
// watchFolders: [path.resolve(__dirname, '..', 'node_modules')],

module.exports = config;
