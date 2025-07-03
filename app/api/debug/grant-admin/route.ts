import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  try {
    // This endpoint should only be used during development/setup
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode' 
      }, { status: 403 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'No valid session' 
      }, { status: 401 })
    }

    const { role = 'admin' } = await request.json()

    // Validate role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be admin or super_admin' 
      }, { status: 400 })
    }

    console.log('🔧 Granting', role, 'role to user:', session.user.email)

    // First, deactivate any existing roles
    const { error: deactivateError } = await supabase
      .from('user_roles')
      .update({ 
        is_active: false, 
        revoked_at: new Date().toISOString() 
      })
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Error deactivating existing roles:', deactivateError)
      // Continue anyway - maybe there were no existing roles
    }

    // Grant new role
    const { data: newRole, error: grantError } = await supabase
      .from('user_roles')
      .insert({
        user_id: session.user.id,
        role: role,
        granted_by: session.user.id, // Self-granted for setup
        granted_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (grantError) {
      console.error('Error granting role:', grantError)
      return NextResponse.json({ 
        error: 'Failed to grant role: ' + grantError.message 
      }, { status: 500 })
    }

    // Verify the role was granted
    const { data: verification } = await supabase.rpc('is_admin', { 
      user_id_param: session.user.id 
    })

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${role} role`,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      roleGranted: newRole,
      verification: {
        isAdmin: verification,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Grant admin endpoint error:', error)
    return NextResponse.json({ 
      error: 'Failed to grant admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 