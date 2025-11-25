import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

// Authentication
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import LoadingScreen from '../components/LoadingScreen';

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

// Community screens
import CommunityHomeScreen from '../screens/CommunityHomeScreen';
import AmenityBookingScreen from '../screens/AmenityBookingScreen';
import VisitorManagementScreen from '../screens/VisitorManagementScreen';
import ServiceRequestsScreen from '../screens/ServiceRequestsScreen';
import CommunityFeesScreen from '../screens/CommunityFeesScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import VisitorQRScanScreen from '../screens/scanner/VisitorQRScanScreen';

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
  VisitorQRScan: undefined;
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
  // Community screens
  Community: undefined;
  AmenityBooking: undefined;
  VisitorManagement: undefined;
  ServiceRequests: undefined;
  CommunityFees: undefined;
  Announcements: undefined;
};

// Stack and Tab Navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Placeholder components for other screens (to be implemented)
const BrokersScreen = () => <Text style={{flex: 1, textAlign: 'center', textAlignVertical: 'center'}}>Brokers Screen</Text>;

// Community Stack Navigator
const CommunityStack = createStackNavigator();
const CommunityStackNavigator = () => {
  return (
    <CommunityStack.Navigator
      id={undefined}
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
      }}
    >
      <CommunityStack.Screen 
        name="CommunityHome" 
        component={CommunityHomeScreen}
        options={{ title: 'المجتمع' }}
      />
      <CommunityStack.Screen 
        name="AmenityBooking" 
        component={AmenityBookingScreen}
        options={{ title: 'حجز المرافق' }}
      />
      <CommunityStack.Screen 
        name="VisitorManagement" 
        component={VisitorManagementScreen}
        options={{ title: 'إدارة الزوار' }}
      />
      <CommunityStack.Screen 
        name="ServiceRequests" 
        component={ServiceRequestsScreen}
        options={{ title: 'طلبات الصيانة' }}
      />
      <CommunityStack.Screen 
        name="CommunityFees" 
        component={CommunityFeesScreen}
        options={{ title: 'الرسوم والمستحقات' }}
      />
      <CommunityStack.Screen 
        name="Announcements" 
        component={AnnouncementsScreen}
        options={{ title: 'الإعلانات' }}
      />
    </CommunityStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { isResident, userRoles } = useSelector((state: RootState) => state.community);
  const { user } = useAuth();
  
  // Get user role from auth context
  const userRole = user?.role || 'user';
  
  // Define role-based tab visibility
  const showCommunityTab = isResident || userRoles.some(role => 
    ['developer', 'compound_manager', 'resident_owner', 'resident_tenant', 'security_guard'].includes(role)
  ) || ['developer', 'compound_manager', 'resident_owner', 'resident_tenant', 'security_guard'].includes(userRole);
  
  const showBrokerFeatures = userRole === 'broker';
  const showAppraiserFeatures = userRole === 'appraiser';
  const showSecurityFeatures = userRole === 'security_guard';
  const showDeveloperFeatures = userRole === 'developer';
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
      
      {/* Community Tab - Conditionally shown for residents */}
      {showCommunityTab && (
        <Tab.Screen 
          name="Community" 
          component={CommunityStackNavigator}
          options={{
            title: 'المجتمع',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🏘️</Text>
            ),
          }}
        />
      )}
      
      {/* Broker Tab - Professional tools for brokers */}
      {showBrokerFeatures && (
        <Tab.Screen 
          name="Broker" 
          component={PropertiesScreen} // Temporary - should be BrokerDashboard
          options={{
            title: 'أدوات الوسيط',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>💼</Text>
            ),
          }}
        />
      )}
      
      {/* Appraiser Tab - Valuation tools */}
      {showAppraiserFeatures && (
        <Tab.Screen 
          name="Appraiser" 
          component={CalculatorScreen} // Temporary - should be AppraiserDashboard
          options={{
            title: 'التقييم',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>📊</Text>
            ),
          }}
        />
      )}
      
      {/* Security Tab - Security management tools */}
      {showSecurityFeatures && (
        <Tab.Screen 
          name="Security" 
          component={PropertiesScreen} // Temporary - should be SecurityDashboard
          options={{
            title: 'الأمن',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🛡️</Text>
            ),
          }}
        />
      )}
      
      {/* Developer Tab - Multi-compound management */}
      {showDeveloperFeatures && (
        <Tab.Screen 
          name="Developer" 
          component={PropertiesScreen} // Temporary - should be DeveloperDashboard
          options={{
            title: 'إدارة المشاريع',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🏗️</Text>
            ),
          }}
        />
      )}
      
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
      
      {/* Community Screens */}
      <Stack.Screen 
        name="AmenityBooking" 
        component={AmenityBookingScreen}
        options={{
          title: 'حجز المرافق',
        }}
      />
      
      <Stack.Screen 
        name="VisitorManagement" 
        component={VisitorManagementScreen}
        options={{
          title: 'إدارة الزوار',
        }}
      />
      
      <Stack.Screen 
        name="ServiceRequests" 
        component={ServiceRequestsScreen}
        options={{
          title: 'طلبات الصيانة',
        }}
      />
      
      <Stack.Screen 
        name="CommunityFees" 
        component={CommunityFeesScreen}
        options={{
          title: 'الرسوم والمستحقات',
        }}
      />
      
      <Stack.Screen 
        name="Announcements" 
        component={AnnouncementsScreen}
        options={{
          title: 'الإعلانات',
        }}
      />
      
      <Stack.Screen 
        name="VisitorQRScan" 
        component={VisitorQRScanScreen}
        options={{
          title: 'فحص QR الزوار',
          headerShown: false, // QR scanner has its own header
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator; 