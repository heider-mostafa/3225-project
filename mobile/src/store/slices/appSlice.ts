import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18n from '../../config/i18n';
import { setRTL } from '../../utils/rtl';

interface AppState {
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  isOnline: boolean;
  firstLaunch: boolean;
  notifications: {
    enabled: boolean;
    token: string | null;
  };
  ui: {
    tabBarVisible: boolean;
    isLoading: boolean;
    activeTab: string;
  };
  settings: {
    currency: string;
    priceRange: string;
    mapType: string;
  };
}

const initialState: AppState = {
  theme: 'light',
  language: 'ar', // Default to Arabic for Egyptian market
  isOnline: true,
  firstLaunch: true,
  notifications: {
    enabled: false,
    token: null,
  },
  ui: {
    tabBarVisible: true,
    isLoading: false,
    activeTab: 'Home',
  },
  settings: {
    currency: 'EGP',
    priceRange: 'thousands',
    mapType: 'standard',
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'ar' | 'en'>) => {
      state.language = action.payload;
      // Update i18n language
      i18n.changeLanguage(action.payload);
      // Update RTL layout
      setRTL(action.payload === 'ar');
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.firstLaunch = action.payload;
    },
    setNotificationToken: (state, action: PayloadAction<string | null>) => {
      state.notifications.token = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notifications.enabled = action.payload;
    },
    setTabBarVisible: (state, action: PayloadAction<boolean>) => {
      state.ui.tabBarVisible = action.payload;
    },
    setAppLoading: (state, action: PayloadAction<boolean>) => {
      state.ui.isLoading = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.ui.activeTab = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetApp: () => {
      return initialState;
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setOnlineStatus,
  setFirstLaunch,
  setNotificationToken,
  setNotificationsEnabled,
  setTabBarVisible,
  setAppLoading,
  setActiveTab,
  updateSettings,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer; 