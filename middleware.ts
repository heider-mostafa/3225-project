import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// Create a Supabase client for middleware
function createMiddlewareSupabaseClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()
  
  // Skip middleware for API routes, static files, and health checks
  if (
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.startsWith('/favicon') ||
    req.nextUrl.pathname === '/robots.txt' ||
    req.nextUrl.pathname === '/sitemap.xml'
  ) {
    return res
  }

  try {
    // Create Supabase client
    const supabase = createMiddlewareSupabaseClient(req, res)
    
    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser()
    const isAuthenticated = !!user && !error
    
    // Check if the path requires authentication
    const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
    const isAdminPath = adminPaths.some(path => req.nextUrl.pathname.startsWith(path))
    
    // Handle protected paths
    if (isProtectedPath && !isAuthenticated) {
      // The profile page handles its own authentication client-side
      if (req.nextUrl.pathname.startsWith('/profile')) {
        return res
      }
      
      // Redirect to login page if accessing protected route without auth
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Enhanced admin path protection
    if (isAdminPath) {
      // First check: Must be authenticated
      if (!isAuthenticated) {
        const redirectUrl = new URL('/auth', req.url)
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Second check: Must have admin role
      try {
        // Primary check: Use is_admin RPC function
        const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { 
          user_id_param: user?.id 
        })
        
        if (rpcError) {
          // Fallback check: Direct query to user_roles table
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role, is_active')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .in('role', ['admin', 'super_admin'])
          
          if (roleError || !userRoles || userRoles.length === 0) {
            return NextResponse.redirect(new URL('/unauthorized', req.url))
          }
        } else if (!isAdmin) {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    return res
  } catch (error) {
    // If middleware fails, allow the request to continue
    // The individual pages can handle auth as needed
    return res
  }
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