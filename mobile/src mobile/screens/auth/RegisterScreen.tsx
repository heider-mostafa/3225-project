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
  const [selectedPlatform, setSelectedPlatform] = useState<'real_estate' | 'community' | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [compoundName, setCompoundName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')

  // Platform and role configuration from the plan
  const PLATFORM_CATEGORIES = [
    {
      id: 'real_estate' as const,
      title: 'Real Estate Services',
      description: 'Buy, sell, or professionally service properties',
      icon: '🏢',
      color: ['#3b82f6', '#2563eb'],
      roles: ['user', 'broker', 'appraiser']
    },
    {
      id: 'community' as const,
      title: 'Community Management', 
      description: 'Manage or live in residential compounds',
      icon: '🏘️',
      color: ['#10b981', '#059669'],
      roles: ['developer', 'compound_manager', 'resident_owner', 'resident_tenant', 'security_guard']
    }
  ]

  const ROLE_DEFINITIONS = {
    // Real Estate Platform Roles
    user: { title: 'Property Owner/Buyer', description: 'Search and inquire about properties', icon: '🏠' },
    broker: { title: 'Real Estate Broker', description: 'Professional property services and client management', icon: '🏢' },
    appraiser: { title: 'Property Appraiser', description: 'Professional valuation services', icon: '📊' },
    // Community Management Roles
    developer: { title: 'Property Developer', description: 'Large-scale development and compound management', icon: '🏗️' },
    compound_manager: { title: 'Compound Manager', description: 'Day-to-day compound operations management', icon: '🏛️' },
    resident_owner: { title: 'Resident Owner', description: 'Property owners living in managed compounds', icon: '🏘️' },
    resident_tenant: { title: 'Resident Tenant', description: 'Tenants living in managed compounds', icon: '🏠' },
    security_guard: { title: 'Security Personnel', description: 'Security staff for compounds and developments', icon: '🛡️' }
  }

  const passwordRequirements: PasswordRequirement[] = [
    { label: t('auth.passwordRequirements.minLength'), test: (pass) => pass.length >= 8 },
    { label: t('auth.passwordRequirements.hasNumber'), test: (pass) => /\d/.test(pass) },
    { label: t('auth.passwordRequirements.hasSpecial'), test: (pass) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
    { label: t('auth.passwordRequirements.hasUpper'), test: (pass) => /[A-Z]/.test(pass) },
    { label: t('auth.passwordRequirements.hasLower'), test: (pass) => /[a-z]/.test(pass) },
  ]

  const validateForm = (): string | null => {
    if (!selectedPlatform) {
      return 'Please select a platform type'
    }

    if (!selectedRole) {
      return 'Please select your role'
    }

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

    if (phone && !/^[+]?[0-9\s\-()]{10,}$/.test(phone)) {
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

    // Role-specific validation
    const roleFields = getRoleSpecificFields()
    if (roleFields.includes('company') && !companyName.trim()) {
      return 'Company name is required for this role'
    }
    if (roleFields.includes('license') && !licenseNumber.trim()) {
      return 'License number is required for this role'
    }
    if (roleFields.includes('compound') && !compoundName.trim()) {
      return 'Compound name is required'
    }
    if (roleFields.includes('unit') && !unitNumber.trim()) {
      return 'Unit number is required'
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
        phone: phone || undefined,
        platform: selectedPlatform,
        role: selectedRole,
        company_name: companyName || undefined,
        license_number: licenseNumber || undefined,
        compound_name: compoundName || undefined,
        unit_number: unitNumber || undefined
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

  const getRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'broker':
      case 'appraiser':
        return ['company', 'license']
      case 'developer':
        return ['company', 'license']
      case 'compound_manager':
        return ['company']
      case 'resident_owner':
      case 'resident_tenant':
        return ['compound', 'unit']
      case 'security_guard':
        return ['company']
      default:
        return []
    }
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
              
              {/* Platform Selection */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Choose Platform Type</Text>
                <View style={styles.platformContainer}>
                  {PLATFORM_CATEGORIES.map((platform) => (
                    <TouchableOpacity
                      key={platform.id}
                      style={[
                        styles.platformCard,
                        selectedPlatform === platform.id && styles.platformCardSelected
                      ]}
                      onPress={() => {
                        setSelectedPlatform(platform.id)
                        setSelectedRole(null) // Reset role when platform changes
                      }}
                    >
                      <LinearGradient
                        colors={platform.color}
                        style={[
                          styles.platformCardGradient,
                          selectedPlatform === platform.id && styles.platformCardGradientSelected
                        ]}
                      >
                        <Text style={styles.platformIcon}>{platform.icon}</Text>
                        <Text style={styles.platformTitle}>{platform.title}</Text>
                        <Text style={styles.platformDescription}>{platform.description}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Role Selection - Only show when platform is selected */}
              {selectedPlatform && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Choose Your Role</Text>
                  <View style={styles.rolesContainer}>
                    {PLATFORM_CATEGORIES
                      .find(p => p.id === selectedPlatform)?.roles
                      .map((roleId) => {
                        const role = ROLE_DEFINITIONS[roleId as keyof typeof ROLE_DEFINITIONS]
                        return (
                          <TouchableOpacity
                            key={roleId}
                            style={[
                              styles.roleCard,
                              selectedRole === roleId && styles.roleCardSelected
                            ]}
                            onPress={() => setSelectedRole(roleId)}
                          >
                            <Text style={styles.roleIcon}>{role.icon}</Text>
                            <Text style={styles.roleTitle}>{role.title}</Text>
                            <Text style={styles.roleDescription}>{role.description}</Text>
                          </TouchableOpacity>
                        )
                      })
                    }
                  </View>
                </View>
              )}

              {/* Form Fields - Only show when role is selected */}
              {selectedRole && (
                <>
              
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

              {/* Role-Specific Fields */}
              {getRoleSpecificFields().includes('company') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Company Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="Enter your company name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              )}

              {getRoleSpecificFields().includes('license') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {selectedRole === 'broker' ? 'Broker License Number' : 
                     selectedRole === 'appraiser' ? 'Appraiser License Number' : 
                     'License Number'} *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="Enter your license number"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              )}

              {getRoleSpecificFields().includes('compound') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Compound Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={compoundName}
                    onChangeText={setCompoundName}
                    placeholder="Enter your compound name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              )}

              {getRoleSpecificFields().includes('unit') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Unit Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={unitNumber}
                    onChangeText={setUnitNumber}
                    placeholder="Enter your unit number"
                    placeholderTextColor="#9ca3af"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              )}

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
                </>
              )}
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
  
  // New styles for platform and role selection
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  platformContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  platformCardSelected: {
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  platformCardGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  platformCardGradientSelected: {
    opacity: 0.9,
  },
  platformIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  rolesContainer: {
    marginTop: 8,
  },
  roleCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleCardSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
    flex: 1,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
    flex: 2,
    lineHeight: 18,
  },
})

export default RegisterScreen 