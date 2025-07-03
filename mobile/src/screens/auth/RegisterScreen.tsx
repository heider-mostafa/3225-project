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
import { useDispatch } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import { useTranslation } from 'react-i18next'

import AuthService from '../../services/AuthService'
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice'

interface RegisterScreenProps {
  navigation: any
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const passwordRequirements: PasswordRequirement[] = [
    { label: t('auth.passwordRequirements.minLength'), test: (pass) => pass.length >= 8 },
    { label: t('auth.passwordRequirements.hasNumber'), test: (pass) => /\d/.test(pass) },
    { label: t('auth.passwordRequirements.hasSpecial'), test: (pass) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
    { label: t('auth.passwordRequirements.hasUpper'), test: (pass) => /[A-Z]/.test(pass) },
    { label: t('auth.passwordRequirements.hasLower'), test: (pass) => /[a-z]/.test(pass) },
  ]

  const validateForm = (): string | null => {
    if (!fullName.trim()) {
      return t('auth.validation.fullNameRequired')
    }

    if (!email.trim()) {
      return t('auth.validation.emailRequired')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return t('auth.validation.emailInvalid')
    }

    if (phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone)) {
      return t('auth.validation.phoneInvalid')
    }

    if (!password) {
      return t('auth.validation.passwordRequired')
    }

    const failedRequirements = passwordRequirements.filter(req => !req.test(password))
    if (failedRequirements.length > 0) {
      return t('auth.validation.passwordWeak')
    }

    if (password !== confirmPassword) {
      return t('auth.validation.passwordMismatch')
    }

    if (!acceptTerms) {
      return t('auth.validation.termsRequired')
    }

    return null
  }

  const handleRegister = async () => {
    const validationError = validateForm()
    if (validationError) {
      Alert.alert(
        t('auth.error'),
        validationError,
        [{ text: t('common.ok') }]
      )
      return
    }

    try {
      setLoading(true)
      dispatch(loginStart())

      const result = await AuthService.signUp(email, password, {
        full_name: fullName,
        phone: phone || undefined
      })

      if (result.success) {
        if (result.requiresVerification) {
          // Show verification screen
          Alert.alert(
            t('auth.verificationRequired'),
            t('auth.verificationSent'),
            [
              {
                text: t('common.ok'),
                onPress: () => navigation.navigate('EmailVerification', {
                  email: email,
                  userId: result.user?.id
                })
              }
            ]
          )
        } else if (result.user) {
          dispatch(loginSuccess({ 
            user: result.user, 
            token: 'authenticated' 
          }))
          navigation.replace('Home')
        }
      } else {
        dispatch(loginFailure(result.error || 'Registration failed'))
        Alert.alert(
          t('auth.registrationFailed'),
          result.error || t('auth.unknownError'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
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

  const handleSocialRegister = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true)
      dispatch(loginStart())

      const result = await AuthService.signInWithProvider(provider)

      if (result.success) {
        Alert.alert(
          t('auth.redirecting'),
          t('auth.redirectingMessage'),
          [{ text: t('common.ok') }]
        )
      } else {
        dispatch(loginFailure(result.error || 'Social registration failed'))
        Alert.alert(
          t('auth.socialLoginFailed'),
          result.error || t('auth.unknownError'),
          [{ text: t('common.ok') }]
        )
      }
    } catch (error) {
      console.error(`❌ ${provider} registration error:`, error)
      dispatch(loginFailure('Social registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const isPasswordRequirementMet = (requirement: PasswordRequirement): boolean => {
    return password ? requirement.test(password) : false
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#059669', '#10b981', '#34d399']}
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
              <Text style={styles.logo}>🏠</Text>
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              <Text style={styles.subtitle}>{t('auth.joinCommunity')}</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.fullName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('auth.fullNamePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.email')} *</Text>
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

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.phone')} ({t('common.optional')})</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.password')} *</Text>
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

                {/* Password Requirements */}
                {password && (
                  <View style={styles.requirementsContainer}>
                    {passwordRequirements.map((requirement, index) => (
                      <View key={index} style={styles.requirementRow}>
                        <Text style={[
                          styles.requirementIcon,
                          isPasswordRequirementMet(requirement) && styles.requirementMet
                        ]}>
                          {isPasswordRequirementMet(requirement) ? '✅' : '❌'}
                        </Text>
                        <Text style={[
                          styles.requirementText,
                          isPasswordRequirementMet(requirement) && styles.requirementMet
                        ]}>
                          {requirement.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.confirmPassword')} *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <View style={styles.matchContainer}>
                    <Text style={[
                      styles.matchText,
                      password === confirmPassword && styles.matchSuccess
                    ]}>
                      {password === confirmPassword ? 
                        `✅ ${t('auth.passwordMatch')}` : 
                        `❌ ${t('auth.passwordNoMatch')}`
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* Terms and Conditions */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    {t('auth.agreeToTerms')} 
                    <Text style={styles.termsLink}> {t('auth.termsOfService')}</Text>
                    {t('auth.and')} 
                    <Text style={styles.termsLink}> {t('auth.privacyPolicy')}</Text>
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('auth.orRegisterWith')}</Text>
                <View style={styles.divider} />
              </View>

              {/* Social Registration Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => handleSocialRegister('google')}
                  disabled={loading}
                >
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialRegister('facebook')}
                  disabled={loading}
                >
                  <Text style={styles.socialIcon}>f</Text>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Link */}
              <View style={styles.signinContainer}>
                <Text style={styles.signinText}>{t('auth.haveAccount')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signinLink}>{t('auth.signIn')}</Text>
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
    paddingBottom: 30,
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
    fontSize: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#6b7280',
  },
  requirementMet: {
    color: '#059669',
  },
  matchContainer: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 14,
    color: '#ef4444',
  },
  matchSuccess: {
    color: '#059669',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#059669',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 16,
    color: '#6b7280',
  },
  signinLink: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
})

export default RegisterScreen 