import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import { RootState } from '../store/store';
import { setLanguage, setTheme } from '../store/slices/appSlice';
import { rtlStyles } from '../utils/rtl';
import ProfileService, { UserSettings } from '../services/ProfileService';
import NotificationService from '../services/NotificationService';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user, biometricConfig, enableBiometric, disableBiometric } = useAuth();
  const { language, theme } = useSelector((state: RootState) => state.app);
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    if (newLanguage !== language) {
      Alert.alert(
        t('language'),
        'App will restart to apply language changes. Continue?',
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: 'OK', 
            onPress: () => {
              dispatch(setLanguage(newLanguage));
              // Note: In production, you might want to use react-native-restart
              Alert.alert('Success', 'Language changed! Please restart the app.');
            }
          },
        ]
      );
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    dispatch(setTheme(newTheme));
    updateUserSetting('theme', newTheme);
  };

  // Load user settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await ProfileService.getProfileData();
      if (response.success && response.data?.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSetting = async (key: string, value: any) => {
    if (!settings) return;
    
    try {
      setUpdating(true);
      const updatedSettings = { [key]: value };
      
      const response = await ProfileService.updateSettings(updatedSettings);
      if (response.success && response.data?.settings) {
        setSettings(response.data.settings);
      } else {
        Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
    } finally {
      setUpdating(false);
    }
  };

  const handleNotificationToggle = async (type: string, enabled: boolean) => {
    if (!settings) return;
    
    const currentNotifications = settings.push_notifications || {};
    const updatedNotifications = {
      ...currentNotifications,
      [type]: enabled
    };
    
    await updateUserSetting('push_notifications', updatedNotifications);
    
    // Also update notification service
    if (enabled) {
      await NotificationService.getInstance().initialize();
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await enableBiometric();
        if (!success) {
          Alert.alert('خطأ', 'فشل في تفعيل المصادقة بالبصمة');
        }
      } else {
        await disableBiometric();
      }
    } catch (error) {
      console.error('❌ Biometric toggle error:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setUpdating(true);
      const success = await NotificationService.getInstance().sendTestNotification();
      
      if (success) {
        Alert.alert('تم', 'تم إرسال إشعار تجريبي. ستراه بعد ثوانٍ.');
      } else {
        const status = await NotificationService.getInstance().getNotificationStatus();
        let message = 'فشل في إرسال الإشعار.';
        
        if (!status.hasPermissions) {
          message += ' يرجى تفعيل صلاحيات الإشعارات.';
        } else if (!status.isPhysicalDevice) {
          message += ' الإشعارات تعمل فقط على الأجهزة الحقيقية.';
        }
        
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      console.error('❌ Test notification error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختبار الإشعارات');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'مسح الذاكرة المؤقتة',
      'هل أنت متأكد من مسح جميع البيانات المحفوظة مؤقتاً؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: () => {
            ProfileService.clearCache();
            Alert.alert('تم', 'تم مسح الذاكرة المؤقتة');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>تحميل الإعدادات...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, rtlStyles.text]}>⚙️ الإعدادات</Text>
        <Text style={[styles.headerSubtitle, rtlStyles.text]}>Settings</Text>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>{t('language')}</Text>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            language === 'ar' && styles.activeOption,
          ]}
          onPress={() => handleLanguageChange('ar')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>🇪🇬</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>{t('arabic')}</Text>
            {language === 'ar' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            language === 'en' && styles.activeOption,
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>🇺🇸</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>{t('english')}</Text>
            {language === 'en' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>Theme / المظهر</Text>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            theme === 'light' && styles.activeOption,
          ]}
          onPress={() => handleThemeChange('light')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>☀️</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>Light / فاتح</Text>
            {theme === 'light' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            theme === 'dark' && styles.activeOption,
          ]}
          onPress={() => handleThemeChange('dark')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>🌙</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>Dark / داكن</Text>
            {theme === 'dark' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>🔔 الإشعارات / Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>عقارات جديدة</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>New Properties</Text>
          </View>
          <Switch
            value={settings?.push_notifications?.new_properties || false}
            onValueChange={(value) => handleNotificationToggle('new_properties', value)}
            disabled={updating}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>تغييرات الأسعار</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>Price Changes</Text>
          </View>
          <Switch
            value={settings?.push_notifications?.price_changes || false}
            onValueChange={(value) => handleNotificationToggle('price_changes', value)}
            disabled={updating}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>مواعيد المعاينة</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>Viewing Appointments</Text>
          </View>
          <Switch
            value={settings?.push_notifications?.viewing_reminders || false}
            onValueChange={(value) => handleNotificationToggle('viewing_reminders', value)}
            disabled={updating}
          />
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>🔒 الأمان / Security</Text>
        
        {biometricConfig?.type && (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, rtlStyles.text]}>{
                biometricConfig.type === 'face' ? 'معرف الوجه' :
                biometricConfig.type === 'fingerprint' ? 'بصمة الإصبع' :
                'المصادقة الحيوية'
              }</Text>
              <Text style={[styles.settingDescription, rtlStyles.text]}>Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricConfig.enabled}
              onValueChange={handleBiometricToggle}
              disabled={updating}
            />
          </View>
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>🔐 الخصوصية / Privacy</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>إظهار الملف الشخصي</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>Show Profile to Others</Text>
          </View>
          <Switch
            value={settings?.profile_visibility === 'public'}
            onValueChange={(value) => updateUserSetting('profile_visibility', value ? 'public' : 'private')}
            disabled={updating}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>إظهار النشاط</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>Show Activity Status</Text>
          </View>
          <Switch
            value={settings?.show_activity || false}
            onValueChange={(value) => updateUserSetting('show_activity', value)}
            disabled={updating}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, rtlStyles.text]}>السماح بالتواصل</Text>
            <Text style={[styles.settingDescription, rtlStyles.text]}>Allow Contact from Brokers</Text>
          </View>
          <Switch
            value={settings?.allow_contact || true}
            onValueChange={(value) => updateUserSetting('allow_contact', value)}
            disabled={updating}
          />
        </View>
      </View>

      {/* Notifications Testing Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>🧪 اختبار / Testing</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestNotification}
          disabled={updating}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>🔔</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>اختبار الإشعارات</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>💾 البيانات / Data & Storage</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClearCache}
          disabled={updating}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionIcon}>🗑️</Text>
            <Text style={[styles.optionText, rtlStyles.text]}>مسح الذاكرة المؤقتة</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.text]}>About / حول التطبيق</Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, rtlStyles.text]}>
            🏠 Egyptian Real Estate Mobile App
          </Text>
          <Text style={[styles.infoText, rtlStyles.text]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.infoText, rtlStyles.text]}>
            Made with ❤️ for Egypt 🇪🇬
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Header
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
    marginTop: 4,
  },

  // Sections
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },

  // Options
  optionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  activeOption: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
    marginLeft: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  
  // Settings rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  
  // Action buttons
  actionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Info
  infoContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});

export default SettingsScreen; 