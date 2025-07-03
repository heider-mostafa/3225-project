import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Use service role key for admin operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current session using anon key first
    const anonSupabase = await createServerSupabaseClient()

    const { data: { session }, error: sessionError } = await anonSupabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    // Check if user already has superadmin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .single()

    if (existingRole) {
      return NextResponse.json({
        message: 'User already has superadmin role',
        user_id: session.user.id,
        email: session.user.email
      })
    }

    // Grant superadmin role
    const { data: newRole, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: session.user.id,
        role: 'super_admin',
        granted_by: session.user.id, // Self-granted for initial setup
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error granting superadmin role:', insertError)
      return NextResponse.json(
        { error: 'Failed to grant superadmin role: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Superadmin role granted successfully',
      user_id: session.user.id,
      email: session.user.email,
      role: newRole
    })

  } catch (error) {
    console.error('Error granting superadmin:', error)
    return NextResponse.json(
      { error: 'Failed to grant superadmin role' },
      { status: 500 }
    )
  }
} 