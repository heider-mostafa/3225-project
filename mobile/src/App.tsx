import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// State Management 
import { store, persistor } from './store/store';

// Components
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';

// Utils
import { initializeApp } from './utils/initialization';

// Notifications
import { notificationService } from './services/NotificationService';

// i18n
import './config/i18n';

// Ignore specific warnings for development
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Remote debugger',
  'Setting a timer',
]);

interface AppProps {}

const App: React.FC<AppProps> = () => {
  useEffect(() => {
    // Initialize app (analytics, crash reporting, etc.)
    initializeApp();
    
    // Initialize notification service
    const initNotifications = async () => {
      try {
        const success = await notificationService.initialize();
        if (success) {
          console.log('✅ Notifications initialized successfully');
        } else {
          console.warn('⚠️ Notifications initialization failed');
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };
    
    initNotifications();
    
    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar 
                barStyle="dark-content" 
                backgroundColor="#ffffff" 
                translucent={false}
              />
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
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