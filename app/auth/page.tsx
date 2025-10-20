'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/config'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'
import React from 'react'
import { Eye, EyeOff, Check, X, User, Building, Home, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const socialProviders = [
  { name: 'Google', provider: 'google', color: 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50', icon: 'G' },
  // Add more providers as needed
]

// User roles for signup - will be translated inline
const getUserRoles = (t: any) => [
  { 
    id: 'user', 
    title: t('auth.propertyOwnerBuyer'), 
    description: t('auth.findAndAppraise'),
    icon: Home,
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'broker', 
    title: t('auth.realEstateBroker'), 
    description: t('auth.managePropertiesClients'),
    icon: Building,
    color: 'from-green-500 to-green-600'
  },
  { 
    id: 'appraiser', 
    title: t('auth.propertyAppraiser'), 
    description: t('auth.provideAppraisalServices'),
    icon: User,
    color: 'from-purple-500 to-purple-600'
  }
]

// Password requirements - will be translated inline
const getPasswordRequirements = (t: any) => [
  { label: t('auth.passwordLengthRequirement'), test: (pass: string) => pass.length >= 8 },
  { label: t('auth.containsNumber'), test: (pass: string) => /\d/.test(pass) },
  { label: t('auth.containsSpecialChar'), test: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
  { label: t('auth.containsUppercase'), test: (pass: string) => /[A-Z]/.test(pass) },
  { label: t('auth.containsLowercase'), test: (pass: string) => /[a-z]/.test(pass) },
]

export default function AuthPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Check if user is already logged in and handle error messages
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo)
    })

    // Check for error messages in URL
    const errorFromUrl = searchParams.get('error')
    if (errorFromUrl === 'profile_setup_incomplete') {
      setError(t('auth.profileSetupIncomplete'))
    }
  }, [redirectTo, router, searchParams])

  const validatePassword = (pass: string) => {
    return getPasswordRequirements(t).every(req => req.test(pass))
  }

  const assignUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/user_roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role: role
        })
      })

      if (!response.ok) {
        console.error('Failed to assign role:', await response.text())
      }
    } catch (error) {
      console.error('Error assigning role:', error)
    }
  }

  const handleSignUp = async () => {
    if (!selectedRole) {
      setError(t('auth.selectAccountType'))
      return
    }

    if (!validatePassword(password)) {
      setError(t('auth.passwordRequirementsNotMet'))
      return
    }

    if (!fullName.trim()) {
      setError(t('auth.enterFullName'))
      return
    }

    console.log('📝 Starting signup for:', email, 'as', selectedRole)
    setLoading(true)
    setError('')
    
    let userData;
    let signupError;

    // For appraisers, create confirmed user directly via admin API
    if (selectedRole === 'appraiser') {
      console.log('📝 Creating confirmed appraiser user...')
      
      const response = await fetch('/api/auth/create-confirmed-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
          role: selectedRole
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('📝 Admin user creation failed:', result.error)
        setLoading(false)
        setError(result.error || t('auth.failedToCreateAccount'))
        return
      }
      
      console.log('📝 Confirmed user created:', result)
      
      // Now sign them in immediately
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      userData = signinData
      signupError = signinError
      
      console.log('📝 Auto-signin result:', { 
        user_id: signinData?.user?.id,
        session: !!signinData?.session,
        error: signinError?.message 
      })
    } else {
      // Regular signup for non-appraisers
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: selectedRole,
            remember_me: rememberMe
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      userData = data
      signupError = error
      
      console.log('📝 Regular signup result:', { 
        user_id: data?.user?.id, 
        user_confirmed: data?.user?.email_confirmed_at,
        session: !!data?.session,
        error: error?.message 
      })
    }
    
    if (signupError) {
      console.error('📝 Signup/signin error:', signupError)
      setLoading(false)
      setError(signupError.message)
      return
    }

    // Assign role to user and handle post-signup flow
    if (userData.user) {
      await assignUserRole(userData.user.id, selectedRole)
      
      // For appraisers, create broker record (they're already signed in)
      if (selectedRole === 'appraiser') {
        try {
          const response = await fetch('/api/appraisers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              full_name: fullName,
              email: email,
              phone: phone,
              user_id: userData.user.id,
              auto_created: true
            })
          })
          
          if (response.ok) {
            // User is confirmed and logged in, redirect to verification
            console.log('📝 Redirecting to appraiser verification...')
            router.push('/auth/callback?role=appraiser')
          } else {
            const errorData = await response.json()
            setError(`${t('auth.accountCreatedProfileFailed')}: ${errorData.error}`)
          }
        } catch (error) {
          console.error('📝 Error creating appraiser profile:', error)
          setError(t('auth.accountCreatedRefresh'))
        }
      } else {
        // For non-appraisers, check if already logged in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push(redirectTo)
        } else {
          // Try to sign in automatically
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          })
          
          if (!signInError) {
            router.push(redirectTo)
          } else {
            setError(t('auth.accountCreatedCheckEmail'))
          }
        }
      }
    }
    
    setLoading(false)
  }

  const handleSignIn = async () => {
    console.log('🔐 Starting sign in process for:', email)
    console.log('🔐 Supabase config check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlFirst20: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)
    })
    
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      })
      
      console.log('🔐 Sign in result:', { 
        userId: data?.user?.id, 
        userEmail: data?.user?.email,
        hasSession: !!data?.session,
        error: error?.message,
        errorCode: error?.status 
      })
      
      setLoading(false)
      if (error) {
        console.error('🔐 Sign in error details:', error)
        setError(error.message)
      } else {
        console.log('🔐 Sign in successful, redirecting to:', redirectTo)
        router.push(redirectTo)
      }
    } catch (err) {
      console.error('🔐 Sign in exception:', err)
      setLoading(false)
      setError(t('auth.unexpectedSignInError'))
    }
  }

  const handleSocial = async (provider: Provider) => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
        queryParams: {
          remember_me: rememberMe ? 'true' : 'false'
        }
      }
    })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-50 blur-3xl transform rotate-12" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full opacity-50 blur-3xl transform -rotate-12" />
      </div>

      <div className="max-w-md w-full relative">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold ml-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {t('app.name')}
          </h1>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
            {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h2>

          {/* Account Type Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setIsSignUp(false)
                setShowRoleSelection(false)
                setSelectedRole(null)
                setError('')
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-white shadow text-slate-800' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => {
                setIsSignUp(true)
                setError('')
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                isSignUp 
                  ? 'bg-white shadow text-slate-800' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          {/* Role Selection for Sign Up */}
          {isSignUp && !showRoleSelection && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('auth.chooseAccountType')}</h3>
              <div className="grid gap-3">
                {getUserRoles(t).map((role) => {
                  const Icon = role.icon
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id)
                        setShowRoleSelection(true)
                      }}
                      className="flex items-center p-4 bg-white/50 border border-slate-200 rounded-xl hover:bg-white/70 hover:border-slate-300 transition-all duration-200 group"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-slate-800">{role.title}</h4>
                        <p className="text-sm text-slate-600">{role.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Back to role selection for sign up */}
          {isSignUp && showRoleSelection && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowRoleSelection(false)}
                className="flex items-center text-slate-600 hover:text-slate-800 text-sm"
              >
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                {t('auth.backToAccountTypes')}
              </button>
              <div className="flex items-center">
                {selectedRole && (
                  <>
                    <div className={`w-6 h-6 bg-gradient-to-r ${getUserRoles(t).find(r => r.id === selectedRole)?.color} rounded mr-2`}>
                      {React.createElement(getUserRoles(t).find(r => r.id === selectedRole)?.icon || User, { className: "h-3 w-3 text-white m-1.5" })}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {getUserRoles(t).find(r => r.id === selectedRole)?.title}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Show form only if not sign up or if role is selected */}
          {(!isSignUp || showRoleSelection) && (
            <>
          <div className="flex flex-col gap-3 mb-6">
            {socialProviders.map((sp) => (
              <button
                key={sp.provider}
                onClick={() => handleSocial(sp.provider as Provider)}
                className={`flex items-center justify-center gap-2 ${sp.color} font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200`}
                disabled={loading}
              >
                <span className="text-lg">{sp.icon}</span>
                {t('auth.continueWith')} {sp.name}
              </button>
            ))}
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="mx-4 text-slate-400 text-sm">{t('common.or')}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-4">
            {/* Additional fields for sign up */}
            {isSignUp && (
              <>
                <div>
                  <input
                    className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={t('auth.fullName')}
                    type="text"
                    autoComplete="name"
                    required
                  />
                </div>
                
                <div>
                  <input
                    className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('auth.phoneNumber')}
                    type="tel"
                    autoComplete="tel"
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <input
                className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <input
                className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-10"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setShowPasswordRequirements(true)
                }}
                onFocus={() => setShowPasswordRequirements(true)}
                placeholder={t('auth.password')}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="/auth/reset-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t('auth.forgotPassword')}
              </a>
            </div>

            {/* Password Requirements - only show during signup */}
            {showPasswordRequirements && isSignUp && (
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-medium text-slate-700 mb-2">{t('auth.passwordRequirementsTitle')}</h3>
                {getPasswordRequirements(t).map((req, index) => (
                  <div key={index} className="flex items-center text-sm">
                    {req.test(password) ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 mr-2" />
                    )}
                    <span className={req.test(password) ? "text-green-700" : "text-slate-500"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                {t('auth.rememberMe')}
              </label>
            </div>

            {!isSignUp ? (
              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all duration-200" 
                onClick={handleSignIn} 
                disabled={loading}
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            ) : (
              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all duration-200" 
                onClick={handleSignUp} 
                disabled={loading || !selectedRole}
              >
                {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
            )}
          </div>

          {error && (
            <div className={`mt-4 p-3 text-sm rounded-xl text-center ${
              error.includes('✅') 
                ? 'bg-green-50 border border-green-100 text-green-700' 
                : 'bg-red-50 border border-red-100 text-red-600'
            }`}>
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-6 text-center">
            {t('auth.agreementText')}
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  )
}