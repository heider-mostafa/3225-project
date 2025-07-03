import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Alert } from 'react-native'
import AuthService from '../services/AuthService'
import NotificationService from '../services/NotificationService'
import type { AuthUser, BiometricConfig } from '../services/AuthService'
import { useTranslation } from 'react-i18next'

export interface AuthContextType {
  // Auth state
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => Promise<boolean>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  
  // Biometric authentication
  biometricConfig: BiometricConfig | null
  enableBiometric: () => Promise<boolean>
  authenticateWithBiometrics: () => Promise<boolean>
  disableBiometric: () => Promise<boolean>
  
  // Profile management
  updateProfile: (profile: any) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t } = useTranslation()
  
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Check for stored authentication
      const storedUser = await AuthService.checkStoredAuth()
      if (storedUser) {
        setUser(storedUser)
        
        // Initialize push notifications for authenticated user
        await NotificationService.getInstance().initialize()
      }

      // Get biometric configuration
      const config = AuthService.getBiometricConfig()
      setBiometricConfig(config)

    } catch (error) {
      console.error('❌ Error initializing auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const result = await AuthService.signIn(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        
        // Initialize push notifications for authenticated user
        await NotificationService.getInstance().initialize()
        
        return true
      } else {
        Alert.alert(
          t('auth.loginFailed'),
          result.error || t('auth.unknownError')
        )
        return false
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; phone?: string }
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const result = await AuthService.signUp(email, password, metadata)
      
      if (result.success) {
        if (result.requiresVerification) {
          Alert.alert(
            t('auth.verificationRequired'),
            t('auth.verificationSent')
          )
          return true
        } else if (result.user) {
          setUser(result.user)
          
          // Initialize push notifications for new user
          await NotificationService.getInstance().initialize()
          
          return true
        }
      } else {
        Alert.alert(
          t('auth.registrationFailed'),
          result.error || t('auth.unknownError')
        )
      }
      
      return false
    } catch (error) {
      console.error('❌ Sign up error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Disable push notifications
      await NotificationService.getInstance().disableNotifications()
      
      // Sign out from Supabase
      await AuthService.signOut()
      
      // Clear local state
      setUser(null)
      setBiometricConfig(prev => prev ? { ...prev, enabled: false } : null)
      
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Still clear local state even if remote sign out fails
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'facebook'): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const result = await AuthService.signInWithProvider(provider)
      
      if (result.success) {
        // OAuth will redirect back to app, state will be updated via auth listener
        return true
      } else {
        Alert.alert(
          t('auth.socialLoginFailed'),
          result.error || t('auth.unknownError')
        )
        return false
      }
    } catch (error) {
      console.error(`❌ ${provider} sign in error:`, error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const result = await AuthService.resetPassword(email)
      
      if (result.success) {
        Alert.alert(
          t('auth.resetEmailSent'),
          t('auth.resetEmailSentMessage')
        )
        return true
      } else {
        Alert.alert(
          t('auth.error'),
          result.error || t('auth.unknownError')
        )
        return false
      }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    }
  }

  const enableBiometric = async (): Promise<boolean> => {
    try {
      const result = await AuthService.enableBiometricAuth()
      
      if (result) {
        const config = AuthService.getBiometricConfig()
        setBiometricConfig(config)
        
        Alert.alert(
          t('auth.biometricEnabled'),
          t('auth.biometricEnabledMessage')
        )
      }
      
      return result
    } catch (error) {
      console.error('❌ Enable biometric error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    }
  }

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const result = await AuthService.authenticateWithBiometrics()
      
      if (result.success && result.user) {
        setUser(result.user)
        return true
      } else {
        Alert.alert(
          t('auth.biometricFailed'),
          result.error || t('auth.biometricFailedMessage')
        )
        return false
      }
    } catch (error) {
      console.error('❌ Biometric auth error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const disableBiometric = async (): Promise<boolean> => {
    try {
      const result = await AuthService.disableBiometricAuth()
      
      if (result) {
        const config = AuthService.getBiometricConfig()
        setBiometricConfig(config)
        
        Alert.alert(
          t('auth.biometricDisabled'),
          t('auth.biometricDisabledMessage')
        )
      }
      
      return result
    } catch (error) {
      console.error('❌ Disable biometric error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    }
  }

  const updateProfile = async (profile: any): Promise<boolean> => {
    try {
      const result = await AuthService.updateProfile(profile)
      
      if (result.success && result.user) {
        setUser(result.user)
        return true
      } else {
        Alert.alert(
          t('profile.updateFailed'),
          result.error || t('auth.unknownError')
        )
        return false
      }
    } catch (error) {
      console.error('❌ Update profile error:', error)
      Alert.alert(t('auth.error'), t('auth.unknownError'))
      return false
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = AuthService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error)
    }
  }

  const value: AuthContextType = {
    // Auth state
    user,
    isAuthenticated: !!user,
    isLoading,
    
    // Auth actions
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    resetPassword,
    
    // Biometric authentication
    biometricConfig,
    enableBiometric,
    authenticateWithBiometrics,
    disableBiometric,
    
    // Profile management
    updateProfile,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 