import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setLanguage, setTheme } from '../store/slices/appSlice';
import { rtlStyles } from '../utils/rtl';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { language, theme } = useSelector((state: RootState) => state.app);

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
  };

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