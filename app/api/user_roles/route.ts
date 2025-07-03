import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET - Get user roles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    let query = supabase
      .from('user_roles')
      .select('*')

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: userRoles, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user roles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user roles: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user_roles: userRoles })

  } catch (error) {
    console.error('Error in GET /api/user_roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    )
  }
}

// POST - Assign a role to a user
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const { user_id, role } = await request.json()

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'superadmin', 'broker', 'user']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
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

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user_id)
      .eq('role', role)
      .single()

    if (existingRole) {
      return NextResponse.json({
        message: 'User already has this role',
        user_role: existingRole
      })
    }

    // Assign the role
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .insert({
        user_id,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning user role:', error)
      return NextResponse.json(
        { error: 'Failed to assign role: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
      user_role: userRole
    })

  } catch (error) {
    console.error('Error in POST /api/user_roles:', error)
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a role from a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const role = searchParams.get('role')
    const id = searchParams.get('id')

    if (!id && (!user_id || !role)) {
      return NextResponse.json(
        { error: 'Either role ID or both user_id and role are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    let query = supabase.from('user_roles').delete()

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('user_id', user_id!).eq('role', role!)
    }

    const { error } = await query

    if (error) {
      console.error('Error removing user role:', error)
      return NextResponse.json(
        { error: 'Failed to remove role: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/user_roles:', error)
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    )
  }
} 