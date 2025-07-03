import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Session refresh error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        action: 'Please sign out and sign back in'
      })
    }

    return NextResponse.json({ 
      success: true, 
      hasSession: !!data.session,
      user: data.session?.user?.email
    })
    
  } catch (error) {
    console.error('Session refresh failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Session refresh failed',
      action: 'Please sign out and sign back in'
    })
  }
} 