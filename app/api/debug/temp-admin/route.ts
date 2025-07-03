import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode' 
      }, { status: 403 })
    }

    const { email, password = 'temppassword123', role = 'admin' } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔧 Creating temporary admin user:', email)

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      // If user already exists, try to find them
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users?.find(u => u.email === email)
      
      if (existingUser) {
        console.log('✅ User already exists, granting admin role:', email)
        
        // Grant admin role to existing user
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: existingUser.id,
            role: role,
            granted_by: existingUser.id,
            granted_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id,role'
          })
          .select()

        if (roleError) {
          console.error('Error granting role to existing user:', roleError)
          return NextResponse.json({ 
            error: 'Failed to grant role: ' + roleError.message 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `Successfully granted ${role} role to existing user`,
          user: {
            id: existingUser.id,
            email: existingUser.email
          },
          created: false
        })
      } else {
        console.error('Error creating user:', authError)
        return NextResponse.json({ 
          error: 'Failed to create user: ' + authError.message 
        }, { status: 500 })
      }
    }

    const user = authData.user
    if (!user) {
      return NextResponse.json({ 
        error: 'User creation failed - no user returned' 
      }, { status: 500 })
    }

    console.log('✅ Created user, now granting admin role:', user.email)

    // Grant admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        is_active: true
      })
      .select()

    if (roleError) {
      console.error('Error granting role:', roleError)
      return NextResponse.json({ 
        error: 'User created but failed to grant role: ' + roleError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${role} user`,
      user: {
        id: user.id,
        email: user.email
      },
      role: roleData,
      password: password,
      created: true
    })

  } catch (error) {
    console.error('Temp admin endpoint error:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 