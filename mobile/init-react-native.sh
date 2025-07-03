#!/bin/bash

echo "🚀 Egyptian Real Estate Mobile App - React Native Initialization"
echo "=============================================================="

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile/ directory"
    exit 1
fi

# Check if React Native CLI is installed
if ! command -v npx react-native &> /dev/null; then
    echo "📱 Installing React Native CLI..."
    npm install -g @react-native-community/cli
fi

# Step 1: Initialize React Native project
echo "📱 Step 1: Initializing React Native project..."
if [ ! -d "android" ] || [ ! -d "ios" ]; then
    echo "Creating React Native project structure..."
    npx react-native init EgyptianRealEstate --template react-native-template-typescript --skip-install
    
    # Move files to current directory
    echo "Moving generated files..."
    mv EgyptianRealEstate/* . 2>/dev/null || true
    mv EgyptianRealEstate/.* . 2>/dev/null || true
    rmdir EgyptianRealEstate 2>/dev/null || true
    
    echo "✅ React Native project structure created"
else
    echo "✅ React Native project structure already exists"
fi

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install

# Step 3: Install iOS dependencies (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Step 3: Installing iOS dependencies..."
    cd ios
    pod install --repo-update
    cd ..
    echo "✅ iOS dependencies installed"
else
    echo "⚠️  Skipping iOS setup (not on macOS)"
fi

# Step 4: Update app configuration
echo "⚙️  Step 4: Updating app configuration..."

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

# Update iOS Info.plist (if exists)
if [ -f "ios/EgyptianRealEstate/Info.plist" ]; then
    # This would need proper plist editing, for now just show instruction
    echo "📝 Please manually update ios/EgyptianRealEstate/Info.plist:"
    echo "   - Set CFBundleDisplayName to 'Egyptian Real Estate'"
    echo "   - Set CFBundleName to 'Egyptian Real Estate'"
fi

# Step 5: Final verification
echo "🔍 Step 5: Verifying setup..."

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
    echo "🎉 Setup Complete! Your mobile app is ready for development."
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
    echo "📱 Happy coding your Egyptian Real Estate mobile app!"
else
    echo ""
    echo "❌ Setup completed with $ERRORS errors. Please check the issues above."
fi 