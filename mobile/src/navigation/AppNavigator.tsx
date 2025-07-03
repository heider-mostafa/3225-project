import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import SearchScreen from '../screens/SearchScreen';
import VirtualToursScreen from '../screens/VirtualToursScreen';
import AreasScreen from '../screens/AreasScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';

// Property interface for type safety
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  address: string;
  city: string;
  property_type: string;
  status: string;
  virtual_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Search: { query?: string };
  Properties: { 
    city?: string;
    searchResults?: Property[];
    searchQuery?: string;
    searchFilters?: any;
  };
  PropertyDetails: { propertyId: string };
  VirtualTours: undefined;
  Brokers: undefined;
  Calculator: { initialPropertyPrice?: number };
  AIAssistant: { 
    propertyId?: string;
    currentRoom?: string;
    tourContext?: {
      visitedRooms: string[];
      timeInRoom: number;
      totalTimeSpent: number;
    };
  };
  Areas: undefined;
  Profile: undefined;
  Favorites: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
};

// Stack and Tab Navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Placeholder components for other screens (to be implemented)
const BrokersScreen = () => <Text style={{flex: 1, textAlign: 'center', textAlignVertical: 'center'}}>Brokers Screen</Text>;

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      {/* Tab 1: Home - Main hub with quick actions */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      
      {/* Tab 2: Explore - All property browsing features */}
      <Tab.Screen 
        name="Properties" 
        component={PropertiesScreen}
        options={{
          title: 'استكشف',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔍</Text>
          ),
        }}
      />
      
      {/* Tab 3: Tours - Virtual tours and media */}
      <Tab.Screen 
        name="VirtualTours" 
        component={VirtualToursScreen}
        options={{
          title: 'جولات',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🎬</Text>
          ),
        }}
      />
      
      {/* Tab 4: Profile - User account, favorites, and tools */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      {/* Tab Navigator as main screen */}
      <Stack.Screen 
        name="Home" 
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Individual screens */}
      <Stack.Screen 
        name="Properties" 
        component={PropertiesScreen}
        options={{
          title: 'العقارات',
        }}
      />
      
      <Stack.Screen 
        name="PropertyDetails" 
        component={PropertyDetailsScreen}
        options={{
          title: 'تفاصيل العقار',
        }}
      />
      
      <Stack.Screen 
        name="Brokers" 
        component={BrokersScreen}
        options={{
          title: 'السماسرة',
        }}
      />
      
      <Stack.Screen 
        name="Calculator" 
        component={CalculatorScreen}
        options={{
          title: 'حاسبة القرض',
        }}
      />
      
      <Stack.Screen 
        name="AIAssistant" 
        component={AIAssistantScreen}
        options={{
          title: 'المساعد الذكي',
          headerShown: false, // AIAssistant has its own header
        }}
      />
      
      <Stack.Screen 
        name="Areas" 
        component={AreasScreen}
        options={{
          title: 'المناطق',
        }}
      />
      
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'الإعدادات',
        }}
      />
      
      <Stack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen}
        options={{
          title: 'تفضيلات الإشعارات',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator; 