'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/config'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'
import { Eye, EyeOff, Check, X } from 'lucide-react'

const socialProviders = [
  { name: 'Google', provider: 'google', color: 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50', icon: 'G' },
  // Add more providers as needed
]

// Password requirements
const passwordRequirements = [
  { label: 'At least 8 characters', test: (pass: string) => pass.length >= 8 },
  { label: 'Contains a number', test: (pass: string) => /\d/.test(pass) },
  { label: 'Contains a special character', test: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
  { label: 'Contains uppercase letter', test: (pass: string) => /[A-Z]/.test(pass) },
  { label: 'Contains lowercase letter', test: (pass: string) => /[a-z]/.test(pass) },
]

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo)
    })
  }, [redirectTo, router])

  const validatePassword = (pass: string) => {
    return passwordRequirements.every(req => req.test(pass))
  }

  const handleSignUp = async () => {
    if (!validatePassword(password)) {
      setError('Please ensure your password meets all requirements')
      return
    }

    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          remember_me: rememberMe
        }
      }
    })
    setLoading(false)
    if (error) setError(error.message)
    else setError('Check your email for confirmation!')
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password
    })
    setLoading(false)
    if (error) setError(error.message)
    else router.push(redirectTo)
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
            VirtualEstate
          </h1>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Welcome Back</h2>
          
          <div className="flex flex-col gap-3 mb-6">
            {socialProviders.map((sp) => (
              <button
                key={sp.provider}
                onClick={() => handleSocial(sp.provider as Provider)}
                className={`flex items-center justify-center gap-2 ${sp.color} font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200`}
                disabled={loading}
              >
                <span className="text-lg">{sp.icon}</span>
                Continue with {sp.name}
              </button>
            ))}
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="mx-4 text-slate-400 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-4">
            <div>
              <input
                className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
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
                placeholder="Password"
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
                Forgot password?
              </a>
            </div>

            {/* Password Requirements */}
            {showPasswordRequirements && (
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Password Requirements:</h3>
                {passwordRequirements.map((req, index) => (
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
                Remember me
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-medium flex-1 shadow-sm hover:shadow transition-all duration-200" 
                onClick={handleSignIn} 
                disabled={loading}
              >
                Sign In
              </button>
              <button 
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-2.5 rounded-xl font-medium flex-1 transition-all duration-200" 
                onClick={handleSignUp} 
                disabled={loading}
              >
                Sign Up
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-6 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}