#!/bin/bash

echo "🚀 Egyptian Real Estate Mobile App - Modern Setup"
echo "================================================"

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile/ directory"
    exit 1
fi

# Remove any existing React Native project files
echo "🧹 Cleaning up any existing files..."
rm -rf android ios node_modules
rm -f App.tsx App.js index.js metro.config.js babel.config.js tsconfig.json

# Step 1: Create React Native project using the new CLI
echo "📱 Step 1: Creating React Native project..."
npx @react-native-community/cli@latest init EgyptianRealEstate --template react-native-template-typescript --skip-install

# Move generated files to current directory
echo "📁 Moving generated files..."
mv EgyptianRealEstate/* . 2>/dev/null || true
mv EgyptianRealEstate/.* . 2>/dev/null || true
rmdir EgyptianRealEstate 2>/dev/null || true

# Step 2: Replace the generated package.json with our custom one
echo "📦 Restoring custom package.json..."
# The package.json is already updated with correct versions

# Step 3: Install dependencies with legacy peer deps to handle conflicts
echo "📦 Step 3: Installing dependencies..."
npm install --legacy-peer-deps

# Step 4: Install iOS dependencies (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Step 4: Installing iOS dependencies..."
    if [ -d "ios" ]; then
        cd ios
        pod install --repo-update
        cd ..
        echo "✅ iOS dependencies installed"
    else
        echo "❌ iOS folder not found"
    fi
else
    echo "⚠️ Skipping iOS setup (not on macOS)"
fi

# Step 5: Restore our custom configuration files
echo "⚙️ Step 5: Restoring custom configuration..."

# Restore metro.config.js
cat > metro.config.js << 'EOF'
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for Egyptian Real Estate Mobile App
 * Configured to share types and utilities with web app
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [
    // Allow Metro to watch parent directories for shared code
    path.resolve(__dirname, '..'),
  ],
  
  resolver: {
    alias: {
      // Enable imports from parent directories (shared types, utils)
      '@shared-types': path.resolve(__dirname, '../types'),
      '@shared-lib': path.resolve(__dirname, '../lib'),
      '@shared-components': path.resolve(__dirname, '../components'),
      '@mobile': path.resolve(__dirname, 'src'),
    },
    
    // Ensure TypeScript files are resolved
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    
    // Platform-specific file resolution for mobile
    platforms: ['ios', 'android', 'native', 'web'],
  },
  
  transformer: {
    // Enable TypeScript and JSX transformation
    babelTransformerPath: require.resolve('metro-react-native-babel-preset'),
    
    // Asset extensions for Egyptian real estate app
    assetExts: [
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', // images
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', // videos
      'mp3', 'wav', 'aiff', 'aac', 'm4a', // audio
      'pdf', 'doc', 'docx', 'xls', 'xlsx', // documents
      'ttf', 'otf', 'woff', 'woff2', // fonts
    ],
    
    // Source extensions
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'cjs'],
  },
  
  // Server configuration
  server: {
    port: 8081,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
EOF

# Restore babel.config.js
cat > babel.config.js << 'EOF'
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reanimated plugin (must be last)
    'react-native-reanimated/plugin',
    
    // Module resolution for shared code
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@mobile': './src',
          '@shared-types': '../types',
          '@shared-lib': '../lib', 
          '@shared-components': '../components',
        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.native.js',
          '.js',
          '.ios.ts',
          '.android.ts',
          '.native.ts',
          '.ts',
          '.tsx',
          '.json',
        ],
      },
    ],
  ],
};
EOF

# Restore tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "jsx": "react-native",
    "lib": ["ES2019", "ES2020.Promise"],
    "moduleResolution": "node", 
    "noEmit": true,
    "strict": false,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "target": "esnext",
    "noImplicitAny": false,
    "typeRoots": ["node_modules/@types", "src/types"],
    
    // Path mapping for shared code
    "baseUrl": ".",
    "paths": {
      "@mobile/*": ["./src/*"],
      "@shared-types/*": ["../types/*"],
      "@shared-lib/*": ["../lib/*"],
      "@shared-components/*": ["../components/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/types/global.d.ts",
    "../types/**/*",
    "../lib/**/*",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js",
    "../node_modules",
    "../.next",
    "../out"
  ]
}
EOF

# Replace App.tsx with our custom one
cp src/App.tsx App.tsx 2>/dev/null || echo "⚠️ Custom App.tsx not found, using generated one"

# Step 6: Update app configuration
echo "📱 Step 6: Updating app configuration..."

# Update Android app name
if [ -f "android/app/src/main/res/values/strings.xml" ]; then
    echo '<resources><string name="app_name">Egyptian Real Estate</string></resources>' > android/app/src/main/res/values/strings.xml
    echo "✅ Android app name updated"
fi

# Update Android settings.gradle
if [ -f "android/settings.gradle" ]; then
    cat > android/settings.gradle << EOF
rootProject.name = 'EgyptianRealEstate'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
EOF
    echo "✅ Android settings updated"
fi

# Step 7: Final verification
echo "🔍 Step 7: Verifying setup..."

ERRORS=0

if [ ! -d "android" ]; then
    echo "❌ Android folder missing"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -d "ios" ]; then
    echo "❌ iOS folder missing"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not installed"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "🎉 Setup Complete! Your Egyptian Real Estate mobile app is ready!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start Metro bundler:    npm start"
    echo "2. Run Android app:        npm run android"
    echo "3. Run iOS app:           npm run ios"
    echo ""
    echo "🔗 Your app can now use shared types and utilities:"
    echo "   import { Property } from '@shared-types/property';"
    echo "   import { formatPrice } from '@shared-lib/utils';"
    echo ""
    echo "📱 Happy coding!"
else
    echo ""
    echo "❌ Setup completed with $ERRORS errors. Check the issues above."
    echo ""
    echo "🔧 Common fixes:"
    echo "1. Make sure you have Android Studio installed"
    echo "2. Make sure you have Xcode installed (macOS only)"
    echo "3. Try running: npm install --legacy-peer-deps"
fi 