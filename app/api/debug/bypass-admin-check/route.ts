import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Get the authorization header or body data
    const authHeader = request.headers.get('authorization')
    const body = await request.json().catch(() => ({}))
    const accessToken = authHeader?.replace('Bearer ', '') || body.access_token

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token provided' 
      }, { status: 401 })
    }

    // Create Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Invalid access token',
        details: userError?.message 
      }, { status: 401 })
    }

    console.log('🔍 Bypass: Checking admin status for user:', user.email)

    // Check user roles directly using service role
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userRoles, error: rolesError } = await serviceSupabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (rolesError) {
      console.error('Error checking roles:', rolesError)
      return NextResponse.json({ 
        error: 'Failed to check roles',
        details: rolesError.message 
      }, { status: 500 })
    }

    const hasAdminRole = userRoles?.some(role => ['admin', 'super_admin'].includes(role.role))

    // If user has admin role, grant them a temporary session
    if (hasAdminRole) {
      console.log('✅ User has admin role, creating admin session')
      
      // You could set cookies here or return success
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: userRoles.find(r => ['admin', 'super_admin'].includes(r.role))?.role
        },
        message: 'Admin access confirmed via bypass'
      })
    } else {
      return NextResponse.json({ 
        error: 'User does not have admin privileges' 
      }, { status: 403 })
    }

  } catch (error) {
    console.error('Bypass endpoint error:', error)
    return NextResponse.json({ 
      error: 'Bypass check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 