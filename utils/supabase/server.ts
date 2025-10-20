import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
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
          try {
            const value = cookieStore.get(name)?.value
            
            // Handle base64-encoded cookies that might be malformed
            if (value && value.startsWith('base64-')) {
              try {
                // Try to decode base64 and parse JSON
                const decoded = atob(value.replace('base64-', ''))
                JSON.parse(decoded) // Validate it's valid JSON
                return value
              } catch (parseError) {
                console.warn(`Malformed cookie ${name}, clearing:`, parseError)
                // Clear malformed cookie
                try {
                  cookieStore.delete(name)
                } catch (deleteError) {
                  console.warn(`Failed to clear malformed cookie ${name}:`, deleteError)
                }
                return undefined
              }
            }
            
            return value
          } catch (error) {
            console.warn(`Failed to get cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}