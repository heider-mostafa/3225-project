// Global type declarations for React Native
declare global {
  var __DEV__: boolean;
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// React Native global types
declare module 'react-native' {
  // Basic React Native types will be available once packages are installed
  export * from 'react-native';
}

declare module '@react-native-async-storage/async-storage' {
  // AsyncStorage types will be available once package is installed
  export * from '@react-native-async-storage/async-storage';
}

declare module '@react-navigation/native' {
  // Navigation types will be available once package is installed
  export * from '@react-navigation/native';
}

declare module '@react-navigation/stack' {
  // Stack navigation types will be available once package is installed
  export * from '@react-navigation/stack';
}

declare module 'react-native-safe-area-context' {
  // Safe area types will be available once package is installed
  export * from 'react-native-safe-area-context';
}

declare module 'react-redux' {
  // Redux types will be available once package is installed
  export * from 'react-redux';
}

declare module 'redux-persist/integration/react' {
  // Redux persist types will be available once package is installed
  export * from 'redux-persist/integration/react';
}

declare module '@reduxjs/toolkit' {
  // Redux toolkit types will be available once package is installed
  export * from '@reduxjs/toolkit';
}

declare module 'redux-persist' {
  // Redux persist types will be available once package is installed
  export * from 'redux-persist';
}

declare module 'axios' {
  // Axios types will be available once package is installed
  export * from 'axios';
}

declare module '@react-native-community/netinfo' {
  // NetInfo types will be available once package is installed
  export * from '@react-native-community/netinfo';
}

export {}; 