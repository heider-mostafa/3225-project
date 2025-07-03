import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { authorizeAdminRequest, ADMIN_PERMISSIONS } from '@/lib/auth/admin'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/admin/users - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Admin Users API: Starting authentication check...')
    
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      console.log('❌ Admin Users API: Access denied - not an admin')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin Users API: Admin access confirmed')

    // For admin operations, we need to use service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Service role key not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const adminSupabase = createServerClient(
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('📊 Fetching users with params:', { page, limit, search, role, sortBy, sortOrder })

    // Get all users from auth.users using admin API with service role
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers({
      page: page,
      perPage: limit
    })

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch users from auth' }, { status: 500 })
    }

    const authUsers = authData.users || []
    console.log('✅ Retrieved', authUsers.length, 'users from auth')

    // Use regular supabase client for non-admin operations
    const supabase = await createServerSupabaseClient()

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, is_active, granted_at, granted_by')
      .eq('is_active', true)

    if (rolesError) {
      console.error('Error loading user roles:', rolesError)
    }

    // Get user activity data
    const userIds = authUsers.map(u => u.id)
    
    const { data: savedProps } = await supabase
      .from('saved_properties')
      .select('user_id')
      .in('user_id', userIds)
    
    const { data: inquiries } = await supabase
      .from('inquiries')
      .select('user_id, created_at')
      .in('user_id', userIds)

    // Get users with lead intelligence data
    const { data: usersWithIntelligence } = await supabase
      .from('users')
      .select('id, lead_intelligence')
      .in('id', userIds)

    // Process users with additional data
    let processedUsers = authUsers.map(user => {
      const userRole = userRoles?.find(ur => ur.user_id === user.id)
      const savedCount = savedProps?.filter(sp => sp.user_id === user.id).length || 0
      const inquiryCount = inquiries?.filter(inq => inq.user_id === user.id).length || 0
      const lastInquiry = inquiries
        ?.filter(inq => inq.user_id === user.id)
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0]
      const userIntelligence = usersWithIntelligence?.find(ui => ui.id === user.id)?.lead_intelligence

      return {
        id: user.id,
        email: user.email || '',
        phone: user.phone || '',
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: user.user_metadata,
        user_roles: userRole ? [userRole] : [],
        saved_properties_count: savedCount,
        inquiries_count: inquiryCount,
        last_activity: lastInquiry?.created_at,
        lead_intelligence: userIntelligence
      }
    })

    // Apply search filter
    if (search) {
      processedUsers = processedUsers.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.phone && user.phone.includes(search))
      )
    }

    // Apply role filter
    if (role) {
      processedUsers = processedUsers.filter(user => 
        user.user_roles.some(ur => ur.role === role)
      )
    }

    // Apply sorting
    processedUsers.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at || '1970-01-01'
          bValue = b.last_sign_in_at || '1970-01-01'
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    console.log('✅ Processed and filtered to', processedUsers.length, 'users')

    return NextResponse.json({
      users: processedUsers,
      pagination: {
        page,
        limit,
        total: processedUsers.length,
        totalPages: Math.ceil(processedUsers.length / limit)
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Create User API: Starting authentication check...')
    
    // Check admin authorization first
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      console.log('❌ Create User API: Access denied - not an admin')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Create User API: Admin access confirmed')

    const body = await request.json()
    const { email, password, role = 'user', firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // For admin operations, we need to use service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Service role key not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const adminSupabase = createServerClient(
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

    // Create user in auth.users using service role
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      phone: '',
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
      },
      email_confirm: true // Auto-confirm email for admin-created users
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user: ' + createError.message },
        { status: 500 }
      )
    }

    // Grant role if specified and not 'user'
    if (role !== 'user' && newUser.user) {
      const { error: roleError } = await adminSupabase
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role,
          granted_by: isAdmin,
          is_active: true
        })

      if (roleError) {
        console.error('Error granting role:', roleError)
        // Don't fail the user creation, just log the role error
      }
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email,
        phone: newUser.user?.phone,
        created_at: newUser.user?.created_at
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
