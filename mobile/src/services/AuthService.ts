import { Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../config/supabase'
import type { User, AuthError, Provider } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  email_verified?: boolean
  phone_verified?: boolean
  role?: 'user' | 'admin' | 'super_admin'
  created_at?: string
  last_sign_in_at?: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  occupation: string | null
  company: string | null
  bio: string | null
  profile_photo_url: string | null
  address: any
  emergency_contact: any
  preferences: any
  is_verified: boolean
  phone_verified: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  profile?: UserProfile
  error?: string
  requiresVerification?: boolean
}

export interface BiometricConfig {
  enabled: boolean
  type: 'fingerprint' | 'face' | 'both' | null
  fallbackToPin: boolean
}

class AuthService {
  private static instance: AuthService
  private currentUser: AuthUser | null = null
  private biometricConfig: BiometricConfig | null = null

  private constructor() {
    this.initializeAuthService()
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async initializeAuthService(): Promise<void> {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await this.handleUserSession(session.user)
      }

      // Initialize biometric settings
      await this.initializeBiometrics()

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          await this.handleSignOut()
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await this.handleUserSession(session.user)
        }
      })

    } catch (error) {
      console.error('❌ Error initializing auth service:', error)
    }
  }

  private async handleUserSession(user: User): Promise<void> {
    try {
      // Get user profile from database
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('❌ Error fetching user profile:', error)
      }

      // Convert to AuthUser format
      this.currentUser = {
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || user.user_metadata?.full_name,
        phone: profile?.phone || user.phone,
        avatar_url: profile?.profile_photo_url || user.user_metadata?.avatar_url,
        email_verified: user.email_confirmed_at ? true : false,
        phone_verified: profile?.phone_verified || false,
        role: user.user_metadata?.role || 'user',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }

      // Store user data locally
      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser))
      // No need to store auth_token separately as we use Supabase session

      console.log('✅ User session established:', this.currentUser.email)
    } catch (error) {
      console.error('❌ Error handling user session:', error)
    }
  }

  private async handleSignOut(): Promise<void> {
    this.currentUser = null
    await AsyncStorage.multiRemove(['user_data', 'biometric_enabled'])
    console.log('✅ User signed out')
  }

  // Email/Password Authentication
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        return this.handleAuthError(error)
      }

      if (data.user) {
        await this.handleUserSession(data.user)
        return {
          success: true,
          user: this.currentUser!
        }
      }

      return { success: false, error: 'No user data returned' }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async signUp(email: string, password: string, metadata: {
    full_name?: string
    phone?: string
  } = {}): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            phone: metadata.phone
          }
        }
      })

      if (error) {
        return this.handleAuthError(error)
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          return {
            success: true,
            requiresVerification: true,
            user: {
              id: data.user.id,
              email: data.user.email || email,
              full_name: metadata.full_name
            }
          }
        }

        await this.handleUserSession(data.user)
        return {
          success: true,
          user: this.currentUser!
        }
      }

      return { success: false, error: 'No user data returned' }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Social Authentication
  async signInWithProvider(provider: Provider): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'com.egyptianrealestate://auth/callback'
        }
      })

      if (error) {
        return this.handleAuthError(error)
      }

      // OAuth will redirect back to app, session will be handled by auth state change
      return { success: true }
    } catch (error) {
      console.error(`❌ ${provider} sign in error:`, error)
      return { success: false, error: `Failed to sign in with ${provider}` }
    }
  }

  // Password Reset
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: 'com.egyptianrealestate://auth/reset-password'
        }
      )

      if (error) {
        return this.handleAuthError(error)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      return { success: false, error: 'Failed to send reset email' }
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return this.handleAuthError(error)
      }

      return { success: true, user: this.currentUser! }
    } catch (error) {
      console.error('❌ Password update error:', error)
      return { success: false, error: 'Failed to update password' }
    }
  }

  // Biometric Authentication
  async initializeBiometrics(): Promise<void> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

      if (hasHardware && isEnrolled) {
        const stored = await AsyncStorage.getItem('biometric_config')
        if (stored) {
          this.biometricConfig = JSON.parse(stored)
        } else {
          // Determine biometric type
          let type: 'fingerprint' | 'face' | 'both' | null = null
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) &&
              supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = 'both'
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = 'face'
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = 'fingerprint'
          }

          this.biometricConfig = {
            enabled: false,
            type,
            fallbackToPin: true
          }
        }
      } else {
        this.biometricConfig = {
          enabled: false,
          type: null,
          fallbackToPin: false
        }
      }
    } catch (error) {
      console.error('❌ Error initializing biometrics:', error)
      this.biometricConfig = { enabled: false, type: null, fallbackToPin: false }
    }
  }

  async enableBiometricAuth(): Promise<boolean> {
    try {
      if (!this.biometricConfig?.type) {
        Alert.alert(
          'البصمة غير متوفرة',
          'جهازك لا يدعم المصادقة بالبصمة أو لم يتم تفعيلها.',
          [{ text: 'حسناً' }]
        )
        return false
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'قم بتأكيد هويتك لتفعيل المصادقة بالبصمة',
        fallbackLabel: 'استخدم كلمة المرور',
        disableDeviceFallback: false
      })

      if (result.success) {
        this.biometricConfig.enabled = true
        await AsyncStorage.setItem('biometric_config', JSON.stringify(this.biometricConfig))
        
        // Store credentials securely
        if (this.currentUser) {
          await SecureStore.setItemAsync('biometric_user_id', this.currentUser.id)
        }
        
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Error enabling biometric auth:', error)
      return false
    }
  }

  async authenticateWithBiometrics(): Promise<AuthResponse> {
    try {
      if (!this.biometricConfig?.enabled) {
        return { success: false, error: 'Biometric authentication not enabled' }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'قم بتأكيد هويتك للدخول',
        fallbackLabel: 'استخدم كلمة المرور',
        disableDeviceFallback: !this.biometricConfig.fallbackToPin
      })

      if (result.success) {
        const userId = await SecureStore.getItemAsync('biometric_user_id')
        if (userId) {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && session.user.id === userId) {
            return { success: true, user: this.currentUser! }
          }
        }
        
        return { success: false, error: 'Biometric authentication failed - no valid session' }
      }

      return { success: false, error: 'Biometric authentication failed' }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error)
      return { success: false, error: 'Biometric authentication failed' }
    }
  }

  async disableBiometricAuth(): Promise<boolean> {
    try {
      if (this.biometricConfig) {
        this.biometricConfig.enabled = false
        await AsyncStorage.setItem('biometric_config', JSON.stringify(this.biometricConfig))
        await SecureStore.deleteItemAsync('biometric_user_id')
      }
      return true
    } catch (error) {
      console.error('❌ Error disabling biometric auth:', error)
      return false
    }
  }

  // Profile Management
  async updateProfile(profile: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: this.currentUser.id,
          ...profile,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Profile update error:', error)
        return { success: false, error: 'Failed to update profile' }
      }

      // Update current user data
      this.currentUser = {
        ...this.currentUser,
        full_name: data.full_name || this.currentUser.full_name,
        phone: data.phone || this.currentUser.phone,
        avatar_url: data.profile_photo_url || this.currentUser.avatar_url
      }

      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser))

      return { success: true, user: this.currentUser, profile: data }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
      // handleSignOut will be called by auth state change listener
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Force local cleanup even if remote sign out fails
      await this.handleSignOut()
    }
  }

  // Getters
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  getBiometricConfig(): BiometricConfig | null {
    return this.biometricConfig
  }

  // Helper Methods
  private handleAuthError(error: AuthError): AuthResponse {
    console.error('❌ Auth error:', error)
    
    const errorMessages: { [key: string]: string } = {
      'invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'email_not_confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً',
      'too_many_requests': 'تم إرسال طلبات كثيرة. حاول مرة أخرى لاحقاً',
      'weak_password': 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل',
      'email_address_invalid': 'عنوان البريد الإلكتروني غير صحيح',
      'signup_disabled': 'التسجيل مُعطل حالياً',
      'email_address_not_authorized': 'البريد الإلكتروني غير مُصرح له',
      'user_already_registered': 'المستخدم مُسجل بالفعل'
    }

    return {
      success: false,
      error: errorMessages[error.message] || error.message || 'حدث خطأ غير متوقع'
    }
  }

  async resendConfirmation(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim()
      })

      if (error) {
        return this.handleAuthError(error)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Resend confirmation error:', error)
      return { success: false, error: 'Failed to resend confirmation email' }
    }
  }

  // Check authentication status from storage (for app startup)
  async checkStoredAuth(): Promise<AuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data')
      if (userData) {
        const user = JSON.parse(userData)
        
        // Verify with Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && session.user.id === user.id) {
          this.currentUser = user
          return user
        } else {
          // Clear invalid stored data
          await this.handleSignOut()
        }
      }
      return null
    } catch (error) {
      console.error('❌ Error checking stored auth:', error)
      return null
    }
  }
}

export default AuthService.getInstance() 