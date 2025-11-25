import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Navigation
import AppNavigator from './src mobile/navigation/AppNavigator';
import AuthNavigator from './src mobile/navigation/AuthNavigator';

// State Management 
import { store, persistor } from './src mobile/store/store';

// Context
import { AuthProvider, useAuth } from './src mobile/contexts/AuthContext';

// Components
import LoadingScreen from './src mobile/components/LoadingScreen';
import ErrorBoundary from './src mobile/components/ErrorBoundary';

// Utils
import { initializeApp } from './src mobile/utils/initialization';

// Notifications
// import { notificationService } from './src/services/NotificationService'; // Temporarily disabled - missing Expo dependencies

// i18n
import './src mobile/config/i18n';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Remote debugger',
  'Setting a timer',
]);

interface AppProps {}

// Navigation component with authentication guards
const NavigationWithAuth: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <AppNavigator />;
};

const App: React.FC<AppProps> = () => {
  useEffect(() => {
    // Initialize app (analytics, crash reporting, etc.)
    initializeApp();
    
    // Initialize notification service - Temporarily disabled
    // const initNotifications = async () => {
    //   try {
    //     const success = await notificationService.initialize();
    //     if (success) {
    //       console.log('✅ Notifications initialized successfully');
    //     } else {
    //       console.warn('⚠️ Notifications initialization failed');
    //     }
    //   } catch (error) {
    //     console.error('❌ Error initializing notifications:', error);
    //   }
    // };
    // 
    // initNotifications();
    
    // Cleanup on unmount - Temporarily disabled
    // return () => {
    //   notificationService.cleanup();
    // };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <SafeAreaProvider>
              <NavigationContainer>
                <StatusBar 
                  barStyle="dark-content" 
                  backgroundColor="#ffffff" 
                  translucent={false}
                />
                <NavigationWithAuth />
              </NavigationContainer>
            </SafeAreaProvider>
          </PersistGate>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;