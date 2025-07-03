import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        authenticated: false, 
        error: 'No valid session',
        sessionError: sessionError?.message 
      })
    }

    console.log('🔍 Debug: Checking admin status for user:', session.user.email)

    // Check RPC function
    const { data: isAdminRPC, error: rpcError } = await supabase.rpc('is_admin', { 
      user_id_param: session.user.id 
    })

    // Check user roles directly
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)

    // Check user roles with active filter
    const { data: activeRoles, error: activeError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      },
      adminChecks: {
        rpcIsAdmin: {
          result: isAdminRPC,
          error: rpcError?.message || null
        },
        userRoles: {
          all: userRoles || [],
          active: activeRoles || [],
          error: rolesError?.message || activeError?.message || null
        }
      },
      recommendations: userRoles?.length === 0 ? [
        'No roles found in user_roles table',
        'You need to be granted admin role first',
        'Contact a super admin or use the grant-admin script'
      ] : activeRoles?.length === 0 ? [
        'User roles exist but none are active',
        'Check if your role was revoked',
        'Contact a super admin to reactivate your role'
      ] : activeRoles?.some(r => ['admin', 'super_admin'].includes(r.role)) ? [
        'User has active admin role - this might be a middleware issue',
        'Check server logs for middleware errors',
        'Verify RLS policies are working correctly'
      ] : [
        'User has roles but no admin privileges',
        'Contact a super admin to grant admin/super_admin role'
      ]
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 