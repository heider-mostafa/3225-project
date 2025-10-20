import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../store/store';
import { rtlStyles, isRTL } from '../utils/rtl';
import { RootStackParamList } from '../navigation/AppNavigator';
import { notificationService, NotificationPreferences } from '../services/NotificationService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'NotificationPreferences'>;

interface PreferenceItem {
  key: keyof NotificationPreferences;
  titleKey: string;
  descriptionKey: string;
  type: 'boolean' | 'time' | 'number' | 'array';
  icon: string;
  value?: any;
}

const NotificationPreferencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const theme = useSelector((state: RootState) => state.app.theme);
  const language = useSelector((state: RootState) => state.app.language);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(false);

  const preferenceItems: PreferenceItem[] = [
    {
      key: 'new_properties',
      titleKey: 'notifications.preferences.newProperties',
      descriptionKey: 'notifications.preferences.newPropertiesDesc',
      type: 'boolean',
      icon: '🏠',
    },
    {
      key: 'price_changes',
      titleKey: 'notifications.preferences.priceChanges',
      descriptionKey: 'notifications.preferences.priceChangesDesc',
      type: 'boolean',
      icon: '💰',
    },
    {
      key: 'inquiry_responses',
      titleKey: 'notifications.preferences.inquiryResponses',
      descriptionKey: 'notifications.preferences.inquiryResponsesDesc',
      type: 'boolean',
      icon: '💬',
    },
    {
      key: 'viewing_reminders',
      titleKey: 'notifications.preferences.viewingReminders',
      descriptionKey: 'notifications.preferences.viewingRemindersDesc',
      type: 'boolean',
      icon: '📅',
    },
    {
      key: 'ai_recommendations',
      titleKey: 'notifications.preferences.aiRecommendations',
      descriptionKey: 'notifications.preferences.aiRecommendationsDesc',
      type: 'boolean',
      icon: '🤖',
    },
    {
      key: 'market_updates',
      titleKey: 'notifications.preferences.marketUpdates',
      descriptionKey: 'notifications.preferences.marketUpdatesDesc',
      type: 'boolean',
      icon: '📊',
    },
    {
      key: 'system_notifications',
      titleKey: 'notifications.preferences.systemNotifications',
      descriptionKey: 'notifications.preferences.systemNotificationsDesc',
      type: 'boolean',
      icon: '🔔',
    },
  ];

  useEffect(() => {
    loadPreferences();
    checkNotificationStatus();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      setLoading(true);
      const prefs = await notificationService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      Alert.alert(
        t('common.error'),
        t('notifications.preferences.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationStatus = async (): Promise<void> => {
    try {
      const enabled = await notificationService.areNotificationsEnabled();
      setIsNotificationEnabled(enabled);
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
    }
  };

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: any
  ): Promise<void> => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);

      const success = await notificationService.updatePreferences({
        [key]: value
      });

      if (!success) {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('❌ Error updating preference:', error);
      Alert.alert(
        t('common.error'),
        t('notifications.preferences.updateError')
      );
      
      // Revert the change
      await loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async (): Promise<void> => {
    try {
      setSaving(true);
      
      if (isNotificationEnabled) {
        const success = await notificationService.disableNotifications();
        if (success) {
          setIsNotificationEnabled(false);
          Alert.alert(
            t('notifications.disabled'),
            t('notifications.disabledMessage')
          );
        }
      } else {
        const success = await notificationService.enableNotifications();
        if (success) {
          setIsNotificationEnabled(true);
          Alert.alert(
            t('notifications.enabled'),
            t('notifications.enabledMessage')
          );
        } else {
          Alert.alert(
            t('notifications.permissionDenied'),
            t('notifications.permissionDeniedMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('common.settings'), 
                onPress: () => {
                  // This would open device settings
                  console.log('Open device settings');
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      Alert.alert(
        t('common.error'),
        t('notifications.toggleError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHours = (): void => {
    Alert.alert(
      t('notifications.preferences.quietHours'),
      t('notifications.preferences.quietHoursDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.configure'), 
          onPress: () => {
            // TODO: Open time picker modal
            console.log('Configure quiet hours');
          }
        }
      ]
    );
  };

  const handleCityPreferences = (): void => {
    Alert.alert(
      t('notifications.preferences.preferredCities'),
      t('notifications.preferences.preferredCitiesDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.configure'), 
          onPress: () => {
            // TODO: Navigate to city selection screen
            console.log('Configure city preferences');
          }
        }
      ]
    );
  };

  const testNotification = async (): Promise<void> => {
    try {
      await notificationService.sendLocalNotification({
        title: t('notifications.test.title'),
        body: t('notifications.test.body'),
        data: {
          type: 'test',
          property_id: 'test-123',
          deep_link: '/property/test-123'
        }
      });

      Alert.alert(
        t('notifications.test.sent'),
        t('notifications.test.sentMessage')
      );
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      Alert.alert(
        t('common.error'),
        t('notifications.test.error')
      );
    }
  };

  const renderPreferenceItem = (item: PreferenceItem): React.ReactNode => {
    if (!preferences) return <View />;

    const value = preferences[item.key];
    const isDisabled = !isNotificationEnabled || saving;

    return (
      <View key={item.key} style={[
        styles.preferenceItem,
        { 
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          borderBottomColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0'
        },
        rtlStyles.flexRow
      ]}>
        <View style={[styles.preferenceContent, { flex: 1 }]}>
          <View style={[styles.preferenceHeader, rtlStyles.flexRow]}>
            <Text style={styles.preferenceIcon}>{item.icon}</Text>
            <Text style={[
              styles.preferenceTitle,
              { color: theme === 'dark' ? '#ffffff' : '#000000' },
              rtlStyles.text
            ]}>
              {t(item.titleKey)}
            </Text>
          </View>
          <Text style={[
            styles.preferenceDescription,
            { color: theme === 'dark' ? '#cccccc' : '#666666' },
            rtlStyles.text
          ]}>
            {t(item.descriptionKey)}
          </Text>
        </View>
        
        <Switch
          value={Boolean(value)}
          onValueChange={(newValue) => updatePreference(item.key, newValue)}
          disabled={isDisabled}
          trackColor={{ 
            false: theme === 'dark' ? '#3a3a3a' : '#e0e0e0', 
            true: '#4CAF50' 
          }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5'
      }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[
          styles.loadingText,
          { color: theme === 'dark' ? '#ffffff' : '#000000' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.loading')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[
      styles.container,
      { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }
      ]}>
        <Text style={[
          styles.headerTitle,
          { color: theme === 'dark' ? '#ffffff' : '#000000' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.title')}
        </Text>
        <Text style={[
          styles.headerSubtitle,
          { color: theme === 'dark' ? '#cccccc' : '#666666' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.subtitle')}
        </Text>
      </View>

      {/* Main Toggle */}
      <View style={[
        styles.mainToggle,
        { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }
      ]}>
        <View style={[styles.preferenceContent, { flex: 1 }]}>
          <View style={[styles.preferenceHeader, rtlStyles.flexRow]}>
            <Text style={styles.preferenceIcon}>🔔</Text>
            <Text style={[
              styles.preferenceTitle,
              { color: theme === 'dark' ? '#ffffff' : '#000000' },
              rtlStyles.text
            ]}>
              {t('notifications.preferences.enableNotifications')}
            </Text>
          </View>
          <Text style={[
            styles.preferenceDescription,
            { color: theme === 'dark' ? '#cccccc' : '#666666' },
            rtlStyles.text
          ]}>
            {t('notifications.preferences.enableNotificationsDesc')}
          </Text>
        </View>
        
        <Switch
          value={isNotificationEnabled}
          onValueChange={toggleNotifications}
          disabled={saving}
          trackColor={{ 
            false: theme === 'dark' ? '#3a3a3a' : '#e0e0e0', 
            true: '#4CAF50' 
          }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
        />
      </View>

      {/* Notification Types */}
      <View style={[
        styles.section,
        { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: theme === 'dark' ? '#ffffff' : '#000000' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.notificationTypes')}
        </Text>
        
        {preferenceItems.map((item, index) => (
          <React.Fragment key={item.key || index}>
            {renderPreferenceItem(item)}
          </React.Fragment>
        ))}
      </View>

      {/* Advanced Settings */}
      <View style={[
        styles.section,
        { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: theme === 'dark' ? '#ffffff' : '#000000' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.advancedSettings')}
        </Text>

        {/* Quiet Hours */}
        <TouchableOpacity
          style={[styles.preferenceItem, { borderBottomColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0' }]}
          onPress={handleQuietHours}
          disabled={!isNotificationEnabled || saving}
        >
          <View style={[styles.preferenceContent, { flex: 1 }]}>
            <View style={[styles.preferenceHeader, rtlStyles.flexRow]}>
              <Text style={styles.preferenceIcon}>🌙</Text>
              <Text style={[
                styles.preferenceTitle,
                { 
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  opacity: !isNotificationEnabled ? 0.5 : 1
                },
                rtlStyles.text
              ]}>
                {t('notifications.preferences.quietHours')}
              </Text>
            </View>
            <Text style={[
              styles.preferenceDescription,
              { 
                color: theme === 'dark' ? '#cccccc' : '#666666',
                opacity: !isNotificationEnabled ? 0.5 : 1
              },
              rtlStyles.text
            ]}>
              {preferences?.quiet_hours_enabled 
                ? `${preferences.quiet_hours_start} - ${preferences.quiet_hours_end}`
                : t('notifications.preferences.quietHoursDesc')
              }
            </Text>
          </View>
          <Text style={[styles.arrow, { color: theme === 'dark' ? '#cccccc' : '#666666' }]}>
            {isRTL() ? '‹' : '›'}
          </Text>
        </TouchableOpacity>

        {/* Preferred Cities */}
        <TouchableOpacity
          style={[styles.preferenceItem, { borderBottomColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0' }]}
          onPress={handleCityPreferences}
          disabled={!isNotificationEnabled || saving}
        >
          <View style={[styles.preferenceContent, { flex: 1 }]}>
            <View style={[styles.preferenceHeader, rtlStyles.flexRow]}>
              <Text style={styles.preferenceIcon}>🏙️</Text>
              <Text style={[
                styles.preferenceTitle,
                { 
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  opacity: !isNotificationEnabled ? 0.5 : 1
                },
                rtlStyles.text
              ]}>
                {t('notifications.preferences.preferredCities')}
              </Text>
            </View>
            <Text style={[
              styles.preferenceDescription,
              { 
                color: theme === 'dark' ? '#cccccc' : '#666666',
                opacity: !isNotificationEnabled ? 0.5 : 1
              },
              rtlStyles.text
            ]}>
              {preferences?.preferred_cities && preferences.preferred_cities.length > 0
                ? preferences.preferred_cities.join(', ')
                : t('notifications.preferences.preferredCitiesDesc')
              }
            </Text>
          </View>
          <Text style={[styles.arrow, { color: theme === 'dark' ? '#cccccc' : '#666666' }]}>
            {isRTL() ? '‹' : '›'}
          </Text>
        </TouchableOpacity>

        {/* Daily Limit */}
        <View style={[styles.preferenceItem, styles.noBorder]}>
          <View style={[styles.preferenceContent, { flex: 1 }]}>
            <View style={[styles.preferenceHeader, rtlStyles.flexRow]}>
              <Text style={styles.preferenceIcon}>📊</Text>
              <Text style={[
                styles.preferenceTitle,
                { 
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  opacity: !isNotificationEnabled ? 0.5 : 1
                },
                rtlStyles.text
              ]}>
                {t('notifications.preferences.dailyLimit')}
              </Text>
            </View>
            <Text style={[
              styles.preferenceDescription,
              { 
                color: theme === 'dark' ? '#cccccc' : '#666666',
                opacity: !isNotificationEnabled ? 0.5 : 1
              },
              rtlStyles.text
            ]}>
              {t('notifications.preferences.dailyLimitDesc', { 
                count: preferences?.max_daily_notifications || 10 
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Test Notification */}
      <TouchableOpacity
        style={[
          styles.testButton,
          { 
            backgroundColor: isNotificationEnabled ? '#4CAF50' : '#cccccc',
            opacity: saving ? 0.7 : 1
          }
        ]}
        onPress={testNotification}
        disabled={!isNotificationEnabled || saving}
      >
        <Text style={[styles.testButtonText, rtlStyles.text]}>
          {saving ? t('common.loading') : t('notifications.test.button')}
        </Text>
      </TouchableOpacity>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[
          styles.footerText,
          { color: theme === 'dark' ? '#999999' : '#666666' },
          rtlStyles.text
        ]}>
          {t('notifications.preferences.footerInfo')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  mainToggle: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  preferenceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
  },
  arrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  testButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default NotificationPreferencesScreen; 