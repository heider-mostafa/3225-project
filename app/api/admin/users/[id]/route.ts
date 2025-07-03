import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/admin/users/[id] - Get specific user details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    // Get user details with related data
    const { data: user, error } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        phone,
        email_confirmed_at,
        phone_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        raw_user_meta_data,
        user_roles (
          role,
          is_active,
          granted_at,
          granted_by
        ),
        saved_properties (
          id,
          property_id,
          created_at,
          properties (
            id,
            title,
            address,
            price
          )
        ),
        inquiries (
          id,
          property_id,
          message,
          status,
          created_at,
          properties (
            id,
            title,
            address
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log admin activity
    await logAdminActivity(
      'user_viewed',
      'user',
      params.id,
      {
        userEmail: user.email
      },
      request
    )

    return NextResponse.json(user)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user details
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for user updates
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { email, phone, full_name, role, is_active = true } = await request.json()

    // Get current user data for logging
    const { data: currentUser } = await supabase.auth.admin.getUserById(params.id)
    if (!currentUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user auth data
    const updateData: any = {}
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (full_name) {
      updateData.user_metadata = {
        ...currentUser.user.user_metadata,
        full_name
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        params.id,
        updateData
      )

      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user: ' + updateError.message },
          { status: 500 }
        )
      }
    }

    // Update role if provided
    if (role) {
      const { data: { session } } = await supabase.auth.getSession()
      
      // First deactivate current roles
      await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', params.id)

      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: params.id,
          role,
          is_active,
          granted_by: session?.user?.id
        })

      if (roleError) {
        console.error('Error updating role:', roleError)
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        )
      }
    }

    // Get updated user data
    const { data: updatedUser } = await supabase.auth.admin.getUserById(params.id)

    // Log admin activity
    await logAdminActivity(
      'user_updated',
      'user',
      params.id,
      {
        previousEmail: currentUser.user.email,
        newEmail: email,
        newRole: role,
        changes: Object.keys(updateData)
      },
      request
    )

    return NextResponse.json({
      user: {
        id: updatedUser.user?.id,
        email: updatedUser.user?.email,
        phone: updatedUser.user?.phone,
        created_at: updatedUser.user?.created_at,
        updated_at: updatedUser.user?.updated_at,
        role
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for user deletion
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get user data for logging before deletion
    const { data: currentUser } = await supabase.auth.admin.getUserById(params.id)
    if (!currentUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user from auth (this will cascade to related data)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(params.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Log admin activity
    await logAdminActivity(
      'user_deleted',
      'user',
      params.id,
      {
        email: currentUser.user.email,
        phone: currentUser.user.phone,
        deletedAt: new Date().toISOString()
      },
      request
    )

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 