'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Toaster } from '@/components/ui/toaster'
import { I18nProvider } from '@/components/i18n-provider'
import { ErrorBoundary } from '@/components/error-boundary'

// Lazy Supabase client initialization with error handling
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { 
      url: !!url, 
      key: !!key 
    })
    throw new Error('Supabase configuration is missing')
  }
  
  return createBrowserClient(url, key)
}

// Create auth context
const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({
  user: null,
  loading: true,
})

// Hook to use auth context
export const useAuth = () => useContext(AuthContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only initialize Supabase client on the client side
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      // Get initial session
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        setLoading(false)
      }).catch((error) => {
        console.error('Error getting user:', error)
        setLoading(false)
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error)
      setLoading(false)
    }
  }, [])

  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthContext.Provider value={{ user, loading }}>
          {children}
          <Toaster />
        </AuthContext.Provider>
      </I18nProvider>
    </ErrorBoundary>
  )
} 