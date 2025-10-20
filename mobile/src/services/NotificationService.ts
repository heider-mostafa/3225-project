import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../config/supabase';
import { apiClient } from '../config/api';

export interface NotificationData {
  property_id?: string;
  property_title?: string;
  property_city?: string;
  property_price?: number;
  type: string;
  deep_link?: string;
  [key: string]: any;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: NotificationData;
}

export interface NotificationPreferences {
  new_properties: boolean;
  price_changes: boolean;
  inquiry_responses: boolean;
  viewing_reminders: boolean;
  ai_recommendations: boolean;
  market_updates: boolean;
  system_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  max_daily_notifications: number;
  batch_similar_notifications: boolean;
  preferred_cities: string[];
  price_range_min?: number;
  price_range_max?: number;
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;
  private notificationListeners: (() => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing NotificationService...');

      // Set notification handler for when app is in foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }),
      });

      // Setup notification listeners
      this.setupNotificationListeners();

      // Request permissions
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        console.warn('⚠️ Push notification permissions not granted');
        return false;
      }

      // Get and register push token
      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerToken(token);
        this.pushToken = token;
      }

      // Initialize default preferences if needed
      await this.initializePreferences();

      this.isInitialized = true;
      console.log('✅ NotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing NotificationService:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Show alert explaining why notifications are useful
        Alert.alert(
          'تفعيل الإشعارات',
          'احصل على إشعارات فورية لعقارات جديدة وتغييرات الأسعار والردود على الاستفسارات.',
          [
            { text: 'لاحقاً', style: 'cancel' },
            { 
              text: 'الإعدادات', 
              onPress: () => {
                // Note: openSettingsAsync is not available in all Expo versions
                Alert.alert('الإعدادات', 'يرجى فتح إعدادات الجهاز يدوياً وتفعيل الإشعارات');
              } 
            }
          ]
        );
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
      });

      console.log('📱 Expo push token obtained:', token.data.substring(0, 20) + '...');
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token with Supabase
   */
  private async registerToken(token: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.warn('⚠️ No authenticated user, cannot register token');
        return;
      }

      const deviceInfo = {
        user_id: user.data.user.id,
        expo_push_token: token,
        device_id: Constants.deviceId || Constants.installationId,
        device_name: Device.deviceName || `${Device.brand} ${Device.modelName}`,
        platform: Platform.OS as 'ios' | 'android',
        app_version: Constants.expoConfig?.version || '1.0.0',
        is_active: true,
        last_used_at: new Date().toISOString(),
      };

      // Upsert token (insert or update if exists)
      const { error } = await supabase
        .from('push_tokens')
        .upsert(deviceInfo, {
          onConflict: 'user_id,expo_push_token',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      // Store token locally for offline access
      await AsyncStorage.setItem('expo_push_token', token);
      
      console.log('✅ Push token registered with Supabase');
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );

    // Handle notification tapped/clicked
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );

    // Store listeners for cleanup
    this.notificationListeners.push(
      () => notificationListener.remove(),
      () => responseListener.remove()
    );

    console.log('🎧 Notification listeners setup complete');
  }

  /**
   * Handle notification received while app is in foreground
   */
  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    console.log('📥 Notification received:', notification);

    // Update notification as delivered in database
    await this.markNotificationAsDelivered(notification);

    // Handle specific notification types
    const notificationData = notification.request.content.data as NotificationData;
    if (notificationData?.type) {
      await this.handleNotificationByType(notificationData, notification);
    }
  }

  /**
   * Handle notification tap/click
   */
  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    console.log('👆 Notification tapped:', response);

    const notificationData = response.notification.request.content.data as NotificationData;
    
    // Mark as clicked in database
    await this.markNotificationAsClicked(response.notification);

    // Handle deep linking
    if (notificationData?.deep_link) {
      await this.handleDeepLink(notificationData.deep_link, notificationData);
    }
  }

  /**
   * Handle notification based on type
   */
  private async handleNotificationByType(
    data: NotificationData, 
    notification: Notifications.Notification
  ): Promise<void> {
    switch (data.type) {
      case 'new_property':
        // Could trigger local updates, refresh property list, etc.
        console.log('📍 New property notification:', data.property_title);
        break;
      
      case 'price_change':
        // Could update saved properties cache
        console.log('💰 Price change notification:', data.property_title);
        break;
      
      case 'inquiry_response':
        // Could refresh inquiries screen
        console.log('💬 Inquiry response notification');
        break;
      
      case 'ai_recommendation':
        // Could trigger AI assistant updates
        console.log('🤖 AI recommendation notification');
        break;
      
      default:
        console.log('📨 Generic notification received');
    }
  }

  /**
   * Handle deep linking from notifications
   */
  private async handleDeepLink(deepLink: string, data: NotificationData): Promise<void> {
    try {
      console.log('🔗 Handling deep link:', deepLink);

      // This would integrate with your navigation system
      // For now, we'll just log it
      // In a real implementation, you'd use React Navigation:
      // navigationRef.navigate('PropertyDetails', { propertyId: data.property_id });
      
      if (deepLink.includes('/property/') && data.property_id) {
        console.log('🏠 Navigating to property:', data.property_id);
        // TODO: Integrate with navigation
      }
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Mark notification as delivered in database
   */
  private async markNotificationAsDelivered(notification: Notifications.Notification): Promise<void> {
    try {
      // This would require the notification ID to be included in the payload
      // For now, we'll just log it
      console.log('✅ Marking notification as delivered');
    } catch (error) {
      console.error('❌ Error marking notification as delivered:', error);
    }
  }

  /**
   * Mark notification as clicked in database
   */
  private async markNotificationAsClicked(notification: Notifications.Notification): Promise<void> {
    try {
      console.log('👆 Marking notification as clicked');
    } catch (error) {
      console.error('❌ Error marking notification as clicked:', error);
    }
  }

  /**
   * Initialize default notification preferences
   */
  private async initializePreferences(): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return;
      }

      // Check if preferences already exist
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

      if (!existingPrefs) {
        // Create default preferences
        const defaultPrefs: Partial<NotificationPreferences> = {
          new_properties: true,
          price_changes: true,
          inquiry_responses: true,
          viewing_reminders: true,
          ai_recommendations: true,
          market_updates: false,
          system_notifications: true,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Africa/Cairo',
          max_daily_notifications: 10,
          batch_similar_notifications: true,
          preferred_cities: ['New Cairo', 'Sheikh Zayed', 'Zamalek', 'Maadi']
        };

        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.data.user.id,
            ...defaultPrefs
          });

        if (error) {
          console.error('❌ Error creating default preferences:', error);
        } else {
          console.log('✅ Default notification preferences created');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing preferences:', error);
    }
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return null;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching preferences:', error);
        return null;
      }

      return data as NotificationPreferences;
    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return false;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', user.data.user.id);

      if (error) {
        console.error('❌ Error updating preferences:', error);
        return false;
      }

      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Send a local notification (for testing)
   */
  async sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        },
        trigger: null, // Show immediately
      });

      console.log('📤 Local notification sent');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  /**
   * Get notification history for current user
   */
  async getNotificationHistory(limit: number = 50): Promise<any[]> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return [];
      }

      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('recipient_user_id', user.data.user.id)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Disable notifications (remove token)
   */
  async disableNotifications(): Promise<boolean> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        return false;
      }

      // Deactivate all tokens for this user
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.data.user.id);

      if (error) {
        console.error('❌ Error disabling notifications:', error);
        return false;
      }

      // Remove local token
      await AsyncStorage.removeItem('expo_push_token');
      this.pushToken = null;

      console.log('✅ Notifications disabled');
      return true;
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
      return false;
    }
  }

  /**
   * Re-enable notifications
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        return false;
      }

      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerToken(token);
        this.pushToken = token;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted' && this.pushToken !== null;
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Send a test notification (for development/testing)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      if (!this.pushToken) {
        console.warn('⚠️ No push token available for test notification');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏠 مرحباً بك في تطبيق العقارات المصرية!',
          body: 'تم تفعيل الإشعارات بنجاح. ستحصل على إشعارات فورية للعقارات الجديدة.',
          data: {
            type: 'test_notification',
            deep_link: 'property://home'
          },
        },
        trigger: { seconds: 2 } as any, // Type workaround for expo-notifications
      });

      console.log('✅ Test notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Check if notifications are properly enabled and configured
   */
  async getNotificationStatus(): Promise<{
    isInitialized: boolean;
    hasPermissions: boolean;
    hasToken: boolean;
    isPhysicalDevice: boolean;
  }> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      
      return {
        isInitialized: this.isInitialized,
        hasPermissions: permissions.status === 'granted',
        hasToken: !!this.pushToken,
        isPhysicalDevice: Device.isDevice
      };
    } catch (error) {
      console.error('❌ Error getting notification status:', error);
      return {
        isInitialized: false,
        hasPermissions: false,
        hasToken: false,
        isPhysicalDevice: false
      };
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.notificationListeners.forEach(removeListener => removeListener());
    this.notificationListeners = [];
    console.log('🧹 NotificationService cleanup complete');
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default NotificationService; 