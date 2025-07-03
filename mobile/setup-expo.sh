#!/bin/bash

echo "🚀 Setting up React Native app for Expo development..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the mobile directory."
    exit 1
fi

# Install/update Expo CLI globally if not already installed
echo "📦 Checking Expo CLI installation..."
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI globally..."
    npm install -g @expo/cli
else
    echo "✅ Expo CLI is already installed"
fi

# Clean up old node_modules and package-lock.json
echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install additional required dependencies for Expo
echo "📦 Installing Expo-compatible dependencies..."
npx expo install --fix

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Install Expo Go app on your phone from App Store/Google Play"
echo "2. Run: npm start"
echo "3. Scan the QR code with Expo Go app"
echo ""
echo "📱 Make sure your phone and computer are on the same WiFi network!"