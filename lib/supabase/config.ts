import { createBrowserClient } from '@supabase/ssr'

// Safe Supabase client creation with environment variable validation
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { 
      url: !!url, 
      key: !!key,
      env: process.env.NODE_ENV 
    })
    
    // Return a mock client for development or when env vars are missing
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase not configured') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signIn: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ error: new Error('Supabase not configured') })
      },
      from: () => ({
        select: () => ({ error: new Error('Supabase not configured') }),
        insert: () => ({ error: new Error('Supabase not configured') }),
        update: () => ({ error: new Error('Supabase not configured') }),
        delete: () => ({ error: new Error('Supabase not configured') })
      })
    } as any
  }
  
  return createBrowserClient(url, key)
}

export const supabase = createSupabaseClient()