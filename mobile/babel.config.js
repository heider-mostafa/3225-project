module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
          '@types': './src/types',
          '@config': './src/config',
          '@store': './src/store',
          '@navigation': './src/navigation',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be listed last
  ],
};
