// Runtime environment configuration as fallback
// This ensures we always have Supabase config available

const FALLBACK_CONFIG = {
  SUPABASE_URL: 'https://pupqcchcdwawgyxbcbeb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHFjY2hjZHdhd2d5eGJjYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzU4NTEsImV4cCI6MjA2NDE1MTg1MX0.3smTr2aD4BMBvarmE15QYm6rPLJtFFxaabWxdbiljaQ'
}

export function getSupabaseConfig() {
  // Try environment variables first
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (envUrl && envKey) {
    console.log('✅ Using Supabase config from environment variables')
    return {
      url: envUrl,
      anonKey: envKey
    }
  }
  
  // Fallback during Vercel infrastructure issues
  console.log('⚠️ Using fallback Supabase config - likely Vercel infrastructure issue affecting env vars')
  return {
    url: FALLBACK_CONFIG.SUPABASE_URL,
    anonKey: FALLBACK_CONFIG.SUPABASE_ANON_KEY
  }
}