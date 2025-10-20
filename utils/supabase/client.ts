import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/env'

export function createClient() {
  const config = getSupabaseConfig()
  const supabaseUrl = config.url
  const supabaseAnonKey = config.anonKey
  
  console.log('🔍 Supabase client creation debug:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl?.substring(0, 20) + '...',
    keyValue: supabaseAnonKey?.substring(0, 10) + '...',
    source: config.url === process.env.NEXT_PUBLIC_SUPABASE_URL ? 'env-vars' : 'fallback'
  })
  
  console.log('✅ Creating real Supabase client with configuration')
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}