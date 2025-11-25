import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// New Auth Screens for Role Selection
// TODO: Create these screens for role-based onboarding
// import PlatformSelectionScreen from '../screens/auth/PlatformSelectionScreen';
// import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

// Navigation Types for Auth Flow
export type AuthStackParamList = {
  Login: undefined;
  Register: { 
    platform?: 'real_estate' | 'community';
    role?: string;
  };
  ForgotPassword: undefined;
  // TODO: Add new auth screens
  // PlatformSelection: undefined;
  // RoleSelection: {
  //   platform: 'real_estate' | 'community';
  // };
};

const AuthStack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      id={undefined}
      initialRouteName="Login"
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
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'تسجيل الدخول',
          headerShown: false, // LoginScreen has custom header
        }}
      />
      
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'إنشاء حساب جديد',
          headerShown: false, // RegisterScreen has custom header
        }}
      />
      
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          title: 'استعادة كلمة المرور',
        }}
      />

      {/* TODO: Add Platform and Role Selection Screens
      <AuthStack.Screen 
        name="PlatformSelection" 
        component={PlatformSelectionScreen}
        options={{
          title: 'اختر نوع الحساب',
          headerShown: false,
        }}
      />
      
      <AuthStack.Screen 
        name="RoleSelection" 
        component={RoleSelectionScreen}
        options={{
          title: 'اختر دورك',
          headerShown: false,
        }}
      />
      */}
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;