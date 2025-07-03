'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Toaster } from '@/components/ui/toaster'
import { I18nProvider } from '@/components/i18n-provider'
import { ErrorBoundary } from '@/components/error-boundary'

// Lazy Supabase client initialization
function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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

    const supabase = getSupabaseClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
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