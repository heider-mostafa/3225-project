import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Session error', 
        details: sessionError.message 
      }, { status: 400 })
    }

    if (!session) {
      return NextResponse.json({ 
        message: 'No active session found',
        session: null
      })
    }

    // Check role using RPC
    const { data: role, error: roleError } = await supabase.rpc('get_user_role', { 
      user_id_param: session.user.id 
    })

    // Check admin status using RPC
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
      user_id_param: session.user.id 
    })

    // Check user_roles table directly
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    // Environment check
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    return NextResponse.json({
      debug: {
        session: {
          user_id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata
        },
        role_check: {
          role,
          roleError: roleError?.message
        },
        admin_check: {
          isAdmin,
          adminError: adminError?.message
        },
        user_roles: {
          data: userRoles,
          error: rolesError?.message
        },
        environment: {
          hasServiceKey,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'
        }
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 