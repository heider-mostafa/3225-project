import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import { useTranslation } from 'react-i18next'

import AuthService from '../../services/AuthService'
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice'
import type { AuthUser, BiometricConfig } from '../../services/AuthService'

interface LoginScreenProps {
  navigation: any
}

const { width, height } = Dimensions.get('window')

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig | null>(null)

  useEffect(() => {
    initializeScreen()
  }, [])

  const initializeScreen = async () => {
    try {
      // Check if user is already authenticated
      const storedUser = await AuthService.checkStoredAuth()
      if (storedUser) {
        dispatch(loginSuccess({ user: storedUser, token: 'authenticated' }))
        navigation.replace('Home')
        return
      }

      // Get biometric configuration
      const config = AuthService.getBiometricConfig()
      setBiometricConfig(config)
    } catch (error) {
      console.error('❌ Error initializing login screen:', error)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        t('auth.error'),
        t('auth.fillAllFields'),
        [{ text: t('common.ok') }]
      )
      return
    }

    try {
      setLoading(true)
      dispatch(loginStart())

      const result = await AuthService.signIn(email, password)

      if (result.success && result.user) {
        dispatch(loginSuccess({ 
          user: result.user, 
          token: 'authenticated' 
        }))
        
        // Navigate to main app
        navigation.replace('Home')
      } else {
        dispatch(loginFailure(result.error || 'Login failed'))
        Alert.alert(
          t('auth.loginFailed'),
          result.error || t('auth.unknownError'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      dispatch(loginFailure('An unexpected error occurred'))
      Alert.alert(
        t('auth.error'),
        t('auth.unknownError'),
        [{ text: t('common.ok') }]
      )
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    try {
      if (!biometricConfig?.enabled) {
        Alert.alert(
          t('auth.biometricNotSetup'),
          t('auth.biometricNotSetupMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('auth.setupBiometric'), 
              onPress: () => navigation.navigate('BiometricSetup')
            }
          ]
        )
        return
      }

      setLoading(true)
      dispatch(loginStart())

      const result = await AuthService.authenticateWithBiometrics()

      if (result.success && result.user) {
        dispatch(loginSuccess({ 
          user: result.user, 
          token: 'authenticated' 
        }))
        navigation.replace('Home')
      } else {
        dispatch(loginFailure(result.error || 'Biometric authentication failed'))
        Alert.alert(
          t('auth.biometricFailed'),
          result.error || t('auth.biometricFailedMessage'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error('❌ Biometric login error:', error)
      dispatch(loginFailure('Biometric authentication failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true)
      dispatch(loginStart())

      const result = await AuthService.signInWithProvider(provider)

      if (result.success) {
        // OAuth redirect will handle the rest
        Alert.alert(
          t('auth.redirecting'),
          t('auth.redirectingMessage'),
          [{ text: t('common.ok') }]
        )
      } else {
        dispatch(loginFailure(result.error || 'Social login failed'))
        Alert.alert(
          t('auth.socialLoginFailed'),
          result.error || t('auth.unknownError'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error(`❌ ${provider} login error:`, error)
      dispatch(loginFailure('Social login failed'))
    } finally {
      setLoading(false)
    }
  }

  const getBiometricIcon = () => {
    if (!biometricConfig?.type) return '🔒'
    
    switch (biometricConfig.type) {
      case 'fingerprint': return '👆'
      case 'face': return '👤'
      case 'both': return '🔐'
      default: return '🔒'
    }
  }

  const getBiometricText = () => {
    if (!biometricConfig?.type) return t('auth.useBiometric')
    
    switch (biometricConfig.type) {
      case 'fingerprint': return t('auth.useFingerprint')
      case 'face': return t('auth.useFaceId')
      case 'both': return t('auth.useBiometric')
      default: return t('auth.useBiometric')
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
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
              <Text style={styles.logo}>🏠</Text>
              <Text style={styles.title}>{t('app.name')}</Text>
              <Text style={styles.subtitle}>{t('auth.welcomeBack')}</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Email Input */}
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
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? t('auth.signingIn') : t('auth.signIn')}
                </Text>
              </TouchableOpacity>

              {/* Biometric Authentication */}
              {biometricConfig?.enabled && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
                  <Text style={styles.biometricText}>{getBiometricText()}</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.divider} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialLogin('facebook')}
                  disabled={loading}
                >
                  <Text style={styles.socialIcon}>f</Text>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
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
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: '#6b7280',
  },
  forgotText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  biometricText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#6b7280',
  },
  signupLink: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
})

export default LoginScreen 