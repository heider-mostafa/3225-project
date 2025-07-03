import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'All authentication cookies cleared',
      instructions: 'Please sign out and sign back in'
    })

    // Clear all possible Supabase cookie variations
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase-access-token',
      'supabase-refresh-token'
    ]

    // Get the host from environment or default
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hostFromUrl = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'localhost'
    
    // Add host-specific cookies
    cookieNames.push(`sb-${hostFromUrl}-auth-token`)
    
    cookieNames.forEach(name => {
      // Clear for current domain
      response.cookies.set(name, '', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      })
      
      // Clear for localhost specifically 
      response.cookies.set(name, '', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        domain: 'localhost',
        maxAge: 0,
        expires: new Date(0)
      })
    })

    return response

  } catch (error) {
    console.error('Clear cookies error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 