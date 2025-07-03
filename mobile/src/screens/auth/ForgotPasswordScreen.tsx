import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import { useTranslation } from 'react-i18next'

import AuthService from '../../services/AuthService'

interface ForgotPasswordScreenProps {
  navigation: any
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        t('auth.error'),
        t('auth.validation.emailRequired'),
        [{ text: t('common.ok') }]
      )
      return
    }

    if (!validateEmail(email)) {
      Alert.alert(
        t('auth.error'),
        t('auth.validation.emailInvalid'),
        [{ text: t('common.ok') }]
      )
      return
    }

    try {
      setLoading(true)

      const result = await AuthService.resetPassword(email)

      if (result.success) {
        setEmailSent(true)
        Alert.alert(
          t('auth.resetEmailSent'),
          t('auth.resetEmailSentMessage'),
          [{ text: t('common.ok') }]
        )
      } else {
        Alert.alert(
          t('auth.error'),
          result.error || t('auth.unknownError'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      Alert.alert(
        t('auth.error'),
        t('auth.unknownError'),
        [{ text: t('common.ok') }]
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (emailSent) {
      await handleResetPassword()
    }
  }

  if (emailSent) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#7c3aed', '#8b5cf6', '#a78bfa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.successIcon}>📧</Text>
                <Text style={styles.title}>{t('auth.checkYourEmail')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.resetLinkSent')} {email}
                </Text>
              </View>

              {/* Success Card */}
              <View style={styles.formContainer}>
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>
                    {t('auth.nextSteps')}
                  </Text>
                  
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>
                      {t('auth.step1CheckEmail')}
                    </Text>
                  </View>

                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>2</Text>
                    <Text style={styles.stepText}>
                      {t('auth.step2ClickLink')}
                    </Text>
                  </View>

                  <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>3</Text>
                    <Text style={styles.stepText}>
                      {t('auth.step3CreateNewPassword')}
                    </Text>
                  </View>
                </View>

                <View style={styles.noteContainer}>
                  <Text style={styles.noteIcon}>💡</Text>
                  <Text style={styles.noteText}>
                    {t('auth.resetEmailNote')}
                  </Text>
                </View>

                {/* Resend Button */}
                <TouchableOpacity
                  style={[styles.resendButton, loading && styles.resendButtonDisabled]}
                  onPress={handleResendEmail}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>
                    {loading ? t('auth.sending') : t('auth.resendEmail')}
                  </Text>
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.backToLoginText}>
                    ← {t('auth.backToLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#7c3aed', '#8b5cf6', '#a78bfa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.logo}>🔐</Text>
              <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.forgotPasswordMessage')}
              </Text>
            </View>

            {/* Reset Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
                </Text>
              </TouchableOpacity>

              <View style={styles.helpContainer}>
                <Text style={styles.helpIcon}>❓</Text>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpTitle}>
                    {t('auth.needHelp')}
                  </Text>
                  <Text style={styles.helpText}>
                    {t('auth.resetHelpMessage')}
                  </Text>
                </View>
              </View>

              {/* Back to Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.rememberPassword')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  resetButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  helpIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 16,
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    paddingTop: 2,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  resendButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  resendButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#7c3aed',
    fontWeight: '600',
  },
})

export default ForgotPasswordScreen 