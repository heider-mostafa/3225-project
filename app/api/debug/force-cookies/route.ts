import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ 
        error: 'Access token required' 
      }, { status: 400 })
    }

    // Verify the token is valid
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(access_token)
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    // Create response with proper cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Cookies set successfully',
      user: user.email
    })

    // Set cookies with all the variations that might work
    const cookieOptions = {
      httpOnly: false,
      secure: false, // localhost doesn't use HTTPS
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    }

    // Set multiple cookie formats
    response.cookies.set('sb-access-token', access_token, cookieOptions)
    response.cookies.set('sb-refresh-token', refresh_token || '', cookieOptions)
    response.cookies.set(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`, access_token, cookieOptions)
    
    return response

  } catch (error) {
    console.error('Force cookies error:', error)
    return NextResponse.json({ 
      error: 'Failed to set cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 