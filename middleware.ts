import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// List of paths that require authentication
const protectedPaths = [
  '/profile',
  '/saved',
  '/inquiries',
]

// List of paths that require admin role
const adminPaths = [
  '/admin',
]

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()
  
  // Skip middleware for API routes - they handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return res
  }
  

  
  console.log('=== MIDDLEWARE DEBUG ===')
  console.log('Path:', req.nextUrl.pathname)
  console.log('Method:', req.method)
  console.log('User-Agent:', req.headers.get('user-agent')?.substring(0, 50) + '...')
  
  // Debug: Show all cookies
  const allCookies = req.cookies.getAll()
  console.log('Total cookies found:', allCookies.length)
  allCookies.forEach(cookie => {
    console.log(`Cookie: ${cookie.name} = ${cookie.value.substring(0, 20)}...`)
  })
  
  // Create Supabase client with simplified cookie handling
  const supabase = await createServerSupabaseClient()
  
  // Check auth state using both methods for debugging
  let session = null
  let user = null
  
  try {
    console.log('🔍 Attempting to get session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else if (sessionData.session) {
      session = sessionData.session
      user = sessionData.session.user
      console.log('✅ Session found via getSession:', user.email, 'ID:', user.id)
      console.log('Session expires at:', new Date(session.expires_at! * 1000).toISOString())
    } else {
      console.log('❌ No session found via getSession')
    }
    
    // Fallback: try getUser as well for comparison
    console.log('🔍 Also trying getUser for comparison...')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ User error:', userError.message)
    } else if (userData.user) {
      console.log('✅ User found via getUser:', userData.user.email, 'ID:', userData.user.id)
      // If we have user but no session, use the user data
      if (!session) {
        user = userData.user
        console.log('📝 Using user data since session was not found')
      }
    } else {
      console.log('❌ No user found via getUser')
    }
    
  } catch (error) {
    console.error('💥 Exception during auth check:', error)
  }
  
  const isAuthenticated = !!(session || user)
  console.log('🎯 Final auth state:', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED')
  if (isAuthenticated) {
    console.log('👤 User:', user?.email || 'unknown')
  }
  
  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => req.nextUrl.pathname.startsWith(path))
  
  console.log('🛡️ Path protection check:')
  console.log('  - Is protected path:', isProtectedPath)
  console.log('  - Is admin path:', isAdminPath)
  console.log('  - Is authenticated:', isAuthenticated)
  
  // Handle protected paths
  if (isProtectedPath && !isAuthenticated) {
    console.log('🚫 Redirecting protected path to auth')
    
    // The profile page handles its own authentication client-side
    if (req.nextUrl.pathname.startsWith('/profile')) {
      console.log('📝 Allowing profile page to handle its own auth')
      return res
    }
    
    // Redirect to login page if accessing protected route without auth
    const redirectUrl = new URL('/auth', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    console.log('↩️ Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }

  // Enhanced admin path protection
  if (isAdminPath) {
    console.log('🔐 Processing admin path protection...')
    
    // First check: Must be authenticated
    if (!isAuthenticated) {
      console.log('❌ Admin path accessed without authentication')
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      console.log('↩️ Redirecting to auth:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    console.log('✅ Authentication confirmed for admin path, user:', user?.email)

    // Second check: Must have admin role
    try {
      console.log('🔍 Checking admin role for user:', user?.id)
      
      // Primary check: Use is_admin RPC function
      const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { 
        user_id_param: user?.id 
      })
      
      if (rpcError) {
        console.error('⚠️ RPC admin check failed, using fallback method:', rpcError.message)
        
        // Fallback check: Direct query to user_roles table
        try {
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role, is_active')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .in('role', ['admin', 'super_admin'])
          
          console.log('🔍 User roles query result:', userRoles)
          
          if (roleError) {
            console.error('❌ Fallback role check failed:', roleError.message)
            console.log('🛡️ Security default - denying access due to verification failure')
            return NextResponse.redirect(new URL('/unauthorized', req.url))
          }
          
          const hasAdminRole = userRoles && userRoles.length > 0
          console.log('🔍 Fallback check - Has admin role:', hasAdminRole, 'Roles found:', userRoles?.length || 0)
          
          if (!hasAdminRole) {
            console.log('❌ User has no admin roles in database')
            return NextResponse.redirect(new URL('/unauthorized', req.url))
          }
          
          console.log('✅ Fallback admin verification successful')
          
        } catch (fallbackError) {
          console.error('❌ Exception in fallback admin check:', fallbackError)
          console.log('🛡️ Security default - denying access due to exception')
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      } else {
        console.log('🔍 RPC check - Is admin:', isAdmin, 'User ID:', user?.id)
        if (!isAdmin) {
          console.log('❌ RPC says user is not an admin')
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
        console.log('✅ RPC admin verification successful')
      }
      
      console.log('🎉 Admin access granted for:', user?.email)
      
    } catch (error) {
      console.error('❌ Exception checking admin role:', error)
      console.log('🛡️ Security default - denying access due to exception')
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }
  
  console.log('✅ Middleware processing complete - allowing access')
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}