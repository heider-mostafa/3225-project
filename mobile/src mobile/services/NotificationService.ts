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
  // Community notification data
  announcement_id?: string;
  announcement_title?: string;
  compound_id?: string;
  compound_name?: string;
  visitor_pass_id?: string;
  booking_id?: string;
  service_request_id?: string;
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
  // Community notification preferences
  community_announcements: boolean;
  visitor_notifications: boolean;
  booking_confirmations: boolean;
  service_request_updates: boolean;
  fee_reminders: boolean;
  // General preferences
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

  private constructor() {}

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

      // Note: This assumes you have a push_tokens table in your Supabase
      // For now, just store locally
      await AsyncStorage.setItem('expo_push_token', token);
      
      console.log('✅ Push token registered');
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
        console.log('📍 New property notification:', data.property_title);
        break;
      
      case 'price_change':
        console.log('💰 Price change notification:', data.property_title);
        break;
      
      case 'inquiry_response':
        console.log('💬 Inquiry response notification');
        break;
      
      case 'ai_recommendation':
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
      
      if (deepLink.includes('/property/') && data.property_id) {
        console.log('🏠 Navigating to property:', data.property_id);
        // TODO: Integrate with navigation
      }
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Initialize default notification preferences
   */
  private async initializePreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (!stored) {
        const defaultPrefs: NotificationPreferences = {
          new_properties: true,
          price_changes: true,
          inquiry_responses: true,
          viewing_reminders: true,
          ai_recommendations: true,
          market_updates: false,
          system_notifications: true,
          // Community notification preferences
          community_announcements: true,
          visitor_notifications: true,
          booking_confirmations: true,
          service_request_updates: true,
          fee_reminders: true,
          // General preferences
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'Africa/Cairo',
          max_daily_notifications: 10,
          batch_similar_notifications: true,
          preferred_cities: ['New Cairo', 'Sheikh Zayed', 'Zamalek', 'Maadi']
        };

        await AsyncStorage.setItem('notification_preferences', JSON.stringify(defaultPrefs));
        console.log('✅ Default notification preferences created');
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
      const stored = await AsyncStorage.getItem('notification_preferences');
      return stored ? JSON.parse(stored) : null;
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
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(updated));
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏠 مرحباً بك في تطبيق العقارات المصرية!',
          body: 'تم تفعيل الإشعارات بنجاح. ستحصل على إشعارات فورية للعقارات الجديدة.',
          data: {
            type: 'test_notification',
            deep_link: 'property://home'
          },
        },
        trigger: { seconds: 2 },
      });

      console.log('✅ Test notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
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

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Disable notifications (remove token)
   */
  async disableNotifications(): Promise<boolean> {
    try {
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
   * Get notification status
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
   * Community-specific notification methods
   */

  /**
   * Send community announcement notification
   */
  async sendCommunityAnnouncementNotification(
    announcement: {
      id: string;
      title: string;
      content: string;
      compound_name: string;
      priority: 'low' | 'medium' | 'high';
    }
  ): Promise<boolean> {
    try {
      const priorityEmojis = {
        low: '📢',
        medium: '📣',
        high: '🚨'
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${priorityEmojis[announcement.priority]} ${announcement.compound_name}`,
          body: announcement.title,
          data: {
            type: 'community_announcement',
            announcement_id: announcement.id,
            compound_name: announcement.compound_name,
            deep_link: `community://announcements/${announcement.id}`
          },
          sound: announcement.priority === 'high' ? 'default' : undefined,
          priority: announcement.priority === 'high' ? 'high' : 'default'
        },
        trigger: { seconds: 1 },
      });

      console.log('✅ Community announcement notification sent:', announcement.title);
      return true;
    } catch (error) {
      console.error('❌ Error sending community announcement notification:', error);
      return false;
    }
  }

  /**
   * Send visitor check-in notification
   */
  async sendVisitorCheckInNotification(
    visitor: {
      name: string;
      unit_number: string;
      compound_name: string;
    }
  ): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏠 زائر جديد',
          body: `وصل ${visitor.name} إلى الوحدة ${visitor.unit_number} في ${visitor.compound_name}`,
          data: {
            type: 'visitor_checkin',
            compound_name: visitor.compound_name,
            unit_number: visitor.unit_number,
            deep_link: 'community://visitor-management'
          },
        },
        trigger: { seconds: 1 },
      });

      console.log('✅ Visitor check-in notification sent for:', visitor.name);
      return true;
    } catch (error) {
      console.error('❌ Error sending visitor check-in notification:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmationNotification(
    booking: {
      amenity_name: string;
      booking_date: string;
      start_time: string;
      compound_name: string;
    }
  ): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ تأكيد الحجز',
          body: `تم تأكيد حجز ${booking.amenity_name} في ${booking.booking_date} الساعة ${booking.start_time}`,
          data: {
            type: 'booking_confirmation',
            amenity_name: booking.amenity_name,
            compound_name: booking.compound_name,
            deep_link: 'community://amenity-booking'
          },
        },
        trigger: { seconds: 2 },
      });

      console.log('✅ Booking confirmation notification sent for:', booking.amenity_name);
      return true;
    } catch (error) {
      console.error('❌ Error sending booking confirmation notification:', error);
      return false;
    }
  }

  /**
   * Send service request update notification
   */
  async sendServiceRequestUpdateNotification(
    request: {
      title: string;
      status: string;
      compound_name: string;
    }
  ): Promise<boolean> {
    try {
      const statusEmojis = {
        'acknowledged': '👀',
        'in_progress': '🔧',
        'completed': '✅',
        'cancelled': '❌'
      };

      const emoji = statusEmojis[request.status as keyof typeof statusEmojis] || '📋';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} تحديث طلب الصيانة`,
          body: `${request.title} - ${request.status}`,
          data: {
            type: 'service_request_update',
            compound_name: request.compound_name,
            deep_link: 'community://service-requests'
          },
        },
        trigger: { seconds: 1 },
      });

      console.log('✅ Service request update notification sent for:', request.title);
      return true;
    } catch (error) {
      console.error('❌ Error sending service request update notification:', error);
      return false;
    }
  }

  /**
   * Send fee reminder notification
   */
  async sendFeeReminderNotification(
    fee: {
      amount: number;
      fee_type: string;
      due_date: string;
      compound_name: string;
    }
  ): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 تذكير بالرسوم',
          body: `رسوم ${fee.fee_type} مستحقة: ${fee.amount} ج.م - تاريخ الاستحقاق ${fee.due_date}`,
          data: {
            type: 'fee_reminder',
            amount: fee.amount,
            compound_name: fee.compound_name,
            deep_link: 'community://fees'
          },
          sound: 'default'
        },
        trigger: { seconds: 1 },
      });

      console.log('✅ Fee reminder notification sent:', fee.fee_type);
      return true;
    } catch (error) {
      console.error('❌ Error sending fee reminder notification:', error);
      return false;
    }
  }

  /**
   * Get default notification preferences for community features
   */
  getDefaultCommunityPreferences(): Partial<NotificationPreferences> {
    return {
      community_announcements: true,
      visitor_notifications: true,
      booking_confirmations: true,
      service_request_updates: true,
      fee_reminders: true,
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;