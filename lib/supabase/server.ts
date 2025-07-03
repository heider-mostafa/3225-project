import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          // Debug logging for auth issues
          if (name.includes('sb') || name.includes('supabase')) {
            console.log(`🍪 Server cookie get: ${name} = ${value ? `[${value.length} chars]` : 'null'}`)
          }
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
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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