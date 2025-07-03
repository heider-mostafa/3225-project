import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://pupqcchcdwawgyxbcbeb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHFjY2hjZHdhd2d5eGJjYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzU4NTEsImV4cCI6MjA2NDE1MTg1MX0.3smTr2aD4BMBvarmE15QYm6rPLJtFFxaabWxdbiljaQ'

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile
  },
  global: {
    headers: {
      'User-Agent': 'EgyptianRealEstate-Mobile/1.0.0',
    },
  },
})

// Auth event listener for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user')
})

export default supabase 