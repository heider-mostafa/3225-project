#!/bin/bash

# Egyptian Real Estate Mobile App - Environment Setup Script
# This script fixes common React Native development environment issues

set -e

echo "🏠 Setting up Egyptian Real Estate Mobile Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please manually configure your environment."
    exit 1
fi

# 1. Check and fix Node.js version
print_status "Checking Node.js version..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# 2. Install/Update Watchman
print_status "Checking Watchman..."
if ! command -v watchman >/dev/null 2>&1; then
    print_warning "Watchman not found. Installing via Homebrew..."
    if command -v brew >/dev/null 2>&1; then
        brew install watchman
        print_success "Watchman installed"
    else
        print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
else
    print_success "Watchman is already installed"
fi

# 3. Check Java version and suggest fix
print_status "Checking Java version..."
if command -v java >/dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ "$JAVA_VERSION" == "21" ]]; then
        print_warning "Java 21 detected. React Native requires Java 17 or 20."
        print_status "Installing Java 17 via Homebrew..."
        
        if command -v brew >/dev/null 2>&1; then
            brew install openjdk@17
            
            # Add to shell profile
            echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
            echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
            
            print_success "Java 17 installed. Please restart your terminal and run 'source ~/.zshrc'"
            print_warning "You may need to restart your terminal for changes to take effect"
        else
            print_error "Homebrew not found. Please install Java 17 manually"
        fi
    else
        print_success "Java version is compatible: $JAVA_VERSION"
    fi
else
    print_error "Java not found. Please install Java 17 or 20"
fi

# 4. Check Android SDK
print_status "Checking Android environment..."
if [[ -z "$ANDROID_HOME" ]]; then
    print_warning "ANDROID_HOME not set"
    
    # Try to find Android SDK in common locations
    ANDROID_LOCATIONS=(
        "$HOME/Library/Android/sdk"
        "$HOME/Android/Sdk"
        "/usr/local/share/android-sdk"
    )
    
    for location in "${ANDROID_LOCATIONS[@]}"; do
        if [[ -d "$location" ]]; then
            print_status "Found Android SDK at: $location"
            echo "export ANDROID_HOME=\"$location\"" >> ~/.zshrc
            echo "export PATH=\"\$ANDROID_HOME/tools:\$ANDROID_HOME/tools/bin:\$ANDROID_HOME/platform-tools:\$PATH\"" >> ~/.zshrc
            print_success "Added ANDROID_HOME to ~/.zshrc"
            break
        fi
    done
else
    print_success "ANDROID_HOME is set: $ANDROID_HOME"
fi

# 5. Clean and setup project
print_status "Setting up project dependencies..."

# Clean old node_modules and lockfile
if [[ -d "node_modules" ]]; then
    print_status "Removing old node_modules..."
    rm -rf node_modules
fi

if [[ -f "package-lock.json" ]]; then
    print_status "Removing old package-lock.json..."
    rm -f package-lock.json
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Setup iOS dependencies (if on macOS)
if [[ -d "ios" ]]; then
    print_status "Setting up iOS dependencies..."
    cd ios
    
    if command -v pod >/dev/null 2>&1; then
        pod install --repo-update
        print_success "iOS dependencies installed"
    else
        print_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
        pod install --repo-update
        print_success "CocoaPods installed and iOS dependencies setup"
    fi
    
    cd ..
fi

# 6. Clean Android build
print_status "Cleaning Android build..."
cd android
if [[ -f "./gradlew" ]]; then
    chmod +x ./gradlew
    ./gradlew clean
    print_success "Android build cleaned"
else
    print_warning "Gradle wrapper not found"
fi
cd ..

# 7. Final checks and instructions
print_success "🎉 Environment setup complete!"
echo ""
print_status "Next steps:"
echo "1. Restart your terminal or run: source ~/.zshrc"
echo "2. Start Metro bundler: npm start"
echo "3. In a new terminal, run the app:"
echo "   - Android: npm run android"
echo "   - iOS: npm run ios"
echo ""
print_warning "If you encounter issues:"
echo "- Make sure Android Studio is installed with Android SDK 35"
echo "- Ensure you have an Android emulator or iOS simulator set up"
echo "- Run 'npx react-native doctor' to check your environment"
echo ""
print_status "Happy coding! 🚀" 