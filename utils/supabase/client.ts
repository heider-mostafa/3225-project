import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', { 
      url: !!supabaseUrl, 
      key: !!supabaseAnonKey 
    })
    
    // Return a mock client that doesn't crash the app
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
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
          }),
          limit: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
        }),
        insert: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ error: new Error('Supabase not configured') })
      })
    } as any
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}