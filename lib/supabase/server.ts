import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          return value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
            console.log(`🍪 Server cookie set: ${name} = [${value.length} chars]`)
          } catch (error) {
            console.error(`❌ Failed to set cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
            console.log(`🍪 Server cookie removed: ${name}`)
          } catch (error) {
            console.error(`❌ Failed to remove cookie ${name}:`, error)
          }
        },
      },
    }
  )
}

export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  
  try {
    console.log('🔍 Getting server session...')
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('❌ Server session error:', error.message)
      return null
    }
    console.log('✅ Server session found:', user?.email)
    return user
  } catch (error) {
    console.error('❌ Server session exception:', error)
    return null
  }
}

// Create a standardized auth check for API routes
export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  
  // Debug: Check what cookies we have
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb') || c.name.includes('supabase'))
  console.log('🔐 Auth check - Supabase cookies found:', supabaseCookies.length)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('❌ Authentication failed:', error.message)
    throw new Error(`Authentication failed: ${error.message}`)
  }
  
  if (!user) {
    console.error('❌ No authenticated user found')
    throw new Error('No authenticated user found')
  }
  
  console.log('✅ Authenticated user:', user.email)
  return { user, supabase }
}

// Service role functions for API routes (admin operations)
import { createClient } from '@supabase/supabase-js'

/**
 * Create a service role Supabase client for admin operations in API routes
 * Uses service role key for full database access
 */
export function createServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Create a server-side service client for API routes with SSR support
 * Uses service role key with minimal cookie handling
 */
export function createServiceServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }
  
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() { return undefined },
    },
  })
} 